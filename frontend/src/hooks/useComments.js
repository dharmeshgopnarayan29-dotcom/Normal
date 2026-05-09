import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchComments, addComment } from '../services/issueService';

/**
 * useComments — fetch comments for a specific issue.
 * Only fetched when the comment section is expanded (enabled prop).
 */
export const useComments = (issueId, enabled = false) => {
    return useQuery({
        queryKey: ['comments', issueId],
        queryFn: () => fetchComments(issueId),
        enabled,  // Only fetches when comment section is open
        staleTime: 30 * 1000,
    });
};

/**
 * useAddComment — mutation to post a new comment.
 * Invalidates the comments cache for this specific issue.
 */
export const useAddComment = (issueId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ text }) => addComment({ issueId, text }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
            // Also refresh the feed so comment_count updates
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
        },
    });
};
