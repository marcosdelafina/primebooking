import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Plus,
    Search,
    X,
    UserMinus,
    Pencil,
    Mail,
    Phone,
    FileText,
    User,
    Filter,
    ChevronsUpDown,
    ShieldCheck
} from 'lucide-react';

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
// Redundant dropdown menu imports removed
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
// Redundant label import removed
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    getClienteByTelefone
} from '@/lib/supabase-services';
import { clienteSchema, type ClienteFormData } from '@/lib/validations';
import type { Cliente } from '@/types/entities';
import { PhoneInput } from '@/components/ui/phone-input';
import { getWhatsAppLink } from '@/lib/utils';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
// Redundant services import removed

// Client Card Component
function ClientCard({
    client,
    onEdit,
    onToggleStatus,
    onInactivate,
}: {
    client: Cliente;
    onEdit: () => void;
    onToggleStatus: (active: boolean) => void;
    onInactivate: () => void;
}) {
    const isActive = client.status === 'ativo' || !client.status;

    return (
        <Card className={cn(
            'hover:shadow-md transition-all duration-200 border-border',
            !isActive && 'opacity-60 bg-muted/30'
        )}>
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <Avatar className="h-16 w-16 border-2 border-primary/5">
                            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                {client.nome?.charAt(0).toUpperCase() || <User className="h-6 w-6" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-xl truncate">{client.nome || 'Sem nome'}</h3>
                                <Badge
                                    variant={isActive ? 'default' : 'secondary'}
                                    className={cn(
                                        isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-200 text-slate-600'
                                    )}
                                >
                                    {isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
                                {client.email && (
                                    <a
                                        href={`mailto:${client.email}`}
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group/link"
                                    >
                                        <Mail className="h-3.5 w-3.5 group-hover/link:scale-110 transition-transform" />
                                        <span className="truncate group-hover/link:underline">{client.email}</span>
                                    </a>
                                )}
                                {client.telefone && (
                                    <a
                                        href={getWhatsAppLink(client.telefone)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-600 transition-colors group/link"
                                    >
                                        <Phone className="h-3.5 w-3.5 group-hover/link:scale-110 transition-transform" />
                                        <span className="group-hover/link:underline">{client.telefone}</span>
                                    </a>
                                )}
                                {client.notas && (
                                    <div className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2">
                                        <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        <span className="line-clamp-1 italic">{client.notas}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Status</span>
                            <Switch
                                checked={isActive}
                                onCheckedChange={onToggleStatus}
                            />
                        </div>
                        <div className="h-8 w-[1px] bg-border mx-1 hidden md:block" />
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                onClick={onEdit}
                                title="Editar Cliente"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:text-red-700 hover:bg-red-50 transition-colors"
                                onClick={onInactivate}
                                title={isActive ? "Inativar Cliente" : "Excluir Cliente"}
                            >
                                <UserMinus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function ClientsPage() {
    const { user } = useAuth();
    const empresaId = user?.empresa_id || '';
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [openStatusFilter, setOpenStatusFilter] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGloballyIdentified, setIsGloballyIdentified] = useState(false);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);


    const form = useForm<ClienteFormData>({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            nome: '',
            telefone: '',
            email: '',
            notas: '',
        },
    });

    const telefoneValue = form.watch('telefone');

    // Phone lookup for new clients
    useEffect(() => {
        if (selectedClient || !telefoneValue || telefoneValue.length < 10) {
            setIsGloballyIdentified(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingPhone(true);
            try {
                const globalClient = await getClienteByTelefone(empresaId, telefoneValue);

                // If found globally but NOT yet linked to this company (id is empty)
                if (globalClient && globalClient.cliente_global_id && !globalClient.id) {
                    setIsGloballyIdentified(true);
                    form.setValue('nome', globalClient.nome || '', { shouldValidate: true });
                    form.setValue('email', globalClient.email || '', { shouldValidate: true });
                    toast({
                        title: 'Cliente encontrado',
                        description: 'Este cliente já possui cadastro no sistema. Os dados básicos foram preenchidos.',
                    });
                } else {
                    setIsGloballyIdentified(false);
                }
            } catch (error) {
                console.error('Error checking phone:', error);
            } finally {
                setIsCheckingPhone(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [telefoneValue, empresaId, selectedClient, form, toast]);

    // Queries
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clientes', empresaId],
        queryFn: () => getClientes(empresaId),
        enabled: !!empresaId,
    });

    // Realtime
    useSupabaseRealtime('clientes_empresa', empresaId, [['clientes', empresaId]]);
    useSupabaseRealtime('clientes_global', undefined, [['clientes', empresaId]]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: ClienteFormData) => createCliente(empresaId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes', empresaId] });
            toast({ title: 'Cliente criado', description: 'O cliente foi cadastrado com sucesso.' });
            setIsFormOpen(false);
            form.reset();
        },
        onError: (error: any) => {
            const isEmailInUse = error.code === 'EMAIL_IN_USE';
            const isDuplicate = error.message?.includes('409') || error.status === 409 || error.code === 'DUPLICATE_CLIENT';

            toast({
                title: isEmailInUse ? 'E-mail em uso' : (isDuplicate ? 'Cliente já cadastrado' : 'Erro ao criar cliente'),
                description: isEmailInUse
                    ? 'Este e-mail já está sendo utilizado por outro cliente com dados diferentes.'
                    : (isDuplicate
                        ? 'Este cliente (e-mail ou telefone) já está cadastrado em sua empresa.'
                        : (error.message || 'Ocorreu um problema ao salvar os dados.')),
                variant: 'destructive'
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ClienteFormData }) => updateCliente(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes', empresaId] });
            toast({ title: 'Cliente atualizado', description: 'Os dados do cliente foram salvos.' });
            setIsFormOpen(false);
            setSelectedClient(null);
            form.reset();
        },
        onError: (error: any) => {
            const isEmailInUse = error.code === 'EMAIL_IN_USE';
            const isDuplicate = error.message?.includes('409') || error.status === 409 || error.code === 'DUPLICATE_CLIENT';

            toast({
                title: isEmailInUse ? 'E-mail em uso' : (isDuplicate ? 'Conflito de dados' : 'Erro ao atualizar'),
                description: isEmailInUse
                    ? 'O e-mail informado já pertence a outro cliente cadastrado.'
                    : (isDuplicate
                        ? 'Já existe outro cliente com este e-mail ou telefone em sua empresa.'
                        : (error.message || 'Não foi possível salvar as alterações.')),
                variant: 'destructive'
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCliente(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes', empresaId] });
            toast({ title: 'Cliente inativado', description: 'O registro foi marcado como inativo.' });
            setIsDeleteOpen(false);
            setSelectedClient(null);
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao inativar',
                description: error.message || 'Ocorreu um erro ao tentar inativar o cliente.',
                variant: 'destructive'
            });
        }
    });

    const reactivateMutation = useMutation({
        mutationFn: (id: string) => updateCliente(id, { status: 'ativo' } as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes', empresaId] });
            toast({ title: 'Cliente reativado', description: 'O cliente agora está ativo novamente.' });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao reativar',
                description: error.message || 'Não foi possível reativar o cliente.',
                variant: 'destructive'
            });
        }
    });

    // Filtered clients
    const filteredClients = useMemo(() => {
        return clients.filter((client) => {
            const search = searchQuery.toLowerCase();
            const matchesSearch = (
                (client.nome || '').toLowerCase().includes(search) ||
                (client.telefone || '').includes(searchQuery) ||
                client.email?.toLowerCase().includes(search)
            );

            const isActive = client.status === 'ativo' || !client.status;
            const matchesStatus = statusFilter.length === 0 ||
                (statusFilter.includes('ativo') && isActive) ||
                (statusFilter.includes('inativo') && !isActive);

            return matchesSearch && matchesStatus;
        });
    }, [clients, searchQuery, statusFilter]);

    // Handlers
    const openCreateForm = () => {
        setSelectedClient(null);
        setIsGloballyIdentified(false);
        form.reset({
            nome: '',
            telefone: '',
            email: '',
            notas: '',
            status: 'ativo'
        });
        setIsFormOpen(true);
    };

    const openEditForm = (client: Cliente) => {
        setSelectedClient(client);
        setIsGloballyIdentified(false);
        form.reset({
            nome: client.nome || '',
            telefone: client.telefone || '',
            email: client.email || '',
            notas: client.notas || '',
            status: client.status || 'ativo'
        });
        setIsFormOpen(true);
    };

    const openDeleteDialog = (client: Cliente) => {
        setSelectedClient(client);
        setIsDeleteOpen(true);
    };

    const onSubmit = (data: ClienteFormData) => {
        if (selectedClient) {
            updateMutation.mutate({ id: selectedClient.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = () => {
        if (selectedClient) {
            deleteMutation.mutate(selectedClient.id);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Clientes</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie sua base de clientes e contatos.
                        </p>
                    </div>
                    <Button onClick={openCreateForm} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Cliente
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome, telefone ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Popover open={openStatusFilter} onOpenChange={setOpenStatusFilter}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full md:w-48 bg-card justify-between h-10 border-input px-3 py-2 text-sm text-foreground">
                                <div className="flex items-center gap-2 truncate">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {statusFilter.length === 0
                                            ? "Todos os Status"
                                            : statusFilter.length === 1
                                                ? (statusFilter[0] === 'ativo' ? 'Ativos' : 'Inativos')
                                                : "Vários Selecionados"}
                                    </span>
                                </div>
                                <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Filtrar status..." />
                                <CommandList>
                                    <CommandEmpty>Não encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => {
                                                setStatusFilter([]);
                                                setOpenStatusFilter(false);
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox checked={statusFilter.length === 0} className="pointer-events-none" />
                                            <span>Todos os Status</span>
                                        </CommandItem>
                                        <CommandItem
                                            onSelect={() => {
                                                setStatusFilter(prev => prev.includes('ativo') ? prev.filter(s => s !== 'ativo') : [...prev, 'ativo']);
                                                setOpenStatusFilter(false);
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox checked={statusFilter.includes('ativo')} className="pointer-events-none" />
                                            <span>Ativos</span>
                                        </CommandItem>
                                        <CommandItem
                                            onSelect={() => {
                                                setStatusFilter(prev => prev.includes('inativo') ? prev.filter(s => s !== 'inativo') : [...prev, 'inativo']);
                                                setOpenStatusFilter(false);
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox checked={statusFilter.includes('inativo')} className="pointer-events-none" />
                                            <span>Inativos</span>
                                        </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((idx) => (
                            <Skeleton key={idx} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhum cliente encontrado</p>
                        <p className="text-muted-foreground mt-1">
                            {searchQuery ? 'Tente ajustar seus filtros de busca.' : 'Comece cadastrando seu primeiro cliente.'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={openCreateForm} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Cadastrar Cliente
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredClients.map((client) => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                onEdit={() => openEditForm(client)}
                                onToggleStatus={(active) => {
                                    if (active) reactivateMutation.mutate(client.id);
                                    else openDeleteDialog(client);
                                }}
                                onInactivate={() => openDeleteDialog(client)}
                            />
                        ))}
                    </div>
                )}

                {/* Client Form Dialog */}
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedClient ? 'Editar Cliente' : 'Novo Cliente'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedClient
                                    ? 'Atualize as informações de contato do cliente.'
                                    : 'Cadastre os dados básicos para identificar o cliente.'}
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={form.control}
                                    name="telefone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                Telefone / WhatsApp
                                                {isCheckingPhone && <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                                            </FormLabel>
                                            <FormControl>
                                                <PhoneInput
                                                    placeholder="Telefone"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    disabled={!!selectedClient} // Don't allow changing phone of existing local client in this modal for now
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="nome"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center justify-between">
                                                Nome Completo
                                                {isGloballyIdentified && (
                                                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 gap-1 px-1 h-5">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        Identidade Global
                                                    </Badge>
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ex: João da Silva"
                                                    {...field}
                                                    readOnly={isGloballyIdentified}
                                                    className={cn(isGloballyIdentified && "bg-muted focus-visible:ring-0 cursor-not-allowed")}
                                                />
                                            </FormControl>
                                            {isGloballyIdentified && (
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Nome importado automaticamente da rede.
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email (opcional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="exemplo@email.com"
                                                    {...field}
                                                    readOnly={isGloballyIdentified || (!!selectedClient && !!selectedClient.email)}
                                                    className={cn((isGloballyIdentified || (!!selectedClient && !!selectedClient.email)) && "bg-muted focus-visible:ring-0 cursor-not-allowed")}
                                                />
                                            </FormControl>
                                            {(isGloballyIdentified || (!!selectedClient && !!selectedClient.email)) && field.value && (
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Email registrado e bloqueado para segurança da identidade do cliente.
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="notas"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observações (opcional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Notas sobre preferências, intolerâncias, etc."
                                                    className="resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter className="gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsFormOpen(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                    >
                                        {selectedClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Inactivation Confirmation */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Inativar cliente?</DialogTitle>
                            <DialogDescription>
                                O cliente <strong>{selectedClient?.nome}</strong> será marcado como inativo. Você poderá reativá-lo mais tarde e o histórico será preservado.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 mt-4">
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                            >
                                Sim, inativar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
