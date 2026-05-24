import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchClients, fetchIdentities, 
  createClientIdentity, checkClientExistence,
  ClientIdentityDto, CreateClientForm1Request 
} from '@/api/clientsApi';

export const useClientIdentities = () => {
  return useQuery({
    queryKey: ['agent-client-identities'],
    queryFn: fetchIdentities,
    staleTime: 30000,
  });
};

export const useCreateClientIdentity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientIdentity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-client-identities'] });
    },
  });
};

// Legacy/Dossier hooks
export const useClients = (params?: { query?: string; stage?: string }) => {
  return useQuery({
    queryKey: ['agent-clients', params],
    queryFn: () => fetchClients(params),
    staleTime: 30000,
  });
};
