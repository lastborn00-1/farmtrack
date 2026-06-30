import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import type { InventoryItem, InventoryLog } from '@/schemas/inventorySchemas';
import { getFarmDocuments, addFarmDocument, updateFarmDocument, deleteFarmDocument } from '@/lib/firestore';

export function useInventory() {
  const { activeFarm } = useAuthStore();
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['inventory', activeFarm?.farmId],
    queryFn: async () => {
      if (!activeFarm?.farmId) return [];
      return await getFarmDocuments<InventoryItem>(
        activeFarm.farmId, 'inventory'
      );
    },
    enabled: !!activeFarm?.farmId,
  });

  const logsQuery = useQuery({
    queryKey: ['inventoryLogs', activeFarm?.farmId],
    queryFn: async () => {
      if (!activeFarm?.farmId) return [];
      return await getFarmDocuments<InventoryLog>(
        activeFarm.farmId, 'inventoryLogs'
      );
    },
    enabled: !!activeFarm?.farmId,
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: Omit<InventoryItem, 'id'>) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      return await addFarmDocument(activeFarm.farmId, 'inventory', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', activeFarm?.farmId] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<InventoryItem> & { id: string }) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      return await updateFarmDocument(activeFarm.farmId, 'inventory', id, data);
    },
    onMutate: async (variables) => {
      const queryKey = ['inventory', activeFarm?.farmId];
      await queryClient.cancelQueries({ queryKey });
      const previousItems = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.map((item: any) => item.id === variables.id ? { ...item, ...variables } : item) : old
      );
      return { previousItems, queryKey };
    },
    onSuccess: () => {
      // Invalidation moved to onSettled
    },
    onError: (_error: any, _variables: any, context: any) => {
      if (context?.previousItems) {
        queryClient.setQueryData(context.queryKey, context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', activeFarm?.farmId] });
    }
  });

  const logTransactionMutation = useMutation({
    mutationFn: async ({
      log,
      newQuantity
    }: {
      log: Omit<InventoryLog, 'id'>;
      newQuantity: number;
    }) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      
      // Strip undefined values before passing to Firestore
      const cleanLog = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));

      // Add the log
      await addFarmDocument(activeFarm.farmId, 'inventoryLogs', cleanLog as any);
      
      // Update the item quantity (strip undefined to avoid Firestore error)
      const updatePayload: Record<string, any> = { currentQuantity: newQuantity };
      if (log.type === 'IN') updatePayload.lastRestockedDate = log.date;
      await updateFarmDocument(activeFarm.farmId, 'inventory', log.itemId, updatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', activeFarm?.farmId] });
      queryClient.invalidateQueries({ queryKey: ['inventoryLogs', activeFarm?.farmId] });
    },
  });

  const updateLogMutation = useMutation({
    mutationFn: async ({
      logId,
      log,
      oldQuantity,
      newQuantity
    }: {
      logId: string;
      log: Partial<InventoryLog>;
      oldQuantity: number;
      newQuantity: number;
    }) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      if (!log.itemId) return;

      // Strip undefined values before passing to Firestore
      const cleanLog = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));

      // Update the log
      await updateFarmDocument(activeFarm.farmId, 'inventoryLogs', logId, cleanLog);
      
      // Update the item quantity: restore old quantity, subtract new quantity
      const allItems = await getFarmDocuments<InventoryItem>(activeFarm.farmId, 'inventory');
      const item = allItems.find(i => i.id === log.itemId);
      if (item) {
        let diff = 0;
        if (log.type === 'OUT' || (!log.type)) {
          // If it was OUT, old qty subtracted from stock. So add back old, subtract new.
          diff = oldQuantity - newQuantity;
        } else if (log.type === 'IN') {
          diff = newQuantity - oldQuantity;
        }
        
        await updateFarmDocument(activeFarm.farmId, 'inventory', log.itemId, {
          currentQuantity: item.currentQuantity + diff,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', activeFarm?.farmId] });
      queryClient.invalidateQueries({ queryKey: ['inventoryLogs', activeFarm?.farmId] });
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async ({ logId, itemId, quantity }: { logId: string; itemId: string; quantity: number }) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      await deleteFarmDocument(activeFarm.farmId, 'inventoryLogs', logId);
      // Restore quantity back
      const allItems = await getFarmDocuments<InventoryItem>(activeFarm.farmId, 'inventory');
      const item = allItems.find(i => i.id === itemId);
      if (item) {
        await updateFarmDocument(activeFarm.farmId, 'inventory', itemId, {
          currentQuantity: item.currentQuantity + quantity,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', activeFarm?.farmId] });
      queryClient.invalidateQueries({ queryKey: ['inventoryLogs', activeFarm?.farmId] });
    },
  });

  return {
    items: itemsQuery.data || [],
    logs: logsQuery.data || [],
    isLoading: itemsQuery.isLoading || logsQuery.isLoading,
    addItem: addItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    logTransaction: logTransactionMutation.mutateAsync,
    updateLog: updateLogMutation.mutateAsync,
    deleteLog: deleteLogMutation.mutateAsync,
    isSubmitting: addItemMutation.isPending || logTransactionMutation.isPending || updateItemMutation.isPending || deleteLogMutation.isPending || updateLogMutation.isPending,
  };
}
