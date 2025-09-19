// api/__tests__/user.test.js
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
const handler = require('../user'); // /api/user/index.js  :contentReference[oaicite:0]{index=0}

const createCtx = () => ({ log: { error: jest.fn() }, bindings: {} });

describe('user function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('400 si champs manquants', async () => {
        const ctx = createCtx();
        const res = await handler(ctx, { body: { pseudo: 'p' } });
        expect(res.status).toBe(400);
    });

    test('200 si user existe déjà', async () => {
        const users = {
            item: () => ({
                read: async () => ({ resource: { id: 'a@b.c', email: 'a@b.c', pseudo: 'A' } }),
            }),
        };
        CosmosClient.__setContainer('users', users);

        const ctx = createCtx();
        const res = await handler(ctx, { body: { pseudo: 'A', email: 'a@b.c' } });
        expect(res.status).toBe(200);
        expect(res.body.exists).toBe(true);
    });

    test('201 si création ok', async () => {
        const users = {
            item: () => ({
                read: async () => { const e = new Error('not found'); e.code = 404; throw e; },
            }),
        };
        CosmosClient.__setContainer('users', users);

        const ctx = createCtx();
        const res = await handler(ctx, { body: { pseudo: 'A', email: 'a@b.c' } });
        expect(res.status).toBe(201);
        expect(ctx.bindings.doc).toMatchObject({ id: 'a@b.c', email: 'a@b.c', pseudo: 'A' });
    });
});
