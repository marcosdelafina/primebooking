import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Scissors,
  Clock,
  DollarSign,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
  X,
  ChevronsUpDown,
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { servicoSchema, type ServicoFormData } from '@/lib/validations';
import type { Servico } from '@/types/entities';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/document-utils';

// Service Card Component
function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  service: Servico;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
}) {
  const displayPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  return (
    <Card className={cn(
      'hover:shadow-soft transition-all',
      !service.ativo && 'opacity-60'
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Scissors className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{service.nome}</h3>
                <Badge
                  variant={service.ativo ? 'default' : 'secondary'}
                  className={cn(
                    'shrink-0',
                    service.ativo
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {service.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {service.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {service.descricao}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(service.duracao_min)}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <DollarSign className="h-4 w-4" />
                  <span>{displayPrice(service.preco)}</span>
                </div>
                {service.categoria && (
                  <Badge variant="outline" className="text-xs">
                    {service.categoria}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={service.ativo}
              onCheckedChange={onToggleActive}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Scissors className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum serviço cadastrado</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Comece cadastrando os serviços que sua empresa oferece para seus clientes.
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar serviço
      </Button>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServicos, createServico, updateServico, deleteServico } from '@/lib/supabase-services';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

// ... (ServiceCard and EmptyState components remain similar but updated below)

export default function ServicesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Servico | null>(null);

  const empresaId = user?.empresa_id || '';

  // Query
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: () => getServicos(empresaId),
    enabled: !!empresaId,
  });

  // Realtime
  useSupabaseRealtime('servicos', empresaId, [['servicos', empresaId]]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ServicoFormData) => createServico(empresaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({ title: 'Serviço criado', description: 'Serviço criado com sucesso.' });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Falha ao criar serviço.', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Servico> }) => updateServico(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({ title: 'Serviço atualizado', description: 'Serviço atualizado com sucesso.' });
      setIsFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({ title: 'Serviço excluído', description: 'O serviço foi removido.' });
      setIsDeleteOpen(false);
    },
  });

  // Form
  const form = useForm<ServicoFormData>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      duracao_min: 30,
      preco: 0,
      ativo: true,
      categoria: '',
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setSelectedService(null);
      form.reset({
        nome: '',
        descricao: '',
        duracao_min: 30,
        preco: 0,
        ativo: true,
        categoria: '',
      });
      setIsFormOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, form]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = service.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.descricao?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter.length === 0 ||
        (statusFilter.includes('active') && service.ativo) ||
        (statusFilter.includes('inactive') && !service.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [services, searchQuery, statusFilter]);

  // Handlers
  const openCreateForm = () => {
    setSelectedService(null);
    form.reset({
      nome: '',
      descricao: '',
      duracao_min: 30,
      preco: 0,
      ativo: true,
      categoria: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (service: Servico) => {
    setSelectedService(service);
    form.reset({
      nome: service.nome,
      descricao: service.descricao || '',
      duracao_min: service.duracao_min,
      preco: service.preco,
      ativo: service.ativo,
      categoria: service.categoria || '',
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (service: Servico) => {
    setSelectedService(service);
    setIsDeleteOpen(true);
  };

  const handleToggleActive = (service: Servico, active: boolean) => {
    updateMutation.mutate({ id: service.id, data: { ativo: active } });
  };

  const handleSubmit = (data: ServicoFormData) => {
    if (selectedService) {
      updateMutation.mutate({ id: selectedService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (selectedService) {
      deleteMutation.mutate(selectedService.id);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Serviços</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os serviços oferecidos pela sua empresa.
            </p>
          </div>
          <Button onClick={openCreateForm} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {/* Filters */}
        {services.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-40 justify-between h-10 border-input bg-background px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {statusFilter.length === 0
                        ? "Todos"
                        : statusFilter.length === 1
                          ? (statusFilter[0] === 'active' ? 'Ativos' : 'Inativos')
                          : "Vários"}
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
                        onSelect={() => setStatusFilter([])}
                        className="flex items-center gap-2"
                      >
                        <Checkbox checked={statusFilter.length === 0} className="pointer-events-none" />
                        <span>Todos</span>
                      </CommandItem>
                      <CommandItem
                        onSelect={() => {
                          setStatusFilter(prev => prev.includes('active') ? prev.filter(s => s !== 'active') : [...prev, 'active']);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Checkbox checked={statusFilter.includes('active')} className="pointer-events-none" />
                        <span>Ativos</span>
                      </CommandItem>
                      <CommandItem
                        onSelect={() => {
                          setStatusFilter(prev => prev.includes('inactive') ? prev.filter(s => s !== 'inactive') : [...prev, 'inactive']);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Checkbox checked={statusFilter.includes('inactive')} className="pointer-events-none" />
                        <span>Inativos</span>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Services List */}
        {services.length === 0 ? (
          <EmptyState onAdd={openCreateForm} />
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum serviço encontrado.</p>
            <Button variant="link" onClick={() => { setSearchQuery(''); setStatusFilter([]); }}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => openEditForm(service)}
                onDelete={() => openDeleteDialog(service)}
                onToggleActive={(active) => handleToggleActive(service, active)}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedService ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
              <DialogDescription>
                {selectedService
                  ? 'Atualize as informações do serviço.'
                  : 'Preencha os dados para criar um novo serviço.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do serviço</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Corte de Cabelo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o serviço..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duracao_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={480}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0,00"
                            value={formatCurrency(String(Math.round(field.value * 100)))}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              const cents = parseInt(digits || '0');
                              field.onChange(cents / 100);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cabelo, Unhas, Bem-estar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="font-medium">Serviço ativo</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Disponível para agendamento
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {selectedService ? 'Salvar alterações' : 'Criar serviço'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Excluir serviço</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{selectedService?.nome}</strong>?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
