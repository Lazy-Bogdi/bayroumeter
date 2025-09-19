// /api/user/index.js
const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.CosmosDB);
const users = client.database("bayrou").container("users");
const { ai, hashId } = require("../telemetry");

module.exports = async function (context, req) {
    const body = req.body || {};
    const { pseudo, email } = body;

    if (!pseudo || !email) {
        ai?.trackEvent({ name: "user_signup", properties: { status: "bad_request" } });
        ai?.flush();
        return { status: 400, body: { error: "pseudo and email are required" } };
    }

    // 1) vérifier si user existe déjà
    try {
        const { resource: existing } = await users.item(email, email).read();
        if (existing) {
            ai?.trackEvent({
                name: "user_signup",
                properties: { status: "exists", userIdHash: hashId(email) }
            });
            ai?.flush();
            return {
                status: 200,
                body: { exists: true, message: "User already exists", user: existing }
            };
        }
    } catch (e) {
        // 404 attendu si non trouvé -> on continue pour créer
        if (e.code && e.code !== 404) {
            context.log.error("Read user error:", e);
            ai?.trackEvent({
                name: "user_signup",
                properties: { status: "db_read_error" }
            });
            ai?.flush();
            return { status: 500, body: { error: "DB read error" } };
        }
    }

    // 2) créer l'utilisateur via binding de sortie (ne pas set si déjà existait)
    const user = { id: email, email, pseudo, createdAt: new Date().toISOString() };
    context.bindings.doc = user;
    ai?.trackEvent({
        name: "user_signup",
        properties: { status: "created", userIdHash: hashId(email) }
    });
    ai?.flush();

    return { status: 201, body: user };
};
