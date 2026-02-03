export async function sendEmailWithRetry(resend: any, payload: any, maxRetries = 3) {
    let attempt = 0;
    let delay = 1000; // Start with 1 second

    while (attempt <= maxRetries) {
        try {
            const result = await resend.emails.send(payload);

            // If result has an error and it's a 429
            if (result.error && (result.error.statusCode === 429 || result.error.name === 'RateLimitExceededError' || result.error.message?.includes('rate limit'))) {
                throw result.error;
            }

            return result;
        } catch (error: any) {
            const isRateLimit = error.statusCode === 429 ||
                error.name === 'RateLimitExceededError' ||
                error.message?.includes('rate limit');

            if (isRateLimit && attempt < maxRetries) {
                console.warn(`[Resend] Rate limit hit. Retrying attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
                delay *= 2; // Exponential backoff
                continue;
            }

            // If not a rate limit or we've exhausted retries, return the error
            console.error(`[Resend] Failed to send email after ${attempt} retries:`, error);
            return { data: null, error };
        }
    }
}

/**
 * Sends a batch of emails with retry logic for the whole batch.
 * Note: Resend's Batch API allows up to 100 emails in one request.
 */
export async function sendBatchWithRetry(resend: any, emails: any[], maxRetries = 3) {
    let attempt = 0;
    let delay = 1000;

    while (attempt <= maxRetries) {
        try {
            const result = await resend.batch.send(emails);

            if (result.error && (result.error.statusCode === 429 || result.error.message?.includes('rate limit'))) {
                throw result.error;
            }

            return result;
        } catch (error: any) {
            if (attempt < maxRetries) {
                console.warn(`[Resend Batch] Rate limit hit. Retrying attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
                delay *= 2;
                continue;
            }
            return { data: null, error };
        }
    }
}
