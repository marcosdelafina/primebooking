import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
import { ptBR } from 'date-fns/locale';
import {
    FileText,
    Download,
    Receipt,
    MoreHorizontal,
    Filter,
    Search,
    Check,
    FileSpreadsheet,
    RotateCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatCurrencyBRL } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Invoice {
    id: string;
    empresa_id: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    amount: number;
    due_date: string;
    period: string;
    created_at: string;
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

export function AdminInvoicesTable() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);

    // Filtering State
    const [filterName, setFilterName] = useState('');
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [openStatusFilter, setOpenStatusFilter] = useState(false);

    // Sorting State
    const [sortField, setSortField] = useState<keyof Invoice | 'company_name'>('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Edit Status State
    const [editStatusOpen, setEditStatusOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [newStatus, setNewStatus] = useState<string>('');
    const [updating, setUpdating] = useState(false);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('subscription_invoices')
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
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvoices(data as unknown as Invoice[] || []);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            toast.error('Erro ao carregar faturas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleEditStatusClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setNewStatus(invoice.status);
        setEditStatusOpen(true);
    };

    const confirmUpdateStatus = async () => {
        if (!selectedInvoice || !newStatus) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('subscription_invoices')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                    paid_at: newStatus === 'PAID' ? new Date().toISOString() : null
                })
                .eq('id', selectedInvoice.id);

            if (error) throw error;

            toast.success('Status da fatura atualizado!');
            setEditStatusOpen(false);
            fetchInvoices();
        } catch (err: any) {
            console.error('Error updating invoice:', err);
            toast.error('Erro ao atualizar status.');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string, dueDate: string) => {
        if (status === 'PENDING' && dueDate) {
            const todayStr = new Date().toISOString().split('T')[0];
            const dueStr = dueDate.includes("T") ? dueDate.split("T")[0] : dueDate;

            if (dueStr < todayStr) {
                return <Badge variant="destructive">Atrasada</Badge>;
            }
        }

        switch (status) {
            case 'PAID':
                return <Badge variant="default" className="bg-green-600">Pago</Badge>;
            case 'PENDING':
                return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Pendente</Badge>;
            case 'OVERDUE':
                return <Badge variant="destructive">Vencido</Badge>;
            case 'CANCELLED':
                return <Badge variant="outline">Cancelado</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    };

    const handleSort = (field: keyof Invoice | 'company_name') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const filteredAndSortedInvoices = invoices
        .filter(inv => {
            const matchesName = !filterName ||
                inv.empresa?.nome.toLowerCase().includes(filterName.toLowerCase());

            if (filterStatus.length === 0) return matchesName;

            let effectiveStatus = inv.status;
            if (inv.status === 'PENDING' && inv.due_date) {
                const todayStr = new Date().toISOString().split('T')[0];
                const dueStr = inv.due_date.includes("T") ? inv.due_date.split("T")[0] : inv.due_date;
                if (dueStr < todayStr) effectiveStatus = 'OVERDUE';
            }

            return matchesName && filterStatus.includes(effectiveStatus);
        })
        .sort((a, b) => {
            let aVal: any = a[sortField as keyof Invoice];
            let bVal: any = b[sortField as keyof Invoice];

            if (sortField === 'company_name') {
                aVal = a.empresa?.nome || '';
                bVal = b.empresa?.nome || '';
            }

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
        });

    const exportToExcel = () => {
        const data = filteredAndSortedInvoices.map(inv => ({
            'ID': inv.id.substring(0, 8),
            'Empresa': inv.empresa?.nome || 'N/A',
            'Período': inv.period,
            'Vencimento': formatDate(inv.due_date),
            'Status': inv.status,
            'Valor': inv.amount
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Faturas");
        XLSX.writeFile(workbook, "Extrato_Cobranca.xlsx");
        toast.success("Excel gerado!");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Extrato de Cobrança - PrimeBooking", 14, 20);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 27);

        const tableColumn = ["Status", "Período", "Vencimento", "Empresa", "Valor"];
        const tableRows = filteredAndSortedInvoices.map(inv => [
            inv.status,
            inv.period,
            formatDate(inv.due_date),
            inv.empresa?.nome || 'N/A',
            formatCurrencyBRL(inv.amount)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
        });

        doc.save("Extrato_Cobranca.pdf");
        toast.success("PDF gerado!");
    };

    const downloadSingleInvoicePDF = (invoice: Invoice) => {
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
        doc.text(invoice.empresa?.nome.toUpperCase() || 'EMPRESA NÃO IDENTIFICADA', 18, 73);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`CNPJ: ${invoice.empresa?.documento || 'Não informado'}`, 18, 79);

        const address = invoice.empresa?.logradouro
            ? `${invoice.empresa.logradouro}, ${invoice.empresa.numero || 'SN'} - ${invoice.empresa.bairro || 'NI'}`
            : 'Endereço não informado';
        const cityState = invoice.empresa?.cidade
            ? `${invoice.empresa.cidade} - ${invoice.empresa.estado || 'NI'}`
            : 'Cidade não informada';

        doc.text(address, 18, 85);
        doc.text(cityState, 18, 91);

        // Table - Services/Plan
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
        doc.text(`Assinatura Mensal - Plano ${invoice.empresa?.plano || 'Base'}`, 18, startY + 15);
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
        doc.text("Aguarde o envio das instruções de faturamento por e-mail ou acesse o painel 'Minha Assinatura'.", 14, startY + 50);
        doc.text("Em caso de dúvidas, entre em contato com o suporte PrimeBooking.", 14, startY + 55);

        // Footer message
        doc.setFontSize(10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont("helvetica", "italic");
        doc.text("Obrigado por utilizar o PrimeBooking!", 105, 280, { align: 'center' });

        doc.save(`Fatura-${invoice.id.substring(0, 8)}.pdf`);
        toast.success("Fatura baixada!");
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-primary" />
                            Extrato de Pagamentos
                        </CardTitle>
                        <CardDescription>
                            Assinaturas mensais e histórico de faturamento.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Exportar
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={exportToExcel} className="gap-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="sm" onClick={fetchInvoices} disabled={loading}>
                            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar empresa..."
                            className="pl-8 h-8 text-xs"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                        />
                    </div>

                    <Popover open={openStatusFilter} onOpenChange={setOpenStatusFilter}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-8 border-dashed text-xs px-3">
                                <Filter className="h-3.5 w-3.5 mr-2 opacity-70" />
                                Status {filterStatus.length > 0 && `(${filterStatus.length})`}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[180px] p-1">
                            {['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].map((status) => (
                                <div
                                    key={status}
                                    className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer text-sm"
                                    onClick={() => {
                                        setFilterStatus(prev =>
                                            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                                        );
                                    }}
                                >
                                    <div className={cn(
                                        "h-4 w-4 border rounded flex items-center justify-center",
                                        filterStatus.includes(status) ? "bg-primary border-primary" : "border-muted-foreground/30"
                                    )}>
                                        {filterStatus.includes(status) && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className="capitalize">{status}</span>
                                </div>
                            ))}
                        </PopoverContent>
                    </Popover>
                    {filterStatus.length > 0 && (
                        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setFilterStatus([])}>
                            Limpar
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead onClick={() => handleSort('status')} className="cursor-pointer">Status</TableHead>
                                <TableHead onClick={() => handleSort('period')} className="cursor-pointer">Período</TableHead>
                                <TableHead onClick={() => handleSort('due_date')} className="cursor-pointer">Vencimento</TableHead>
                                <TableHead onClick={() => handleSort('company_name')} className="cursor-pointer">Empresa</TableHead>
                                <TableHead onClick={() => handleSort('amount')} className="cursor-pointer text-right">Valor</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
                            ) : filteredAndSortedInvoices.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8">Nenhuma fatura encontrada.</TableCell></TableRow>
                            ) : (
                                filteredAndSortedInvoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>{getStatusBadge(inv.status, inv.due_date)}</TableCell>
                                        <TableCell>{inv.period}</TableCell>
                                        <TableCell>{formatDate(inv.due_date)}</TableCell>
                                        <TableCell className="font-medium">{inv.empresa?.nome}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrencyBRL(inv.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => downloadSingleInvoicePDF(inv)}>
                                                        <Download className="mr-2 h-4 w-4" /> PDF
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditStatusClick(inv)}>
                                                        Alterar Status
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <Dialog open={editStatusOpen} onOpenChange={setEditStatusOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alterar Status</DialogTitle>
                        <DialogDescription>Atualize o status da fatura #{selectedInvoice?.id.substring(0, 8)}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Status</Label>
                            <div className="col-span-3">
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pendente</SelectItem>
                                        <SelectItem value="PAID">Pago</SelectItem>
                                        <SelectItem value="OVERDUE">Vencido</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditStatusOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmUpdateStatus} disabled={updating}>
                            {updating ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
