import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Save, Loader2, ExternalLink, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getEmpresa, updateEmpresa, getEstados, getMunicipios } from '@/lib/supabase-services';
import { empresaSettingsSchema, type EmpresaSettingsFormData } from '@/lib/validations';
import { formatDocument, formatCEP } from '@/lib/document-utils';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsUpDown } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';

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

    const { data: estados = [] } = useQuery({
        queryKey: ['estados'],
        queryFn: () => getEstados(),
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
            categoria: '',
            imagem_url: '',
            descricao: '',
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
                categoria: empresa.categoria || '',
                imagem_url: empresa.imagem_url || '',
                descricao: empresa.descricao || '',
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
                                    <Label htmlFor="categoria">Categoria Principal</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between font-normal"
                                            >
                                                {form.watch('categoria') || "Selecione uma categoria"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar categoria..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                                                    <CommandGroup>
                                                        {['Salão de Beleza', 'Barbearia', 'Spa & Bem-estar', 'Estética', 'Saúde', 'Academia', 'Educação', 'Outros'].map((cat) => (
                                                            <CommandItem
                                                                key={cat}
                                                                value={cat}
                                                                onSelect={() => form.setValue('categoria', cat)}
                                                            >
                                                                <Checkbox
                                                                    checked={form.watch('categoria') === cat}
                                                                    className="mr-2"
                                                                />
                                                                {cat}
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
                                        Seu link público será: <span className="font-medium text-primary">localhost:8080/book/{form.watch('slug')}</span>
                                    </p>
                                    {form.formState.errors.slug && (
                                        <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="documento">CPF / CNPJ (apenas números)</Label>
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
                                    {form.formState.errors.cidade && (
                                        <p className="text-sm text-destructive">{form.formState.errors.cidade.message}</p>
                                    )}
                                </div>
                            </div>
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
