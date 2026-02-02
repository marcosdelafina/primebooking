import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Star,
    CheckCircle2,
    Trash2,
    EyeOff,
    Search,
    MoreVertical,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getAllBusinessReviews,
    updateBusinessReviewStatus,
    deleteBusinessReview
} from '@/lib/supabase-services';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

export default function AdminReviewsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');

    const empresaId = user?.empresa_id || '';

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['admin-reviews', empresaId],
        queryFn: () => getAllBusinessReviews(empresaId),
        enabled: !!empresaId,
    });

    // Real-time subscription
    useSupabaseRealtime(
        'avaliacoes_empresa',
        empresaId,
        [['admin-reviews', empresaId]]
    );

    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'pending' }) =>
            updateBusinessReviewStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews', empresaId] });
            toast({
                title: 'Status atualizado',
                description: 'O status da avaliação foi alterado com sucesso.',
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteBusinessReview(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews', empresaId] });
            toast({
                title: 'Avaliação excluída',
                description: 'A avaliação foi removida permanentemente.',
            });
        },
    });

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = review.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.comentario?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = reviews.filter(r => r.status === 'pending').length;

    return (
        <AdminLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Avaliações</h1>
                        <p className="text-muted-foreground italic">Gerencie o feedback dos seus clientes e controle o que aparece no seu perfil público.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="h-8 px-3 text-sm flex gap-2">
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            <span className="font-bold">Média: {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.nota, 0) / reviews.length).toFixed(1) : '0.0'}</span>
                        </Badge>
                        <Badge variant="outline" className="h-8 px-3 text-sm">
                            {reviews.length} Total
                        </Badge>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente ou comentário..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setStatusFilter('all')}
                        >
                            Todas
                        </Button>
                        <Button
                            variant={statusFilter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1 relative"
                            onClick={() => setStatusFilter('pending')}
                        >
                            Pendentes
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center border-2 border-background">
                                    {pendingCount}
                                </span>
                            )}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={statusFilter === 'active' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setStatusFilter('active')}
                        >
                            Ativas
                        </Button>
                        <Button
                            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setStatusFilter('inactive')}
                        >
                            Ocultas
                        </Button>
                    </div>
                </div>

                {/* Reviews List */}
                {isLoading ? (
                    <div className="grid gap-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="h-32" />
                            </Card>
                        ))}
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <Card className="border-dashed flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold">Nenhuma avaliação encontrada</h3>
                        <p className="text-muted-foreground">Ajuste seus filtros ou aguarde novos feedbacks dos clientes.</p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredReviews.map((review: any) => (
                            <Card key={review.id} className={cn(
                                "overflow-hidden transition-all hover:shadow-md",
                                review.status === 'pending' && "border-l-4 border-l-primary"
                            )}>
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Left: Client Info & Rating */}
                                        <div className="p-6 md:w-64 bg-muted/30 border-b md:border-b-0 md:border-r border-border">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                                    {review.cliente_nome.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold truncate text-sm">{review.cliente_nome}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 mb-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={cn(
                                                            "h-3.5 w-3.5",
                                                            s <= review.nota ? "text-warning fill-warning" : "text-muted-foreground"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <Badge variant={
                                                review.status === 'active' ? 'default' :
                                                    review.status === 'pending' ? 'secondary' : 'outline'
                                            } className="text-[10px] uppercase font-bold tracking-wider">
                                                {review.status === 'active' ? 'Publicado' :
                                                    review.status === 'pending' ? 'Pendente' : 'Oculto'}
                                            </Badge>
                                        </div>

                                        {/* Middle: Comment */}
                                        <div className="p-6 flex-1">
                                            {review.comentario ? (
                                                <p className="text-sm italic text-foreground leading-relaxed transition-all">"{review.comentario}"</p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">Cliente não deixou um comentário escrito.</p>
                                            )}
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="p-6 md:w-48 flex md:flex-col justify-end gap-2 border-t md:border-t-0 border-border">
                                            {review.status !== 'active' && (
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-green-600 hover:bg-green-700 h-9"
                                                    onClick={() => updateMutation.mutate({ id: review.id, status: 'active' })}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Aprovar
                                                </Button>
                                            )}
                                            {review.status === 'active' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 h-9"
                                                    onClick={() => updateMutation.mutate({ id: review.id, status: 'inactive' })}
                                                >
                                                    <EyeOff className="h-4 w-4 mr-2" />
                                                    Ocultar
                                                </Button>
                                            )}

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => updateMutation.mutate({ id: review.id, status: 'pending' })}>
                                                        Marcar como Pendente
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => {
                                                            if (confirm('Tem certeza que deseja excluir esta avaliação permanentemente?')) {
                                                                deleteMutation.mutate(review.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir Avaliação
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
