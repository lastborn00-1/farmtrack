import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import type { TreatmentRecord, VaccinationSchedule } from '@/schemas/healthSchemas';
import { getFarmDocuments, addFarmDocument, updateFarmDocument } from '@/lib/firestore';

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
      return await addFarmDocument(activeFarm.farmId, 'treatments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments', activeFarm?.farmId] });
    },
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
    addVaccine: addVaccineMutation.mutateAsync,
    updateVaccine: updateVaccineMutation.mutateAsync,
    isSubmitting: addTreatmentMutation.isPending || updateTreatmentMutation.isPending || addVaccineMutation.isPending || updateVaccineMutation.isPending,
  };
}
