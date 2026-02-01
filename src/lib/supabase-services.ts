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

export async function createCliente(empresaId: string, data: Partial<Cliente>): Promise<Cliente> {
    const { data: newCliente, error } = await supabase
        .from('clientes')
        .insert([{ ...data, empresa_id: empresaId }])
        .select()
        .single();

    if (error) throw error;
    return newCliente;
}

export async function updateCliente(id: string, data: Partial<Cliente>): Promise<Cliente> {
    const { data: updatedCliente, error } = await supabase
        .from('clientes')
        .update(data)
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
