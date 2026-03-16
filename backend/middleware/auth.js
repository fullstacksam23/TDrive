import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function authenticate(req, res, next) {

    const headerToken = req.headers.authorization?.replace("Bearer ", "");
    const queryToken = req.query.token;

    const token = headerToken || queryToken;
    if (!token) {
        return res.status(401).json({ error: "Missing token" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({ error: "Invalid token" });
    }

    req.user = data.user;

    next();
}