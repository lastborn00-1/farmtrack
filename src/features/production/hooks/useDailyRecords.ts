import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFarmDocuments, addFarmDocument, updateFarmDocument, deleteFarmDocument } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import type { DailyRecord } from '@/schemas/productionSchemas';
import { toast } from 'sonner';

export function useDailyRecords() {
  const { activeFarm } = useAuthStore();
  const queryClient = useQueryClient();

  const queryKey = ['dailyRecords', activeFarm?.farmId];

  const query = useQuery({
    queryKey,
    queryFn: () => getFarmDocuments<DailyRecord>(activeFarm!.farmId, 'dailyRecords'),
    enabled: !!activeFarm?.farmId,
  });

  const addMutation = useMutation({
    mutationFn: async (data: DailyRecord) => {
      const docId = await addFarmDocument(activeFarm!.farmId, 'dailyRecords', data);

      // Auto-update batch currentQuantity and cumulativeMortality
      const totalLoss = (data.mortality || 0) + (data.culling || 0);
      if (totalLoss > 0 && data.batchId) {
        const batches = await getFarmDocuments<any>(activeFarm!.farmId, 'batches');
        const batch = batches.find((b: any) => b.id === data.batchId);
        if (batch) {
          const newQty = Math.max(0, (batch.currentQuantity || 0) - totalLoss);
          const newCumMortality = (batch.cumulativeMortality || 0) + totalLoss;
          await updateFarmDocument(activeFarm!.farmId, 'batches', data.batchId, {
            currentQuantity: newQty,
            cumulativeMortality: newCumMortality,
          });
        }
      }

      return docId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['batches', activeFarm?.farmId] });
      toast.success('Daily record added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add daily record');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, prevMortality, prevCulling, ...data }: Partial<DailyRecord> & { id: string; prevMortality?: number; prevCulling?: number }) => {
      await updateFarmDocument(activeFarm!.farmId, 'dailyRecords', id, data);

      // Adjust batch quantity: reverse old loss, apply new loss
      if (data.batchId) {
        const oldLoss = (prevMortality || 0) + (prevCulling || 0);
        const newLoss = (data.mortality || 0) + (data.culling || 0);
        const diff = newLoss - oldLoss;
        if (diff !== 0) {
          const batches = await getFarmDocuments<any>(activeFarm!.farmId, 'batches');
          const batch = batches.find((b: any) => b.id === data.batchId);
          if (batch) {
            const newQty = Math.max(0, (batch.currentQuantity || 0) - diff);
            const newCumMortality = Math.max(0, (batch.cumulativeMortality || 0) + diff);
            await updateFarmDocument(activeFarm!.farmId, 'batches', data.batchId, {
              currentQuantity: newQty,
              cumulativeMortality: newCumMortality,
            });
          }
        }
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousRecords = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.map((record: any) => record.id === variables.id ? { ...record, ...variables } : record) : old
      );
      return { previousRecords };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches', activeFarm?.farmId] });
      toast.success('Daily record updated successfully');
    },
    onError: (error: any, _variables: any, context: any) => {
      if (context?.previousRecords) {
        queryClient.setQueryData(queryKey, context.previousRecords);
      }
      toast.error(error.message || 'Failed to update daily record');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFarmDocument(activeFarm!.farmId, 'dailyRecords', id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousRecords = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.filter((record: any) => record.id !== id) : old
      );
      return { previousRecords };
    },
    onSuccess: () => {
      toast.success('Daily record deleted successfully');
    },
    onError: (error: any, _variables: any, context: any) => {
      if (context?.previousRecords) {
        queryClient.setQueryData(queryKey, context.previousRecords);
      }
      toast.error(error.message || 'Failed to delete daily record');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    records: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    addRecord: addMutation.mutateAsync,
    updateRecord: updateMutation.mutateAsync,
    deleteRecord: deleteMutation.mutateAsync,
  };
}
