import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFarmDocuments, addFarmDocument, updateFarmDocument, deleteFarmDocument } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import type { EggProduction } from '@/schemas/productionSchemas';
import { toast } from 'sonner';

export function useEggProduction() {
  const { activeFarm } = useAuthStore();
  const queryClient = useQueryClient();

  const queryKey = ['eggProductions', activeFarm?.farmId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await getFarmDocuments<EggProduction>(activeFarm!.farmId, 'eggProductions');
      return data.sort((a, b) => (b.date > a.date ? 1 : -1));
    },
    enabled: !!activeFarm?.farmId,
  });

  const addMutation = useMutation({
    mutationFn: async (data: EggProduction) => {
      const docId = await addFarmDocument(activeFarm!.farmId, 'eggProductions', data);
      
      if (data.totalCrates && data.totalCrates > 0) {
        await addFarmDocument(activeFarm!.farmId, 'eggStoreEntries', {
          date: data.date,
          crates: data.totalCrates,
          source: 'Production',
          notes: `Auto-synced from batch ${data.batchName || 'production'} log`
        });
      }
      return docId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['eggStoreEntries', activeFarm?.farmId] });
      toast.success('Egg production record added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add egg production record');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<EggProduction> & { id: string }) => 
      updateFarmDocument(activeFarm!.farmId, 'eggProductions', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Egg production record updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update egg production record');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFarmDocument(activeFarm!.farmId, 'eggProductions', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Egg production record deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete egg production record');
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
