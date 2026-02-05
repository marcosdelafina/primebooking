import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Plus,
    Search,
    UserCircle,
    MoreVertical,
    Edit,
    Trash2,
    Phone,
    Mail,
    FileText,
    X
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente
} from '@/lib/supabase-services';
import { clienteSchema, type ClienteFormData } from '@/lib/validations';
import type { Cliente } from '@/types/entities';
import { PhoneInput } from '@/components/ui/phone-input';
import { getWhatsAppLink } from '@/lib/utils';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

export default function ClientsPage() {
    const { user } = useAuth();
    const empresaId = user?.empresa_id || '';
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const form = useForm<ClienteFormData>({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            nome: '',
            telefone: '',
            email: '',
            notas: '',
        },
    });

    // Queries
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clientes', empresaId],
        queryFn: () => getClientes(empresaId),
        enabled: !!empresaId,
    });

    // Realtime
    useSupabaseRealtime('clientes', empresaId, [['clientes', empresaId]]);

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
            toast({
                title: 'Erro ao criar cliente',
                description: error.message || 'Ocorreu um problema ao salvar os dados.',
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
            toast({
                title: 'Erro ao atualizar',
                description: error.message || 'Não foi possível salvar as alterações.',
                variant: 'destructive'
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCliente(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes', empresaId] });
            toast({ title: 'Cliente removido', description: 'O registro foi excluído permanentemente.' });
            setIsDeleteOpen(false);
            setSelectedClient(null);
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao excluir',
                description: error.message || 'Ocorreu um erro ao tentar remover o cliente.',
                variant: 'destructive'
            });
        }
    });

    // Filtered clients
    const filteredClients = useMemo(() => {
        return clients.filter((client) => {
            const search = searchQuery.toLowerCase();
            return (
                client.nome.toLowerCase().includes(search) ||
                client.telefone.includes(searchQuery) ||
                client.email?.toLowerCase().includes(search)
            );
        });
    }, [clients, searchQuery]);

    // Handlers
    const openCreateForm = () => {
        setSelectedClient(null);
        form.reset({
            nome: '',
            telefone: '',
            email: '',
            notas: '',
        });
        setIsFormOpen(true);
    };

    const openEditForm = (client: Cliente) => {
        setSelectedClient(client);
        form.reset({
            nome: client.nome,
            telefone: client.telefone,
            email: client.email || '',
            notas: client.notas || '',
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

                <div className="relative">
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

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <Skeleton key={idx} className="h-40 w-full rounded-xl" />
                        ))}
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                        <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredClients.map((client) => (
                            <div
                                key={client.id}
                                className="group bg-card hover:bg-accent/5 transition-all duration-200 border border-border rounded-xl p-5 shadow-sm hover:shadow-md relative"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <UserCircle className="h-6 w-6" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditForm(client)}>
                                                <Edit className="h-4 w-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => openDeleteDialog(client)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="mt-4">
                                    <h3 className="font-semibold text-lg line-clamp-1">{client.nome}</h3>
                                    <div className="mt-3 space-y-2">
                                        <a
                                            href={getWhatsAppLink(client.telefone)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-sm text-muted-foreground hover:text-green-600 transition-colors group/link"
                                        >
                                            <Phone className="h-3.5 w-3.5 mr-2 shrink-0 group-hover/link:scale-110 transition-transform" />
                                            <span className="truncate group-hover/link:underline">{client.telefone}</span>
                                        </a>
                                        {client.email && (
                                            <a
                                                href={`mailto:${client.email}`}
                                                className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors group/link"
                                            >
                                                <Mail className="h-3.5 w-3.5 mr-2 shrink-0 group-hover/link:scale-110 transition-transform" />
                                                <span className="truncate group-hover/link:underline">{client.email}</span>
                                            </a>
                                        )}
                                        {client.notas && (
                                            <div className="flex items-start text-sm text-muted-foreground">
                                                <FileText className="h-3.5 w-3.5 mr-2 mt-0.5 shrink-0" />
                                                <p className="line-clamp-2 italic">{client.notas}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
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
                                    name="nome"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: João da Silva" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="telefone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone / WhatsApp</FormLabel>
                                            <FormControl>
                                                <PhoneInput
                                                    placeholder="Telefone"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
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
                                                <Input placeholder="exemplo@email.com" {...field} />
                                            </FormControl>
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

                {/* Delete Confirmation */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Excluir cliente?</DialogTitle>
                            <DialogDescription>
                                Esta ação não pode ser desfeita. O cliente <strong>{selectedClient?.nome}</strong> será removido permanentemente.
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
                                Sim, excluir
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
