import { useQuery } from '@tanstack/react-query';
import { fetchKarma } from '../services/userService';

/**
 * useProfile — fetch the current user's karma points.
 * Karma rarely changes, so we use a long staleTime of 5 minutes.
 * The cache is invalidated explicitly when a badge is earned (via badge evaluator response).
 */
export const useProfile = () => {
    return useQuery({
        queryKey: ['profile', 'karma'],
        queryFn: fetchKarma,
        staleTime: 5 * 60 * 1000,  // 5 minutes
        gcTime: 15 * 60 * 1000,    // 15 minutes
    });
};
