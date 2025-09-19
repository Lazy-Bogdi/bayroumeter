const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.CosmosDB);
const container = client.database("bayrou").container("votes");
const { ai, hashId } = require("../telemetry");

module.exports = async function (context, req) {
    const query = { query: "SELECT c.userId, c.choice, c.ts FROM c" };
    const { resources } = await container.items.query(query).fetchAll();
    ai?.trackMetric({ name: "votes_list_count", value: resources.length });
    ai?.flush();
    return { status: 200, body: resources };
};
