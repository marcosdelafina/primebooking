import { createClient } from "@supabase/supabase-js";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { sendEmailWithRetry } from "../_shared/resend-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization, x-customer-jwt",
};

interface BillingRequest {
  empresa_id: string;
  invoice_id?: string;
  amount?: number;
  due_date?: string;
}

Deno.serve(async (req: Request) => {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("[send-billing-notification] CRITICAL: RESEND_API_KEY missing.");
    return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendKey);

    const body: BillingRequest = await req.json();
    const { empresa_id, amount, due_date } = body;

    // Fetch company details and owner email
    const { data: empresa } = await supabaseClient
      .from('empresas')
      .select('nome')
      .eq('id', empresa_id)
      .single();

    const { data: owner } = await supabaseClient
      .from('usuarios')
      .select('email, nome')
      .eq('empresa_id', empresa_id)
      .eq('role', 'admin') // Assuming owner is 'admin'
      .limit(1)
      .single();

    if (!empresa || !owner) {
      throw new Error("Company or owner not found");
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Fatura PrimeBooking</title>
      </head>
      <body style="font-family: sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: #2563eb; padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">Fatura Gerada - PrimeBooking</h1>
          </div>
          <div style="padding: 32px; color: #374151; line-height: 1.6;">
            <h2 style="color: #111827; margin-top: 0;">Olá, ${owner.nome}! 👋</h2>
            
            <p>Informamos que uma nova fatura para a empresa <strong>${empresa.nome}</strong> acaba de ser gerada no sistema.</p>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0;"><strong>Resumo da Fatura:</strong></p>
              ${amount ? `<p style="margin: 5px 0;">Valor: <span style="color: #2563eb; font-weight: bold;">R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>` : ''}
              ${due_date ? `<p style="margin: 5px 0;">Vencimento: <strong>${new Date(due_date).toLocaleDateString('pt-BR')}</strong></p>` : ''}
            </div>
            
            <p>Você pode acessar seu painel financeiro agora mesmo para visualizar os detalhes, baixar o boleto ou realizar o pagamento via Pix.</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${Deno.env.get("APP_URL") || "http://localhost:8080"}/admin/subscription" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">Ver Fatura no Painel 💳</a>
            </div>
            
            <p>Se tiver qualquer dúvida sobre sua assinatura, nossa equipe financeira está à disposição para ajudar.</p>
            
            <p style="margin-bottom: 0;">Atenciosamente,<br><strong>Equipe Financeira PrimeBooking</strong></p>
          </div>
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px;">
            © 2026 PrimeBooking. Todos os direitos reservados.
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailWithRetry(resend, {
      from: 'Financeiro PrimeBooking <financeiro@notifications.appsbuilding.com>',
      to: [owner.email],
      subject: `[PrimeBooking] Fatura Gerada - ${empresa.nome}`,
      html: emailHtml
    });

    if (result.error) throw result.error;

    // Log to email_events
    await supabaseClient.from('email_events').insert({
      company_id: empresa_id,
      type: 'billing_invoice',
      recipient_type: 'owner',
      status: 'sent',
      resend_email_id: result.data?.id,
      resend_event_type: 'email.sent',
      payload: { email: owner.email, amount, due_date }
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
