import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CheckCircle2,
    Clock,
    XCircle,
    User,
    Calendar as CalendarIcon,
    Pencil,
    Search,
    Plus,
    Filter,
    AlertCircle,
    Scissors,
    ChevronsUpDown
} from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { format, addMinutes, startOfDay, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
    getAgendamentos,
    createAgendamento,
    updateAgendamento,
    getClientes,
    getProfissionais,
    getServicos
} from '@/lib/supabase-services';
import { agendamentoSchema, type AgendamentoFormData } from '@/lib/validations';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';


const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: AlertCircle },
    confirmado: { label: 'Confirmado', color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: CheckCircle2 },
    em_andamento: { label: 'Em Andamento', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200', icon: Clock },
    concluido: { label: 'Concluído', color: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle2 },
    cancelado: { label: 'Cancelado', color: 'bg-red-500/10 text-red-600 border-red-200', icon: XCircle },
    nao_compareceu: { label: 'Não Compareceu', color: 'bg-gray-500/10 text-gray-600 border-gray-200', icon: User },
};

export default function AppointmentsPage() {
    const { user } = useAuth();
    const empresaId = user?.empresa_id || '';
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const form = useForm<AgendamentoFormData>({
        resolver: zodResolver(agendamentoSchema),
        defaultValues: {
            cliente_id: '',
            profissional_id: '',
            servicos_ids: [],
            data: new Date(),
            hora: '',
            status: 'pendente',
            notas: '',
        },
    });

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            setSelectedAppointment(null);
            form.reset();
            setIsFormOpen(true);
            // Optionally clear the param to avoid re-opening on refresh
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('action');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams, form]);

    // Queries
    const { data: appointments = [], isLoading: isAppsLoading } = useQuery({
        queryKey: ['agendamentos', empresaId],
        queryFn: () => getAgendamentos(empresaId),
        enabled: !!empresaId,
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clientes', empresaId],
        queryFn: () => getClientes(empresaId),
        enabled: !!empresaId && isFormOpen,
    });

    const { data: professionals = [] } = useQuery({
        queryKey: ['profissionais', empresaId],
        queryFn: () => getProfissionais(empresaId),
        enabled: !!empresaId && isFormOpen,
    });

    const { data: services = [] } = useQuery({
        queryKey: ['servicos', empresaId],
        queryFn: () => getServicos(empresaId),
        enabled: !!empresaId && isFormOpen,
    });

    // Realtime Subscriptions
    useSupabaseRealtime('agendamentos', empresaId, [['agendamentos', empresaId]]);
    useSupabaseRealtime('clientes', empresaId, [['clientes', empresaId]]);
    useSupabaseRealtime('profissionais', empresaId, [['profissionais', empresaId]]);
    useSupabaseRealtime('servicos', empresaId, [['servicos', empresaId]]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => createAgendamento(empresaId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agendamentos', empresaId] });
            toast({ title: 'Agendamento criado', description: 'O compromisso foi registrado com sucesso.' });
            setIsFormOpen(false);
            form.reset();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateAgendamento(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agendamentos', empresaId] });
            toast({ title: 'Agendamento atualizado', description: 'O compromisso foi alterado com sucesso.' });
            setIsFormOpen(false);
            setSelectedAppointment(null);
            form.reset();
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            updateAgendamento(id, { status } as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agendamentos', empresaId] });
            toast({ title: 'Status atualizado', description: 'O status do agendamento foi alterado.' });
        },
    });

    // Filtered appointments
    const filteredAppointments = useMemo(() => {
        return appointments.filter((app: any) => {
            const matchesStatus = statusFilter.length === 0 || statusFilter.includes(app.status);

            // Search in multiple services names resolved from the services list
            const serviceNames = (app.servicos_ids || [])
                .map((id: string) => services.find(s => s.id === id)?.nome || '')
                .join(' ') + (app.servico?.nome || '');

            const matchesSearch =
                app.cliente?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.profissional?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                serviceNames.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesStatus && matchesSearch;
        }).sort((a: any, b: any) => parseISO(a.data_inicio).getTime() - parseISO(b.data_inicio).getTime());
    }, [appointments, statusFilter, searchQuery, services]);

    // Available slots calculation
    const availableSlots = useMemo(() => {
        const selectedProfId = form.watch('profissional_id');
        const selectedDate = form.watch('data');
        const selectedSvcIds = form.watch('servicos_ids');

        if (!selectedProfId || !selectedDate || !selectedSvcIds?.length) return [];

        const professional = professionals.find(p => p.id === selectedProfId);
        const selectedServices = services.filter(s => selectedSvcIds.includes(s.id));
        if (!professional || selectedServices.length === 0) return [];

        const daysOrder = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
        const dayKey = daysOrder[selectedDate.getDay()];
        const availability = professional.disponibilidade?.[dayKey];

        if (!availability || availability.length === 0) return [];

        const slots: string[] = [];
        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duracao_min, 0);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const now = new Date();
        const isToday = dateStr === format(now, 'yyyy-MM-dd');

        // Get existing appointments for this prof/day to avoid overlap
        // We include all statuses except 'cancelado' as occupied time
        const existingOnDay = appointments.filter((a: any) =>
            a.profissional_id === selectedProfId &&
            format(new Date(a.data_inicio), 'yyyy-MM-dd') === dateStr &&
            a.status !== 'cancelado' &&
            (!selectedAppointment || a.id !== selectedAppointment.id)
        );

        availability.filter((a: any) => a.ativo).forEach((period: any) => {
            let current = new Date(`${dateStr}T${period.inicio}`);
            const end = new Date(`${dateStr}T${period.fim}`);

            while (addMinutes(current, totalDuration) <= end) {
                const hourStr = format(current, 'HH:mm');
                const slotStart = new Date(current);
                const slotEnd = addMinutes(current, totalDuration);

                // 1. Check if slot is in the past (if today)
                if (isToday && slotStart < now) {
                    current = addMinutes(current, 15);
                    continue;
                }

                // 2. Collision check against existing appointments
                const isBusy = existingOnDay.some((a: any) => {
                    const appStart = new Date(a.data_inicio);
                    const appEnd = new Date(a.data_fim);
                    // Standard overlap: (start1 < end2) AND (end1 > start2)
                    return (slotStart < appEnd && slotEnd > appStart);
                });

                if (!isBusy) {
                    slots.push(hourStr);
                }

                // Advance for next potential slot
                current = addMinutes(current, 15);
            }
        });

        return slots;
    }, [form.watch('profissional_id'), form.watch('data'), form.watch('servicos_ids'), professionals, services, appointments, selectedAppointment]);

    // Services filtered by professional
    const filteredServicesForPro = useMemo(() => {
        const selectedProfId = form.watch('profissional_id');
        if (!selectedProfId) return [];

        const professional = professionals.find(p => p.id === selectedProfId);
        if (!professional || !professional.servicos_ids) return [];

        return services.filter(s => professional.servicos_ids.includes(s.id));
    }, [form.watch('profissional_id'), professionals, services]);

    const onSubmit = (values: AgendamentoFormData) => {
        const selectedServices = services.filter(s => values.servicos_ids.includes(s.id));
        if (selectedServices.length === 0) return;

        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duracao_min, 0);
        const [hours, minutes] = values.hora.split(':').map(Number);
        const dataInicio = new Date(values.data);
        dataInicio.setHours(hours, minutes, 0, 0);
        const dataFim = addMinutes(dataInicio, totalDuration);

        const payload = {
            cliente_id: values.cliente_id,
            profissional_id: values.profissional_id,
            servicos_ids: values.servicos_ids,
            servico_id: values.servicos_ids[0], // Keep for compatibility
            data_inicio: dataInicio.toISOString(),
            data_fim: dataFim.toISOString(),
            status: values.status,
            notas: values.notas,
        };

        if (selectedAppointment) {
            updateMutation.mutate({ id: selectedAppointment.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const openEditDialog = (app: any) => {
        setSelectedAppointment(app);
        form.reset({
            cliente_id: app.cliente_id,
            profissional_id: app.profissional_id,
            servicos_ids: app.servicos_ids || (app.servico_id ? [app.servico_id] : []),
            data: new Date(app.data_inicio),
            hora: format(new Date(app.data_inicio), 'HH:mm'),
            status: app.status,
            notas: app.notas || '',
        });
        setIsFormOpen(true);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Agendamentos</h1>
                        <p className="text-muted-foreground mt-1">
                            Visualize e gerencie os horários marcados.
                        </p>
                    </div>
                    <Button onClick={() => { setSelectedAppointment(null); form.reset(); setIsFormOpen(true); }} className="shrink-0 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Agendamento
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente, profissional ou serviço..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[180px] justify-between h-10 border-input bg-background px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2 truncate">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {statusFilter.length === 0
                                                ? "Todos os Status"
                                                : `${statusFilter.length} Selecionado${statusFilter.length > 1 ? 's' : ''}`}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Filtrar status..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => setStatusFilter([])}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox checked={statusFilter.length === 0} className="pointer-events-none" />
                                                <span>Todos os Status</span>
                                            </CommandItem>
                                            {Object.entries(statusConfig).map(([key, config]) => (
                                                <CommandItem
                                                    key={key}
                                                    onSelect={() => {
                                                        setStatusFilter(prev =>
                                                            prev.includes(key)
                                                                ? prev.filter(s => s !== key)
                                                                : [...prev, key]
                                                        );
                                                    }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Checkbox checked={statusFilter.includes(key)} className="pointer-events-none" />
                                                    <config.icon className="h-4 w-4 text-muted-foreground" />
                                                    <span>{config.label}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Appointments List */}
                <div className="grid gap-4">
                    {isAppsLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)
                    ) : filteredAppointments.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold">Nenhum agendamento encontrado</h3>
                            <p className="text-muted-foreground mt-2 max-w-xs mx-auto mb-6">
                                {searchQuery ? 'Tente ajustar sua busca ou filtros.' : 'Comece a organizar sua agenda agora mesmo.'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => { setSelectedAppointment(null); form.reset(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Novo Agendamento
                                </Button>
                            )}
                            {searchQuery && (
                                <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter([]); }}>
                                    Limpar filtros
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredAppointments.map((app: any) => {
                            const config = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pendente;

                            return (
                                <div key={app.id} className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center h-16 w-16 rounded-xl bg-primary/5 border border-primary/10 shrink-0">
                                            <span className="text-xs font-semibold text-primary uppercase">
                                                {format(new Date(app.data_inicio), 'MMM', { locale: ptBR })}
                                            </span>
                                            <span className="text-2xl font-bold text-primary">
                                                {format(new Date(app.data_inicio), 'dd')}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">{app.cliente?.nome}</h3>
                                                <div className="flex items-center gap-1.5">
                                                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-1.5 py-0", config.color)}>
                                                        {config.label}
                                                    </Badge>
                                                    {app.google_event_id && (
                                                        <div className="flex items-center" title="Sincronizado com Google Calendar">
                                                            <img
                                                                src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png"
                                                                alt="Google"
                                                                className="w-3.5 h-3.5 opacity-80"
                                                                onDragStart={(e) => e.preventDefault()}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Scissors className="h-3.5 w-3.5" />
                                                    {app.servicos_ids && app.servicos_ids.length > 0
                                                        ? services.filter(s => app.servicos_ids.includes(s.id)).map(s => s.nome).join(', ')
                                                        : app.servico?.nome}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3.5 w-3.5" />
                                                    {app.profissional?.nome}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {format(new Date(app.data_inicio), 'HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end md:self-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    Mudar Status
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {Object.entries(statusConfig).map(([key, config]) => (
                                                    <DropdownMenuItem
                                                        key={key}
                                                        onClick={() => {
                                                            if (!app.profissional_id) {
                                                                toast({
                                                                    title: 'Profissional não atribuído',
                                                                    description: 'Defina um profissional antes de alterar o status.',
                                                                    variant: 'destructive',
                                                                });
                                                                return;
                                                            }
                                                            updateStatusMutation.mutate({ id: app.id, status: key });
                                                        }}
                                                    >
                                                        <config.icon className="h-4 w-4 mr-2" />
                                                        {config.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(app)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Dialog Form */}
                <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) setSelectedAppointment(null); setIsFormOpen(open); }}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
                            <DialogDescription>
                                {selectedAppointment ? 'Atualize os detalhes do compromisso.' : 'Escolha o cliente, profissional e horário.'}
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={form.control}
                                    name="cliente_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Cliente</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? clients.find((c) => c.id === field.value)?.nome
                                                                : "Selecione o cliente"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Buscar cliente..." />
                                                        <CommandList>
                                                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                                            <CommandGroup>
                                                                {clients.map((client) => (
                                                                    <CommandItem
                                                                        key={client.id}
                                                                        value={client.nome}
                                                                        onSelect={() => {
                                                                            form.setValue("cliente_id", client.id);
                                                                        }}
                                                                        className="flex items-center gap-2"
                                                                    >
                                                                        <Checkbox
                                                                            checked={field.value === client.id}
                                                                            className="pointer-events-none"
                                                                        />
                                                                        <span>{client.nome}</span>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="profissional_id"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Profissional</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-full justify-between font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? professionals.find((p) => p.id === field.value)?.nome
                                                                    : "Profissional"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Buscar profissional..." />
                                                            <CommandList>
                                                                <CommandEmpty>Não encontrado.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {professionals.map((prof) => (
                                                                        <CommandItem
                                                                            key={prof.id}
                                                                            value={prof.nome}
                                                                            onSelect={() => {
                                                                                form.setValue("profissional_id", prof.id);
                                                                            }}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            <Checkbox
                                                                                checked={field.value === prof.id}
                                                                                className="pointer-events-none"
                                                                            />
                                                                            <span>{prof.nome}</span>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="servicos_ids"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Serviços</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-full justify-between font-normal h-auto py-2",
                                                                    !field.value?.length && "text-muted-foreground"
                                                                )}
                                                            >
                                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                    {field.value?.length > 0
                                                                        ? services.filter((s) => field.value.includes(s.id)).map(s => (
                                                                            <Badge key={s.id} variant="secondary" className="text-[10px] px-1 h-5">
                                                                                {s.nome}
                                                                            </Badge>
                                                                        ))
                                                                        : "Selecione os serviços"}
                                                                </div>
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Buscar serviço..." />
                                                            <CommandList>
                                                                <CommandEmpty>Não encontrado.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {filteredServicesForPro.length === 0 ? (
                                                                        <div className="p-4 text-center text-sm text-muted-foreground font-medium bg-muted/50 rounded-md mx-2 my-1">
                                                                            {form.watch('profissional_id')
                                                                                ? "Nenhum serviço vinculado a este profissional."
                                                                                : "Selecione um profissional primeiro."}
                                                                        </div>
                                                                    ) : (
                                                                        filteredServicesForPro.map((svc) => (
                                                                            <CommandItem
                                                                                key={svc.id}
                                                                                onSelect={() => {
                                                                                    const current = field.value || [];
                                                                                    const next = current.includes(svc.id)
                                                                                        ? current.filter(id => id !== svc.id)
                                                                                        : [...current, svc.id];
                                                                                    form.setValue("servicos_ids", next, { shouldValidate: true });
                                                                                }}
                                                                                className="flex items-center gap-2"
                                                                            >
                                                                                <Checkbox
                                                                                    checked={field.value?.includes(svc.id)}
                                                                                    className="pointer-events-none"
                                                                                />
                                                                                <span>{svc.nome} - R$ {svc.preco}</span>
                                                                            </CommandItem>
                                                                        ))
                                                                    )}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="data"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Data</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP", { locale: ptBR })
                                                                ) : (
                                                                    <span>Escolha uma data</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => isBefore(date, startOfDay(new Date()))}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="hora"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Horário</FormLabel>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={availableSlots.length > 0 ? "Escolha um horário" : "Sem horários"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {availableSlots.length === 0 ? (
                                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                                Nenhum horário disponível para esta combinação.
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-3 gap-1 p-1">
                                                                {availableSlots.map(slot => (
                                                                    <SelectItem
                                                                        key={slot}
                                                                        value={slot}
                                                                        className="flex justify-center"
                                                                    >
                                                                        {slot}
                                                                    </SelectItem>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="notas"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observações (opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Cliente prefere água sem gás" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter className="pt-4">
                                    <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        Confirmar Agendamento
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
