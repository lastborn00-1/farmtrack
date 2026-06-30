import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFarmDocuments, addFarmDocument, updateFarmDocument, deleteFarmDocument } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import type { EggStoreEntry } from '@/schemas/productionSchemas';
import { toast } from 'sonner';

export function useEggStore() {
  const { activeFarm } = useAuthStore();
  const queryClient = useQueryClient();

  const queryKey = ['eggStoreEntries', activeFarm?.farmId];

  const query = useQuery({
    queryKey,
    queryFn: () => getFarmDocuments<EggStoreEntry>(activeFarm!.farmId, 'eggStoreEntries'),
    enabled: !!activeFarm?.farmId,
  });

  const addMutation = useMutation({
    mutationFn: (data: EggStoreEntry) => addFarmDocument(activeFarm!.farmId, 'eggStoreEntries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Egg store updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update egg store');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<EggStoreEntry> & { id: string }) =>
      updateFarmDocument(activeFarm!.farmId, 'eggStoreEntries', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Egg store entry updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update egg store entry');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFarmDocument(activeFarm!.farmId, 'eggStoreEntries', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Egg store entry deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete egg store entry');
    }
  });

  return {
    entries: query.data || [],
    isLoading: query.isLoading,
    addEntry: addMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
    isSubmitting: addMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
