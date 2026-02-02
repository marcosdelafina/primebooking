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
        .select('*')
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

// ============ Clientes ============

export async function getClientes(empresaId: string): Promise<Cliente[]> {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome');

    if (error) throw error;
    return data || [];
}

export async function getClienteByTelefone(empresaId: string, telefone: string): Promise<Cliente | null> {
    const rawPhone = telefone.trim();
    const normalizedPhone = '+' + rawPhone.replace(/\D/g, '');

    // 1. Try normalized search
    let { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('telefone', normalizedPhone)
        .maybeSingle();

    if (error) throw error;

    // 2. Fallback to raw search for historical "dirty" data
    if (!data && rawPhone !== normalizedPhone) {
        const { data: dirtyData, error: dirtyError } = await supabase
            .from('clientes')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('telefone', rawPhone)
            .maybeSingle();

        if (dirtyError) throw dirtyError;

        if (dirtyData) {
            // Found a dirty record! Update it to normalized format for future efficiency
            const { data: updated, error: updateError } = await supabase
                .from('clientes')
                .update({ telefone: normalizedPhone })
                .eq('id', dirtyData.id)
                .select()
                .single();

            if (!updateError) return updated;
            return dirtyData;
        }
    }

    return data;
}

export async function createCliente(empresaId: string, data: Partial<Cliente>): Promise<Cliente> {
    const normalizedPhone = data.telefone ? '+' + data.telefone.replace(/\D/g, '') : undefined;
    const { data: newCliente, error } = await supabase
        .from('clientes')
        .insert([{ ...data, empresa_id: empresaId, telefone: normalizedPhone }])
        .select()
        .single();

    if (error) throw error;
    return newCliente;
}

export async function updateCliente(id: string, data: Partial<Cliente>): Promise<Cliente> {
    const updateData = { ...data };
    if (updateData.telefone) {
        updateData.telefone = '+' + updateData.telefone.replace(/\D/g, '');
    }
    const { data: updatedCliente, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updatedCliente;
}

export async function deleteCliente(id: string): Promise<void> {
    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ Agendamentos ============

export async function getAgendamentos(empresaId: string): Promise<any[]> {
    const { data, error } = await supabase
        .from('agendamentos')
        .select(`
            *,
            cliente:clientes(id, nome, telefone),
            profissional:profissionais(id, nome),
            servico:servicos(id, nome, duracao_min, preco)
        `)
        .eq('empresa_id', empresaId)
        .order('data_inicio', { ascending: false });

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
