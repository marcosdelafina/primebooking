// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
        const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
        const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Debug: GOOGLE_CLIENT_ID used:", googleClientId);
        console.log("Debug: GOOGLE_REDIRECT_URI used:", redirectUri);

        // Check if we are receiving code/state from the frontend via JSON body
        let code: string | null | undefined;
        let state: string | null | undefined;
        let profissional_id: string | null | undefined;
        let empresa_id: string | null | undefined;

        if (req.method === "POST") {
            const body = await req.json();
            code = body.code;
            state = body.state;
            profissional_id = body.profissional_id;
            empresa_id = body.empresa_id;
        } else {
            const url = new URL(req.url);
            code = url.searchParams.get("code");
            state = url.searchParams.get("state");
            // For GET requests, if we are initiating the auth flow, these might be in query params
            profissional_id = url.searchParams.get("profissional_id");
            empresa_id = url.searchParams.get("empresa_id");
        }

        // 1. If we have a CODE, it's a callback exchange
        if (code && state) {
            console.log("Exchanging code for tokens...");
            const [pId, eId] = state.split(":");

            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    code,
                    client_id: googleClientId,
                    client_secret: googleClientSecret,
                    redirect_uri: redirectUri,
                    grant_type: "authorization_code",
                }),
            });

            const tokens = await tokenResponse.json();

            if (tokens.error) {
                console.error("Google Token Error:", tokens);
                return new Response(JSON.stringify({ error: tokens.error_description || tokens.error }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Store the refresh token
            const { error: updateError } = await supabase
                .from("profissionais")
                .update({
                    google_refresh_token: tokens.refresh_token,
                })
                .eq("id", pId)
                .eq("empresa_id", eId);

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. If no code, we generate the Auth URL (Original Flow)
        if (profissional_id && empresa_id) {
            const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
            authUrl.searchParams.set("client_id", googleClientId);
            authUrl.searchParams.set("redirect_uri", redirectUri);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly");
            authUrl.searchParams.set("access_type", "offline");
            authUrl.searchParams.set("prompt", "consent");
            authUrl.searchParams.set("state", `${profissional_id}:${empresa_id}`);

            return new Response(JSON.stringify({ url: authUrl.toString() }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Parâmetros ausentes" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
