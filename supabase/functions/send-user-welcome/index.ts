import { createClient } from "@supabase/supabase-js";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { sendEmailWithRetry } from "../_shared/resend-utils.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization, x-customer-jwt",
};

Deno.serve(async (req: Request) => {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
        console.error("[send-user-welcome] CRITICAL: RESEND_API_KEY missing.");
        return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
    }

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        console.log("[send-user-welcome] Received request body:", JSON.stringify(body, null, 2));

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        let email = body.email;
        let userName = body.userName;
        let companyName = body.companyName;

        // Handle Database Webhook (usuarios INSERT)
        // Note: Supabase Webhooks send body.table and body.record
        if (body.table === 'usuarios' || body.table === 'public.usuarios') {
            const user = body.record || body.new_record;
            if (user) {
                email = user.email;
                userName = user.nome || user.full_name;

                console.log(`[send-user-welcome] Detected Webhook for user: ${email}`);

                const { data: company } = await supabaseClient
                    .from('empresas')
                    .select('nome')
                    .eq('id', user.empresa_id)
                    .maybeSingle();

                companyName = company?.nome || "Sua Empresa";
            }
        }

        if (!email) {
            console.error("[send-user-welcome] Error: Email not found in payload.");
            return new Response(JSON.stringify({ success: false, error: "Missing email" }), { status: 400 });
        }

        const appUrl = Deno.env.get("APP_URL") || "http://localhost:8080";
        const resend = new Resend(resendKey);

        const emailSubject = `Bem-vindo ao PrimeBooking, ${userName || 'Cliente'}!`;
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo</title>
      </head>
      <body style="font-family: sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: #2563eb; padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Bem-vindo ao PrimeBooking</h1>
          </div>
          <div style="padding: 32px; color: #374151; line-height: 1.6;">
            <h2 style="color: #111827; margin-top: 0;">Olá, ${userName || 'Cliente'}! 👋</h2>
            
            <p>Seja muito bem-vindo(a) ao <strong>PrimeBooking</strong>!</p>
            
            <p>Ficamos muito felizes em ter você com a gente 😊</p>
            
            <p>Sua conta foi criada com sucesso e, neste momento, ela está associada à empresa <strong>${companyName}</strong>. <span style="color: #6b7280; font-size: 14px;">(👉 Importante: esse nome é temporário e pode ser alterado a qualquer momento nas configurações)</span></p>
            
            <p>O <strong>PrimeBooking</strong> é uma plataforma para ajudar você a gerenciar seus agendamentos de forma simples, organizada e eficiente, economizando tempo no dia a dia e oferecendo uma melhor experiência para seus clientes.</p>
            
            <p>Se precisar de qualquer ajuda nesse início, estamos à disposição para apoiar você em cada passo.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${appUrl}/admin" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">Acessar Meu Painel 🚀</a>
            </div>
            
            <p style="margin-bottom: 0;">Bem-vindo(a) à plataforma! 🚀<br><strong>Equipe PrimeBooking</strong></p>
          </div>
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px;">
            © 2026 PrimeBooking. Todos os direitos reservados.
          </div>
        </div>
      </body>
      </html>
    `;

        console.log(`[send-user-welcome] Attempting to send email to ${email}`);

        const result = await sendEmailWithRetry(resend, {
            from: '"PrimeBooking" <notificacoes@notifications.appsbuilding.com>',
            to: [email],
            subject: emailSubject,
            html: emailHtml
        });

        if (result.error) {
            console.error("[send-user-welcome] Resend Error:", JSON.stringify(result.error));
            throw result.error;
        }

        console.log("[send-user-welcome] Email sent successfully. Resend ID:", result.data?.id);

        // Log to email_events
        try {
            const { data: userData } = await supabaseClient.from('usuarios').select('empresa_id').eq('email', email).limit(1).maybeSingle();
            await supabaseClient.from('email_events').insert({
                company_id: userData?.empresa_id || null,
                type: 'welcome',
                recipient_type: 'user',
                status: 'sent',
                resend_email_id: result.data?.id,
                resend_event_type: 'email.sent',
                payload: { email, userName, companyName }
            });
        } catch (logErr) {
            console.error("[send-user-welcome] Failed to log welcome email event:", logErr);
        }

        return new Response(JSON.stringify({ success: true, id: result.data?.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("[send-user-welcome] Universal Error:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});
