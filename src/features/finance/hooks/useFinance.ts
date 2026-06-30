import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import type { Transaction } from '@/schemas/financeSchemas';
import { getFarmDocuments, addFarmDocument, updateFarmDocument, deleteFarmDocument } from '@/lib/firestore';

export function useFinance() {
  const { activeFarm } = useAuthStore();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ['transactions', activeFarm?.farmId],
    queryFn: async () => {
      if (!activeFarm?.farmId) return [];
      return await getFarmDocuments<Transaction>(
        activeFarm.farmId, 'transactions'
      );
    },
    enabled: !!activeFarm?.farmId,
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (data: Omit<Transaction, 'id'>) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      return await addFarmDocument(activeFarm.farmId, 'transactions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', activeFarm?.farmId] });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Transaction> }) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      return await updateFarmDocument(activeFarm.farmId, 'transactions', id, data);
    },
    onMutate: async (variables) => {
      const queryKey = ['transactions', activeFarm?.farmId];
      await queryClient.cancelQueries({ queryKey });
      const previousTransactions = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.map((t: any) => t.id === variables.id ? { ...t, ...variables.data } : t) : old
      );
      return { previousTransactions, queryKey };
    },
    onSuccess: () => {
      // Invalidation moved to onSettled
    },
    onError: (_error: any, _variables: any, context: any) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(context.queryKey, context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', activeFarm?.farmId] });
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!activeFarm?.farmId) throw new Error('No active farm');
      return await deleteFarmDocument(activeFarm.farmId, 'transactions', id);
    },
    onMutate: async (id) => {
      const queryKey = ['transactions', activeFarm?.farmId];
      await queryClient.cancelQueries({ queryKey });
      const previousTransactions = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => 
        old ? old.filter((t: any) => t.id !== id) : old
      );
      return { previousTransactions, queryKey };
    },
    onSuccess: () => {
      // Invalidation moved to onSettled
    },
    onError: (_error: any, _variables: any, context: any) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(context.queryKey, context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', activeFarm?.farmId] });
    }
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    addTransaction: addTransactionMutation.mutateAsync,
    updateTransaction: updateTransactionMutation.mutateAsync,
    deleteTransaction: deleteTransactionMutation.mutateAsync,
    isSubmitting: addTransactionMutation.isPending || updateTransactionMutation.isPending || deleteTransactionMutation.isPending,
  };
}
