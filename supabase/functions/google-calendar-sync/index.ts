// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { format } from "https://esm.sh/date-fns@2.30.0";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

async function getAccessToken(refreshToken: string) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(`Failed to refresh token: ${data.error_description || data.error}`);
    }
    return data.access_token;
}

serve(async (req) => {
    try {
        const payload = await req.json();
        console.log("Sync trigger received:", payload.type, "for table", payload.table);
        console.log("Full Payload:", JSON.stringify(payload));

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const record = payload.type === 'DELETE' ? payload.old_record : payload.record;
        console.log("Target record ID:", record.id, "Profissional ID:", record.profissional_id);

        // Get professional tokens
        const { data: prof, error: profError } = await supabase
            .from("profissionais")
            .select("google_refresh_token, google_calendar_id, nome")
            .eq("id", record.profissional_id)
            .single();

        if (profError) {
            console.error("Error fetching professional:", profError);
            return new Response(JSON.stringify({ error: "Professional fetch failed" }), { status: 500 });
        }

        if (!prof?.google_refresh_token) {
            console.log("Sync skipped: Professional", record.profissional_id, "has no refresh token.");
            return new Response(JSON.stringify({ message: "Skipped: No token" }));
        }

        console.log("Refreshing token for professional:", prof.nome);
        const accessToken = await getAccessToken(prof.google_refresh_token);
        const calendarId = prof.google_calendar_id || "primary";

        // Prepare Google Event
        const { data: client } = await supabase.from("clientes").select("nome").eq("id", record.cliente_id).single();

        // Fetch services (support both multi and single for compatibility)
        let svcList = [];
        const svcIds = record.servicos_ids?.length > 0 ? record.servicos_ids : (record.servico_id ? [record.servico_id] : []);

        if (svcIds.length > 0) {
            const { data: svcs } = await supabase.from("servicos").select("nome, preco").in("id", svcIds);
            svcList = svcs || [];
        }

        const totalPreco = svcList.reduce((sum, s) => sum + (Number(s.preco) || 0), 0);
        const svcNames = svcList.map(s => s.nome).join(", ");

        // Fetch company address
        const { data: empresa } = await supabase
            .from("empresas")
            .select("logradouro, numero, bairro, cidade, estado")
            .eq("id", record.empresa_id)
            .single();

        const address = empresa
            ? `${empresa.logradouro}, ${empresa.numero} - ${empresa.bairro}, ${empresa.cidade}/${empresa.estado}`
            : '';

        const startTime = format(new Date(record.data_inicio), 'HH:mm');
        const endTime = format(new Date(record.data_fim), 'HH:mm');

        const statusLabel = {
            pendente: 'Pendente',
            confirmado: 'Confirmado',
            em_andamento: 'Em Andamento',
            concluido: 'Concluído',
            cancelado: 'Cancelado',
            nao_compareceu: 'Não Compareceu'
        }[record.status] || record.status;

        const event = {
            summary: `${client?.nome} - ${svcNames}`,
            location: address,
            description: `${client?.nome}, seu horário é das ${startTime} até ${endTime}\nProfissional: ${prof.nome}\nServiços: ${svcNames}\nValor Total: R$ ${totalPreco.toFixed(2)}\nStatus: ${statusLabel}\n\n${record.notas ? `Notas: ${record.notas}\n\n` : ''}Agendamento realizado via PrimeBooking`,
            start: { dateTime: record.data_inicio },
            end: { dateTime: record.data_fim },
        };

        console.log("Sending event to Google:", JSON.stringify(event));

        const isCanceled = record.status === 'cancelado';

        if (isCanceled) {
            if (record.google_event_id) {
                console.log("Performing DELETE for canceled appointment:", record.google_event_id);
                const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${record.google_event_id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                console.log("Google Delete Response status:", resp.status);
                // Clear the ID so it can be re-synced if the status changes back to confirmed
                await supabase.from("agendamentos").update({ google_event_id: null }).eq("id", record.id);
            } else {
                console.log("Cancellation ignored: No google_event_id on record.");
            }
            return new Response(JSON.stringify({ status: "ok", message: "Processed cancellation" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        if (payload.type === 'INSERT' || (payload.type === 'UPDATE' && !record.google_event_id)) {
            console.log(payload.type === 'INSERT' ? "Performing INSERT" : "Performing UPDATE as INSERT (missing ID)");
            const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify(event),
            });
            const data = await resp.json();
            console.log("Google Create Response:", JSON.stringify(data));

            if (data.id) {
                const { error: updateError } = await supabase
                    .from("agendamentos")
                    .update({ google_event_id: data.id })
                    .eq("id", record.id);
                if (updateError) console.error("Error updating agendamento with google_event_id:", updateError);
            } else {
                console.error("Failed to create event or get ID from Google response:", data);
            }
        } else if (payload.type === 'UPDATE') {
            console.log("Performing PATCH for existing event:", record.google_event_id);
            const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${record.google_event_id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify(event),
            });
            const data = await resp.json();
            console.log("Google Update Response:", JSON.stringify(data));
            if (data.error) {
                console.error("Error patching event:", data.error);
            }
        } else if (payload.type === 'DELETE') {
            if (record.google_event_id) {
                console.log("Performing DELETE for record deletion:", record.google_event_id);
                const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${record.google_event_id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                console.log("Google Delete Response status:", resp.status);
            } else {
                console.log("Delete skipped: No google_event_id on record.");
            }
        }

        return new Response(JSON.stringify({ status: "ok" }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("Sync Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
