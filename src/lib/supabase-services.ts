import { supabase } from './supabase';
import type { Servico, Profissional, Cliente, Agendamento } from '@/types/entities';

// ============ Servicos ============

export async function getServicos(empresaId: string): Promise<Servico[]> {
    const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome');

    if (error) throw error;
    return data || [];
}

export async function createServico(empresaId: string, data: Partial<Servico>): Promise<Servico> {
    const { data: newServico, error } = await supabase
        .from('servicos')
        .insert([{ ...data, empresa_id: empresaId }])
        .select()
        .single();

    if (error) throw error;
    return newServico;
}

export async function updateServico(id: string, data: Partial<Servico>): Promise<Servico> {
    const { data: updatedServico, error } = await supabase
        .from('servicos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updatedServico;
}

export async function deleteServico(id: string): Promise<void> {
    const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ Profissionais ============

export async function getProfissionais(empresaId: string): Promise<Profissional[]> {
    const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome');

    if (error) throw error;
    return data || [];
}

export async function createProfissional(empresaId: string, data: Partial<Profissional>): Promise<Profissional> {
    const { data: newProf, error } = await supabase
        .from('profissionais')
        .insert([{ ...data, empresa_id: empresaId }])
        .select()
        .single();

    if (error) throw error;
    return newProf;
}

export async function updateProfissional(id: string, data: Partial<Profissional>): Promise<Profissional> {
    const { data: updatedProf, error } = await supabase
        .from('profissionais')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updatedProf;
}

export async function deleteProfissional(id: string): Promise<void> {
    const { error } = await supabase
        .from('profissionais')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ Empresa Settings ============

export async function getEmpresa(empresaId: string): Promise<any> {
    const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

    if (error) throw error;
    return data;
}

export async function getEmpresaBySlug(slug: string): Promise<any> {
    const { data, error } = await supabase
        .from('empresas')
        .select('*, billing:billing_empresa(billing_status)')
        .eq('slug', slug)
        .single();

    if (error) throw error;
    return data;
}

export async function getEmpresasPublicas(): Promise<any[]> {
    const { data, error } = await supabase
        .from('empresas')
        .select(`
            *,
            servicos(preco)
        `)
        .order('nome');

    if (error) throw error;
    return data || [];
}

export async function updateEmpresa(empresaId: string, data: any): Promise<any> {
    const { data: updated, error } = await supabase
        .from('empresas')
        .update(data)
        .eq('id', empresaId)
        .select()
        .single();

    if (error) throw error;
    return updated;
}

// ============ Categorias de Empresa ============

export async function getCategoriasEmpresa(): Promise<any[]> {
    const { data, error } = await supabase
        .from('categorias_empresa')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createCategoriaEmpresa(data: any): Promise<any> {
    const { data: newCat, error } = await supabase
        .from('categorias_empresa')
        .insert([data])
        .select()
        .single();

    if (error) throw error;
    return newCat;
}

export async function updateCategoriaEmpresa(id: string, data: any): Promise<any> {
    const { data: updated, error } = await supabase
        .from('categorias_empresa')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updated;
}

export async function deleteCategoriaEmpresa(id: string): Promise<void> {
    const { error } = await supabase
        .from('categorias_empresa')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ Clientes ============

export async function getClientes(empresaId: string): Promise<Cliente[]> {
    const { data, error } = await supabase
        .from('clientes_empresa')
        .select(`
            *,
            global:clientes_global(*)
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten the join result for convenience matching the interface
    // Prioritize local data from clientes_empresa if available
    return (data || []).map(ce => ({
        ...ce,
        nome: ce.nome || ce.global?.nome,
        email: ce.email || ce.global?.email,
        telefone: ce.telefone || ce.global?.telefone
    }));
}

export async function getClienteByTelefone(empresaId: string, telefone: string): Promise<Cliente | null> {
    const rawPhone = telefone.trim();
    let normalizedPhone = rawPhone.replace(/\D/g, '');

    // Auto-add +55 for BR numbers if missing (10 or 11 digits)
    if (normalizedPhone.length >= 10 && normalizedPhone.length <= 11 && !normalizedPhone.startsWith('55')) {
        normalizedPhone = '55' + normalizedPhone;
    }

    // Prepend + if missing
    if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+' + normalizedPhone;
    }

    // 1. Try global lookup first to find the identity
    const { data: globalClient, error: globalError } = await supabase
        .from('clientes_global')
        .select('*')
        .eq('telefone', normalizedPhone)
        .maybeSingle();

    if (globalError) throw globalError;
    if (!globalClient) return null;

    // 2. See if there's a link to THIS company
    const { data: companyLink, error: linkError } = await supabase
        .from('clientes_empresa')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('cliente_global_id', globalClient.id)
        .maybeSingle();

    if (linkError) throw linkError;

    // 3. Merge and return
    // Prioritize local data
    return {
        ...(companyLink || {}),
        id: companyLink?.id || '', // id will be empty if not linked yet, but we have global data
        cliente_global_id: globalClient.id,
        nome: companyLink?.nome || globalClient.nome,
        email: companyLink?.email || globalClient.email,
        telefone: companyLink?.telefone || globalClient.telefone,
        empresa_id: empresaId,
        status: companyLink?.status || 'ativo'
    };
}

export async function getClienteByEmail(empresaId: string, email: string): Promise<Cliente | null> {
    // 1. Try global lookup first
    const { data: globalClient, error: globalError } = await supabase
        .from('clientes_global')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

    if (globalError) throw globalError;
    if (!globalClient) return null;

    // 2. See if there's a link to THIS company
    const { data: companyLink, error: linkError } = await supabase
        .from('clientes_empresa')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('cliente_global_id', globalClient.id)
        .maybeSingle();

    if (linkError) throw linkError;

    // 3. Merge and return
    // Prioritize local data
    return {
        ...(companyLink || {}),
        id: companyLink?.id || '',
        cliente_global_id: globalClient.id,
        nome: companyLink?.nome || globalClient.nome,
        email: companyLink?.email || globalClient.email,
        telefone: companyLink?.telefone || globalClient.telefone,
        empresa_id: empresaId,
        status: companyLink?.status || 'ativo'
    };
}

/**
 * Handles complex client registration via Edge Function
 * This will:
 * 1. Check/Create auth.users (without password)
 * 2. Check/Create clientes_global
 * 3. Link to clientes_empresa
 * 4. Trigger activation email
 */
export async function registerClient(empresaId: string, data: {
    nome: string;
    email?: string;
    telefone: string;
    notas?: string;
    googleContactId?: string;
    allowAuthCreation?: boolean;
    isManualRegistration?: boolean;
}): Promise<Cliente> {
    const { data: response, error } = await supabase.functions.invoke('handle-client-registration', {
        body: {
            empresaId,
            ...data
        }
    });

    if (error) {
        // Supabase Edge Function errors often contain the JSON body in context
        // We try to extract the specific error message and code to show to the user
        try {
            const body = await (error as any).context?.json();
            if (body) {
                error.message = body.error || error.message;
                (error as any).code = body.code || (error as any).code;
                (error as any).status = (error as any).context?.status || 400;
            }
        } catch (e) {
            // If parsing fails, use the original error
            console.warn('[registerClient] Failed to parse error context:', e);
        }
        throw error;
    }
    return response;
}

export async function createCliente(empresaId: string, data: {
    nome: string;
    email?: string;
    telefone: string;
    notas?: string;
}): Promise<Cliente> {
    return registerClient(empresaId, {
        ...data,
        isManualRegistration: true
    });
}

export async function updateCliente(id: string, data: Partial<Cliente>): Promise<Cliente> {
    // Update ONLY empresa data by default to allow local overrides
    const { id: _, created_at, empresa_id, cliente_global_id, ...empresaData } = data;

    // 1. Update company-specific link data
    const { data: updatedEmpresa, error: empresaError } = await supabase
        .from('clientes_empresa')
        .update(empresaData)
        .eq('id', id)
        .select()
        .single();

    if (empresaError) throw empresaError;

    // 2. Fetch current global data to return merged object
    const { data: globalData, error: globalError } = await supabase
        .from('clientes_global')
        .select('*')
        .eq('id', updatedEmpresa.cliente_global_id)
        .single();

    if (globalError) throw globalError;

    return {
        ...updatedEmpresa,
        nome: updatedEmpresa.nome || globalData.nome,
        email: updatedEmpresa.email || globalData.email,
        telefone: updatedEmpresa.telefone || globalData.telefone
    };
}

export async function deleteCliente(id: string): Promise<void> {
    const { error } = await supabase
        .from('clientes_empresa')
        .update({ status: 'inativo' })
        .eq('id', id);

    if (error) throw error;
}

// ============ Agendamentos ============

export async function getAgendamentos(empresaId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('agendamentos')
        .select(`
            *,
            cliente:clientes_empresa(
                id,
                global:clientes_global(nome, telefone)
            ),
            profissional:profissionais(id, nome),
            servico:servicos(id, nome, duracao_min, preco)
        `)
        .eq('empresa_id', empresaId)
        .order('data_inicio', { ascending: false });

    if (error) throw error;

    // Flatten client data for backward compatibility
    return (data || []).map(item => ({
        ...item,
        cliente: item.cliente ? {
            id: item.cliente.id,
            nome: item.cliente.global?.nome,
            telefone: item.cliente.global?.telefone
        } : null
    }));
}

export async function getAgendamentosByDateRange(
    empresaId: string,
    start: Date,
    end: Date
): Promise<Agendamento[]> {
    const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .neq('status', 'cancelled')
        .gte('data_inicio', start.toISOString())
        .lte('data_inicio', end.toISOString())
        .order('data_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createAgendamento(empresaId: string, data: Partial<Agendamento>): Promise<Agendamento> {
    const { data: newAgendamento, error } = await supabase
        .from('agendamentos')
        .insert([{ ...data, empresa_id: empresaId }])
        .select()
        .single();

    if (error) throw error;
    return newAgendamento;
}

export async function updateAgendamento(id: string, data: Partial<Agendamento>): Promise<Agendamento> {
    const { data: updatedAgendamento, error } = await supabase
        .from('agendamentos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updatedAgendamento;
}

export async function deleteAgendamento(id: string): Promise<void> {
    const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// Geo Services
export async function getEstados(): Promise<any[]> {
    const { data, error } = await supabase
        .from('estados')
        .select('*')
        .order('nome_uf');

    if (error) throw error;
    return data || [];
}

export async function getMunicipios(ufCodigo?: number): Promise<any[]> {
    let query = supabase
        .from('vw_municipios_com_estado')
        .select('*')
        .order('nome_municipio');

    if (ufCodigo) {
        query = query.eq('codigo_ibge_uf', ufCodigo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function getPaises(): Promise<any[]> {
    const { data, error } = await supabase
        .from('paises')
        .select('*')
        .order('nome_pais');

    if (error) throw error;
    return data || [];
}

// ============ Plataforma Avaliacoes ============

export async function getPublicReviews() {
    const { data, error } = await supabase
        .from('plataforma_avaliacoes')
        .select(`
            id,
            nota,
            comentario,
            created_at,
            empresa:empresas(nome)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getStoreReview(empresaId: string, usuarioId: string) {
    const { data, error } = await supabase
        .from('plataforma_avaliacoes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('usuario_id', usuarioId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function submitReview(data: {
    empresa_id: string;
    usuario_id: string;
    nota: number;
    comentario?: string;
}) {
    const { data: newReview, error } = await supabase
        .from('plataforma_avaliacoes')
        .insert([data])
        .select()
        .single();

    if (error) throw error;
    return newReview;
}

export async function getAllReviews() {
    const { data, error } = await supabase
        .from('plataforma_avaliacoes')
        .select(`
            *,
            empresa:empresas(nome),
            usuario:usuarios(nome)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function updateReviewStatus(id: string, status: 'pending' | 'active' | 'inactive') {
    const { data, error } = await supabase
        .from('plataforma_avaliacoes')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteReview(id: string) {
    const { error } = await supabase
        .from('plataforma_avaliacoes')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ Estabelecimento Avaliacoes (Client-to-Business) ============

export async function getBusinessReviews(empresaId: string) {
    const { data, error } = await supabase
        .from('avaliacoes_empresa')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function submitBusinessReview(data: {
    empresa_id: string;
    cliente_id?: string;
    cliente_nome: string;
    nota: number;
    comentario?: string;
}) {
    const { data: newReview, error } = await supabase
        .from('avaliacoes_empresa')
        .insert([data])
        .select()
        .single();

    if (error) throw error;
    return newReview;
}

export async function getAllBusinessReviews(empresaId: string) {
    const { data, error } = await supabase
        .from('avaliacoes_empresa')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function updateBusinessReviewStatus(id: string, status: 'pending' | 'active' | 'inactive') {
    const { data, error } = await supabase
        .from('avaliacoes_empresa')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteBusinessReview(id: string) {
    const { error } = await supabase
        .from('avaliacoes_empresa')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ Likes (Curtidas) ============

export async function getLikesCount(targetId: string = 'global') {
    const { data, error } = await supabase
        .from('likes_counter')
        .select('total_likes')
        .eq('id', targetId)
        .maybeSingle();

    if (error) {
        console.error(`Error fetching likes for ${targetId}:`, error);
        return 0;
    }
    return Number(data?.total_likes || 0);
}

export async function incrementLikes(targetId: string, sessionId: string) {
    const { data, error } = await supabase
        .rpc('increment_likes', {
            p_target_id: targetId,
            p_session_id: sessionId
        });

    if (error) throw error;
    return Number(data);
}

export const getGlobalLikes = () => getLikesCount('global');
export const incrementGlobalLikes = (sessionId: string) => incrementLikes('global', sessionId);

// ============ Planos & Preços (Global Admin) ============

export async function getPlanos() {
    const { data, error } = await supabase
        .from('planos')
        .select('*, precos:plano_valores(*)')
        .order('nome');

    if (error) throw error;
    return data || [];
}

export async function createPlano(data: any) {
    const { data: newPlano, error } = await supabase
        .from('planos')
        .insert([data])
        .select()
        .single();

    if (error) throw error;
    return newPlano;
}

export async function updatePlano(id: string, data: any) {
    // Defensive check: Remove fields that are not columns in the table
    const { precos, precos_count, id: _id, created_at, ...updateData } = data;

    const { data: updated, error } = await supabase
        .from('planos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updated;
}

export async function getPlanoPrecos(planoId: string) {
    const { data, error } = await supabase
        .from('plano_valores')
        .select('*')
        .eq('plano_id', planoId)
        .order('data_inicio_vigencia', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createPlanoPreco(data: any) {
    const { data: newPreco, error } = await supabase
        .from('plano_valores')
        .insert([data])
        .select()
        .single();

    if (error) throw error;
    return newPreco;
}

export async function deletePlanoPreco(id: string) {
    const { error } = await supabase
        .from('plano_valores')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
