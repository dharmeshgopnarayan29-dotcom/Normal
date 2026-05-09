import { useQuery } from '@tanstack/react-query';
import { fetchComplaints } from '../services/issueService';

/**
 * useNotifications — reuses the complaints feed but sorted by updated_at DESC.
 * Uses a shorter staleTime (15s) because notification updates (status changes)
 * should appear faster than the regular feed.
 * Cached separately under ["notifications"] so invalidating notifications
 * (after admin status change) doesn't blow away the main complaints cache.
 */
export const useNotifications = () => {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const data = await fetchComplaints();
            // Sort by most recently updated for the notifications view
            return [...data].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        },
        staleTime: 15 * 1000, // 15 seconds — refresh often
        gcTime: 5 * 60 * 1000, // 5 minutes in memory
    });
};
