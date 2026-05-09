import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyComplaints, deleteComplaint } from '../services/issueService';

/**
 * useMyComplaints — fetch only the current user's own issues.
 * Cached under ["myComplaints"] with a shorter staleTime since
 * the user expects to see their own newly submitted issues quickly.
 */
export const useMyComplaints = () => {
    return useQuery({
        queryKey: ['myComplaints'],
        queryFn: fetchMyComplaints,
        staleTime: 30 * 1000, // 30 seconds
    });
};

/**
 * useDeleteMyComplaint — mutation to delete one of the user's own complaints.
 * Invalidates both myComplaints and the shared complaints feed.
 */
export const useDeleteMyComplaint = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteComplaint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
        },
    });
};
