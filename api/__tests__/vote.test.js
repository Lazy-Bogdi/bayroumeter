// api/__tests__/vote.test.js
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
const handler = require('../vote'); // /api/vote/index.js  :contentReference[oaicite:1]{index=1}

const createCtx = () => ({ log: { error: jest.fn() }, bindings: {} });

describe('vote function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('400 si payload invalide', async () => {
        const ctx = createCtx();
        const res = await handler(ctx, { body: { userId: 'a@b.c', choice: 'MAYBE' } });
        expect(res.status).toBe(400);
    });

    test('403 si user inexistant', async () => {
        const users = {
            item: () => ({
                read: async () => { const e = new Error('not found'); e.code = 404; throw e; },
            }),
        };
        CosmosClient.__setContainer('users', users);

        const ctx = createCtx();
        const res = await handler(ctx, { body: { userId: 'x@y.z', choice: 'Oui' } });
        expect(res.status).toBe(403);
    });

    test('201 si vote créé', async () => {
        const users = {
            item: () => ({
                read: async () => ({ resource: { id: 'a@b.c' } }),
            }),
        };
        CosmosClient.__setContainer('users', users);

        const ctx = createCtx();
        const res = await handler(ctx, { body: { userId: 'a@b.c', choice: 'Non' } });
        expect(res.status).toBe(201);
        expect(ctx.bindings.doc).toMatchObject({ id: 'a@b.c', userId: 'a@b.c', choice: 'Non' });
    });
});
