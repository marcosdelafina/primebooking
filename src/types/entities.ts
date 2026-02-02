// PrimeBooking Entity Types
// Based on spec.md database schema

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  plano: 'basic' | 'pro' | 'enterprise';
  whatsapp_number_id?: string;
  documento?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  whatsapp?: string;
  categoria?: string[];
  imagem_url?: string;
  galeria?: string[];
  descricao?: string;
  horario_abertura?: string;
  horario_fechamento?: string;
  dias_funcionamento?: string[];
  rating?: number;
  avaliacoes?: number;
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
  is_admin_global: boolean;
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
  servico_id: string; // Maintain for backward compatibility
  servicos_ids: string[];
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
  is_admin_global: boolean;
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

export interface BillingEmpresa {
  id: string;
  empresa_id: string;
  valor_mensal: number;
  billing_status: 'ATIVA' | 'INADIMPLENTE' | 'SUSPENSA';
  ciclo_atual?: string;
  data_renovacao?: string;
  data_onboarding: string;
  data_inicio_ciclo?: string;
  created_at: string;
  updated_at: string;
}

export interface PlataformaAvaliacao {
  id: string;
  empresa_id: string;
  usuario_id: string;
  nota: number;
  comentario?: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  empresa?: {
    nome: string;
  };
  usuario?: {
    nome: string;
  };
}
