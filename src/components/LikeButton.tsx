import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLikesCount, incrementLikes } from '@/lib/supabase-services';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
    targetId?: string; // defaults to 'global'
    compact?: boolean;
}

export function LikeButton({ targetId = 'global', compact = false }: LikeButtonProps) {
    const queryClient = useQueryClient();
    const [sessionId, setSessionId] = useState<string>('');
    const [hasLiked, setHasLiked] = useState<boolean>(false);

    // 1. Initialize session ID
    useEffect(() => {
        let id = localStorage.getItem('primebooking_session_id');
        if (!id) {
            id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('primebooking_session_id', id);
        }
        setSessionId(id);

        // Check if liked in this session for this specific target
        const liked = localStorage.getItem(`liked_${targetId}_${id}`);
        if (liked) setHasLiked(true);
    }, [targetId]);

    // 2. Fetch total likes for this target
    const { data: totalLikes = 0 } = useQuery({
        queryKey: ['likes', targetId],
        queryFn: () => getLikesCount(targetId),
        refetchInterval: 60000,
    });

    // 3. Real-time sync
    useSupabaseRealtime(
        'likes_counter',
        undefined,
        [['likes', targetId]]
    );

    // 4. Increment mutation
    const likeMutation = useMutation({
        mutationFn: () => incrementLikes(targetId, sessionId),
        onSuccess: (newTotal) => {
            queryClient.setQueryData(['likes', targetId], newTotal);
            setHasLiked(true);
            localStorage.setItem(`liked_${targetId}_${sessionId}`, 'true');
        },
    });

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasLiked || likeMutation.isPending) return;
        likeMutation.mutate();
    };

    if (compact) {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                disabled={hasLiked}
                className={cn(
                    "h-10 w-10 rounded-full transition-all relative overflow-visible",
                    hasLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500 hover:bg-red-50"
                )}
            >
                <Heart className={cn("h-5 w-5", hasLiked && "fill-current")} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-background">
                    {totalLikes > 999 ? '1k+' : totalLikes}
                </span>
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleLike}
            disabled={hasLiked}
            className={cn(
                "flex items-center gap-2 rounded-full border-muted/50 transition-all active:scale-95 px-4 h-9",
                hasLiked ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20" : "hover:bg-red-50 hover:text-red-500 hover:border-red-100"
            )}
        >
            <Heart
                className={cn(
                    "h-4 w-4 transition-transform",
                    hasLiked ? "fill-current scale-110" : "group-hover:scale-110"
                )}
            />
            <span className="font-bold">{totalLikes}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                {hasLiked ? 'Curtido' : 'Curtir'}
            </span>
        </Button>
    );
}
