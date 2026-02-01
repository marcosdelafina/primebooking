import { supabase } from './supabase';
import type { Servico, Profissional, ApiResponse } from '@/types/entities';

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

export async function getEmpresa(empresaId: string): Promise<ApiResponse<any>> {
    try {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single();

        if (error) throw error;
        return { data };
    } catch (error: any) {
        return { data: null, error: error.code, message: error.message };
    }
}

export async function updateEmpresa(empresaId: string, data: any): Promise<ApiResponse<any>> {
    const { data: updated, error } = await supabase
        .from('empresas')
        .update(data)
        .eq('id', empresaId)
        .select()
        .single();

    return { data: updated, error: error ? error.message : undefined };
}

// Geo Services
export async function getEstados(): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase
        .from('estados')
        .select('*')
        .order('nome_uf');

    return { data: data || [], error: error ? error.message : undefined };
}

export async function getMunicipios(ufCodigo?: number): Promise<ApiResponse<any[]>> {
    let query = supabase
        .from('vw_municipios_com_estado')
        .select('*')
        .order('nome_municipio');

    if (ufCodigo) {
        query = query.eq('codigo_ibge_uf', ufCodigo);
    }

    const { data, error } = await query;

    return { data: data || [], error: error ? error.message : undefined };
}

export async function getPaises(): Promise<ApiResponse<any[]>> {
    const { data, error } = await supabase
        .from('paises')
        .select('*')
        .order('nome_pais');

    return { data: data || [], error: error ? error.message : undefined };
}
