// Mock data for frontend development
// This simulates API responses until backend is ready

import type {
  Empresa,
  Usuario,
  Cliente,
  Servico,
  Profissional,
  Agendamento
} from '@/types/entities';

export const mockEmpresa: Empresa = {
  id: 'emp-001',
  nome: 'Studio Beauty Prime',
  slug: 'studio-beauty-prime',
  plano: 'pro',
  whatsapp_number_id: '+5511999999999',
  config: {
    horarios: {
      seg: { inicio: '09:00', fim: '18:00', ativo: true },
      ter: { inicio: '09:00', fim: '18:00', ativo: true },
      qua: { inicio: '09:00', fim: '18:00', ativo: true },
      qui: { inicio: '09:00', fim: '18:00', ativo: true },
      sex: { inicio: '09:00', fim: '18:00', ativo: true },
      sab: { inicio: '09:00', fim: '14:00', ativo: true },
      dom: { inicio: '00:00', fim: '00:00', ativo: false },
    },
  },
  created_at: '2024-01-15T10:00:00Z',
};

export const mockUsuario: Usuario = {
  id: 'usr-001',
  empresa_id: 'emp-001',
  nome: 'Maria Silva',
  email: 'maria@studiobeauty.com',
  role: 'owner',
  is_admin_global: false,
  created_at: '2024-01-15T10:00:00Z',
};

export const mockServicos: Servico[] = [
  {
    id: 'srv-001',
    empresa_id: 'emp-001',
    nome: 'Corte de Cabelo',
    descricao: 'Corte profissional masculino ou feminino',
    duracao_min: 45,
    preco: 80,
    ativo: true,
    categoria: 'Cabelo',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'srv-002',
    empresa_id: 'emp-001',
    nome: 'Coloração',
    descricao: 'Coloração completa com produtos premium',
    duracao_min: 120,
    preco: 250,
    ativo: true,
    categoria: 'Cabelo',
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'srv-003',
    empresa_id: 'emp-001',
    nome: 'Manicure',
    descricao: 'Tratamento completo para unhas das mãos',
    duracao_min: 45,
    preco: 45,
    ativo: true,
    categoria: 'Unhas',
    created_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'srv-004',
    empresa_id: 'emp-001',
    nome: 'Pedicure',
    descricao: 'Tratamento completo para unhas dos pés',
    duracao_min: 50,
    preco: 55,
    ativo: true,
    categoria: 'Unhas',
    created_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'srv-005',
    empresa_id: 'emp-001',
    nome: 'Massagem Relaxante',
    descricao: 'Sessão de 60 minutos de massagem relaxante',
    duracao_min: 60,
    preco: 150,
    ativo: false,
    categoria: 'Bem-estar',
    created_at: '2024-01-18T10:00:00Z',
  },
];

export const mockProfissionais: Profissional[] = [
  {
    id: 'prof-001',
    empresa_id: 'emp-001',
    nome: 'Ana Costa',
    email: 'ana@studiobeauty.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    disponibilidade: {
      seg: [{ inicio: '09:00', fim: '12:00', ativo: true }, { inicio: '14:00', fim: '18:00', ativo: true }],
      ter: [{ inicio: '09:00', fim: '12:00', ativo: true }, { inicio: '14:00', fim: '18:00', ativo: true }],
      qua: [{ inicio: '09:00', fim: '12:00', ativo: true }, { inicio: '14:00', fim: '18:00', ativo: true }],
      qui: [{ inicio: '09:00', fim: '12:00', ativo: true }, { inicio: '14:00', fim: '18:00', ativo: true }],
      sex: [{ inicio: '09:00', fim: '12:00', ativo: true }, { inicio: '14:00', fim: '18:00', ativo: true }],
    },
    servicos_ids: ['srv-001', 'srv-002'],
    ativo: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'prof-002',
    empresa_id: 'emp-001',
    nome: 'Carlos Oliveira',
    email: 'carlos@studiobeauty.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    disponibilidade: {
      seg: [{ inicio: '10:00', fim: '18:00', ativo: true }],
      ter: [{ inicio: '10:00', fim: '18:00', ativo: true }],
      qua: [{ inicio: '10:00', fim: '18:00', ativo: true }],
      qui: [{ inicio: '10:00', fim: '18:00', ativo: true }],
      sex: [{ inicio: '10:00', fim: '18:00', ativo: true }],
      sab: [{ inicio: '09:00', fim: '14:00', ativo: true }],
    },
    servicos_ids: ['srv-001', 'srv-003', 'srv-004'],
    ativo: true,
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'prof-003',
    empresa_id: 'emp-001',
    nome: 'Juliana Santos',
    email: 'juliana@studiobeauty.com',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juliana',
    disponibilidade: {
      ter: [{ inicio: '09:00', fim: '17:00', ativo: true }],
      qua: [{ inicio: '09:00', fim: '17:00', ativo: true }],
      qui: [{ inicio: '09:00', fim: '17:00', ativo: true }],
      sex: [{ inicio: '09:00', fim: '17:00', ativo: true }],
      sab: [{ inicio: '09:00', fim: '14:00', ativo: true }],
    },
    servicos_ids: ['srv-003', 'srv-004', 'srv-005'],
    ativo: true,
    created_at: '2024-01-17T10:00:00Z',
  },
];

export const mockClientes: Cliente[] = [
  {
    id: 'cli-001',
    empresa_id: 'emp-001',
    nome: 'Fernanda Lima',
    telefone: '+5511987654321',
    email: 'fernanda@email.com',
    created_at: '2024-02-01T10:00:00Z',
  },
  {
    id: 'cli-002',
    empresa_id: 'emp-001',
    nome: 'Roberto Mendes',
    telefone: '+5511912345678',
    email: 'roberto@email.com',
    notas: 'Prefere horários pela manhã',
    created_at: '2024-02-05T10:00:00Z',
  },
  {
    id: 'cli-003',
    empresa_id: 'emp-001',
    nome: 'Patricia Souza',
    telefone: '+5511955556666',
    created_at: '2024-02-10T10:00:00Z',
  },
];

export const mockAgendamentos: Agendamento[] = [
  {
    id: 'agd-001',
    empresa_id: 'emp-001',
    cliente_id: 'cli-001',
    profissional_id: 'prof-001',
    servico_id: 'srv-001',
    servicos_ids: ['srv-001'],
    data_inicio: '2024-02-20T10:00:00Z',
    data_fim: '2024-02-20T10:45:00Z',
    status: 'confirmado',
    created_at: '2024-02-15T10:00:00Z',
    updated_at: '2024-02-15T10:00:00Z',
  },
  {
    id: 'agd-002',
    empresa_id: 'emp-001',
    cliente_id: 'cli-002',
    profissional_id: 'prof-002',
    servico_id: 'srv-003',
    servicos_ids: ['srv-003'],
    data_inicio: '2024-02-20T14:00:00Z',
    data_fim: '2024-02-20T14:45:00Z',
    status: 'pendente',
    created_at: '2024-02-16T10:00:00Z',
    updated_at: '2024-02-16T10:00:00Z',
  },
  {
    id: 'agd-003',
    empresa_id: 'emp-001',
    cliente_id: 'cli-003',
    profissional_id: 'prof-003',
    servico_id: 'srv-004',
    servicos_ids: ['srv-004'],
    data_inicio: '2024-02-20T11:00:00Z',
    data_fim: '2024-02-20T11:50:00Z',
    status: 'em_andamento',
    created_at: '2024-02-17T10:00:00Z',
    updated_at: '2024-02-17T10:00:00Z',
  },
];

// Dashboard metrics
export const mockDashboardMetrics = {
  todayAppointments: 8,
  pendingConfirmations: 3,
  totalClients: 156,
  monthlyRevenue: 12580,
  revenueGrowth: 12.5,
  appointmentsGrowth: 8.3,
};
