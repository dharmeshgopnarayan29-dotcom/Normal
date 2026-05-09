import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchComplaints,
    addComplaint,
    deleteComplaint,
    updateIssueStatus,
    toggleUpvote,
    toggleFlag,
} from '../services/issueService';

/**
 * useComplaints — fetch the community complaint feed.
 * Pass a location string to filter by area (e.g. "Whitefield").
 * Data is cached under ["complaints", location].
 */
export const useComplaints = (location = '') => {
    return useQuery({
        queryKey: ['complaints', location],
        queryFn: () => fetchComplaints(location),
        staleTime: 60 * 1000, // 60 seconds
    });
};

/**
 * useAddComplaint — mutation to submit a new complaint (multipart/form-data).
 * On success: invalidates complaints, myComplaints, and badges (badge may be earned).
 */
export const useAddComplaint = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addComplaint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
            queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
            queryClient.invalidateQueries({ queryKey: ['badges'] });
        },
    });
};

/**
 * useDeleteComplaint — mutation to delete a complaint by ID.
 * On success: invalidates complaints and myComplaints.
 */
export const useDeleteComplaint = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteComplaint,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
            queryClient.invalidateQueries({ queryKey: ['myComplaints'] });
        },
    });
};

/**
 * useUpdateStatus — admin mutation to change an issue's status.
 * On success: invalidates complaints and notifications (status change shows in notifications).
 */
export const useUpdateStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateIssueStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['badges'] });
        },
    });
};

/**
 * useToggleUpvote — mutation to upvote/un-upvote an issue.
 * On success: invalidates the complaints cache so upvote_count reflects instantly.
 */
export const useToggleUpvote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: toggleUpvote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
        },
    });
};

/**
 * useToggleFlag — mutation to flag/unflag an issue.
 * On success: invalidates complaints.
 */
export const useToggleFlag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: toggleFlag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
        },
    });
};
