import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import type { TreatmentRecord, VaccinationSchedule } from '@/schemas/healthSchemas';
import { getFarmDocuments, addFarmDocument, updateFarmDocument, getFarmDocument, deleteFarmDocument } from '@/lib/firestore';
import type { InventoryItem, InventoryLog } from '@/schemas/inventorySchemas';

export function useHealth() {
  const { activeFarm } = useAuthStore();
  const queryClient = useQueryClient();

  const treatmentsQuery = useQuery({
    queryKey: ['treatments', activeFarm?.farmId],
    queryFn: async () => {
      if (!activeFarm?.farmId) return [];
      return await getFarmDocuments<TreatmentRecord>(
        activeFarm.farmId, 'treatments'
      );
    },
    enabled: !!activeFarm?.farmId,
  });

  const vaccinesQuery = useQuery({
    queryKey: ['vaccines', activeFarm?.farmId],
    queryFn: async () => {
      if (!activeFarm?.farmId) return [];
      const [vaccines, legacyVaccinations] = await Promise.all([
        getFarmDocuments<VaccinationSchedule>(activeFarm.farmId, 'vaccines'),
        getFarmDocuments<VaccinationSchedule>(activeFarm.farmId, 'vaccinations'),
      ]);

      return [
        ...vaccines.map(v => ({ ...v, sourceCollection: 'vaccines' })),
        ...legacyVaccinations.map(v => ({ ...v, sourceCollection: 'vaccinations' })),
      ] as (VaccinationSchedule & { sourceCollection?: string })[];
    },
    enabled: !!activeFarm?.farmId,
  });

  const addTreatmentMutation = useMutation({
    mutationFn: async (data: Omit<TreatmentRecord, 'id'>) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      const treatmentId = await addFarmDocument(activeFarm.farmId, 'treatments', data);

      if (data.inventoryItemId && data.inventoryQuantityUsed) {
        try {
          const item = await getFarmDocument<InventoryItem>(activeFarm.farmId, 'inventory', data.inventoryItemId);
          if (item) {
            const newQuantity = Math.max(0, item.currentQuantity - data.inventoryQuantityUsed);
            await updateFarmDocument(activeFarm.farmId, 'inventory', data.inventoryItemId, {
              currentQuantity: newQuantity
            });
            const log: Omit<InventoryLog, 'id'> = {
              itemId: item.id!,
              itemName: item.name,
              date: data.date,
              type: 'OUT',
              quantity: data.inventoryQuantityUsed,
              notes: `Treatment: ${data.diagnosis}`,
            };
            await addFarmDocument(activeFarm.farmId, 'inventoryLogs', log);
          }
        } catch (err) {
          console.error("Failed to deduct inventory for treatment", err);
        }
      }

      return treatmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments', activeFarm?.farmId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', activeFarm?.farmId] });
      queryClient.invalidateQueries({ queryKey: ['inventoryLogs', activeFarm?.farmId] });
    },
  });

  const deleteTreatmentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      return await deleteFarmDocument(activeFarm.farmId, 'treatments', id);
    },
    onMutate: async (id) => {
      const queryKey = ['treatments', activeFarm?.farmId];
      await queryClient.cancelQueries({ queryKey });
      const previousTreatments = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.filter((t: any) => t.id !== id) : old
      );
      return { previousTreatments, queryKey };
    },
    onError: (_error: any, _variables: any, context: any) => {
      if (context?.previousTreatments) {
        queryClient.setQueryData(context.queryKey, context.previousTreatments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments', activeFarm?.farmId] });
    }
  });

  const updateTreatmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TreatmentRecord> }) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      return await updateFarmDocument(activeFarm.farmId, 'treatments', id, data);
    },
    onMutate: async (variables) => {
      const queryKey = ['treatments', activeFarm?.farmId];
      await queryClient.cancelQueries({ queryKey });
      const previousTreatments = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.map((t: any) => t.id === variables.id ? { ...t, ...variables.data } : t) : old
      );
      return { previousTreatments, queryKey };
    },
    onSuccess: () => {
      // Invalidation moved to onSettled
    },
    onError: (_error: any, _variables: any, context: any) => {
      if (context?.previousTreatments) {
        queryClient.setQueryData(context.queryKey, context.previousTreatments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments', activeFarm?.farmId] });
    }
  });

  const addVaccineMutation = useMutation({
    mutationFn: async (data: Omit<VaccinationSchedule, 'id'>) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      return await addFarmDocument(activeFarm.farmId, 'vaccines', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccines', activeFarm?.farmId] });
    },
  });

  const updateVaccineMutation = useMutation({
    mutationFn: async ({ id, data, collectionName = 'vaccines' }: { id: string; data: Partial<VaccinationSchedule>; collectionName?: string }) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      return await updateFarmDocument(activeFarm.farmId, collectionName, id, data);
    },
    onMutate: async (variables) => {
      const queryKey = ['vaccines', activeFarm?.farmId];
      await queryClient.cancelQueries({ queryKey });
      const previousVaccines = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.map((v: any) => v.id === variables.id ? { ...v, ...variables.data } : v) : old
      );
      return { previousVaccines, queryKey };
    },
    onSuccess: () => {
      // Invalidation moved to onSettled
    },
    onError: (_error: any, _variables: any, context: any) => {
      if (context?.previousVaccines) {
        queryClient.setQueryData(context.queryKey, context.previousVaccines);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccines', activeFarm?.farmId] });
    }
  });

  return {
    treatments: treatmentsQuery.data || [],
    vaccines: vaccinesQuery.data || [],
    isLoading: treatmentsQuery.isLoading || vaccinesQuery.isLoading,
    addTreatment: addTreatmentMutation.mutateAsync,
    updateTreatment: updateTreatmentMutation.mutateAsync,
    deleteTreatment: deleteTreatmentMutation.mutateAsync,
    addVaccine: addVaccineMutation.mutateAsync,
    updateVaccine: updateVaccineMutation.mutateAsync,
    isSubmitting: addTreatmentMutation.isPending || updateTreatmentMutation.isPending || deleteTreatmentMutation.isPending || addVaccineMutation.isPending || updateVaccineMutation.isPending,
  };
}
