import twilio from "twilio";
const { Twilio, validateRequest } = twilio as any;

/**
 * Sends a WhatsApp message using Twilio API.
 * Primarily uses Content Templates (contentSid) for WhatsApp Business compliance.
 */
export const sendWhatsappMessage = async (
    to: string,
    content: { body?: string; templateSid?: string; templateVariables?: Record<string, string> }
) => {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
        console.error("[Twilio] Missing credentials");
        return { success: false, error: "Missing Twilio credentials" };
    }

    const client = new Twilio(accountSid, authToken);
    const fromWhatsApp = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    try {
        let message;

        if (content.templateSid) {
            console.log(`[Twilio] Sending Template (${content.templateSid}) to ${toWhatsApp}`);
            message = await client.messages.create({
                from: fromWhatsApp,
                to: toWhatsApp,
                contentSid: content.templateSid,
                contentVariables: JSON.stringify(content.templateVariables || {}),
            });
        } else if (content.body) {
            console.log(`[Twilio] Sending Text to ${toWhatsApp}`);
            message = await client.messages.create({
                from: fromWhatsApp,
                to: toWhatsApp,
                body: content.body,
            });
        } else {
            return { success: false, error: "No body or templateSid provided" };
        }

        console.log("[Twilio] Message sent SID:", message.sid);
        return { success: true, sid: message.sid, status: message.status };
    } catch (error: any) {
        console.error("[Twilio] Error sending message:", error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Validates that a request came from Twilio.
 */
export const validateTwilioWebhook = async (req: Request): Promise<boolean> => {
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!authToken) return false;

    const signature = req.headers.get("x-twilio-signature");
    if (!signature) return false;

    // To validate, we need the full URL and the form-encoded body
    const url = req.url;
    const formData = await req.formData();
    const params = Object.fromEntries(formData.entries()) as Record<string, string>;

    return validateRequest(authToken, signature, url, params);
};
