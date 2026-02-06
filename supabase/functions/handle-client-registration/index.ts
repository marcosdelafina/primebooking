import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { sendEmailWithRetry } from "../_shared/resend-utils.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization, x-customer-jwt",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("APP_URL") || "https://www.primebooking.com.br";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });

    try {
        const { empresaId, nome, email, telefone, notas, googleContactId, allowAuthCreation = false, isManualRegistration = false } = await req.json();

        if (!empresaId || (!email && !telefone)) {
            return new Response(JSON.stringify({ error: "Missing required fields (email or telefone, and empresaId)" }), { status: 400, headers: corsHeaders });
        }

        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedPhone = telefone ? '+' + telefone.replace(/\D/g, '') : undefined;

        console.log(`[handle-client-registration] Processing for company ${empresaId}. Email: ${normalizedEmail}, Phone: ${normalizedPhone}`);

        // 1. Manage auth.users (Conditional)
        let authUserId: string | null = null;
        let isNewUser = false;

        if (normalizedEmail) {
            // More robust way: Try to create and handle "already exists" error
            // Or use a filtered list if available (depends on Supabase version, but 409 catch is safest)
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: normalizedEmail,
                email_confirm: true,
                user_metadata: { nome, full_name: nome, is_client: true },
            });

            if (createError) {
                if (createError.message.includes('already exists') || (createError as any).status === 422 || (createError as any).status === 409) {
                    console.log(`[handle-client-registration] User already exists in auth. Fetching ID...`);
                    // Now we fetch specifically (can use listUsers with a filter or just query if we have access)
                    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                    // We still have the 50 limit issue if we don't paginate, but we can try to find it.
                    // A better way is to catch the ID from the error metadata if available, 
                    // or just rely on the fact that if it exists, we find it in the global table link later.
                    const existingUser = listData.users.find(u => u.email?.toLowerCase() === normalizedEmail);
                    authUserId = existingUser?.id || null;
                } else {
                    console.error("[handle-client-registration] Error creating auth user:", createError);
                    throw createError;
                }
            } else {
                authUserId = newUser.user.id;
                isNewUser = true;
                console.log(`[handle-client-registration] Created new auth user: ${authUserId}`);
            }
        }

        // 2. Manage clientes_global (Smart Matching)
        let globalClient: any = null;

        // A. Primary Match: EMAIL
        if (normalizedEmail) {
            const { data: byEmail } = await supabaseAdmin
                .from('clientes_global')
                .select('*')
                .eq('email', normalizedEmail)
                .limit(1)
                .maybeSingle();

            if (byEmail) {
                globalClient = byEmail;
                console.log(`[handle-client-registration] Found existing global client by email: ${globalClient.id}`);

                // Security Check: If current request has a phone that differs from global record, 
                // we'll keep the record but we should be aware (usually email wins as identity).

                if (authUserId && !globalClient.auth_user_id) {
                    await supabaseAdmin.from('clientes_global').update({ auth_user_id: authUserId }).eq('id', globalClient.id);
                }
            }
        }

        // B. Secondary Match: PHONE
        if (!globalClient && normalizedPhone) {
            // Find by exact phone
            const { data: byPhone } = await supabaseAdmin
                .from('clientes_global')
                .select('*')
                .eq('telefone', normalizedPhone)
                .limit(1)
                .maybeSingle();

            if (byPhone) {
                globalClient = byPhone;
                console.log(`[handle-client-registration] Found existing global client by Phone match: ${globalClient.id}`);
            }
        }

        // C. Duplicate Email Violation Catch
        // If we found NO global client yet, but an email WAS provided...
        // We need to double check if that email is used by SOMEONE ELSE (under a different phone/name).
        // (Step A already does this, but this is a courtesy check for "New registration with used email")
        if (!globalClient && normalizedEmail) {
            const { data: emailConflict } = await supabaseAdmin
                .from('clientes_global')
                .select('id, telefone, nome')
                .eq('email', normalizedEmail)
                .limit(1)
                .maybeSingle();

            if (emailConflict) {
                return new Response(JSON.stringify({
                    error: "Email já cadastrado para outro cliente.",
                    code: "EMAIL_IN_USE"
                }), { status: 400, headers: corsHeaders });
            }
        }

        if (globalClient) {
            // Sync email and authId if missing and provided now
            const updates: any = {};
            if (!globalClient.email && normalizedEmail) updates.email = normalizedEmail;
            if (!globalClient.auth_user_id && authUserId) updates.auth_user_id = authUserId;
            // Update global name if it was empty
            if (!globalClient.nome && nome) updates.nome = nome;

            if (Object.keys(updates).length > 0) {
                console.log(`[handle-client-registration] Updating global client ${globalClient.id} with:`, updates);
                const { data: updated } = await supabaseAdmin
                    .from('clientes_global')
                    .update(updates)
                    .eq('id', globalClient.id)
                    .select()
                    .single();
                if (updated) globalClient = updated;
            }
        } else {
            // Create NEW global client
            const { data: newGlobal, error: createError } = await supabaseAdmin
                .from('clientes_global')
                .insert({
                    email: normalizedEmail,
                    telefone: normalizedPhone,
                    nome: nome,
                    auth_user_id: authUserId
                })
                .select()
                .single();

            if (createError) {
                console.error("[handle-client-registration] Error creating global client:", createError);
                throw createError;
            }
            globalClient = newGlobal;
            console.log(`[handle-client-registration] Created new global client: ${globalClient.id}`);
        }

        // 3. Manage clientes_empresa (Link)

        // If it's a manual registration from Admin, check if link already exists to prevent "silent update"
        if (isManualRegistration) {
            const { data: existingLink } = await supabaseAdmin
                .from('clientes_empresa')
                .select('id')
                .eq('empresa_id', empresaId)
                .eq('cliente_global_id', globalClient.id)
                .maybeSingle();

            if (existingLink) {
                return new Response(JSON.stringify({
                    error: "Este cliente já está cadastrado em sua empresa.",
                    code: "DUPLICATE_CLIENT"
                }), { status: 409, headers: corsHeaders });
            }
        }

        const { data: link, error: linkError } = await supabaseAdmin
            .from('clientes_empresa')
            .upsert({
                empresa_id: empresaId,
                cliente_global_id: globalClient.id,
                nome: nome,
                status: 'ativo',
                notas: notas || undefined,
                google_contact_id: googleContactId || undefined
            }, { onConflict: 'empresa_id,cliente_global_id' })
            .select()
            .single();

        if (linkError) {
            console.error("[handle-client-registration] Error in clientes_empresa upsert:", linkError);
            throw linkError;
        }

        // 4. Trigger Password Definition Email if new user and email present
        if (isNewUser && resendKey && normalizedEmail) {
            const resend = new Resend(resendKey);

            // Generate a recovery link (safe way to set a first password)
            const { data: linkData, error: linkGenError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email: normalizedEmail,
                options: { redirectTo: `${appUrl}/reset-password` }
            });

            if (linkGenError) {
                console.warn("[handle-client-registration] Could not generate recovery link:", linkGenError);
            } else {
                const activationLink = linkData.properties.action_link;
                const { data: empresa } = await supabaseAdmin.from('empresas').select('nome').eq('id', empresaId).single();

                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: sans-serif; padding: 40px 20px; color: #374151;">
                        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                            <div style="background: #2563eb; padding: 32px; text-align: center; color: white;">
                                <h1 style="margin: 0;">Bem-vindo ao PrimeBooking</h1>
                            </div>
                            <div style="padding: 32px;">
                                <p>Olá, <strong>${nome}</strong>!</p>
                                <p>Seu agendamento em <strong>${empresa?.nome || 'nosso parceiro'}</strong> foi realizado com sucesso.</p>
                                <p>Para sua comodidade, criamos uma conta global no PrimeBooking para que você possa gerenciar seus agendamentos em um só lugar no futuro.</p>
                                <p><strong>A criação de senha é opcional</strong>, mas recomendada para que você possa acompanhar seus horários.</p>
                                
                                <div style="text-align: center; margin: 40px 0;">
                                    <a href="${activationLink}" style="background: #2563eb; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Definir Minha Senha</a>
                                </div>
                            </div>
                            <div style="background: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                                © 2026 PrimeBooking. A plataforma inteligente de agendamentos.
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                console.log(`[handle-client-registration] Sending activation email to ${normalizedEmail}`);
                await sendEmailWithRetry(resend, {
                    from: '"PrimeBooking" <notificacoes@notifications.appsbuilding.com>',
                    to: [normalizedEmail],
                    subject: "Ative sua conta no PrimeBooking 🚀",
                    html: emailHtml
                });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            id: link.id,
            clientId: link.id, // Keep for legacy compatibility during transition
            globalClientId: globalClient.id,
            isNewUser
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });


    } catch (error: any) {
        console.error("[handle-client-registration] Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
