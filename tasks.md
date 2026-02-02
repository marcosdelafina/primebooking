# Tasks: PrimeBooking - SaaS de Agendamento Multi-Empresa

**Input**: [spec.md](file:///Users/marcosdelafina/Antigravity/primebooking/spec.md)
#### [NEW] [add_geo_tables.sql](file:///Users/marcosdelafina/Antigravity/primebooking/supabase/migrations/20260201160000_add_geo_tables.sql)
Criar tabelas `estados` e `municipios` com dados do IBGE para suporte a endereços.

#### [NEW] [create_municipios_view.sql](file:///Users/marcosdelafina/Antigravity/primebooking/supabase/migrations/20260201170000_create_municipios_view.sql)
Criar a view `vw_municipios_com_estado` para busca facilitada de cidades vinculadas aos estados.

#### [NEW] [create_paises_table.sql](file:///Users/marcosdelafina/Antigravity/primebooking/supabase/migrations/20260201171000_create_paises_table.sql)
Criar a tabela `paises` para suporte a códigos de país e formatação de celulares.
**Prerequisites**: plan.md, spec.md

## Phase 0: Global Administration & Billing (Priority: P1)

**Goal**: Setup the command center for platform operation and simplified billing.

- [ ] T000.1 [P] Migração: Adicionar `is_admin_global` em `usuarios` e criar tabela `billing_empresa`
- [ ] T000.2 [P] RLS Update: Garantir que Admin Global tenha acesso total (bypass) baseado no novo flag
- [ ] T000.3 [US_ADMIN] Seletor de Contexto: Dropdown na UI para alternar entre Global e Empresa
- [ ] T000.4 [US_ADMIN] Dashboard Global Financeiro: Visualização de MRR, Inadimplência e Lista de Empresas
- [ ] T000.5 [US_ADMIN] Painel de Suporte: Logs, status de integração e ações manuais de reativação
- [ ] T000.6 [P] Automator: Lógica de faturamento simplificada (geração mensal de títulos fixos)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize project structure per implementation plan
- [x] T002 Initialize project dependencies and environment configurations
- [x] T003 [P] Configure linting and formatting tools (ESLint/Prettier)
- [x] T003.1 Align project stack with PrimeCashflow (Radix UI, TanStack Query, Framer Motion)
- [x] T003.2 Resolve IDE environment warnings (Typescript types, Tailwind CSS linting)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and Database Setup

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Setup Supabase schema (empresas, usuarios, clientes, servicos, profissionais, agendamentos, conversas)
- [x] T004.1 Setup admin_users table for global administration
- [x] T005 [P] Enable Row Level Security (RLS) on all tables with tenant isolation
    - [x] Theme Management <!-- id: 85 -->
        - [x] Implement Dark Mode support (next-themes) <!-- id: 86 -->
        - [x] Add Theme Toggle to Admin & Public pages <!-- id: 87 -->
        - [x] UI Polishing (Fix layout issues in filters) <!-- id: 88 -->
    - [x] Implementing Animated Toast System <!-- id: 89 -->
        - [x] Port `animated-toast.tsx` from PrimeCashFlow <!-- id: 90 -->
        - [x] Update `use-toast.ts` bridge <!-- id: 91 -->
        - [x] Wrap app in `AnimatedToastProvider` <!-- id: 92 -->
    - [x] Implementing Full Realtime Coverage <!-- id: 93 -->
        - [x] Support unfiltered subscriptions in `useSupabaseRealtime` <!-- id: 94 -->
        - [x] Add Realtime to `EnterpriseSettingsPage` <!-- id: 95 -->
        - [x] Add Realtime to `MinhaAssinatura` (Refactor to useQuery) <!-- id: 96 -->
        - [x] Add Realtime to `GlobalAdminDashboard` <!-- id: 97 -->
    - [x] Logic: PDF Export for Invoices <!-- id: 71 -->
- [x] T006 [P] Implement Authentication flow with multi-tenant custom claims
- [x] T007 Configure Edge Functions base for Twilio and Google integrations
- [x] T008 [P] Setup error handling and standardized API response formats
- [x] Criar migração para as tabelas `estados` e `municipios`
- [x] Criar view `vw_municipios_com_estado` para busca de cidades
- [x] Criar tabela `paises` para códigos de país
- [x] Integrar view de cidades/estados no formulário de Configurações
- [x] Criar camada de serviço para Supabase (`/src/lib/supabase-services.ts`)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Gestão Administrativa (Priority: P1) 🎯 MVP

**Goal**: Allow company owners to manage services and basic settings

- [x] T009 [P] [US1] Implement CRUD for `servicos` in the backend
- [x] T010 [P] [US1] Implement CRUD for `profissionais` in the backend
- [x] T011 [US1] Build Administration Dashboard for Service Management
- [x] T012 [US1] Build Professional Management module with availability settings

---

## Phase 4: User Story 2 - Fluxo de Agendamento WhatsApp (Priority: P1) 🎯 MVP

**Goal**: Automate scheduling via Twilio WhatsApp API

- [ ] T013 [P] [US2] Implement Chat State Machine logic (conversas table)
- [ ] T014 [US2] Setup Twilio Webhook handler for incoming messages
- [ ] T015 [US2] Implement availability lookup logic (db query + business hours)
- [ ] T016 [US2] Implement appointment creation logic via WhatsApp flow

---

## Phase 5: User Story 3 - Integração Google Calendar (Priority: P2)

**Goal**: Sincronização em tempo real para evitar conflitos de horários e centralizar agenda profissional.

- [ ] T017 [US3] Configuração Google Cloud Console (OAuth2 Credentials & Scopes)
- [ ] T018 [P] [US3] Implementação do Fluxo OAuth2 (Onboarding do profissional)
- [ ] T019 [US3] Gestão Segura de Tokens (Refresh tokens e encriptação no banco/Vault)
- [ ] T020 [P] [US3] Outbound Sync: Criar/Editar eventos no Google ao agendar no PrimeBooking
- [ ] T021 [P] [US3] Inbound Sync: Bloquear horários locais baseados em eventos do Google Calendar
- [ ] T022 [US3] Sincronização em tempo real via Webhooks (Google Calendar Watch Channel)

---

---

## Phase 4b: User Story 4 - Experiência de Agendamento Web (Priority: P1) 🎯 MVP

**Goal**: Interface web/mobile premium para clientes que não usam WhatsApp.

- [x] T016.1 Implementação da página de detalhes do estabelecimento (`BusinessDetailPage`)
- [x] T016.2 Implementação do Seletor de Categorias e Serviços (Multi-checkout)
- [x] T016.3 Fluxo de agendamento em 4 passos (Serviços -> Horário -> Contato -> Confirmação)
- [ ] T016.4 Integração com Supabase Storage para fotos de galeria e perfil

---

## Phase 7: Notificações & Automações (Priority: P1)

**Goal**: Garantir que o cliente compareça e reduzir o no-show.

- [ ] T023 Setup de Edge Functions para disparos automáticos (Cron Jobs)
- [ ] T024 Lógica de Lembrete: Enviar mensagem 2h antes do agendamento
- [ ] T025 Confirmação de Presença: Botão interativo no WhatsApp para confirmar/cancelar
- [ ] T026 Notificação de Cancelamento para o profissional e para o cliente

## Phase 8: Polish & Hardening

- [ ] T027 [P] Auditoria Final de Segurança (RLS, Multi-tenant Shield e Sanitização)
- [ ] T028 Otimização de Banco de Dados (Índices em FKs e Performance de Queries)
- [ ] T029 Ajustes de UI/UX Mobile (Feedback tátil, micro-interações e loading states)
- [ ] T030 Documentação Final e Guia de Configuração (Supabase, Twilio e Google)

---

## Phase 9: Reviews Feature (Avaliações) (Priority: P2)

**Goal**: Permitir a gestão e exibição de avaliações para reforçar credibilidade e prova social.

- [/] T031 [P] Migração: Criar tabela `plataforma_avaliacoes` com RLS e políticas de moderação <!-- id: 98 -->
- [ ] T032 [P] Camada de Serviço: Implementar funções Supabase para gestão de avaliações <!-- id: 99 -->
- [ ] T033 [US_ADMIN_GLOBAL] Dashboard de Moderação: UI para aprovar/reprovar/ocultar avaliações <!-- id: 100 -->
- [ ] T034 [US_EMPRESA] Submissão de Avaliação: Formulário para proprietários de lojas avaliarem a plataforma <!-- id: 101 -->
- [ ] T035 [US_PUBLIC] Display Público: Exibir média global e feedbacks aprovados na Landing Page <!-- id: 102 -->

---

## Dependencies & Execution Order

1. **Phase 1 & 2** are strictly sequential and required.
2. **Phase 3, 4 & 4b** can run in parallel after Phase 2.
3. **Phase 5** depends on Phase 3 (profissionais setup).
4. **Phase 7** depends on Phase 4 (WhatsApp logic).
5. **Phase 8** is the final hardening.
