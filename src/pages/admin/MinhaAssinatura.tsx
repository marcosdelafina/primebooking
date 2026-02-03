import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import {
    Download,
    Receipt,
    RotateCw,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrencyBRL } from '@/lib/utils';
import jsPDF from 'jspdf';

interface Invoice {
    id: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    amount: number;
    due_date: string;
    period: string;
    created_at: string;
}

interface BillingInfo {
    id: string;
    valor_mensal: number;
    billing_status: string;
    ciclo_atual: string;
    data_renovacao: string;
    empresa: {
        nome: string;
        documento?: string;
        logradouro?: string;
        numero?: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
        cep?: string;
        plano?: string;
    };
}

export default function MinhaAssinatura() {
    const { user } = useAuth();
    const empresaId = user?.empresa_id || '';
    const queryClient = useQueryClient();

    // Billing Info Query
    const { data: billing, isLoading: loadingBilling } = useQuery({
        queryKey: ['billing_info', empresaId],
        queryFn: async () => {
            if (!empresaId) return null;
            const { data, error } = await supabase
                .from('billing_empresa')
                .select(`
                    *,
                    empresa:empresas(
                        nome, 
                        documento, 
                        logradouro, 
                        numero, 
                        bairro, 
                        cidade, 
                        estado, 
                        cep,
                        plano
                    )
                `)
                .eq('empresa_id', empresaId)
                .maybeSingle();

            if (error) throw error;
            return data as unknown as BillingInfo;
        },
        enabled: !!empresaId,
    });

    // Invoices Query
    const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
        queryKey: ['subscription_invoices', empresaId],
        queryFn: async () => {
            if (!empresaId) return [];
            const { data, error } = await supabase
                .from('subscription_invoices')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Invoice[];
        },
        enabled: !!empresaId,
    });

    const loading = loadingBilling || loadingInvoices;

    // Realtime Sync
    useSupabaseRealtime('billing_empresa', empresaId, [['billing_info', empresaId]]);
    useSupabaseRealtime('subscription_invoices', empresaId, [['subscription_invoices', empresaId]]);

    const fetchData = () => {
        queryClient.invalidateQueries({ queryKey: ['billing_info', empresaId] });
        queryClient.invalidateQueries({ queryKey: ['subscription_invoices', empresaId] });
    };

    const getStatusBadge = (status: string, dueDate: string) => {
        if (status === 'PENDING' && dueDate) {
            const todayStr = new Date().toISOString().split('T')[0];
            const dueStr = dueDate.includes("T") ? dueDate.split("T")[0] : dueDate;
            if (dueStr < todayStr) return <Badge variant="destructive">Atrasada</Badge>;
        }

        switch (status) {
            case 'PAID': return <Badge className="bg-green-600">Pago</Badge>;
            case 'PENDING': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Pendente</Badge>;
            case 'OVERDUE': return <Badge variant="destructive">Vencido</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const downloadInvoicePDF = (invoice: Invoice) => {
        if (!billing) return;

        const doc = new jsPDF();

        // Header Color
        const primaryColor = [0, 102, 204]; // Professional blue

        // Logo/Title
        doc.setFontSize(18);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text("PrimeBooking", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text("Gestão de Reservas e Agendamentos Inteligentes", 14, 25);

        // Extrato Title
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text("Extrato de Cobrança", 14, 40);

        // Info Box
        doc.setDrawColor(230, 230, 230);
        doc.line(14, 43, 196, 43);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");

        const column1 = 14;
        const column2 = 60;
        const column3 = 110;
        const column4 = 160;

        doc.text("Período:", column1, 52);
        doc.text("Data Emissão:", column2, 52);
        doc.text("Vencimento:", column3, 52);
        doc.text("STATUS:", column4, 52);

        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");

        doc.text(invoice.period, column1, 58);
        doc.text(format(new Date(invoice.created_at), 'dd/MM/yyyy'), column2, 58);
        doc.text(format(new Date(invoice.due_date), 'dd/MM/yyyy'), column3, 58);

        const statusLabel =
            invoice.status === 'PAID' ? 'PAGO' :
                invoice.status === 'OVERDUE' ? 'ATRASADA' :
                    invoice.status === 'CANCELLED' ? 'CANCELADA' : 'PENDENTE';

        if (invoice.status === 'OVERDUE') doc.setTextColor(220, 38, 38);
        else if (invoice.status === 'PAID') doc.setTextColor(22, 163, 74);

        doc.text(statusLabel, column4, 58);

        // Company Info
        doc.setDrawColor(245, 245, 245);
        doc.setFillColor(245, 245, 245);
        doc.rect(14, 65, 182, 35, 'F');

        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text(billing.empresa?.nome.toUpperCase() || 'EMPRESA', 18, 73);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`CNPJ: ${billing.empresa?.documento || 'Não informado'}`, 18, 79);

        const address = billing.empresa?.logradouro
            ? `${billing.empresa.logradouro}, ${billing.empresa.numero || 'SN'} - ${billing.empresa.bairro || 'NI'}`
            : 'Endereço não informado';
        const cityState = billing.empresa?.cidade
            ? `${billing.empresa.cidade} - ${billing.empresa.estado || 'NI'}`
            : 'Cidade não informada';

        doc.text(address, 18, 85);
        doc.text(cityState, 18, 91);

        // Table
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("PLANO CONTRATADO", 14, 115);

        const startY = 120;
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(14, startY, 182, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.text("Descrição", 18, startY + 5.5);
        doc.text("Valor (R$)", 192, startY + 5.5, { align: 'right' });

        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "normal");
        doc.text(`Assinatura Mensal - Plano ${billing.empresa?.plano || 'Base'}`, 18, startY + 15);
        doc.text(formatCurrencyBRL(invoice.amount), 192, startY + 15, { align: 'right' });

        doc.line(14, startY + 20, 196, startY + 20);

        // Total
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL A PAGAR", 18, startY + 27);
        doc.setFontSize(12);
        doc.text(formatCurrencyBRL(invoice.amount), 192, startY + 27, { align: 'right' });

        // Instructions
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "bold");
        doc.text("Instruções de Pagamento:", 14, startY + 45);
        doc.setFont("helvetica", "normal");
        doc.text("Efetue o pagamento através dos dados enviados em seu e-mail cadastrado.", 14, startY + 50);
        doc.text("Caso tenha dúvidas, entre em contato através do suporte oficial PrimeBooking.", 14, startY + 55);

        // Footer message
        doc.setFontSize(10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont("helvetica", "italic");
        doc.text("Obrigado por utilizar o PrimeBooking!", 105, 280, { align: 'center' });

        doc.save(`Extrato-${invoice.id.substring(0, 8)}.pdf`);
        toast.success("Download iniciado!");
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-primary" />
                        Minha Assinatura
                    </h1>
                    <p className="text-muted-foreground">Gerencie seu plano e histórico de pagamentos.</p>
                </div>

                {/* Billing Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Status da Assinatura
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {billing?.billing_status === 'ATIVA' ? 'Ativa' : 'Pendente'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Plano Professional</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                Próxima Renovação
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {billing?.data_renovacao ? format(new Date(billing.data_renovacao), 'dd/MM/yyyy') : '-'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Cobrança mensal recorrente</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-purple-500" />
                                Valor da Mensalidade
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrencyBRL(billing?.valor_mensal || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Valor fixo acordado</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Invoices Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Histórico de Faturas</CardTitle>
                            <CardDescription>Visualize e baixe seus extratos mensais.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                            <RotateCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Status</TableHead>
                                        <TableHead>Período</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
                                    ) : invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                Nenhum histórico de fatura encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell>{getStatusBadge(inv.status, inv.due_date)}</TableCell>
                                                <TableCell className="font-medium">{inv.period}</TableCell>
                                                <TableCell>{format(new Date(inv.due_date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrencyBRL(inv.amount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => downloadInvoicePDF(inv)}>
                                                        <Download className="h-4 w-4 mr-2" /> Extrato PDF
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
