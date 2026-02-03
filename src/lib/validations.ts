import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .max(255, 'Email muito longo');

// Password validation
export const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .max(100, 'Senha muito longa');

// Phone validation (E.164 format)
export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Telefone é obrigatório')
  .regex(/^\+?[1-9]\d{10,14}$/, 'Telefone inválido (use formato +5511999999999)');

// Name validation
export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo');

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Sign up form schema
export const signUpSchema = z.object({
  nome: nameSchema,
  email: emailSchema,
  telefone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset password schema
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// OTP verification schema
export const otpSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos').regex(/^\d+$/, 'Código deve conter apenas números'),
});

export type OTPFormData = z.infer<typeof otpSchema>;

// Service form schema
export const servicoSchema = z.object({
  nome: z.string().trim().min(2, 'Nome é obrigatório').max(100),
  descricao: z.string().trim().max(500).optional(),
  duracao_min: z.number().min(5, 'Duração mínima: 5 min').max(480, 'Duração máxima: 8 horas'),
  preco: z.number().min(0, 'Preço não pode ser negativo'),
  ativo: z.boolean().default(true),
  categoria: z.string().optional(),
});

export type ServicoFormData = z.infer<typeof servicoSchema>;

// Professional form schema
export const profissionalSchema = z.object({
  nome: nameSchema,
  email: emailSchema,
  telefone: phoneSchema,
  servicos_ids: z.array(z.string()).min(1, 'Selecione pelo menos um serviço'),
  disponibilidade: z.record(
    z.array(
      z.object({
        inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
        fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
        ativo: z.boolean().default(true),
      })
    )
  ).default({}),
  ativo: z.boolean().default(true),
});

export type ProfissionalFormData = z.infer<typeof profissionalSchema>;
import { validateCNPJ, validateCPF } from './document-utils';

// Enterprise settings schema
export const empresaSettingsSchema = z.object({
  nome: nameSchema,
  slug: z
    .string()
    .trim()
    .min(3, 'O link deve ter pelo menos 3 caracteres')
    .max(50, 'O link deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hifens'),
  documento: z
    .string()
    .trim()
    .min(11, 'Documento muito curto')
    .max(18, 'Documento muito longo')
    .refine((val) => {
      const clean = val.replace(/[^\w]/g, '');
      if (clean.length === 11) return validateCPF(clean);
      if (clean.length === 14) return validateCNPJ(clean);
      return false;
    }, 'CPF ou CNPJ inválido'),
  cep: z
    .string()
    .trim()
    .refine((val) => val.replace(/\D/g, '').length === 8, 'CEP deve ter 8 dígitos'),
  logradouro: z.string().trim().min(1, 'Logradouro é obrigatório'),
  numero: z.string().trim().min(1, 'Número é obrigatório'),
  complemento: z.string().trim().optional(),
  bairro: z.string().trim().min(1, 'Bairro é obrigatório'),
  cidade: z.string().trim().min(1, 'Cidade é obrigatória'),
  estado: z
    .string()
    .trim()
    .length(2, 'Estado inválido (UF)')
    .toUpperCase(),
  whatsapp: z.string().trim().min(8, 'WhatsApp muito curto').optional(),
  categoria: z.array(z.string()).default([]),
  imagem_url: z.string().trim().url('URL da imagem inválida').optional().or(z.literal('')),
  descricao: z.string().trim().max(500).optional(),
  horario_abertura: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido').optional(),
  horario_fechamento: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido').optional(),
  dias_funcionamento: z.array(z.string()).default(['seg', 'ter', 'qua', 'qui', 'sex', 'sab']),
});

export type EmpresaSettingsFormData = z.infer<typeof empresaSettingsSchema>;

// Client form schema
export const clienteSchema = z.object({
  nome: nameSchema,
  telefone: phoneSchema,
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  notas: z.string().trim().max(500).optional(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

// Appointment form schema
export const agendamentoSchema = z.object({
  cliente_id: z.string().uuid('Selecione um cliente'),
  profissional_id: z.string().uuid('Selecione um profissional'),
  servicos_ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um serviço'),
  data: z.date({ required_error: 'Data é obrigatória' }),
  hora: z.string().min(1, 'Hora é obrigatória'),
  status: z.string().default('pendente'),
  notas: z.string().optional(),
});

export type AgendamentoFormData = z.infer<typeof agendamentoSchema>;
