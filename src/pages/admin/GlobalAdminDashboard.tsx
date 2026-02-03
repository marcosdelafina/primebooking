import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    AlertCircle,
    TrendingUp,
    Search,
    ExternalLink,
    ShieldCheck,
    History,
    Play,
    RotateCw,
    FileText,
    Star,
    CheckCircle,
    XCircle,
    EyeOff,
    Heart,
    Package,
    LayoutGrid
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { formatCurrencyBRL } from '@/lib/utils';
import type { Empresa, BillingEmpresa } from '@/types/entities';
import { AdminRunBillingDialog } from '@/components/admin/AdminRunBillingDialog';
import { AdminBillingLogsDialog } from '@/components/admin/AdminBillingLogsDialog';
import { AdminInvoicesTable } from '@/components/admin/AdminInvoicesTable';
import { AdminEditBillingDialog } from '@/components/admin/AdminEditBillingDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { getAllReviews, updateReviewStatus, deleteReview, getGlobalLikes } from '@/lib/supabase-services';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmpresaWithBilling extends Empresa {
    billing?: BillingEmpresa;
}

export default function GlobalAdminDashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [runDialogOpen, setRunDialogOpen] = useState(false);
    const [logsDialogOpen, setLogsDialogOpen] = useState(false);
    const [editBillingOpen, setEditBillingOpen] = useState(false);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [selectedBilling, setSelectedBilling] = useState<BillingEmpresa | null>(null);
    const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
    const [activeTab, setActiveTab] = useState('overview');

    // Realtime Sync (Global)
    useSupabaseRealtime('empresas', undefined, [['global-companies-billing']]);
    useSupabaseRealtime('billing_empresa', undefined, [['global-companies-billing']]);
    useSupabaseRealtime('billing_runs', undefined, [['global-billing-runs']]);
    useSupabaseRealtime('subscription_invoices', undefined, [['global-companies-billing']]);
    useSupabaseRealtime('plataforma_avaliacoes', undefined, [['global-reviews']]);
    useSupabaseRealtime('likes_counter', undefined, [['global-likes']]);

    // Queries
    const { data: companies = [], isLoading, refetch: refetchCompanies } = useQuery({
        queryKey: ['global-companies-billing'],
        queryFn: async () => {
            const { data: companiesData, error: companiesError } = await supabase
                .from('empresas')
                .select('*')
                .order('nome');

            if (companiesError) throw companiesError;

            const { data: billingData, error: billingError } = await supabase
                .from('billing_empresa')
                .select('*');

            if (billingError) throw billingError;

            return companiesData.map(company => ({
                ...company,
                billing: billingData.find(b => b.empresa_id === company.id)
            })) as EmpresaWithBilling[];
        }
    });

    const { data: reviews = [], isLoading: isLoadingReviews, refetch: refetchReviews } = useQuery({
        queryKey: ['global-reviews'],
        queryFn: () => getAllReviews()
    });
    const { data: billingRuns = [], isLoading: isLoadingRuns, refetch: refetchRuns } = useQuery({
        queryKey: ['global-billing-runs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('billing_runs')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            return data;
        }
    });

    const { data: globalLikes = 0 } = useQuery({
        queryKey: ['global-likes'],
        queryFn: getGlobalLikes
    });

    const filteredCompanies = companies.filter(c =>
        c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        mrr: companies.reduce((acc, c) => acc + (c.billing?.valor_mensal || 0), 0),
        activeClients: companies.filter(c => c.billing?.billing_status === 'ATIVA').length,
        delinquentClients: companies.filter(c => c.billing?.billing_status === 'INADIMPLENTE').length,
        avgRating: reviews.filter(r => r.status === 'active').length > 0
            ? reviews.filter(r => r.status === 'active').reduce((acc, r) => acc + r.nota, 0) / reviews.filter(r => r.status === 'active').length
            : 0,
        activeReviews: reviews.filter(r => r.status === 'active').length,
        totalLikes: globalLikes
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-blue-600" />
                        Painel Global
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Visão consolidada da operação e faturamento.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600">MRR (Mensal Recorrente)</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-900">{formatCurrencyBRL(stats.mrr)}</div>
                            <p className="text-xs text-blue-600/80 mt-1">Total acumulado mensal</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-600">Clientes Ativos</CardTitle>
                            <Users className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-900">{stats.activeClients}</div>
                            <p className="text-xs text-green-600/80 mt-1">Empresas com assinatura ativa</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50 border-red-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-600">Inadimplentes</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-900">{stats.delinquentClients}</div>
                            <p className="text-xs text-red-600/80 mt-1">Pendências financeiras em aberto</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-pink-50 border-pink-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-pink-600">Total de Curtidas</CardTitle>
                            <Heart className="h-4 w-4 text-pink-600 fill-pink-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-pink-900">{stats.totalLikes}</div>
                            <p className="text-xs text-pink-600/80 mt-1">Interações globais na plataforma</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Actions */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="reviews" className="flex gap-2">
                            Avaliações
                            {reviews.filter(r => r.status === 'pending').length > 0 && (
                                <Badge className="bg-orange-500 text-white border-0 px-1.5 h-4 min-w-[16px] flex items-center justify-center text-[10px]">
                                    {reviews.filter(r => r.status === 'pending').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Search & Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar empresa ou slug..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => navigate('/admin/global/categories')}
                                >
                                    <LayoutGrid className="h-4 w-4 mr-2" />
                                    Categorias
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => navigate('/admin/global/planos')}
                                >
                                    <Package className="h-4 w-4 mr-2" />
                                    Gerenciar Planos
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => setRunDialogOpen(true)}
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    Executar Billing
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => refetchRuns()}
                                >
                                    <RotateCw className={`h-4 w-4 mr-2 ${isLoadingRuns ? 'animate-spin' : ''}`} />
                                    Atualizar
                                </Button>
                            </div>
                        </div>

                        {/* Companies Table */}
                        <div className="bg-card rounded-xl border overflow-hidden">
                            <div className="p-4 border-b bg-muted/30">
                                <h3 className="font-semibold">Lista de Empresas</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/10">
                                            <th className="px-4 py-3 text-left font-medium">Empresa</th>
                                            <th className="px-4 py-3 text-left font-medium">Plano / Status</th>
                                            <th className="px-4 py-3 text-left font-medium">Ciclo / Renovação</th>
                                            <th className="px-4 py-3 text-right font-medium">Mensalidade</th>
                                            <th className="px-4 py-3 text-right font-medium">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                    Carregando dados...
                                                </td>
                                            </tr>
                                        ) : filteredCompanies.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                    Nenhuma empresa encontrada.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCompanies.map((company) => (
                                                <tr key={company.id} className="hover:bg-muted/5 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium">{company.nome}</div>
                                                        <div className="text-xs text-muted-foreground">{company.slug}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="text-xs font-bold uppercase text-muted-foreground">
                                                                {company.plano?.toUpperCase() || 'N/A'}
                                                            </div>
                                                            <Badge variant={
                                                                company.billing?.billing_status === 'ATIVA' ? 'default' :
                                                                    company.billing?.billing_status === 'INADIMPLENTE' ? 'destructive' : 'secondary'
                                                            }>
                                                                {company.billing?.billing_status || 'SEM DADOS'}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-muted-foreground">
                                                            {company.billing?.ciclo_atual || '-'}
                                                        </div>
                                                        <div className="text-xs font-medium">
                                                            Renov: {company.billing?.data_renovacao ? new Date(company.billing.data_renovacao).toLocaleDateString() : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-medium">
                                                        {formatCurrencyBRL(company.billing?.valor_mensal || 0)}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 gap-1"
                                                            onClick={() => {
                                                                setSelectedBilling(company.billing || null);
                                                                setSelectedCompanyName(company.nome);
                                                                setEditBillingOpen(true);
                                                            }}
                                                        >
                                                            Gerenciar
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Invoices Section */}
                        <AdminInvoicesTable />

                        {/* Billing Run History */}
                        <div className="bg-card rounded-xl border overflow-hidden mt-8">
                            <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
                                <History className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold">Histórico de Processamento</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/10">
                                            <th className="px-4 py-3 text-left font-medium">Início</th>
                                            <th className="px-4 py-3 text-left font-medium">Escopo</th>
                                            <th className="px-4 py-3 text-left font-medium">Tipo</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                            <th className="px-4 py-3 text-center font-medium">Resumo</th>
                                            <th className="px-4 py-3 text-right font-medium">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoadingRuns ? (
                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando histórico...</td></tr>
                                        ) : billingRuns.length === 0 ? (
                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma execução registrada.</td></tr>
                                        ) : (
                                            billingRuns.map((run) => (
                                                <tr key={run.id} className="hover:bg-muted/5 transition-colors">
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        {format(new Date(run.started_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                                                    </td>
                                                    <td className="px-4 py-4 italic text-muted-foreground">
                                                        {run.scope}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {run.is_dry_run ? (
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">SIMULAÇÃO</Badge>
                                                        ) : (
                                                            <Badge variant="default" className="bg-orange-100 text-orange-700 hover:bg-orange-100 uppercase">Real</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Badge variant={run.status === 'COMPLETED' ? 'default' : run.status === 'RUNNING' ? 'secondary' : 'destructive'} className={run.status === 'COMPLETED' ? 'bg-green-600' : ''}>
                                                            {run.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex justify-center gap-4 text-[10px] font-bold uppercase">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-muted-foreground">OK</span>
                                                                <span className="text-green-600 text-sm">{run.metadata?.processed || 0}</span>
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-muted-foreground">Erro</span>
                                                                <span className={`${run.metadata?.errors > 0 ? 'text-red-600' : 'text-muted-foreground'} text-sm`}>{run.metadata?.errors || 0}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 gap-2"
                                                            onClick={() => {
                                                                setSelectedRunId(run.id);
                                                                setLogsDialogOpen(true);
                                                            }}
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                            Logs
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Card className="bg-orange-50 border-orange-100">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-orange-600">Nota Média Global</CardTitle>
                                    <Star className="h-4 w-4 text-orange-600 fill-orange-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-900">{stats.avgRating.toFixed(1)} / 5.0</div>
                                    <p className="text-xs text-orange-600/80 mt-1">Baseada em {stats.activeReviews} avaliações</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="bg-card rounded-xl border overflow-hidden">
                            <div className="p-4 border-b bg-muted/30">
                                <h3 className="font-semibold">Moderação de Avaliações</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/10">
                                            <th className="px-4 py-3 text-left font-medium">Empresa / Usuário</th>
                                            <th className="px-4 py-3 text-left font-medium">Nota</th>
                                            <th className="px-4 py-3 text-left font-medium">Comentário</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                            <th className="px-4 py-3 text-right font-medium">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoadingReviews ? (
                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando avaliações...</td></tr>
                                        ) : reviews.length === 0 ? (
                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma avaliação registrada.</td></tr>
                                        ) : (
                                            reviews.map((review) => (
                                                <tr key={review.id} className="hover:bg-muted/5 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium">{review.empresa?.nome}</div>
                                                        <div className="text-xs text-muted-foreground">{review.usuario?.nome}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-1 text-orange-500 font-bold">
                                                            <Star className="h-4 w-4 fill-orange-500" />
                                                            {review.nota}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 max-w-xs">
                                                        <div className="truncate text-muted-foreground" title={review.comentario}>
                                                            {review.comentario || <em className="text-xs opacity-50">Sem comentário</em>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Badge variant={
                                                            review.status === 'active' ? 'default' :
                                                                review.status === 'pending' ? 'secondary' : 'outline'
                                                        } className={review.status === 'active' ? 'bg-green-600' : ''}>
                                                            {review.status === 'active' ? 'Publicada' :
                                                                review.status === 'pending' ? 'Pendente' : 'Oculta'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            {review.status !== 'active' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-green-600"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await updateReviewStatus(review.id, 'active');
                                                                            toast.success("Avaliação aprovada!");
                                                                            refetchReviews();
                                                                        } catch (e) { toast.error("Erro ao aprovar."); }
                                                                    }}
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {review.status === 'active' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-orange-600"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await updateReviewStatus(review.id, 'inactive');
                                                                            toast.success("Avaliação ocultada!");
                                                                            refetchReviews();
                                                                        } catch (e) { toast.error("Erro ao ocultar."); }
                                                                    }}
                                                                >
                                                                    <EyeOff className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600"
                                                                onClick={async () => {
                                                                    if (confirm("Tem certeza que deseja excluir esta avaliação?")) {
                                                                        try {
                                                                            await deleteReview(review.id);
                                                                            toast.success("Avaliação excluída!");
                                                                            refetchReviews();
                                                                        } catch (e) { toast.error("Erro ao excluir."); }
                                                                    }
                                                                }}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Dialogs */}
                <AdminRunBillingDialog
                    open={runDialogOpen}
                    onOpenChange={setRunDialogOpen}
                    onSuccess={(runId) => {
                        refetchRuns();
                        setSelectedRunId(runId);
                        setLogsDialogOpen(true);
                    }}
                />

                <AdminBillingLogsDialog
                    open={logsDialogOpen}
                    onOpenChange={setLogsDialogOpen}
                    runId={selectedRunId}
                />

                <AdminEditBillingDialog
                    open={editBillingOpen}
                    onOpenChange={setEditBillingOpen}
                    billing={selectedBilling}
                    companyName={selectedCompanyName}
                    onSuccess={() => {
                        // Refetch both companies and runs to ensure consistency
                        refetchCompanies();
                    }}
                />
            </div>
        </AdminLayout>
    );
}
