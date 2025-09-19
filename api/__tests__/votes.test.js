// api/__tests__/votes.test.js
jest.mock('@azure/cosmos', () => {
    const containerStubs = {};
    const mockClient = {
        database: () => ({
            container: (name) => containerStubs[name],
        }),
    };
    const CosmosClient = function () { return mockClient; };
    CosmosClient.__setContainer = (name, stub) => { containerStubs[name] = stub; };
    return { CosmosClient };
});

jest.mock('../telemetry', () => ({
    ai: { trackEvent: jest.fn(), trackMetric: jest.fn(), flush: jest.fn() },
    hashId: jest.fn(() => 'hash'),
}));

const { CosmosClient } = require('@azure/cosmos');
const handler = require('../votes'); // /api/votes/index.js  :contentReference[oaicite:2]{index=2}

const createCtx = () => ({ log: { error: jest.fn() }, bindings: {} });

describe('votes function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('200 + liste', async () => {
        const votes = {
            items: {
                query: () => ({
                    fetchAll: async () => ({
                        resources: [
                            { userId: 'a@b.c', choice: 'Oui', ts: '2025-09-17T00:00:00Z' },
                            { userId: 'x@y.z', choice: 'Non', ts: '2025-09-17T00:01:00Z' },
                        ],
                    }),
                }),
            },
        };
        CosmosClient.__setContainer('votes', votes);

        const ctx = createCtx();
        const res = await handler(ctx, { method: 'GET' });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });
});
