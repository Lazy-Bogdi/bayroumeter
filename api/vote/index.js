// /api/vote/index.js
const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.CosmosDB);
const users = client.database("bayrou").container("users");

module.exports = async function (context, req) {
    const body = req.body || {};
    const { userId, choice } = body; // "Oui" | "Non"

    if (!userId || !["Oui", "Non"].includes(choice)) {
        return { status: 400, body: { error: "userId and choice (Oui|Non) are required" } };
    }

    // 1) Vérifier que l'utilisateur existe
    try {
        const { resource: existing } = await users.item(userId, userId).read();
        if (!existing) {
            return { status: 403, body: { error: "User not registered" } };
        }
    } catch (e) {
        if (e.code === 404) {
            return { status: 403, body: { error: "User not registered" } };
        }
        context.log.error("Read user error:", e);
        return { status: 500, body: { error: "DB read error" } };
    }

    // 2) Enregistrer le vote (id = userId -> 1 vote par user)
    const vote = { id: userId, userId, choice, ts: new Date().toISOString() };
    context.bindings.doc = vote;
    return { status: 201, body: vote };
};
