import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Filter,
  X,
  Calendar,
  Scissors,
  Clock,
  CalendarCheck2,
  ChevronsUpDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProfissionais,
  createProfissional,
  updateProfissional,
  deleteProfissional,
  getServicos
} from '@/lib/supabase-services';
import { profissionalSchema, type ProfissionalFormData } from '@/lib/validations';
import type { Profissional, Servico } from '@/types/entities';
import { cn, getWhatsAppLink } from '@/lib/utils';
import { PhoneInput } from '@/components/ui/phone-input';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

const diasSemana = [
  { id: 'seg', label: 'Segunda' },
  { id: 'ter', label: 'Terça' },
  { id: 'qua', label: 'Quarta' },
  { id: 'qui', label: 'Quinta' },
  { id: 'sex', label: 'Sexta' },
  { id: 'sab', label: 'Sábado' },
  { id: 'dom', label: 'Domingo' },
];

// Professional Card Component
function ProfessionalCard({
  professional,
  services,
  onEdit,
  onDelete,
  onToggleActive,
  onConnectGoogle,
}: {
  professional: Profissional;
  services: Servico[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
  onConnectGoogle: () => void;
}) {
  const isGoogleConnected = !!professional.google_refresh_token;

  const assignedServices = services.filter((s) =>
    professional.servicos_ids.includes(s.id)
  );

  const getAvailabilityDays = () => {
    const activeDays = Object.entries(professional.disponibilidade || {})
      .filter(([_, slots]) => slots && slots.some(s => s.ativo))
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

    // Sort to maintain sequence
    return diasSemana
      .filter(d => activeDays.includes(d.id))
      .map(d => dayLabels[d.id])
      .join(', ');
  };

  return (
    <Card className={cn(
      'hover:shadow-md transition-all duration-200 border-border',
      !professional.ativo && 'opacity-60 bg-muted/30'
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <Avatar className="h-16 w-16 border-2 border-primary/5">
              <AvatarImage src={professional.avatar_url} alt={professional.nome} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {professional.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-xl truncate">{professional.nome}</h3>
                <Badge
                  variant={professional.ativo ? 'default' : 'secondary'}
                  className={cn(
                    professional.ativo ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {professional.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
                {isGoogleConnected ? (
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-600 gap-1">
                    <CalendarCheck2 className="h-3 w-3" />
                    Google Agenda Conectada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-600 gap-1 animate-pulse shadow-sm">
                    <Calendar className="h-3 w-3" />
                    Conectar Google Agenda
                  </Badge>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
                <a
                  href={`mailto:${professional.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group/link"
                >
                  <Mail className="h-3.5 w-3.5 group-hover/link:scale-110 transition-transform" />
                  <span className="truncate group-hover/link:underline">{professional.email}</span>
                </a>
                {professional.telefone && (
                  <a
                    href={getWhatsAppLink(professional.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-600 transition-colors group/link"
                  >
                    <Phone className="h-3.5 w-3.5 group-hover/link:scale-110 transition-transform" />
                    <span className="group-hover/link:underline">{professional.telefone}</span>
                  </a>
                )}
                <div className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2">
                  <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{getAvailabilityDays() || 'Sem disponibilidade configurada'}</span>
                </div>
              </div>

              {/* Services Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {assignedServices.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">Nenhum serviço vinculado</span>
                ) : (
                  assignedServices.slice(0, 5).map((service) => (
                    <Badge key={service.id} variant="secondary" className="text-[10px] py-0">
                      {service.nome}
                    </Badge>
                  ))
                )}
                {assignedServices.length > 5 && (
                  <Badge variant="outline" className="text-[10px] py-0">
                    +{assignedServices.length - 5} mais
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <div className="flex flex-col items-end mr-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Status</span>
              <Switch
                checked={professional.ativo}
                onCheckedChange={onToggleActive}
              />
            </div>
            <div className="h-8 w-[1px] bg-border mx-1 hidden md:block" />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                onClick={onEdit}
                title="Editar Profissional"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 transition-colors",
                  isGoogleConnected ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                )}
                onClick={onConnectGoogle}
                title={isGoogleConnected ? 'Reconectar Google Agenda' : 'Conectar Google Agenda'}
              >
                <CalendarCheck2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:text-red-700 hover:bg-red-50 transition-colors"
                onClick={onDelete}
                title="Excluir Profissional"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfessionalsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
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

  // Realtime
  useSupabaseRealtime('profissionais', empresaId, [['profissionais', empresaId]]);
  useSupabaseRealtime('servicos', empresaId, [['servicos', empresaId]]);

  // Form
  const form = useForm<ProfissionalFormData>({
    resolver: zodResolver(profissionalSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      servicos_ids: [],
      disponibilidade: {
        seg: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        ter: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        qua: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        qui: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        sex: [{ inicio: '09:00', fim: '18:00', ativo: true }],
      },
      ativo: true,
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setSelectedProfessional(null);
      form.reset({
        nome: '',
        email: '',
        telefone: '',
        servicos_ids: [],
        disponibilidade: {
          seg: [{ inicio: '09:00', fim: '18:00', ativo: true }],
          ter: [{ inicio: '09:00', fim: '18:00', ativo: true }],
          qua: [{ inicio: '09:00', fim: '18:00', ativo: true }],
          qui: [{ inicio: '09:00', fim: '18:00', ativo: true }],
          sex: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        },
        ativo: true,
      });
      setIsFormOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, form]);

  useEffect(() => {
    if (searchParams.get('sync') === 'success') {
      toast({
        title: 'Sucesso!',
        description: 'Google Calendar conectado com sucesso.',
      });
      // Clear the param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('sync');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  const handleConnectGoogle = async (profissionalId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          profissional_id: profissionalId,
          empresa_id: empresaId,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error connecting Google:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a conexão com o Google.',
        variant: 'destructive',
      });
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Profissional>) => createProfissional(empresaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais', empresaId] });
      toast({ title: 'Profissional criado', description: 'Profissional adicionado com sucesso.' });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Profissional> }) => updateProfissional(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais', empresaId] });
      toast({ title: 'Profissional atualizado', description: 'Dados atualizados com sucesso.' });
      setIsFormOpen(false);
      setSelectedProfessional(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfissional(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais', empresaId] });
      toast({ title: 'Profissional excluído', description: 'O profissional foi removido.' });
      setIsDeleteOpen(false);
      setSelectedProfessional(null);
    },
  });

  const handleDelete = () => {
    if (selectedProfessional) {
      deleteMutation.mutate(selectedProfessional.id);
    }
  };

  // Filtered professionals
  const filteredProfessionals = useMemo(() => {
    return professionals.filter((prof) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = prof.nome.toLowerCase().includes(search) ||
        prof.email.toLowerCase().includes(search) ||
        (prof.telefone && prof.telefone.includes(searchQuery));

      const matchesStatus = statusFilter.length === 0 ||
        (statusFilter.includes('active') && prof.ativo) ||
        (statusFilter.includes('inactive') && !prof.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [professionals, searchQuery, statusFilter]);

  // Handlers
  const openCreateForm = () => {
    setSelectedProfessional(null);
    form.reset({
      nome: '',
      email: '',
      telefone: '',
      servicos_ids: [],
      disponibilidade: {
        seg: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        ter: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        qua: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        qui: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        sex: [{ inicio: '09:00', fim: '18:00', ativo: true }],
      },
      ativo: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (professional: Profissional) => {
    setSelectedProfessional(professional);
    form.reset({
      nome: professional.nome,
      email: professional.email,
      telefone: professional.telefone || '',
      servicos_ids: professional.servicos_ids,
      disponibilidade: professional.disponibilidade || {},
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

  const onSubmit = (data: ProfissionalFormData) => {
    if (selectedProfessional) {
      updateMutation.mutate({ id: selectedProfessional.id, data });
    } else {
      createMutation.mutate({
        ...data,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.nome}`,
      });
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

  const activeServices = services.filter((s) => s.ativo);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Profissionais</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua equipe e disponibilidade.
            </p>
          </div>
          <Button onClick={openCreateForm} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Profissional
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
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
              <Button variant="outline" className="w-full md:w-48 bg-card justify-between h-10 border-input px-3 py-2 text-sm">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {statusFilter.length === 0
                      ? "Todos os Status"
                      : statusFilter.length === 1
                        ? (statusFilter[0] === 'active' ? 'Ativos' : 'Inativos')
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
                      onSelect={() => setStatusFilter([])}
                      className="flex items-center gap-2"
                    >
                      <Checkbox checked={statusFilter.length === 0} className="pointer-events-none" />
                      <span>Todos os Status</span>
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

        {/* List */}
        {filteredProfessionals.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold">Nenhum profissional</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
              {searchQuery ? 'Tente ajustar sua busca ou filtros.' : 'Cadastre sua equipe para começar os agendamentos.'}
            </p>
            {!searchQuery && (
              <Button onClick={openCreateForm} variant="outline" className="mt-8 border-blue-600 text-blue-600 hover:bg-blue-50">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Profissional
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProfessionals.map((prof) => (
              <ProfessionalCard
                key={prof.id}
                professional={prof}
                services={services}
                onEdit={() => openEditForm(prof)}
                onDelete={() => openDeleteDialog(prof)}
                onToggleActive={(active) => handleToggleActive(prof, active)}
                onConnectGoogle={() => handleConnectGoogle(prof.id)}
              />
            ))}
          </div>
        )}

        {/* Dialog Form */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-bold">
                {selectedProfessional ? 'Editar Profissional' : 'Novo Profissional'}
              </DialogTitle>
              <DialogDescription>
                Configure os dados e a agenda semanal de trabalho.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 pt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <Tabs defaultValue="geral" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
                      <TabsTrigger value="agenda">Disponibilidade Semanal</TabsTrigger>
                    </TabsList>

                    <TabsContent value="geral" className="space-y-6 mt-0">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Marcelo Silva" {...field} />
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
                                <Input type="email" placeholder="contato@exemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
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
                          name="ativo"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-xl border p-4 bg-muted/10 h-[72px]">
                              <div className="space-y-0.5">
                                <FormLabel className="font-semibold text-base">Status Ativo</FormLabel>
                                <p className="text-xs text-muted-foreground">Disponível para agenda</p>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="servicos_ids"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-bold flex items-center gap-2">
                              <Scissors className="h-5 w-5" />
                              Serviços Vinculados
                            </FormLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-xl bg-muted/5">
                              {activeServices.length === 0 ? (
                                <p className="col-span-full text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
                                  Cadastre serviços antes de vinculá-los aqui.
                                </p>
                              ) : (
                                activeServices.map((service) => (
                                  <div key={service.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/30 transition-colors">
                                    <Checkbox
                                      id={`svc-${service.id}`}
                                      checked={field.value.includes(service.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) field.onChange([...field.value, service.id]);
                                        else field.onChange(field.value.filter(id => id !== service.id));
                                      }}
                                    />
                                    <label htmlFor={`svc-${service.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 py-1">
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
                    </TabsContent>

                    <TabsContent value="agenda" className="space-y-4 mt-0">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 mb-6">
                        <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-blue-900">Configure os horários</p>
                          <p className="text-xs text-blue-700">Apenas dias marcados com horários estarão disponíveis para novos agendamentos.</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {diasSemana.map((dia) => (
                          <div key={dia.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border bg-card">
                            <div className="w-32 font-bold text-lg flex items-center gap-2">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                form.watch(`disponibilidade.${dia.id}`)?.length ? "bg-green-500" : "bg-muted"
                              )} />
                              {dia.label}
                            </div>

                            <div className="flex-1 space-y-3">
                              {form.watch(`disponibilidade.${dia.id}`)?.map((slot, index) => (
                                <div key={index} className={cn(
                                  "flex items-center gap-3 p-2 rounded-lg transition-colors border-2",
                                  slot.ativo ? "bg-background border-transparent" : "bg-muted/30 border-dashed border-muted grayscale-[0.5]"
                                )}>
                                  <div className="flex items-center gap-2 flex-1">
                                    <Input
                                      type="time"
                                      className="h-9"
                                      disabled={!slot.ativo}
                                      {...form.register(`disponibilidade.${dia.id}.${index}.inicio`)}
                                    />
                                    <span className="text-muted-foreground text-xs uppercase font-bold">até</span>
                                    <Input
                                      type="time"
                                      className="h-9"
                                      disabled={!slot.ativo}
                                      {...form.register(`disponibilidade.${dia.id}.${index}.fim`)}
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 border-l pl-3">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[9px] uppercase font-bold text-muted-foreground mb-0.5">Ativo</span>
                                      <Switch
                                        checked={slot.ativo}
                                        onCheckedChange={(checked) => {
                                          const current = [...form.getValues(`disponibilidade.${dia.id}`)];
                                          current[index].ativo = checked;
                                          form.setValue(`disponibilidade.${dia.id}`, current);
                                        }}
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      type="button"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => {
                                        const current = form.getValues(`disponibilidade.${dia.id}`);
                                        form.setValue(`disponibilidade.${dia.id}`, current.filter((_, i) => i !== index));
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                className="h-8 text-xs font-bold border-dashed border-2 ml-2"
                                onClick={() => {
                                  const current = form.getValues(`disponibilidade.${dia.id}`) || [];
                                  form.setValue(`disponibilidade.${dia.id}`, [...current, { inicio: '09:00', fim: '18:00', ativo: true }]);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {form.watch(`disponibilidade.${dia.id}`)?.length ? 'Novo Horário' : 'Ativar Dia'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t gap-2">
                    <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                      {selectedProfessional ? 'Salvar Alterações' : 'Criar Profissional'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-md p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Trash2 className="h-8 w-8" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Remover Profissional?</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Deseja mesmo excluir <strong>{selectedProfessional?.nome}</strong>?
                  Isso pode afetar agendamentos existentes vinculados a ele.
                </DialogDescription>
              </div>
            </div>
            <DialogFooter className="gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setIsDeleteOpen(false)}>
                Não, manter
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleteMutation.isPending}>
                Sim, excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
