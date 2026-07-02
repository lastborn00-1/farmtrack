import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFarmDocuments, addFarmDocument, updateFarmDocument, deleteFarmDocument } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import type { House } from '@/schemas/farmSchemas';
import { toast } from 'sonner';

export function useHouses() {
  const { activeFarm } = useAuthStore();
  const queryClient = useQueryClient();

  const queryKey = ['houses', activeFarm?.farmId];

  const housesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await getFarmDocuments<House>(activeFarm!.farmId, 'houses');
      return data.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds ?? 0;
        const bTime = b.createdAt?.seconds ?? 0;
        return aTime - bTime;
      });
    },
    enabled: !!activeFarm?.farmId,
  });

  const addHouseMutation = useMutation({
    mutationFn: (data: House) => addFarmDocument(activeFarm!.farmId, 'houses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('House added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add house');
    }
  });

  const updateHouseMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<House> & { id: string }) => 
      updateFarmDocument(activeFarm!.farmId, 'houses', id, data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousHouses = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.map((house: any) => house.id === variables.id ? { ...house, ...variables } : house) : old
      );
      return { previousHouses };
    },
    onSuccess: () => {
      toast.success('House updated successfully');
    },
    onError: (error: any, _variables: any, context: any) => {
      if (context?.previousHouses) {
        queryClient.setQueryData(queryKey, context.previousHouses);
      }
      toast.error(error.message || 'Failed to update house');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteHouseMutation = useMutation({
    mutationFn: (id: string) => deleteFarmDocument(activeFarm!.farmId, 'houses', id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousHouses = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.filter((house: any) => house.id !== id) : old
      );
      return { previousHouses };
    },
    onSuccess: () => {
      toast.success('House deleted successfully');
    },
    onError: (error: any, _variables: any, context: any) => {
      if (context?.previousHouses) {
        queryClient.setQueryData(queryKey, context.previousHouses);
      }
      toast.error(error.message || 'Failed to delete house');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    houses: housesQuery.data || [],
    isLoading: housesQuery.isLoading,
    isError: housesQuery.isError,
    addHouse: addHouseMutation.mutateAsync,
    updateHouse: updateHouseMutation.mutateAsync,
    deleteHouse: deleteHouseMutation.mutateAsync,
  };
}
