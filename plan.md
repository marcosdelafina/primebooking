# Plano do Projeto — SaaS de Agendamento Multi-Empresa

## 1. Visão Geral
Plataforma SaaS de agendamento automático via WhatsApp, integrada ao Google Calendar, utilizando a Twilio como provedor oficial da WhatsApp Business API.

A solução atende múltiplas empresas (consultórios, salões e barbearias) em um único sistema, garantindo isolamento total de dados (multi-tenancy).

Cada empresa possui:
- Serviços próprios
- Profissionais próprios
- Clientes próprios
- Agenda própria
- Configurações próprias

---

## 2. Objetivos
- Automatizar o processo de agendamento via WhatsApp
- Reduzir carga operacional das empresas
- Evitar conflitos de horário (overbooking)
- Oferecer uma solução escalável no modelo SaaS
- Garantir isolamento total entre empresas

---

## 3. Escopo Inicial (MVP)

### Incluído
- Cadastro e gestão de empresas
- Painel administrativo por empresa
- Cadastro de serviços
- Cadastro de profissionais
- Cadastro de clientes
- Integração com Twilio (WhatsApp)
- Integração com Google Calendar
- Agendamento automático
- Cancelamento e reagendamento via WhatsApp
- Lembretes automáticos
- Controle de estado de conversa (chat flow)

### Fora do Escopo (versões futuras)
- Pagamentos online
- Aplicativo mobile
- IA para sugestão automática de horários
- Relatórios avançados
- Marketplace público de empresas

---

## 4. Tipos de Usuários
- Super Admin (plataforma)
- Admin da Empresa
- Atendente da Empresa
- Cliente Final (WhatsApp)

---

## 5. Arquitetura Geral

Fluxo de comunicação:

Cliente  
→ WhatsApp  
→ Twilio  
→ Backend (Webhook)  
→ Supabase (Postgres + RLS)  
→ Google Calendar  
→ Twilio (resposta)  
→ Cliente

Características:
- Backend único
- Banco único (Supabase)
- Isolamento por `empresa_id` com Row Level Security (RLS)

---

## 6. Estratégia Multi-Empresa
- Arquitetura multi-tenant
- Todas as tabelas possuem `empresa_id`
- Row Level Security (RLS) no Supabase
- Identificação da empresa via:
  - Link exclusivo (slug)
  - Primeira mensagem do cliente no WhatsApp

---

## 7. Diretrizes de Segurança (Conforme Regras do Projeto)
- **Isolamento de Segurança**: Acesso crítico apenas via API server-side.
- **Escudo Multi-Tenant**: Filtro obrigatório por `company_id` extraído do JWT.
- **Criptografia de Segredos**: API keys e tokens Twilio/Google criptografados no banco.
- **Performance do Banco**: Índices obrigatórios em todas as foreign keys.
- **Edge Functions**: Validação rigorosa de JWT em todas as funções.

---

## 8. Fases do Projeto

### Fase 1 — Fundação e Estrutura
- Setup do projeto frontend/backend.
- Modelagem do banco no Supabase com RLS rigoroso.
- Autenticação e definição de roles.

### Fase 2 — Integrações Críticas
- Conexão com Twilio WhatsApp Business API.
- Integração com Google Calendar API (OAuth2).
- Gestão de Webhooks e Secrets.

### Fase 3 — Inteligência de Agendamento
- Motor de fluxo de conversa (State Machine).
- Validação de disponibilidade real (Google Calendar + Local).
- Automação de lembretes e confirmações.

### Fase 4 — Interface Administrativa
- Painel de gestão para empresas (Serviços, Equipe, Clientes).
- Configurações de disponibilidade e feriados.
- Logs e monitoramento de mensagens.

---

## 9. Métricas de Sucesso
- Taxa de agendamentos concluídos via WhatsApp.
- Redução de no-shows através de lembretes.
- Tempo de resposta do bot de agendamento.
- Taxa de retenção de empresas na plataforma.

