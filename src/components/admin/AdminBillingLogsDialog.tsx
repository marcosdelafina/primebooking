import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, AlertCircle, Info } from "lucide-react";

interface AdminBillingLogsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    runId: string | null;
}

interface BillingLog {
    id: number;
    level: 'INFO' | 'ERROR';
    message: string;
    created_at: string;
    empresa?: { nome: string };
}

export function AdminBillingLogsDialog({ open, onOpenChange, runId }: AdminBillingLogsDialogProps) {
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['billing-run-logs', runId],
        queryFn: async () => {
            if (!runId) return [];
            const { data, error } = await supabase
                .from('billing_run_logs')
                .select(`
                    id,
                    level,
                    message,
                    created_at,
                    empresa:empresas(nome)
                `)
                .eq('run_id', runId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as unknown as BillingLog[];
        },
        enabled: !!runId && open,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Logs de Execução
                        <Badge variant="outline">#{runId?.split('-')[0]}</Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 mt-4 border rounded-lg overflow-hidden bg-muted/20">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-3">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <span>Carregando logs...</span>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    Nenhum log encontrado para esta execução.
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex gap-3 text-sm border-b border-muted pb-3 last:border-0"
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            {log.level === 'ERROR' ? (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <Info className="h-4 w-4 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-xs text-muted-foreground">
                                                    {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
                                                    {log.empresa?.nome && ` • ${log.empresa.nome}`}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] h-4 px-1 ${log.level === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                        }`}
                                                >
                                                    {log.level}
                                                </Badge>
                                            </div>
                                            <p className="leading-relaxed whitespace-pre-wrap">{log.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
