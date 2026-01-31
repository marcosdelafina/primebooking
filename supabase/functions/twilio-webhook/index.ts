// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: any) => {
    try {
        const { method } = req;

        // Basic multi-tenant security would happen here if it's an authenticated function
        // For webhooks, we'd verify the Twilio signature.

        if (method === 'POST') {
            const body = await req.json();
            console.log('Received Twilio webhook:', body);

            return new Response(
                JSON.stringify({ message: "Webhook received" }),
                { headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
