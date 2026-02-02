import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Play, AlertTriangle } from "lucide-react";
import type { Empresa } from "@/types/entities";

interface AdminRunBillingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (runId: string) => void;
}

export function AdminRunBillingDialog({ open, onOpenChange, onSuccess }: AdminRunBillingDialogProps) {
    const [mode, setMode] = useState<"ALL" | "SINGLE">("ALL");
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [dryRun, setDryRun] = useState(true);
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<Pick<Empresa, 'id' | 'nome'>[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);

    // Fetch companies when mode changes to SINGLE
    useEffect(() => {
        if (mode === "SINGLE" && companies.length === 0) {
            const fetchCompanies = async () => {
                setLoadingCompanies(true);
                const { data } = await supabase
                    .from("empresas")
                    .select("id, nome")
                    .order("nome");

                if (data) setCompanies(data);
                setLoadingCompanies(false);
            };
            fetchCompanies();
        }
    }, [mode, companies.length]);

    const handleRun = async () => {
        if (mode === "SINGLE" && !selectedCompanyId) {
            toast.error("Seleccione uma empresa.");
            return;
        }

        setLoading(true);
        try {
            toast.info(
                dryRun ? "Iniciando Simulação..." : "Iniciando Execução Real..."
            );

            const { data: runId, error } = await supabase.rpc('generate_monthly_billing', {
                target_scope: mode,
                target_empresa_id: mode === 'SINGLE' ? selectedCompanyId : null,
                is_dry_run: dryRun
            });

            if (error) throw error;

            toast.success(
                dryRun ? "Simulação Concluída" : "Execução Concluída"
            );

            if (runId) onSuccess(runId as string);
            onOpenChange(false);
        } catch (err: any) {
            console.error(err);
            toast.error("Falha ao executar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5 text-primary" />
                        Executar Motor de Cobrança
                    </DialogTitle>
                    <DialogDescription>
                        Configure os parâmetros de execução. Use o modo simulado (Dry Run) para testar sem alterar dados.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">

                    {/* Mode Selection */}
                    <div className="grid gap-2">
                        <Label>Escopo de Execução</Label>
                        <Select value={mode} onValueChange={(v: "ALL" | "SINGLE") => setMode(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas as Empresas</SelectItem>
                                <SelectItem value="SINGLE">Apenas Uma Empresa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Company Selection (Conditional) */}
                    {mode === "SINGLE" && (
                        <div className="grid gap-2">
                            <Label>Selecione a Empresa</Label>
                            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId} disabled={loadingCompanies}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingCompanies ? "Carregando..." : "Selecione..."} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Dry Run Switch */}
                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg shadow-sm">
                        <div className="space-y-0.5">
                            <Label className="text-base font-semibold">Modo Simulação (Dry Run)</Label>
                            <p className="text-xs text-muted-foreground">
                                Gera logs e valida a elegibilidade, mas NÃO atualiza os faturamentos.
                            </p>
                        </div>
                        <Switch
                            checked={dryRun}
                            onCheckedChange={setDryRun}
                        />
                    </div>

                    {!dryRun && (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md text-sm">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Atenção: A execução real irá atualizar o ciclo de faturamento das empresas.</span>
                        </div>
                    )}

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleRun} disabled={loading} variant={dryRun ? "default" : "destructive"}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Processando..." : dryRun ? "Simular Agora" : "Executar (Valendo)"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
