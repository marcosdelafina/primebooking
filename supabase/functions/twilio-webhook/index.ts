import { createClient } from "@supabase/supabase-js";
import { validateTwilioWebhook } from "../_shared/twilio-utils.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
};

Deno.serve(async (req: Request) => {
    // 1. Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 2. Validate Twilio Signature
        // Clone the request because validateTwilioWebhook consumes the body (formData)
        const validated = await validateTwilioWebhook(req.clone());

        if (!validated) {
            console.error("[twilio-webhook] Invalid signature");
            // Returning 403 or 401 might be better, but 200 with error log is safer for webhooks to avoid retries
            return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 403 });
        }

        // 3. Parse Body (Twilio sends application/x-www-form-urlencoded)
        const formData = await req.formData();
        const data = Object.fromEntries(formData.entries());

        const messageSid = data.MessageSid as string;
        const messageStatus = data.MessageStatus as string; // delivered, read, failed, etc.
        const errorCode = data.ErrorCode as string;
        const errorMessage = data.ErrorMessage as string;

        console.log(`[twilio-webhook] Received status update: ${messageSid} -> ${messageStatus}`);

        // 4. Update Database
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        const { error: updateError } = await supabaseClient
            .from('whatsapp_logs')
            .update({
                status: messageStatus,
                error_message: errorMessage || (errorCode ? `Error Code: ${errorCode}` : null),
                updated_at: new Date().toISOString()
            })
            .eq('provider_message_id', messageSid);

        if (updateError) {
            console.error("[twilio-webhook] Database update error:", updateError);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("[twilio-webhook] Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
