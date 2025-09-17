const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.CosmosDB);
const container = client.database("bayrou").container("votes");

module.exports = async function (context, req) {
    const query = { query: "SELECT c.userId, c.choice, c.ts FROM c" };
    const { resources } = await container.items.query(query).fetchAll();
    return { status: 200, body: resources };
};
