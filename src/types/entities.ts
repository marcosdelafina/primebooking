// PrimeBooking Entity Types
// Based on spec.md database schema

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  plano: 'basic' | 'pro' | 'enterprise';
  whatsapp_number_id?: string;
  config: EmpresaConfig;
  created_at: string;
}

export interface EmpresaConfig {
  horarios?: {
    [key: string]: { inicio: string; fim: string; ativo: boolean };
  };
  preferencias?: Record<string, unknown>;
}

export interface Usuario {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface Cliente {
  id: string;
  empresa_id: string;
  nome: string;
  telefone: string; // E.164 format
  email?: string;
  google_contact_id?: string;
  notas?: string;
  created_at: string;
}

export interface Servico {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  duracao_min: number;
  preco: number;
  ativo: boolean;
  categoria?: string;
  imagem_url?: string;
  created_at: string;
}

export interface Profissional {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  telefone?: string;
  avatar_url?: string;
  google_calendar_id?: string;
  google_refresh_token?: string;
  disponibilidade: Disponibilidade;
  servicos_ids: string[];
  ativo: boolean;
  created_at: string;
}

export interface Disponibilidade {
  [dia: string]: SlotHorario[];
}

export interface SlotHorario {
  inicio: string; // HH:mm format
  fim: string;
  ativo: boolean;
}

export interface Agendamento {
  id: string;
  empresa_id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_inicio: string;
  data_fim: string;
  google_event_id?: string;
  status: AgendamentoStatus;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export type AgendamentoStatus =
  | 'pendente'
  | 'confirmado'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'
  | 'nao_compareceu';

export interface Conversa {
  id: string;
  empresa_id: string;
  telefone_cliente: string;
  estado_fluxo: string;
  dados_parciais: Record<string, unknown>;
  updated_at: string;
}

// Auth related types
export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  empresa_id: string;
  role: Usuario['role'];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
