// Mock API services for frontend development
// Simulates async API calls with realistic delays

import type { 
  Servico, 
  Profissional, 
  Cliente, 
  Agendamento,
  ApiResponse,
  PaginatedResponse 
} from '@/types/entities';
import {
  mockServicos,
  mockProfissionais,
  mockClientes,
  mockAgendamentos,
  mockDashboardMetrics,
} from './mock-data';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate occasional errors for testing error states
const shouldFail = () => Math.random() < 0.05; // 5% failure rate

// ============ Servicos ============
export async function getServicos(): Promise<ApiResponse<Servico[]>> {
  await delay(500);
  if (shouldFail()) {
    return { data: [], error: 'NETWORK_ERROR', message: 'Failed to fetch services' };
  }
  return { data: [...mockServicos] };
}

export async function getServico(id: string): Promise<ApiResponse<Servico | null>> {
  await delay(300);
  const servico = mockServicos.find(s => s.id === id);
  return { data: servico || null };
}

export async function createServico(data: Omit<Servico, 'id' | 'empresa_id' | 'created_at'>): Promise<ApiResponse<Servico>> {
  await delay(800);
  const newServico: Servico = {
    ...data,
    id: `srv-${Date.now()}`,
    empresa_id: 'emp-001',
    created_at: new Date().toISOString(),
  };
  mockServicos.push(newServico);
  return { data: newServico };
}

export async function updateServico(id: string, data: Partial<Servico>): Promise<ApiResponse<Servico>> {
  await delay(600);
  const index = mockServicos.findIndex(s => s.id === id);
  if (index === -1) {
    return { data: {} as Servico, error: 'NOT_FOUND', message: 'Service not found' };
  }
  mockServicos[index] = { ...mockServicos[index], ...data };
  return { data: mockServicos[index] };
}

export async function deleteServico(id: string): Promise<ApiResponse<boolean>> {
  await delay(500);
  const index = mockServicos.findIndex(s => s.id === id);
  if (index !== -1) {
    mockServicos.splice(index, 1);
    return { data: true };
  }
  return { data: false, error: 'NOT_FOUND', message: 'Service not found' };
}

// ============ Profissionais ============
export async function getProfissionais(): Promise<ApiResponse<Profissional[]>> {
  await delay(500);
  if (shouldFail()) {
    return { data: [], error: 'NETWORK_ERROR', message: 'Failed to fetch professionals' };
  }
  return { data: [...mockProfissionais] };
}

export async function getProfissional(id: string): Promise<ApiResponse<Profissional | null>> {
  await delay(300);
  const profissional = mockProfissionais.find(p => p.id === id);
  return { data: profissional || null };
}

export async function createProfissional(data: Omit<Profissional, 'id' | 'empresa_id' | 'created_at'>): Promise<ApiResponse<Profissional>> {
  await delay(800);
  const newProfissional: Profissional = {
    ...data,
    id: `prof-${Date.now()}`,
    empresa_id: 'emp-001',
    created_at: new Date().toISOString(),
  };
  mockProfissionais.push(newProfissional);
  return { data: newProfissional };
}

export async function updateProfissional(id: string, data: Partial<Profissional>): Promise<ApiResponse<Profissional>> {
  await delay(600);
  const index = mockProfissionais.findIndex(p => p.id === id);
  if (index === -1) {
    return { data: {} as Profissional, error: 'NOT_FOUND', message: 'Professional not found' };
  }
  mockProfissionais[index] = { ...mockProfissionais[index], ...data };
  return { data: mockProfissionais[index] };
}

export async function deleteProfissional(id: string): Promise<ApiResponse<boolean>> {
  await delay(500);
  const index = mockProfissionais.findIndex(p => p.id === id);
  if (index !== -1) {
    mockProfissionais.splice(index, 1);
    return { data: true };
  }
  return { data: false, error: 'NOT_FOUND', message: 'Professional not found' };
}

// ============ Clientes ============
export async function getClientes(page = 1, limit = 10): Promise<PaginatedResponse<Cliente>> {
  await delay(500);
  const start = (page - 1) * limit;
  const paginatedData = mockClientes.slice(start, start + limit);
  return {
    data: paginatedData,
    total: mockClientes.length,
    page,
    limit,
    hasMore: start + limit < mockClientes.length,
  };
}

export async function getCliente(id: string): Promise<ApiResponse<Cliente | null>> {
  await delay(300);
  const cliente = mockClientes.find(c => c.id === id);
  return { data: cliente || null };
}

// ============ Agendamentos ============
export async function getAgendamentos(filters?: {
  data?: string;
  profissional_id?: string;
  status?: string;
}): Promise<ApiResponse<Agendamento[]>> {
  await delay(500);
  let filtered = [...mockAgendamentos];
  
  if (filters?.profissional_id) {
    filtered = filtered.filter(a => a.profissional_id === filters.profissional_id);
  }
  if (filters?.status) {
    filtered = filtered.filter(a => a.status === filters.status);
  }
  
  return { data: filtered };
}

export async function getAgendamento(id: string): Promise<ApiResponse<Agendamento | null>> {
  await delay(300);
  const agendamento = mockAgendamentos.find(a => a.id === id);
  return { data: agendamento || null };
}

// ============ Dashboard ============
export async function getDashboardMetrics(): Promise<ApiResponse<typeof mockDashboardMetrics>> {
  await delay(400);
  return { data: mockDashboardMetrics };
}

// ============ Auth Mock ============
export async function mockLogin(email: string, password: string): Promise<ApiResponse<{ token: string; user: { id: string; email: string; nome: string } }>> {
  await delay(1000);
  
  if (email === 'demo@primebooking.com' && password === 'demo123') {
    return {
      data: {
        token: 'mock-jwt-token-12345',
        user: {
          id: 'usr-001',
          email: 'demo@primebooking.com',
          nome: 'Maria Silva',
        },
      },
    };
  }
  
  return {
    data: {} as { token: string; user: { id: string; email: string; nome: string } },
    error: 'AUTH_FAILED',
    message: 'Invalid email or password',
  };
}

export async function mockSignUp(data: { nome: string; email: string; telefone: string; password: string }): Promise<ApiResponse<{ success: boolean }>> {
  await delay(1000);
  
  // Simulate email already exists
  if (data.email === 'existing@email.com') {
    return {
      data: { success: false },
      error: 'EMAIL_EXISTS',
      message: 'This email is already registered',
    };
  }
  
  return { data: { success: true } };
}

export async function mockVerifyOTP(telefone: string, code: string): Promise<ApiResponse<{ verified: boolean }>> {
  await delay(800);
  
  // Accept any 6-digit code for demo
  if (code.length === 6 && /^\d+$/.test(code)) {
    return { data: { verified: true } };
  }
  
  return {
    data: { verified: false },
    error: 'INVALID_CODE',
    message: 'Invalid verification code',
  };
}

export async function mockRequestPasswordReset(email: string): Promise<ApiResponse<{ sent: boolean }>> {
  await delay(800);
  return { data: { sent: true } };
}
