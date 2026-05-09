import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient — single source of truth for all cached server state.
 *
 * staleTime:  How long cached data is considered "fresh". During this window,
 *             a component mounting will use the cache instantly (no network call).
 * gcTime:     How long unused cache entries stay in memory before being garbage-collected.
 * retry:      How many times to retry a failed request before throwing an error.
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Show cached data immediately, refetch silently in background after staleTime
            staleTime: 60 * 1000,        // 60 seconds default
            gcTime: 10 * 60 * 1000,      // 10 minutes in memory
            retry: 1,
            refetchOnWindowFocus: true,   // Silently refresh when user returns to tab
            refetchOnMount: true,         // Refetch if data is stale when component mounts
        },
        mutations: {
            retry: 0,
        },
    },
});

export default queryClient;
