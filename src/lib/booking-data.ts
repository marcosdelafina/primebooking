// Extended mock data for client booking experience

import type { Servico, Profissional } from '@/types/entities';

export interface Business {
  id: string;
  nome: string;
  slug: string;
  categoria: string;
  endereco: string;
  cidade: string;
  rating: number;
  avaliacoes: number;
  imagem_url: string;
  galeria: string[];
  horario_abertura: string;
  horario_fechamento: string;
  dias_funcionamento: string[];
  telefone: string;
  descricao: string;
  servicos: Servico[];
  profissionais: Profissional[];
}

export const mockBusinesses: Business[] = [
  {
    id: 'biz-001',
    nome: 'Studio Beauty Prime',
    slug: 'studio-beauty-prime',
    categoria: 'Salão de Beleza',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    rating: 4.8,
    avaliacoes: 156,
    imagem_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    galeria: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
      'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
    ],
    horario_abertura: '09:00',
    horario_fechamento: '18:00',
    dias_funcionamento: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
    telefone: '+5511999999999',
    descricao: 'Especializado em cortes modernos, coloração e tratamentos capilares.',
    servicos: [
      {
        id: 'srv-001',
        empresa_id: 'biz-001',
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
        empresa_id: 'biz-001',
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
        empresa_id: 'biz-001',
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
        empresa_id: 'biz-001',
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
        empresa_id: 'biz-001',
        nome: 'Escova Progressiva',
        descricao: 'Alisamento com duração de até 3 meses',
        duracao_min: 180,
        preco: 350,
        ativo: true,
        categoria: 'Tratamentos',
        created_at: '2024-01-18T10:00:00Z',
      },
    ],
    profissionais: [
      {
        id: 'prof-001',
        empresa_id: 'biz-001',
        nome: 'Ana Costa',
        email: 'ana@studiobeauty.com',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
        disponibilidade: {
          seg: [{ inicio: '09:00', fim: '18:00', ativo: true }],
          ter: [{ inicio: '09:00', fim: '18:00', ativo: true }],
          qua: [{ inicio: '09:00', fim: '18:00', ativo: true }],
          qui: [{ inicio: '09:00', fim: '18:00', ativo: true }],
          sex: [{ inicio: '09:00', fim: '18:00', ativo: true }],
        },
        servicos_ids: ['srv-001', 'srv-002', 'srv-005'],
        ativo: true,
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'prof-002',
        empresa_id: 'biz-001',
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
    ],
  },
  {
    id: 'biz-002',
    nome: 'Barbearia Vintage',
    slug: 'barbearia-vintage',
    categoria: 'Barbearia',
    endereco: 'Av. Paulista, 456',
    cidade: 'São Paulo',
    rating: 4.9,
    avaliacoes: 234,
    imagem_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
    galeria: [
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80',
    ],
    horario_abertura: '10:00',
    horario_fechamento: '20:00',
    dias_funcionamento: ['ter', 'qua', 'qui', 'sex', 'sab'],
    telefone: '+5511888888888',
    descricao: 'Barbearia tradicional com ambiente retrô e atendimento premium.',
    servicos: [
      {
        id: 'srv-101',
        empresa_id: 'biz-002',
        nome: 'Corte Masculino',
        descricao: 'Corte clássico ou moderno',
        duracao_min: 30,
        preco: 50,
        ativo: true,
        categoria: 'Corte',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'srv-102',
        empresa_id: 'biz-002',
        nome: 'Barba Completa',
        descricao: 'Aparar, modelar e hidratação',
        duracao_min: 30,
        preco: 40,
        ativo: true,
        categoria: 'Barba',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'srv-103',
        empresa_id: 'biz-002',
        nome: 'Combo Corte + Barba',
        descricao: 'Corte masculino e barba completa',
        duracao_min: 60,
        preco: 80,
        ativo: true,
        categoria: 'Combos',
        created_at: '2024-01-15T10:00:00Z',
      },
    ],
    profissionais: [
      {
        id: 'prof-101',
        empresa_id: 'biz-002',
        nome: 'Ricardo Barbeiro',
        email: 'ricardo@vintage.com',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo',
        disponibilidade: {
          ter: [{ inicio: '10:00', fim: '20:00', ativo: true }],
          qua: [{ inicio: '10:00', fim: '20:00', ativo: true }],
          qui: [{ inicio: '10:00', fim: '20:00', ativo: true }],
          sex: [{ inicio: '10:00', fim: '20:00', ativo: true }],
          sab: [{ inicio: '10:00', fim: '18:00', ativo: true }],
        },
        servicos_ids: ['srv-101', 'srv-102', 'srv-103'],
        ativo: true,
        created_at: '2024-01-15T10:00:00Z',
      },
    ],
  },
  {
    id: 'biz-003',
    nome: 'Spa Wellness Center',
    slug: 'spa-wellness-center',
    categoria: 'Spa & Bem-estar',
    endereco: 'Rua do Bem-estar, 789',
    cidade: 'São Paulo',
    rating: 4.7,
    avaliacoes: 89,
    imagem_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    galeria: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    ],
    horario_abertura: '08:00',
    horario_fechamento: '21:00',
    dias_funcionamento: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
    telefone: '+5511777777777',
    descricao: 'Experiências relaxantes para corpo e mente.',
    servicos: [
      {
        id: 'srv-201',
        empresa_id: 'biz-003',
        nome: 'Massagem Relaxante',
        descricao: 'Sessão de 60 minutos',
        duracao_min: 60,
        preco: 180,
        ativo: true,
        categoria: 'Massagens',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'srv-202',
        empresa_id: 'biz-003',
        nome: 'Day Spa Completo',
        descricao: 'Massagem + sauna + hidratação',
        duracao_min: 180,
        preco: 450,
        ativo: true,
        categoria: 'Pacotes',
        created_at: '2024-01-15T10:00:00Z',
      },
    ],
    profissionais: [
      {
        id: 'prof-201',
        empresa_id: 'biz-003',
        nome: 'Marina Terapeuta',
        email: 'marina@wellness.com',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marina',
        disponibilidade: {
          seg: [{ inicio: '08:00', fim: '16:00', ativo: true }],
          ter: [{ inicio: '08:00', fim: '16:00', ativo: true }],
          qua: [{ inicio: '08:00', fim: '16:00', ativo: true }],
          qui: [{ inicio: '08:00', fim: '16:00', ativo: true }],
          sex: [{ inicio: '08:00', fim: '16:00', ativo: true }],
        },
        servicos_ids: ['srv-201', 'srv-202'],
        ativo: true,
        created_at: '2024-01-15T10:00:00Z',
      },
    ],
  },
];

// Generate available time slots for a given date
export function generateTimeSlots(
  date: Date,
  startTimeStr: string = '09:00',
  endTimeStr: string = '18:00',
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const [startHour, startMinute] = startTimeStr.split(':').map(Number);
  const [endHour, endMinute] = endTimeStr.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  for (let totalMinutes = startTotalMinutes; totalMinutes < endTotalMinutes; totalMinutes += intervalMinutes) {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    // Skip past times for today
    if (isToday) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);
      if (slotTime <= now) continue;
    }

    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // Randomly mark some slots as unavailable (for demo)
    if (Math.random() > 0.3) {
      slots.push(timeString);
    }
  }

  return slots;
}

// Get next 7 days for date picker, optionally filtering by open days
export function getNext7Days(openDays?: string[]): Date[] {
  const days: Date[] = [];
  const today = new Date();
  const dayLabels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

  let i = 0;
  let count = 0;
  // Look ahead up to 14 days to find 7 open days
  while (count < 7 && i < 14) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayLabel = dayLabels[date.getDay()];
    if (!openDays || openDays.includes(dayLabel)) {
      days.push(date);
      count++;
    }
    i++;
  }

  return days;
}
