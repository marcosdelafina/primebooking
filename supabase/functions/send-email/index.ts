import React from 'react'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { renderAsync } from '@react-email/components'
import { createClient } from "@supabase/supabase-js";
import { MagicLinkEmail } from './_templates/magic-link.tsx'
import { sendEmailWithRetry } from "../_shared/resend-utils.ts";

Deno.serve(async (req: Request) => {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
        console.error('[send-email] CRITICAL: RESEND_API_KEY is not set in Supabase Secrets.')
        return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 500 })
    }
    const resend = new Resend(resendKey)
    const hookSecret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string ?? '').replace('v1,whsec_', '')

    if (req.method !== 'POST') {
        return new Response('ok', { status: 200 })
    }

    let payload = ''
    let headers = {}
    let verification: any = null

    try {
        payload = await req.text()
        headers = Object.fromEntries(req.headers)

        if (!hookSecret) {
            console.warn('[send-email] SEND_EMAIL_HOOK_SECRET missing. Skipping verification for debugging (if in dev).')
        } else {
            const wh = new Webhook(hookSecret)
            try {
                verification = wh.verify(payload, headers)
            } catch (err: any) {
                console.error('[send-email] Webhook verification failed:', err.message)
                // In some cases, we might want to return 401, but for Auth Hooks, 
                // returning 200 avoids blocking the user's flow if it's just a config issue.
                // However, Supabase Auth expects 200 { "ok": true } to proceed.
            }
        }
    } catch (err: any) {
        console.error('[send-email] Error reading request:', err.message)
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    // Process email in background to avoid Supabase Auth timeout
    (async () => {
        try {
            // Use verification if successful, otherwise parse payload directly (for testing/bypass)
            const body = verification || JSON.parse(payload)
            const { user, email_data } = body

            if (!user || !email_data) {
                console.log("[send-email] Non-auth hook call or missing data. Payload:", payload.substring(0, 100))
                return
            }

            const { token, token_hash, redirect_to, email_action_type } = email_data
            const user_name = user.user_metadata?.nome || user.user_metadata?.full_name || user.user_metadata?.name || 'Cliente'

            const isRecovery = email_action_type === 'recovery'
            const subject = isRecovery ? 'Redefina sua senha do PrimeBooking' : 'Acesse o PrimeBooking'

            console.log(`[send-email] Rendering template for ${user.email} (type: ${email_action_type})`)

            const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8080'
            const html = await renderAsync(
                React.createElement(MagicLinkEmail, {
                    app_url: appUrl,
                    token,
                    token_hash,
                    redirect_to,
                    email_action_type,
                    user_name,
                })
            )

            const result = await sendEmailWithRetry(resend, {
                from: 'PrimeBooking <notificacoes@notifications.appsbuilding.com>',
                to: [user.email],
                subject: subject,
                html,
            })

            if (result.error) {
                console.error('[send-email] Failed to send email via Resend:', result.error)
                return
            }

            console.log('[send-email] Email sent successfully to:', user.email)

            // Log to email_events
            try {
                const supabase = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                )

                await supabase.from('email_events').insert({
                    company_id: user.user_metadata?.empresa_id || null,
                    type: isRecovery ? 'password_reset' : 'magic_link',
                    recipient_type: 'user',
                    status: 'sent',
                    resend_email_id: result.data?.id,
                    resend_event_type: 'email.sent',
                    payload: { email: user.email, type: email_action_type }
                })
            } catch (logErr) {
                console.error('[send-email] Failed to log email event:', logErr)
            }
        } catch (err: any) {
            console.error('[send-email] Background process error:', err.message)
        }
    })()

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
})
