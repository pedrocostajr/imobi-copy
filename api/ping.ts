import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    return response.status(200).json({ status: "ok", version: "v7.3", timestamp: new Date().toISOString() });
}
