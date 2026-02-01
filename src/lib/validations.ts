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
  servicos_ids: z.array(z.string()).min(1, 'Selecione pelo menos um serviço'),
  ativo: z.boolean().default(true),
});

export type ProfissionalFormData = z.infer<typeof profissionalSchema>;
import { validateCNPJ, validateCPF } from './document-utils';

// Enterprise settings schema
export const empresaSettingsSchema = z.object({
  nome: nameSchema,
  documento: z
    .string()
    .trim()
    .min(11, 'Documento muito curto')
    .max(14, 'Documento muito longo')
    .refine((val) => {
      const clean = val.replace(/[^\w]/g, '');
      if (clean.length === 11) return validateCPF(clean);
      if (clean.length === 14) return validateCNPJ(clean);
      return false;
    }, 'CPF ou CNPJ inválido'),
  cep: z
    .string()
    .trim()
    .length(8, 'CEP deve ter 8 dígitos')
    .regex(/^\d+$/, 'Apenas números'),
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
});

export type EmpresaSettingsFormData = z.infer<typeof empresaSettingsSchema>;
