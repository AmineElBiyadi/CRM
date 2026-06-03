import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAgentDashboard, toggleMeeting, AgentDashboardDto, MeetingDto } from '@/api/dashboardApi';
import {
  fetchAdminDashboard,
  notifyAdminAlert,
  AdminDashboardDto,
  AdminAlertNotifyRequest,
} from '@/api/adminDashboardApi';
import { ApiError } from '@/lib/api-error';

export const useAgentDashboard = () => {
  return useQuery<AgentDashboardDto, Error>({
    queryKey: ['agent-dashboard'],
    queryFn: fetchAgentDashboard,
    staleTime: 30000,
  });
};

export const useAdminDashboard = (weekOffset = 0) => {
  return useQuery<AdminDashboardDto, ApiError>({
    queryKey: ['admin-dashboard', weekOffset],
    queryFn: () => fetchAdminDashboard(weekOffset),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
};

export const useNotifyAdminAlert = () => {
  return useMutation<unknown, ApiError, AdminAlertNotifyRequest>({
    mutationFn: notifyAdminAlert,
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
