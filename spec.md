# Especificação Técnica — SaaS de Agendamento Multi-Empresa

## 1. Stack Tecnológica

### Backend
- Node.js ou Python
- API REST
- Webhooks

### Banco de Dados
- Supabase (PostgreSQL)
- Row Level Security (RLS)

### Integrações
- Twilio WhatsApp Business API
- Google Calendar API

---

## 2. Modelo de Dados (Supabase/PostgreSQL)

> [!IMPORTANT]
> Todas as tabelas devem habilitar Row Level Security (RLS) e possuir índices em `empresa_id` e outras Foreign Keys.

### empresas
- `id`: uuid (primary key)
- `nome`: text
- `slug`: text (unique, format-friendly)
- `plano`: text (basic, pro, enterprise)
- `whatsapp_number_id`: text (Twilio reference)
- `config`: jsonb (horários, preferências)
- `created_at`: timestamptz

### usuarios
- `id`: uuid (Auth.users reference)
- `empresa_id`: uuid (FK)
- `nome`: text
- `email`: text
- `role`: text (owner, admin, member)
- `created_at`: timestamptz

### clientes
- `id`: uuid
- `empresa_id`: uuid (FK)
- `nome`: text
- `telefone`: text (E.164 format)
- `google_contact_id`: text (opcional)
- `created_at`: timestamptz

### servicos
- `id`: uuid
- `empresa_id`: uuid (FK)
- `nome`: text
- `descricao`: text
- `duracao_min`: int
- `preco`: numeric(12,2)
- `ativo`: boolean

### profissionais
- `id`: uuid
- `empresa_id`: uuid (FK)
- `nome`: text
- `email`: text
- `google_calendar_id`: text
- `google_refresh_token`: text (encrypted)
- `disponibilidade`: jsonb

### agendamentos
- `id`: uuid
- `empresa_id`: uuid (FK)
- `cliente_id`: uuid (FK)
- `profissional_id`: uuid (FK)
- `servico_id`: uuid (FK)
- `data_inicio`: timestamptz
- `data_fim`: timestamptz
- `google_event_id`: text
- `status`: text (pending, confirmed, cancelled, completed)

### conversas (Chat States)
- `id`: uuid
- `empresa_id`: uuid (FK)
- `telefone_cliente`: text
- `estado_fluxo`: text (awaiting_service, awaiting_professional, etc.)
- `dados_parciais`: jsonb
- `updated_at`: timestamptz

---

## 3. Segurança e Padronização API

### Multi-Tenant Shield
- Nenhuma query no frontend deve omitir `empresa_id`.
- O `empresa_id` deve ser validado via JWT no server-side.
- **RLS Policy Example**:
  ```sql
  CREATE POLICY "Tenant isolation" ON public.servicos
  FOR ALL USING (empresa_id = auth.jwt() ->> 'empresa_id');
  ```

### API Consistency
- Métodos: `GET`, `POST`, `PATCH` (update parcial), `DELETE`.
- Rotas: `/api/v1/servicos`, `/api/v1/profissionais`.
- Erros: `{ "error": "Code", "message": "Friendly message" }`.

### Credential Hygiene
- Senhas: Nunca trafegadas em texto puro.
- Tokens: Armazenados com criptografia AES-256 no banco (Vault pattern).

