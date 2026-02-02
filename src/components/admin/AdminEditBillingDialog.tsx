import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Settings2 } from "lucide-react";
import type { BillingEmpresa } from '@/types/entities';

interface AdminEditBillingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    billing: BillingEmpresa | null;
    companyName?: string;
    onSuccess: () => void;
}

export function AdminEditBillingDialog({ open, onOpenChange, billing, companyName, onSuccess }: AdminEditBillingDialogProps) {
    const [loading, setLoading] = useState(false);
    const [valorMensal, setValorMensal] = useState<string>('0');
    const [status, setStatus] = useState<string>('ATIVA');

    useEffect(() => {
        if (billing) {
            setValorMensal(billing.valor_mensal.toString());
            setStatus(billing.billing_status);
        }
    }, [billing]);

    const handleSave = async () => {
        if (!billing) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('billing_empresa')
                .update({
                    valor_mensal: parseFloat(valorMensal),
                    billing_status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', billing.id);

            if (error) throw error;

            toast.success("Configurações de faturamento atualizadas!");
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            console.error(err);
            toast.error("Erro ao salvar alterações.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        Manutenção de Plano
                    </DialogTitle>
                    <DialogDescription>
                        Ajuste os parâmetros financeiros para <strong>{companyName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="valor">Valor da Mensalidade (R$)</Label>
                        <Input
                            id="valor"
                            type="number"
                            step="0.01"
                            value={valorMensal}
                            onChange={(e) => setValorMensal(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="status">Status da Conta</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ATIVA">Ativa</SelectItem>
                                <SelectItem value="INADIMPLENTE">Inadimplente</SelectItem>
                                <SelectItem value="SUSPENSA">Suspensa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Ciclo Atual:</span>
                            <span className="font-semibold">{billing?.ciclo_atual || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Próxima Renovação:</span>
                            <span className="font-semibold">{billing?.data_renovacao ? new Date(billing.data_renovacao).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
