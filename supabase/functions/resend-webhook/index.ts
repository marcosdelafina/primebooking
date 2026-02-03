import { createClient } from "@supabase/supabase-js";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization, x-customer-jwt",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
        const payload = await req.text();
        const headers = Object.fromEntries(req.headers);

        if (!webhookSecret) {
            console.warn("[Resend Webhook] RESEND_WEBHOOK_SECRET not set. Skipping verification.");
        } else {
            const wh = new Webhook(webhookSecret);
            try {
                wh.verify(payload, headers);
            } catch (err: any) {
                console.error("[Resend Webhook] Signature verification failed:", err.message);
                return new Response(JSON.stringify({ error: "Invalid signature" }), {
                    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        const body = JSON.parse(payload);
        console.log("[Resend Webhook] Event received:", body.type, body.data?.id);

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const emailId = body.data?.id;
        const eventType = body.type; // e.g., 'email.delivered', 'email.bounced'

        if (emailId) {
            const { error: updateError } = await supabase
                .from('email_events')
                .update({
                    status: eventType.split('.')[1] || eventType,
                    resend_event_type: eventType,
                    payload: body
                })
                .eq('resend_email_id', emailId);

            if (updateError) {
                console.error("[Resend Webhook] Error updating email_events:", updateError);
            } else {
                console.log("[Resend Webhook] Successfully updated email status for:", emailId);
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("[Resend Webhook] Critical error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
