import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, Building2, MapPin, Save, Loader2, ExternalLink, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getEmpresa, updateEmpresa, getEstados, getMunicipios, getStoreReview, submitReview, getCategoriasEmpresa } from '@/lib/supabase-services';
import { empresaSettingsSchema, type EmpresaSettingsFormData } from '@/lib/validations';
import { formatDocument, formatCEP } from '@/lib/document-utils';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Clock, ChevronsUpDown } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

export default function EnterpriseSettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const empresaId = user?.empresa_id || '';

    const { data: empresa, isLoading } = useQuery({
        queryKey: ['empresa', empresaId],
        queryFn: () => getEmpresa(empresaId),
        enabled: !!empresaId,
    });

    // Realtime Sync
    useSupabaseRealtime('empresas', empresaId, [['empresa', empresaId]]);

    const { data: estados = [] } = useQuery({
        queryKey: ['estados'],
        queryFn: () => getEstados(),
    });

    const { data: dbCategories = [] } = useQuery({
        queryKey: ['global-categories'],
        queryFn: getCategoriasEmpresa
    });

    const form = useForm<EmpresaSettingsFormData>({
        resolver: zodResolver(empresaSettingsSchema),
        defaultValues: {
            nome: '',
            slug: '',
            documento: '',
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            whatsapp: '',
            categoria: [],
            imagem_url: '',
            descricao: '',
            horario_abertura: '09:00',
            horario_fechamento: '18:00',
            dias_funcionamento: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
        },
    });

    const selectedEstadoSigla = form.watch('estado');
    const selectedEstado = estados.find(e => e.sigla === selectedEstadoSigla);

    const { data: municipios = [] } = useQuery({
        queryKey: ['municipios', selectedEstado?.codigo_ibge_uf],
        queryFn: () => getMunicipios(selectedEstado?.codigo_ibge_uf),
        enabled: !!selectedEstado?.codigo_ibge_uf,
    });

    useEffect(() => {
        if (empresa) {
            form.reset({
                nome: empresa.nome || '',
                slug: empresa.slug || '',
                documento: empresa.documento || '',
                cep: empresa.cep || '',
                logradouro: empresa.logradouro || '',
                numero: empresa.numero || '',
                complemento: empresa.complemento || '',
                bairro: empresa.bairro || '',
                cidade: empresa.cidade || '',
                estado: empresa.estado || '',
                whatsapp: empresa.whatsapp || '',
                categoria: (() => {
                    const raw = empresa.categoria;
                    if (!raw) return [];

                    let categories: string[] = [];
                    if (Array.isArray(raw)) {
                        // If it's a stringified JSON array inside another array, unwrap it
                        if (raw.length === 1 && typeof raw[0] === 'string' && raw[0].startsWith('[')) {
                            try {
                                const parsed = JSON.parse(raw[0]);
                                if (Array.isArray(parsed)) categories = parsed;
                                else categories = raw;
                            } catch (e) { categories = raw; }
                        } else {
                            categories = raw;
                        }
                    } else if (typeof raw === 'string' && raw.startsWith('[')) {
                        try {
                            const parsed = JSON.parse(raw);
                            if (Array.isArray(parsed)) categories = parsed;
                            else categories = [raw];
                        } catch (e) { categories = [raw]; }
                    } else {
                        categories = [raw];
                    }

                    // Filter out any "dirty" JSON strings that might have slipped into the array
                    return categories.filter(c => typeof c === 'string' && !c.startsWith('['));
                })(),
                imagem_url: empresa.imagem_url || '',
                descricao: empresa.descricao || '',
                horario_abertura: empresa.horario_abertura || '09:00',
                horario_fechamento: empresa.horario_fechamento || '18:00',
                dias_funcionamento: empresa.dias_funcionamento || ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
            });
        }
    }, [empresa, form]);

    const updateMutation = useMutation({
        mutationFn: (data: EmpresaSettingsFormData) => updateEmpresa(empresaId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['empresa', empresaId] });
            toast({
                title: 'Configurações salvas',
                description: 'Os dados da empresa foram atualizados com sucesso.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao salvar',
                description: error.message || 'Ocorreu um erro ao atualizar os dados.',
                variant: 'destructive',
            });
        },
    });

    const { data: existingReview, refetch: refetchReview } = useQuery({
        queryKey: ['store-review', empresaId, user?.id],
        queryFn: () => getStoreReview(empresaId, user?.id || ''),
        enabled: !!empresaId && !!user?.id,
    });

    const [rating, setRating] = React.useState(0);
    const [comment, setComment] = React.useState('');

    const reviewMutation = useMutation({
        mutationFn: (data: { nota: number; comentario?: string }) =>
            submitReview({
                empresa_id: empresaId,
                usuario_id: user?.id || '',
                nota: data.nota,
                comentario: data.comentario
            }),
        onSuccess: () => {
            refetchReview();
            toast({
                title: 'Avaliação enviada',
                description: 'Obrigado pelo seu feedback! Ele será analisado pela nossa equipe.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao enviar',
                description: error.message || 'Ocorreu um erro ao enviar sua avaliação.',
                variant: 'destructive',
            });
        },
    });

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    form.setValue('logradouro', data.logradouro);
                    form.setValue('bairro', data.bairro);
                    form.setValue('estado', data.uf);
                    // We set the city name, and if it's in our database list, it should match the selector
                    form.setValue('cidade', data.localidade);

                    // Focus on number field after CEP lookup
                    const numeroField = document.getElementById('numero');
                    if (numeroField) numeroField.focus();
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            }
        }
    };

    const onSubmit = (data: EmpresaSettingsFormData) => {
        // Clean documento before saving
        const cleanedData = {
            ...data,
            documento: data.documento.replace(/[^\w]/g, '').toUpperCase()
        };
        updateMutation.mutate(cleanedData as EmpresaSettingsFormData);
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="container mx-auto py-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configurações da Empresa</h1>
                    <p className="text-muted-foreground">
                        Gerencie as informações básicas e de localização do seu estabelecimento.
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                <CardTitle>Perfil Público</CardTitle>
                            </div>
                            <CardDescription>
                                Como seu estabelecimento aparecerá para os clientes no PrimeBooking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="categoria">Categorias do Estabelecimento</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between font-normal h-auto min-h-10 py-2"
                                            >
                                                <div className="flex flex-wrap gap-1">
                                                    {(() => {
                                                        const cats = form.watch('categoria') || [];
                                                        const cleanCats = cats.filter((c: string) => !c.startsWith('['));

                                                        if (cleanCats.length === 0) {
                                                            return <span className="text-muted-foreground">Selecione as categorias</span>;
                                                        }

                                                        return cleanCats.map((cat: string) => (
                                                            <Badge key={cat} variant="secondary" className="font-medium text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                                                {cat}
                                                            </Badge>
                                                        ));
                                                    })()}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Buscar categoria..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                                                    <CommandGroup>
                                                        {dbCategories.filter(c => c.ativo).map((cat) => (
                                                            <CommandItem
                                                                key={cat.id}
                                                                value={cat.nome}
                                                                onSelect={() => {
                                                                    const current = form.getValues('categoria') || [];
                                                                    const next = current.includes(cat.nome)
                                                                        ? current.filter(c => c !== cat.nome)
                                                                        : [...current, cat.nome];
                                                                    form.setValue('categoria', next, { shouldValidate: true, shouldDirty: true });
                                                                }}
                                                            >
                                                                <div className={cn(
                                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                    form.watch('categoria')?.includes(cat.nome)
                                                                        ? "bg-primary text-primary-foreground"
                                                                        : "opacity-50 [&_svg]:invisible"
                                                                )}>
                                                                    <Check className="h-4 w-4" />
                                                                </div>
                                                                {cat.nome}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imagem_url">URL da Foto de Perfil</Label>
                                    <Input
                                        id="imagem_url"
                                        placeholder="https://exemplo.com/sua-foto.jpg"
                                        {...form.register('imagem_url')}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Cole uma URL de imagem do Unsplash ou do seu site.</p>
                                    {form.formState.errors.imagem_url && (
                                        <p className="text-sm text-destructive">{form.formState.errors.imagem_url.message}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição / Bio (Aparece no seu perfil)</Label>
                                <Input
                                    id="descricao"
                                    placeholder="Conte um pouco sobre seu estabelecimento, especialidades e diferenciais."
                                    {...form.register('descricao')}
                                />
                                {form.formState.errors.descricao && (
                                    <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <CardTitle>Dados Gerais</CardTitle>
                            </div>
                            <CardDescription>
                                Informações de identificação da empresa.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nome">Nome da Empresa</Label>
                                    <Input
                                        id="nome"
                                        placeholder="Ex: Prime Booking Studio"
                                        {...form.register('nome')}
                                    />
                                    {form.formState.errors.nome && (
                                        <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        Link de Agendamento (Slug)
                                    </Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">/book/</span>
                                            <Input
                                                id="slug"
                                                className="pl-14"
                                                placeholder="nome-do-seu-salao"
                                                {...form.register('slug')}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                        .toLowerCase()
                                                        .replace(/\s+/g, '-')
                                                        .replace(/[^a-z0-9-]/g, '');
                                                    form.setValue('slug', value, { shouldValidate: true });
                                                }}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            title="Ver página pública"
                                            onClick={() => {
                                                const slug = form.getValues('slug');
                                                if (slug) window.open(`/book/${slug}`, '_blank');
                                            }}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        Seu link público será: <span className="font-medium text-primary">{window.location.host}/book/{form.watch('slug')}</span>
                                    </p>
                                    {form.formState.errors.slug && (
                                        <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="documento">CPF / CNPJ</Label>
                                    <Input
                                        id="documento"
                                        placeholder="CPF ou CNPJ (ex: 12.345.678/0001-99)"
                                        maxLength={18}
                                        {...form.register('documento')}
                                        onChange={(e) => {
                                            const formatted = formatDocument(e.target.value);
                                            form.setValue('documento', formatted, { shouldValidate: true, shouldDirty: true });
                                        }}
                                    />
                                    {form.formState.errors.documento && (
                                        <p className="text-sm text-destructive">{form.formState.errors.documento.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp">WhatsApp de Atendimento</Label>
                                    <PhoneInput
                                        id="whatsapp"
                                        value={form.watch('whatsapp')}
                                        onChange={(v) => form.setValue('whatsapp', v)}
                                    />
                                    {form.formState.errors.whatsapp && (
                                        <p className="text-sm text-destructive">{form.formState.errors.whatsapp.message}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                <CardTitle>Localização</CardTitle>
                            </div>
                            <CardDescription>
                                Endereço físico de atendimento. O CEP preenche logradouro, bairro, cidade e estado automaticamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cep">CEP</Label>
                                    <Input
                                        id="cep"
                                        placeholder="00000-000"
                                        maxLength={9}
                                        {...form.register('cep')}
                                        onChange={(e) => {
                                            const formatted = formatCEP(e.target.value);
                                            form.setValue('cep', formatted, { shouldValidate: true, shouldDirty: true });
                                        }}
                                        onBlur={handleCepBlur}
                                    />
                                    {form.formState.errors.cep && (
                                        <p className="text-sm text-destructive">{form.formState.errors.cep.message}</p>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="logradouro">Logradouro (Rua, Avenida, etc)</Label>
                                    <Input
                                        id="logradouro"
                                        placeholder="Rua das Flores"
                                        {...form.register('logradouro')}
                                    />
                                    {form.formState.errors.logradouro && (
                                        <p className="text-sm text-destructive">{form.formState.errors.logradouro.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="numero">Número</Label>
                                    <Input
                                        id="numero"
                                        placeholder="123"
                                        {...form.register('numero')}
                                    />
                                    {form.formState.errors.numero && (
                                        <p className="text-sm text-destructive">{form.formState.errors.numero.message}</p>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="complemento">Complemento (Opcional)</Label>
                                    <Input
                                        id="complemento"
                                        placeholder="Sala 402, Bloco B"
                                        {...form.register('complemento')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bairro">Bairro</Label>
                                    <Input
                                        id="bairro"
                                        placeholder="Centro"
                                        {...form.register('bairro')}
                                    />
                                    {form.formState.errors.bairro && (
                                        <p className="text-sm text-destructive">{form.formState.errors.bairro.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estado">Estado (UF)</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between font-normal"
                                                id="estado"
                                            >
                                                {form.watch('estado')
                                                    ? estados.find(e => e.sigla === form.watch('estado'))?.nome_uf
                                                    : "Selecione o estado"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar estado..." />
                                                <CommandList>
                                                    <CommandEmpty>Estado não encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                        {estados.map((estado) => (
                                                            <CommandItem
                                                                key={estado.id}
                                                                value={estado.nome_uf}
                                                                onSelect={() => {
                                                                    form.setValue('estado', estado.sigla);
                                                                    form.setValue('cidade', '');
                                                                }}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Checkbox
                                                                    checked={form.watch('estado') === estado.sigla}
                                                                    className="pointer-events-none"
                                                                />
                                                                <span>{estado.nome_uf} ({estado.sigla})</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {form.formState.errors.estado && (
                                        <p className="text-sm text-destructive">{form.formState.errors.estado.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cidade">Cidade</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between font-normal"
                                                id="cidade"
                                                disabled={!selectedEstadoSigla}
                                            >
                                                {form.watch('cidade') || (selectedEstadoSigla ? "Selecione a cidade" : "Selecione um estado")}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar cidade..." />
                                                <CommandList>
                                                    <CommandEmpty>Cidade não encontrada.</CommandEmpty>
                                                    <CommandGroup>
                                                        {municipios.map((municipio) => (
                                                            <CommandItem
                                                                key={municipio.id}
                                                                value={municipio.nome_municipio}
                                                                onSelect={() => {
                                                                    form.setValue('cidade', municipio.nome_municipio);
                                                                }}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Checkbox
                                                                    checked={form.watch('cidade') === municipio.nome_municipio}
                                                                    className="pointer-events-none"
                                                                />
                                                                <span>{municipio.nome_municipio}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                <CardTitle>Horário de Funcionamento</CardTitle>
                            </div>
                            <CardDescription>
                                Defina os dias e horários em que seu estabelecimento está aberto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="horario_abertura">Início do Expediente</Label>
                                    <Input
                                        id="horario_abertura"
                                        type="time"
                                        {...form.register('horario_abertura')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="horario_fechamento">Fim do Expediente</Label>
                                    <Input
                                        id="horario_fechamento"
                                        type="time"
                                        {...form.register('horario_fechamento')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Dias de Atendimento</Label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'seg', label: 'Segunda' },
                                        { id: 'ter', label: 'Terça' },
                                        { id: 'qua', label: 'Quarta' },
                                        { id: 'qui', label: 'Quinta' },
                                        { id: 'sex', label: 'Sexta' },
                                        { id: 'sab', label: 'Sábado' },
                                        { id: 'dom', label: 'Domingo' },
                                    ].map((dia) => {
                                        const isSelected = form.watch('dias_funcionamento')?.includes(dia.id);
                                        return (
                                            <Button
                                                key={dia.id}
                                                type="button"
                                                variant={isSelected ? "default" : "outline"}
                                                size="sm"
                                                className={cn(
                                                    "rounded-full px-4 transition-all",
                                                    isSelected ? "shadow-md shadow-primary/20" : "text-muted-foreground"
                                                )}
                                                onClick={() => {
                                                    const current = form.getValues('dias_funcionamento') || [];
                                                    const next = current.includes(dia.id)
                                                        ? current.filter(d => d !== dia.id)
                                                        : [...current, dia.id];
                                                    form.setValue('dias_funcionamento', next, { shouldValidate: true, shouldDirty: true });
                                                }}
                                            >
                                                {dia.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                                {form.formState.errors.dias_funcionamento && (
                                    <p className="text-sm text-destructive">{form.formState.errors.dias_funcionamento.message}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-primary fill-primary" />
                                <CardTitle>Avalie o PrimeBooking</CardTitle>
                            </div>
                            <CardDescription>
                                Sua opinião é fundamental para evoluirmos a plataforma.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {existingReview ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star
                                                    key={s}
                                                    className={cn(
                                                        "h-5 w-5",
                                                        s <= existingReview.nota ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <Badge variant="outline" className="capitalize">
                                            {existingReview.status === 'active' ? 'Publicado' : 'Em moderação'}
                                        </Badge>
                                    </div>
                                    {existingReview.comentario && (
                                        <p className="text-sm italic text-muted-foreground">
                                            "{existingReview.comentario}"
                                        </p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground">
                                        Avaliação enviada em {new Date(existingReview.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <Label>Sua nota</Label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setRating(s)}
                                                    className="transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        className={cn(
                                                            "h-8 w-8",
                                                            s <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                                                        )}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="review-comment">Seu comentário (opcional)</Label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <textarea
                                                id="review-comment"
                                                placeholder="Conte o que está achando da plataforma..."
                                                className="w-full min-h-[100px] rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => reviewMutation.mutate({ nota: rating, comentario: comment })}
                                        disabled={rating === 0 || reviewMutation.isPending}
                                        variant="default"
                                    >
                                        {reviewMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={updateMutation.isPending}
                            className="px-8"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
