export default {
	async fetch(request, env) {
		try {
			const url = new URL(request.url);
			const rawPath = url.searchParams.get("path");
			if (!rawPath) {
				return new Response("Missing file path", { status: 400 });
			}
			const filePath = decodeURIComponent(rawPath);
			const tgUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${filePath}`;
			const response = await fetch(tgUrl);
			if (!response.ok) {
				return new Response("Telegram chunk fetch failed", { status: 500 });
			}
			return new Response(response.body, {
				headers: {
					"Content-Type": "application/octet-stream",
					"Access-Control-Allow-Origin": "*",
				},
			});
		} catch (err) {
			return new Response("Cloudflare Download - Worker error", { status: 500 });
		}
	}
};
