import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchDossiers, 
  confirmDossier,
  DossierSummary 
} from '@/api/dossiersApi';

export const useDossiers = () => {
  return useQuery({
    queryKey: ['dossiers'],
    queryFn: fetchDossiers,
    staleTime: 30000,
  });
};

export const useConfirmDossier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => confirmDossier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });
};
