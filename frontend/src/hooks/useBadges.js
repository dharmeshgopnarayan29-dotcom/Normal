import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyBadges } from '../services/badgeService';

/**
 * useBadges — fetch all badges for the current user with earned/locked state.
 * staleTime: 2 minutes — badges only change when a badge is earned, and we
 * invalidate this cache explicitly in useAddComplaint and useUpdateStatus.
 */
export const useBadges = () => {
    return useQuery({
        queryKey: ['badges'],
        queryFn: fetchMyBadges,
        staleTime: 2 * 60 * 1000,   // 2 minutes
        gcTime: 15 * 60 * 1000,     // 15 minutes
    });
};
