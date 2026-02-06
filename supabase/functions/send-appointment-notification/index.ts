import { createClient } from "@supabase/supabase-js";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { sendEmailWithRetry } from "../_shared/resend-utils.ts";
import { sendWhatsappMessage } from "../_shared/twilio-utils.ts";
import { WHATSAPP_TEMPLATES } from "../_shared/whatsapp-templates.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization, x-customer-jwt",
};

Deno.serve(async (req: Request) => {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
        console.error("[send-appointment-notification] CRITICAL: RESEND_API_KEY missing.");
        return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
    }

    // Check Twilio Env Vars (soft check, don't fail whole function if missing, just log)
    const twilioConfigured = Deno.env.get("TWILIO_ACCOUNT_SID") && Deno.env.get("TWILIO_AUTH_TOKEN") && Deno.env.get("TWILIO_WHATSAPP_NUMBER");
    if (!twilioConfigured) {
        console.warn("[send-appointment-notification] Twilio not fully configured. WhatsApp will be skipped.");
    }

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
        const resend = new Resend(resendKey);

        const bodyText = await req.text();
        console.log("[send-appointment-notification] Request Body:", bodyText);

        let payload;
        try {
            payload = JSON.parse(bodyText);
        } catch (e) {
            console.error("[send-appointment-notification] Error parsing JSON:", e.message);
            return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
        }

        const { type, record, old_record } = payload;

        if (!record) {
            console.error("[send-appointment-notification] Error: No record in payload");
            return new Response(JSON.stringify({ error: "No record in payload" }), { status: 400 });
        }

        // 1. Get Client Details
        const { data: client, error: clientError } = await supabaseClient
            .from('clientes')
            .select('nome, email, telefone')
            .eq('id', record.cliente_id)
            .maybeSingle();

        if (clientError || !client) {
            console.error(`[send-appointment-notification] Error fetching client [${record.cliente_id}]:`, clientError);
            return new Response(JSON.stringify({ error: "Client not found" }), { status: 404 });
        }

        // 2. Determine Notification Scenario
        let scenario = '';
        if (type === 'INSERT') {
            scenario = 'REQUESTED';
        } else if (type === 'REMINDER') {
            scenario = 'REMINDER';
        } else if (type === 'UPDATE') {
            if (record.status === 'confirmado' && old_record?.status !== 'confirmado') {
                scenario = 'CONFIRMED';
            } else if (record.status === 'cancelado' && old_record?.status !== 'cancelado') {
                scenario = 'CANCELED';
            } else if (record.data_inicio && old_record?.data_inicio && record.data_inicio !== old_record.data_inicio) {
                scenario = 'RESCHEDULED';
            } else {
                console.log("[send-appointment-notification] Notification skipped: No relevant change.");
                return new Response(JSON.stringify({ message: "Skipped: No change" }));
            }
        }

        if (!scenario) {
            return new Response(JSON.stringify({ message: "Skipped: No scenario identified" }));
        }

        console.log(`[send-appointment-notification] Processing scenario: ${scenario} for client: ${client.email}`);

        // 3. Gather Context Data (Company, Professional, Services)
        const { data: empresa } = await supabaseClient
            .from('empresas')
            .select('nome, imagem_url, whatsapp, logradouro, numero, bairro, cidade, estado, cep, complemento')
            .eq('id', record.empresa_id)
            .maybeSingle();
        const { data: professional } = await supabaseClient.from('profissionais').select('nome').eq('id', record.profissional_id).maybeSingle();

        const svcIds = record.servicos_ids?.length > 0 ? record.servicos_ids : (record.servico_id ? [record.servico_id] : []);
        const { data: svcs } = await supabaseClient.from('servicos').select('nome, preco').in('id', svcIds);
        const svcNames = svcs?.map(s => s.nome).join(', ') || 'Serviço';

        const dateFormatted = new Date(record.data_inicio).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Sao_Paulo'
        });
        const timeStart = new Date(record.data_inicio).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });

        // 4. Build Email Content
        type ScenarioType = 'REQUESTED' | 'CONFIRMED' | 'CANCELED' | 'RESCHEDULED' | 'REMINDER';

        const scenarioConfigMap: Record<ScenarioType, { subject: string, title: string, message: string, color: string }> = {
            REQUESTED: {
                subject: `[PrimeBooking] Solicitação de agendamento: ${empresa?.nome}`,
                title: "Solicitação Recebida! 📝",
                message: `Olá, ${client.nome}! Recebemos seu pedido de agendamento para <strong>${empresa?.nome}</strong>. Estamos aguardando a confirmação do profissional.`,
                color: "#2563eb"
            },
            CONFIRMED: {
                subject: `[PrimeBooking] Agendamento CONFIRMADO! ✅ - ${empresa?.nome}`,
                title: "Agendamento Confirmado! 🎉",
                message: `Ótima notícia, ${client.nome}! Seu agendamento para <strong>${empresa?.nome}</strong> foi confirmado. Nos vemos em breve!`,
                color: "#16a34a"
            },
            CANCELED: {
                subject: `[PrimeBooking] Agendamento Cancelado ❌ - ${empresa?.nome}`,
                title: "Agendamento Cancelado",
                message: `Olá, ${client.nome}. Informamos que seu agendamento para <strong>${empresa?.nome}</strong> foi cancelado. Se tiver dúvidas, entre em contato com o estabelecimento.`,
                color: "#dc2626"
            },
            RESCHEDULED: {
                subject: `[PrimeBooking] Seu agendamento foi REAGENDADO - ${empresa?.nome}`,
                title: "Horário Alterado! 🕒",
                message: `Olá, ${client.nome}. O horário do seu agendamento para <strong>${empresa?.nome}</strong> foi alterado. Confira os novos detalhes abaixo.`,
                color: "#8b5cf6"
            },
            REMINDER: {
                subject: `🚀 Lembrete: Seu agendamento é AMANHÃ! - ${empresa?.nome}`,
                title: "Lembrete Importante! ⏰",
                message: `Olá, ${client.nome}! Passando para lembrar que você tem um agendamento marcado para amanhã em <strong>${empresa?.nome}</strong>.`,
                color: "#f59e0b"
            }
        };

        const scenarioConfig = scenarioConfigMap[scenario as ScenarioType];

        // Should not happen due to earlier check, but safely handle it
        if (!scenarioConfig) {
            console.error(`[send-appointment-notification] Error: Scenario config not found for ${scenario}`);
            return new Response(JSON.stringify({ error: "Scenario config missing" }), { status: 500 });
        }

        const statusMap: Record<string, string> = {
            pendente: 'Pendente',
            confirmado: 'Confirmado',
            cancelado: 'Cancelado',
            concluido: 'Concluído',
            nao_compareceu: 'Não Compareceu',
            em_andamento: 'Em Andamento'
        };

        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; color: #374151;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background-color: ${scenarioConfig.color}; padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${scenarioConfig.title}</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${scenarioConfig.message}</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
              <p style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: bold;">Detalhes do Agendamento</p>
              <p style="margin: 5px 0;">📍 <strong>Local:</strong> ${empresa?.nome}</p>
              <p style="margin: 5px 0;">👤 <strong>Profissional:</strong> ${professional?.nome || 'A definir'}</p>
              <p style="margin: 5px 0;">✂️ <strong>Serviço:</strong> ${svcNames}</p>
              <p style="margin: 5px 0;">📅 <strong>Data:</strong> ${dateFormatted}</p>
              <p style="margin: 5px 0;">⏰ <strong>Horário:</strong> ${timeStart}</p>
              <p style="margin: 5px 0;">📊 <strong>Status:</strong> ${statusMap[record.status] || record.status}</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">Se precisar falar conosco, clique no botão abaixo para abrir o WhatsApp:</p>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://wa.me/${empresa?.whatsapp?.replace(/\D/g, '')}" style="background-color: #25d366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Falar via WhatsApp 💬</a>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
            © 2026 ${empresa?.nome}. Gerenciado via <strong>PrimeBooking</strong>.
          </div>
        </div>
      </body>
      </html>
    `;

        if (client.email) {
            console.log(`[send-appointment-notification] Sending email to: ${client.email} (Scenario: ${scenario})`);
            const result = await sendEmailWithRetry(resend, {
                from: `"${empresa?.nome || 'PrimeBooking'}" <notificacoes@notifications.appsbuilding.com>`,
                to: [client.email],
                subject: scenarioConfig.subject,
                html: emailHtml,
            });

            if (result.error) {
                console.error(`[send-appointment-notification] Resend Error for ${client.email}:`, result.error);
            } else {
                console.log(`[send-appointment-notification] Email sent successfully to: ${client.email}`);

                // Log to email_events
                await supabaseClient.from('email_events').insert({
                    company_id: record.empresa_id,
                    type: `appointment_${scenario.toLowerCase()}`,
                    recipient_type: 'client',
                    status: 'sent',
                    resend_email_id: result.data?.id,
                    resend_event_type: 'email.sent',
                    payload: { email: client.email, agendamento_id: record.id, status: record.status }
                });
            }
        } else {
            console.log(`[send-appointment-notification] Email skipped: Client [${client.nome}] has no email.`);
        }

        // =========================================================================
        // 5. WhatsApp Notification (Parallel / Async)
        // =========================================================================

        if (twilioConfigured && client.telefone) {
            try {
                console.log(`[send-appointment-notification] Starting WhatsApp flow for ${client.telefone} (Scenario: ${scenario})`);

                // Global Variable Mapping Schemes (Standardized in whatsapp-templates.ts)
                const valClientName = client.nome || "Cliente";
                const valBusinessName = empresa?.nome || "Empresa";

                // Construct Address String
                const addressParts = [
                    empresa?.logradouro,
                    empresa?.numero,
                    empresa?.complemento,
                    empresa?.bairro,
                    empresa?.cidade,
                    empresa?.estado
                ].filter(Boolean);

                const valBusinessAddress = addressParts.length > 0
                    ? addressParts.join(', ')
                    : "Endereço não disponível";
                const valProfName = professional?.nome || "Profissional";
                const valService = svcNames;
                const valDate = dateFormatted;
                const valTime = timeStart;
                const valStatus = statusMap[record.status] || record.status;
                const valBusinessPhone = empresa?.whatsapp || "";

                // Define Base Variables
                const baseVars = {
                    "1": valClientName,
                    "2": valBusinessName,
                    "3": valBusinessAddress,
                    "4": valProfName,
                    "5": valService,
                    "6": valDate,
                    "7": valTime,
                    "8": valStatus,
                    "9": valBusinessPhone
                };

                let templateId = '';
                let vars: Record<string, string> = { ...baseVars };

                if (scenario === 'REQUESTED') {
                    templateId = WHATSAPP_TEMPLATES.APPOINTMENT_CREATED.id;
                    // For HX601... (8 variables), address is merged or skipped 
                    // based on user report: 
                    // {{2}} = Intro Name & Local Label
                    // {{3}} = Prof, {{4}} = Service, {{5}} = Date, {{6}} = Time, {{7}} = Status, {{8}} = WhatsApp
                    vars = {
                        "1": valClientName,
                        "2": `${valBusinessName} (${valBusinessAddress})`,
                        "3": valProfName,
                        "4": valService,
                        "5": valDate,
                        "6": valTime,
                        "7": "Pendente",
                        "8": valBusinessPhone
                    };
                } else if (scenario === 'CONFIRMED') {
                    templateId = WHATSAPP_TEMPLATES.APPOINTMENT_CONFIRMED.id;
                    // For HXc6b... (9 variables):
                    // {{3}} is Business Address (Local), {{4}} is Prof, etc.
                } else if (scenario === 'CANCELED') {
                    templateId = WHATSAPP_TEMPLATES.APPOINTMENT_CANCELLED.id;
                } else if (scenario === 'RESCHEDULED') {
                    templateId = WHATSAPP_TEMPLATES.APPOINTMENT_RESCHEDULED.id;
                } else if (scenario === 'REMINDER') {
                    templateId = WHATSAPP_TEMPLATES.APPOINTMENT_REMINDER.id;
                }

                // Check Idempotency for this specific event type
                const eventType = `appointment_${scenario.toLowerCase()}`;
                const { data: existingLog } = await supabaseClient
                    .from('whatsapp_logs')
                    .select('id')
                    .eq('appointment_id', record.id)
                    .eq('event_type', eventType)
                    .eq('status', 'sent')
                    .maybeSingle();

                if (existingLog) {
                    console.log(`[send-appointment-notification] WhatsApp skipped: Already sent (${eventType})`);
                } else if (templateId) {
                    const waResult = await sendWhatsappMessage(client.telefone, {
                        templateSid: templateId,
                        templateVariables: vars
                    });

                    // Log to whatsapp_logs
                    const { error: logError } = await supabaseClient.from('whatsapp_logs').insert({
                        empresa_id: record.empresa_id,
                        appointment_id: record.id,
                        event_type: eventType,
                        template_id: templateId,
                        recipient_phone: client.telefone,
                        status: waResult.success ? 'sent' : 'failed',
                        provider_message_id: waResult.sid,
                        error_message: waResult.error
                    });

                    if (logError) console.error("[send-appointment-notification] Error logging WhatsApp:", logError);
                }

            } catch (waError: any) {
                console.error("[send-appointment-notification] WhatsApp Logic Error:", waError.message, waError.stack);
                // Swallow error ensures email success is still returned and flow doesn't crash
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("[send-appointment-notification] Error:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Returning 200 to not block DB trigger wait if async
        });
    }
});
