import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFarmDocuments, addFarmDocument, updateFarmDocument, deleteFarmDocument } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import type { Batch } from '@/schemas/farmSchemas';
import { calcCurrentAgeWeeks, getLifecycleStage } from '@/lib/birdAge';
import { toast } from 'sonner';

export function useBatches() {
  const { activeFarm } = useAuthStore();
  const queryClient = useQueryClient();

  const queryKey = ['batches', activeFarm?.farmId];

  const batchesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await getFarmDocuments<Batch>(activeFarm!.farmId, 'batches');
      return data
        .sort((a, b) => (a.arrivalDate > b.arrivalDate ? 1 : -1))
        .map(b => {
        if (b.status === 'BROODING' || b.status === 'GROWING' || b.status === 'LAYING') {
          const age = calcCurrentAgeWeeks(b.arrivalDate, b.currentAgeWeeks);
          const stage = getLifecycleStage(age.totalWeeks);
          let newStatus = b.status;
          if (stage === 'Brooding') newStatus = 'BROODING';
          else if (stage === 'Growing' || stage === 'Pre-Lay') newStatus = 'GROWING';
          else if (stage === 'Laying' || stage === 'Late Lay' || stage === 'End of Lay') newStatus = 'LAYING';
          return { ...b, status: newStatus };
        }
        return b;
      });
    },
    enabled: !!activeFarm?.farmId,
  });

  const addBatchMutation = useMutation({
    mutationFn: async (data: Batch) => {
      const batchId = await addFarmDocument(activeFarm!.farmId, 'batches', data);
      
      // Generate and save standard Nigerian vaccination schedule if enabled
      if (activeFarm!.autoVaccinationSchedule !== false) {
        const { generateVaccinationSchedule } = await import('@/lib/vaccinationSchedule');
        const schedules = generateVaccinationSchedule(
          batchId, 
          data.batchName, 
          data.arrivalDate, 
          data.currentAgeWeeks || 0
        );
        
        await Promise.all(
          schedules.map(schedule => 
            addFarmDocument(activeFarm!.farmId, 'vaccines', schedule)
          )
        );
      }

      return batchId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Invalidate health queries so the bell updates immediately
      queryClient.invalidateQueries({ queryKey: ['vaccines', activeFarm?.farmId] });
      toast.success('Batch added with standard vaccination schedule');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add batch');
    }
  });

  const updateBatchMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Batch> & { id: string }) => {
      await updateFarmDocument(activeFarm!.farmId, 'batches', id, data);

      // If auto-vaccination is on, check if this batch already has vaccines; if not, generate them
      if (activeFarm!.autoVaccinationSchedule !== false) {
        const existingVaccines = await getFarmDocuments<any>(activeFarm!.farmId, 'vaccines');
        const batchVaccines = existingVaccines.filter((v: any) => v.batchId === id);
        const existingVaccinations = await getFarmDocuments<any>(activeFarm!.farmId, 'vaccinations');
        const batchVaccinations = existingVaccinations.filter((v: any) => v.batchId === id);

        if (batchVaccines.length === 0 && batchVaccinations.length === 0) {
          const { generateVaccinationSchedule } = await import('@/lib/vaccinationSchedule');
          const schedules = generateVaccinationSchedule(
            id,
            (data as any).batchName || '',
            (data as any).arrivalDate || new Date().toISOString().split('T')[0],
            (data as any).currentAgeWeeks || 0
          );
          await Promise.all(
            schedules.map(schedule =>
              addFarmDocument(activeFarm!.farmId, 'vaccines', schedule)
            )
          );
        }
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousBatches = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.map((batch: any) => batch.id === variables.id ? { ...batch, ...variables } : batch) : old
      );
      return { previousBatches };
    },
    onSuccess: () => {
      // Invalidate health queries in case vaccines were generated
      queryClient.invalidateQueries({ queryKey: ['vaccines', activeFarm?.farmId] });
      toast.success('Batch updated successfully');
    },
    onError: (error: any, _variables: any, context: any) => {
      if (context?.previousBatches) {
        queryClient.setQueryData(queryKey, context.previousBatches);
      }
      toast.error(error.message || 'Failed to update batch');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id: string) => deleteFarmDocument(activeFarm!.farmId, 'batches', id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousBatches = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.filter((batch: any) => batch.id !== id) : old
      );
      return { previousBatches };
    },
    onSuccess: () => {
      toast.success('Batch deleted successfully');
    },
    onError: (error: any, _variables: any, context: any) => {
      if (context?.previousBatches) {
        queryClient.setQueryData(queryKey, context.previousBatches);
      }
      toast.error(error.message || 'Failed to delete batch');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    batches: batchesQuery.data || [],
    isLoading: batchesQuery.isLoading,
    isError: batchesQuery.isError,
    addBatch: addBatchMutation.mutateAsync,
    updateBatch: updateBatchMutation.mutateAsync,
    deleteBatch: deleteBatchMutation.mutateAsync,
  };
}
