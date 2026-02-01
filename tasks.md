# Tasks: PrimeBooking - SaaS de Agendamento Multi-Empresa

**Input**: [spec.md](file:///Users/marcosdelafina/Antigravity/primebooking/spec.md)
#### [NEW] [add_geo_tables.sql](file:///Users/marcosdelafina/Antigravity/primebooking/supabase/migrations/20260201160000_add_geo_tables.sql)
Criar tabelas `estados` e `municipios` com dados do IBGE para suporte a endereços.

#### [NEW] [create_municipios_view.sql](file:///Users/marcosdelafina/Antigravity/primebooking/supabase/migrations/20260201170000_create_municipios_view.sql)
Criar a view `vw_municipios_com_estado` para busca facilitada de cidades vinculadas aos estados.

#### [NEW] [create_paises_table.sql](file:///Users/marcosdelafina/Antigravity/primebooking/supabase/migrations/20260201171000_create_paises_table.sql)
Criar a tabela `paises` para suporte a códigos de país e formatação de celulares.
**Prerequisites**: plan.md, spec.md

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

**Goal**: Sync appointments with professional's Google Calendar

- [ ] T017 [P] [US3] Implement Google OAuth2 flow for professional calendar access
- [ ] T018 [US3] Implement bi-directional sync (Local DB <-> Google Calendar)
- [ ] T019 [US3] Encrypt Google Refresh Tokens in database (AES-256)

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T020 [P] Final security audit (Credential Hygiene & Multi-Tenant Shield)
- [ ] T021 Database performance tuning (Indices on all FKs and empresa_id)
- [ ] T022 Documentation updates and Quickstart guide

---

## Dependencies & Execution Order

1. **Phase 1 & 2** are strictly sequential and required.
2. **Phase 3 & 4** can run in parallel after Phase 2.
3. **Phase 5** depends on Phase 3 (profissionais setup).
4. **Phase 6** is the final hardening.
