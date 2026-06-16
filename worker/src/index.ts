import { verifyTelegramWebAppData } from './utils';

export interface Env {
	TELEGRAM_BOT_TOKEN: string;
	FIREBASE_PROJECT_ID: string;
	FIREBASE_PRIVATE_KEY: string;
	FIREBASE_CLIENT_EMAIL: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
		}

		try {
			const body = await request.json() as any;
			const { initData, startParam, telegramId, username, firstName } = body;

			// 1. Verify Telegram InitData Hash using TELEGRAM_BOT_TOKEN
			if (!verifyTelegramWebAppData(initData, env.TELEGRAM_BOT_TOKEN)) {
				return new Response(JSON.stringify({ error: 'Invalid InitData' }), { status: 401 });
			}

			// 2. Validate referral link pattern
			if (!startParam || !startParam.startsWith('ref_')) {
				return new Response(JSON.stringify({ error: 'Invalid referral' }), { status: 400 });
			}

			const referrerId = startParam.replace('ref_', '');

			if (referrerId === telegramId.toString()) {
				return new Response(JSON.stringify({ error: 'Self referral not allowed' }), { status: 400 });
			}

			// 3. Obtain OAuth 2.0 Token for Google Cloud (Firestore) using Service Account
			// We generate JWT using the environment variables
			const firestoreToken = await getFirestoreToken(env.FIREBASE_CLIENT_EMAIL, env.FIREBASE_PRIVATE_KEY);
			const projectId = env.FIREBASE_PROJECT_ID;

			// 4. Perform Firestore "runTransaction" REST API Call securely
			const txResponse = await runReferralTransaction(projectId, firestoreToken, referrerId, telegramId, username, firstName);

			if (txResponse.success) {
				return new Response(JSON.stringify({ success: true, message: 'Referral processed' }), { headers: { 'Content-Type': 'application/json' } });
			} else {
				return new Response(JSON.stringify({ error: txResponse.error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
			}
		} catch (error: any) {
			return new Response(JSON.stringify({ error: error.message }), { status: 500 });
		}
	},
};

// ... Helper functions for JWT generation and Firestore REST API
async function getFirestoreToken(clientEmail: string, privateKey: string) {
	// Example implementation of JWT signing for Cloudflare Workers
	// (Placeholder for actual crypto.subtle JWT implementation for GCP Service Accounts)
	return "mock_token";
}

async function runReferralTransaction(projectId: string, token: string, referrerId: string, telegramId: string, username: string, firstName: string) {
	// 1. BeginTransaction
	// 2. Get referrer and referred user docs
	// 3. Commit logic
	return { success: true };
}
