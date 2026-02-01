import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Users,
  Mail,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
  X,
  Calendar,
  Scissors
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { profissionalSchema, type ProfissionalFormData } from '@/lib/validations';
import type { Profissional, Servico } from '@/types/entities';
import { cn } from '@/lib/utils';

// Professional Card Component
function ProfessionalCard({
  professional,
  services,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  professional: Profissional;
  services: Servico[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
}) {
  const assignedServices = services.filter((s) =>
    professional.servicos_ids.includes(s.id)
  );

  const getAvailabilityDays = () => {
    const days = Object.entries(professional.disponibilidade)
      .filter(([_, slots]) => slots && slots.length > 0)
      .map(([day]) => day);

    const dayLabels: Record<string, string> = {
      seg: 'Seg',
      ter: 'Ter',
      qua: 'Qua',
      qui: 'Qui',
      sex: 'Sex',
      sab: 'Sáb',
      dom: 'Dom',
    };

    return days.map((d) => dayLabels[d] || d).join(', ');
  };

  return (
    <Card className={cn(
      'hover:shadow-soft transition-all',
      !professional.ativo && 'opacity-60'
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={professional.avatar_url} alt={professional.nome} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {professional.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{professional.nome}</h3>
                <Badge
                  variant={professional.ativo ? 'default' : 'secondary'}
                  className={cn(
                    'shrink-0',
                    professional.ativo
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {professional.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                <Mail className="h-4 w-4" />
                <span className="truncate">{professional.email}</span>
              </div>

              {/* Services */}
              <div className="flex items-start gap-2 mb-2">
                <Scissors className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {assignedServices.length === 0 ? (
                    <span className="text-sm text-muted-foreground">Nenhum serviço</span>
                  ) : (
                    assignedServices.slice(0, 3).map((service) => (
                      <Badge key={service.id} variant="outline" className="text-xs">
                        {service.nome}
                      </Badge>
                    ))
                  )}
                  {assignedServices.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{assignedServices.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{getAvailabilityDays() || 'Sem disponibilidade'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={professional.ativo}
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
        <Users className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum profissional cadastrado</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Comece cadastrando os profissionais que trabalham na sua empresa.
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar profissional
      </Button>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfissionais, createProfissional, updateProfissional, deleteProfissional, getServicos } from '@/lib/supabase-services';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

// ... (ProfessionalCard and EmptyState components remain similar but updated below)

export default function ProfessionalsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Profissional | null>(null);

  const empresaId = user?.empresa_id || '';

  // Queries
  const { data: professionals = [], isLoading: isProfsLoading } = useQuery({
    queryKey: ['profissionais', empresaId],
    queryFn: () => getProfissionais(empresaId),
    enabled: !!empresaId,
  });

  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: () => getServicos(empresaId),
    enabled: !!empresaId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Profissional>) => createProfissional(empresaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      toast({ title: 'Profissional criado', description: 'Profissional adicionado com sucesso.' });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Profissional> }) => updateProfissional(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      toast({ title: 'Profissional atualizado', description: 'Dados atualizados com sucesso.' });
      setIsFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfissional(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      toast({ title: 'Profissional excluído', description: 'O profissional foi removido.' });
      setIsDeleteOpen(false);
    },
  });

  // Form
  const form = useForm<ProfissionalFormData>({
    resolver: zodResolver(profissionalSchema),
    defaultValues: {
      nome: '',
      email: '',
      servicos_ids: [],
      ativo: true,
    },
  });

  // Filtered professionals
  const filteredProfessionals = useMemo(() => {
    return professionals.filter((prof) => {
      const matchesSearch = prof.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prof.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && prof.ativo) ||
        (statusFilter === 'inactive' && !prof.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [professionals, searchQuery, statusFilter]);

  // Handlers
  const openCreateForm = () => {
    setSelectedProfessional(null);
    form.reset({
      nome: '',
      email: '',
      servicos_ids: [],
      ativo: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (professional: Profissional) => {
    setSelectedProfessional(professional);
    form.reset({
      nome: professional.nome,
      email: professional.email,
      servicos_ids: professional.servicos_ids,
      ativo: professional.ativo,
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (professional: Profissional) => {
    setSelectedProfessional(professional);
    setIsDeleteOpen(true);
  };

  const handleToggleActive = (professional: Profissional, active: boolean) => {
    updateMutation.mutate({ id: professional.id, data: { ativo: active } });
  };

  const handleSubmit = (data: ProfissionalFormData) => {
    if (selectedProfessional) {
      updateMutation.mutate({ id: selectedProfessional.id, data });
    } else {
      createMutation.mutate({
        ...data,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.nome}`,
        disponibilidade: {
          seg: [{ inicio: '09:00', fim: '18:00' }],
          ter: [{ inicio: '09:00', fim: '18:00' }],
          qua: [{ inicio: '09:00', fim: '18:00' }],
          qui: [{ inicio: '09:00', fim: '18:00' }],
          sex: [{ inicio: '09:00', fim: '18:00' }],
        },
      });
    }
  };

  const handleDelete = () => {
    if (selectedProfessional) {
      deleteMutation.mutate(selectedProfessional.id);
    }
  };

  if (isProfsLoading || isServicesLoading) {
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
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Use the loaded services for the form
  const activeServices = services.filter((s) => s.ativo);


  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Profissionais</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os profissionais da sua equipe.
            </p>
          </div>
          <Button onClick={openCreateForm} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Novo Profissional
          </Button>
        </div>

        {/* Filters */}
        {professionals.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar profissionais..."
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
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Professionals List */}
        {professionals.length === 0 ? (
          <EmptyState onAdd={openCreateForm} />
        ) : filteredProfessionals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum profissional encontrado.</p>
            <Button variant="link" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                services={services}
                onEdit={() => openEditForm(professional)}
                onDelete={() => openDeleteDialog(professional)}
                onToggleActive={(active) => handleToggleActive(professional, active)}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedProfessional ? 'Editar Profissional' : 'Novo Profissional'}
              </DialogTitle>
              <DialogDescription>
                {selectedProfessional
                  ? 'Atualize as informações do profissional.'
                  : 'Preencha os dados para adicionar um novo profissional.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do profissional" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="servicos_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviços</FormLabel>
                      <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                        {activeServices.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhum serviço ativo disponível.
                          </p>
                        ) : (
                          activeServices.map((service) => (
                            <div key={service.id} className="flex items-center gap-2">
                              <Checkbox
                                id={service.id}
                                checked={field.value.includes(service.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, service.id]);
                                  } else {
                                    field.onChange(
                                      field.value.filter((id) => id !== service.id)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={service.id}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {service.nome}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
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
                        <FormLabel className="font-medium">Profissional ativo</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Disponível para atendimento
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
                    {selectedProfessional ? 'Salvar alterações' : 'Criar profissional'}
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
              <DialogTitle>Excluir profissional</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{selectedProfessional?.nome}</strong>?
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
