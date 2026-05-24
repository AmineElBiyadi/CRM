import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAgentDashboard, toggleMeeting, AgentDashboardDto, MeetingDto } from '@/api/dashboardApi';

export const useAgentDashboard = () => {
  return useQuery<AgentDashboardDto, Error>({
    queryKey: ['agent-dashboard'],
    queryFn: fetchAgentDashboard,
    staleTime: 30000,
  });
};

export const useToggleMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation<MeetingDto, Error, string>({
    mutationFn: toggleMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
    },
  });
};
