import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Package,
    Plus,
    History,
    Edit,
    X,
    DollarSign,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getPlanos, createPlano, updatePlano, getPlanoPrecos, createPlanoPreco, deletePlanoPreco } from '@/lib/supabase-services';
import { formatCurrencyBRL } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

export default function GlobalPlanosPage() {
    const navigate = useNavigate();
    const [selectedPlano, setSelectedPlano] = useState<any | null>(null);
    const [isPlanoDialogOpen, setIsPlanoDialogOpen] = useState(false);
    const [isPrecosDialogOpen, setIsPrecosDialogOpen] = useState(false);
    const [precoToDelete, setPrecoToDelete] = useState<string | null>(null);

    // Form States
    const [planoForm, setPlanoForm] = useState({ nome: '', descricao: '', type: 'assinatura', max_usuarios: 10, is_draft: false });
    const [precoForm, setPrecoForm] = useState({ valor_mensal: 0, valor_anual: 0, data_inicio_vigencia: format(new Date(), 'yyyy-MM-dd'), data_fim_vigencia: '' });

    // Currency Input Helper
    const formatValue = (v: number) => {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(v);
    };

    const parseValue = (s: string) => {
        const cleaned = s.replace(/\D/g, '');
        return cleaned ? parseFloat(cleaned) / 100 : 0;
    };

    const findCurrentPrice = (precos: any[]) => {
        if (!precos || precos.length === 0) return null;
        const now = new Date();
        return precos.find(p => {
            const start = new Date(p.data_inicio_vigencia);
            const end = p.data_fim_vigencia ? new Date(p.data_fim_vigencia) : null;
            return now >= start && (!end || now <= end);
        });
    };

    // Queries
    const { data: planos = [], isLoading, refetch: refetchPlanos } = useQuery({
        queryKey: ['global-planos'],
        queryFn: getPlanos
    });

    const { data: precos = [], isLoading: isLoadingPrecos, refetch: refetchPrecos } = useQuery({
        queryKey: ['plano-precos', selectedPlano?.id],
        queryFn: () => getPlanoPrecos(selectedPlano.id),
        enabled: !!selectedPlano
    });

    // Real-time Sync
    useSupabaseRealtime('planos', undefined, [['global-planos']]);
    useSupabaseRealtime('plano_precos', undefined, [['plano-precos', selectedPlano?.id]]);

    // Handlers
    const handleSavePlano = async () => {
        try {
            if (selectedPlano?.id && !isPrecosDialogOpen) {
                // Remove non-column fields that might be in the form state from the fetch
                const { precos, id, created_at, ...updateData } = planoForm as any;
                await updatePlano(selectedPlano.id, updateData);
                toast.success("Plano atualizado com sucesso!");
            } else if (!selectedPlano) {
                await createPlano(planoForm);
                toast.success("Plano criado com sucesso!");
            }
            setIsPlanoDialogOpen(false);
            refetchPlanos();
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar plano.");
        }
    };

    const handleSavePreco = async () => {
        try {
            await createPlanoPreco({
                plano_id: selectedPlano.id,
                ...precoForm,
                data_fim_vigencia: precoForm.data_fim_vigencia || null
            });
            toast.success("Valor de vigência adicionado!");
            refetchPrecos();
            setPrecoForm({ valor_mensal: 0, valor_anual: 0, data_inicio_vigencia: format(new Date(), 'yyyy-MM-dd'), data_fim_vigencia: '' });
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar vigência. Verifique se há sobreposição de datas.");
        }
    };

    const handleDeletePreco = async () => {
        if (!precoToDelete) return;
        try {
            await deletePlanoPreco(precoToDelete);
            toast.success("Vigência excluída.");
            refetchPrecos();
            setPrecoToDelete(null);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/global')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Package className="h-6 w-6 text-blue-600" />
                                Gestão de Planos
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Configure produtos e valores com períodos de vigência.
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => {
                        setSelectedPlano(null);
                        setPlanoForm({ nome: '', descricao: '', type: 'assinatura', max_usuarios: 10, is_draft: false });
                        setIsPlanoDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Plano
                    </Button>
                </div>

                {isLoading ? (
                    <div className="text-center py-20 animate-pulse text-muted-foreground">Carregando planos...</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {planos.map((plano: any) => (
                            <Card key={plano.id} className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-100">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{plano.nome}</CardTitle>
                                        <Badge variant={plano.is_draft ? "outline" : "default"}>
                                            {plano.is_draft ? "Rascunho" : "Ativo"}
                                        </Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {plano.descricao || "Sem descrição informada."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between text-sm py-2 px-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="font-medium">Valor Vigente:</span>
                                        </div>
                                        <span className="text-blue-600 font-bold">
                                            {(() => {
                                                const current = findCurrentPrice(plano.precos);
                                                return current ? formatCurrencyBRL(Number(current.valor_mensal)) : "R$ --";
                                            })()}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 text-xs h-9"
                                            onClick={() => {
                                                setSelectedPlano(plano);
                                                setPlanoForm({ ...plano });
                                                setIsPlanoDialogOpen(true);
                                            }}
                                        >
                                            <Edit className="h-3 w-3 mr-1.5" />
                                            Editar Plano
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="flex-1 text-xs h-9 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                            onClick={() => {
                                                setSelectedPlano(plano);
                                                setIsPrecosDialogOpen(true);
                                            }}
                                        >
                                            <History className="h-3 w-3 mr-1.5" />
                                            Vigências
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Dialog: Plano Edit/Create */}
                <Dialog open={isPlanoDialogOpen} onOpenChange={setIsPlanoDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedPlano ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome do Plano</Label>
                                <Input
                                    id="nome"
                                    value={planoForm.nome}
                                    onChange={e => setPlanoForm({ ...planoForm, nome: e.target.value })}
                                    placeholder="Ex: Prime Premium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição</Label>
                                <Textarea
                                    id="descricao"
                                    value={planoForm.descricao}
                                    onChange={e => setPlanoForm({ ...planoForm, descricao: e.target.value })}
                                    placeholder="Descreva as vantagens deste plano..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="max_usuarios">Máx. Usuários</Label>
                                    <Input
                                        type="number"
                                        id="max_usuarios"
                                        value={planoForm.max_usuarios}
                                        onChange={e => setPlanoForm({ ...planoForm, max_usuarios: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2 flex flex-col justify-end pb-2">
                                    <Label className="mb-2">Status</Label>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            type="button"
                                            variant={planoForm.is_draft ? "outline" : "default"}
                                            size="sm"
                                            onClick={() => setPlanoForm({ ...planoForm, is_draft: false })}
                                        >
                                            Ativo
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={planoForm.is_draft ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setPlanoForm({ ...planoForm, is_draft: true })}
                                        >
                                            Rascunho
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPlanoDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSavePlano}>Salvar Alterações</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Vigências (Preços) */}
                <Dialog open={isPrecosDialogOpen} onOpenChange={setIsPrecosDialogOpen}>
                    <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-blue-600" />
                                Histórico de Vigências: {selectedPlano?.nome}
                            </DialogTitle>
                            <DialogDescription>
                                Gestão de preços baseada em períodos. Novos preços não sobrepõem os ativos.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Add New Pricing Form */}
                        <div className="bg-muted/30 p-4 rounded-xl border-2 border-dashed border-muted space-y-4 my-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Definir Nova Vigência
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Valor Mensal</Label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">R$</span>
                                        <Input
                                            value={formatValue(precoForm.valor_mensal)}
                                            onChange={e => setPrecoForm({ ...precoForm, valor_mensal: parseValue(e.target.value) })}
                                            className="h-8 text-sm pl-7 text-right"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Valor Anual</Label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">R$</span>
                                        <Input
                                            value={formatValue(precoForm.valor_anual)}
                                            onChange={e => setPrecoForm({ ...precoForm, valor_anual: parseValue(e.target.value) })}
                                            className="h-8 text-sm pl-7 text-right"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Início</Label>
                                    <Input
                                        type="date"
                                        value={precoForm.data_inicio_vigencia}
                                        onChange={e => setPrecoForm({ ...precoForm, data_inicio_vigencia: e.target.value })}
                                        className="h-8 text-sm px-2"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fim (Opcional)</Label>
                                    <Input
                                        type="date"
                                        value={precoForm.data_fim_vigencia}
                                        onChange={e => setPrecoForm({ ...precoForm, data_fim_vigencia: e.target.value })}
                                        className="h-8 text-sm px-2"
                                    />
                                </div>
                            </div>
                            <Button className="w-full h-8 bg-blue-600 hover:bg-blue-700" onClick={handleSavePreco}>
                                Confirmar Novo Valor
                            </Button>
                        </div>

                        {/* History Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Período</TableHead>
                                        <TableHead>Mensal</TableHead>
                                        <TableHead>Anual</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingPrecos ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-4">Carregando...</TableCell></TableRow>
                                    ) : precos.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground italic">Nenhum preço definido para este plano.</TableCell></TableRow>
                                    ) : (
                                        precos.map((v: any) => {
                                            const now = new Date();
                                            const start = new Date(v.data_inicio_vigencia);
                                            const end = v.data_fim_vigencia ? new Date(v.data_fim_vigencia) : null;
                                            const isActive = now >= start && (!end || now <= end);
                                            const isFuture = now < start;

                                            return (
                                                <TableRow key={v.id} className={isActive ? "bg-green-50/30" : ""}>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {format(start, 'dd/MM/yy')} - {end ? format(end, 'dd/MM/yy') : '∞'}
                                                    </TableCell>
                                                    <TableCell>{formatCurrencyBRL(v.valor_mensal)}</TableCell>
                                                    <TableCell>{formatCurrencyBRL(v.valor_anual)}</TableCell>
                                                    <TableCell>
                                                        {isActive ? (
                                                            <Badge className="bg-green-600 border-0">VIGENTE</Badge>
                                                        ) : isFuture ? (
                                                            <Badge variant="outline" className="text-blue-600 border-blue-200">AGENDADO</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="opacity-50">EXPIRADO</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-500 hover:text-red-700"
                                                            onClick={() => setPrecoToDelete(v.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={() => setIsPrecosDialogOpen(false)}>Fechar Histórico</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* AlertDialog: Confirmação de Exclusão */}
                <AlertDialog open={!!precoToDelete} onOpenChange={(open) => !open && setPrecoToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A vigência será permanentemente removida deste plano.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeletePreco} className="bg-red-600 hover:bg-red-700">
                                Sim, excluir vigência
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AdminLayout>
    );
}
