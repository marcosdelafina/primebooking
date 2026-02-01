import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Hook to synchronize Supabase Realtime changes with React Query cache
 * @param table The table name to listen for changes
 * @param empresaId The company ID for filtering
 * @param queryKeys Array of query keys to invalidate on change
 */
export function useSupabaseRealtime(
    table: string,
    empresaId: string,
    queryKeys: any[][]
) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!empresaId) return;

        console.log(`[Realtime] Subscribing to ${table} for company ${empresaId}`);

        const channel = supabase
            .channel(`public:${table}:empresa_id=eq.${empresaId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                    filter: `empresa_id=eq.${empresaId}`,
                },
                (payload) => {
                    console.log(`[Realtime] Change detected in ${table}:`, payload);
                    // Invalidate associated React Query caches
                    queryKeys.forEach((key) => {
                        queryClient.invalidateQueries({ queryKey: key });
                    });
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] Subscription status for ${table}:`, status);
            });

        return () => {
            console.log(`[Realtime] Unsubscribing from ${table}`);
            supabase.removeChannel(channel);
        };
    }, [table, empresaId, queryKeys, queryClient]);
}
