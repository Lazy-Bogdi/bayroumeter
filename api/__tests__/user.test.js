// api/__tests__/user.test.js
const loadHandler = (stubs = {}) => {
    jest.resetModules();

    // Mock inline d'@azure/cosmos
    jest.doMock('@azure/cosmos', () => {
        const containers = new Map(Object.entries(stubs));
        return {
            CosmosClient: function () {
                return {
                    database: () => ({
                        container: (name) => containers.get(name),
                    }),
                };
            },
        };
    });

    // Mock inline de ../telemetry (pas de side effects)
    jest.doMock('../telemetry', () => ({
        ai: { trackEvent: jest.fn(), trackMetric: jest.fn(), flush: jest.fn() },
        hashId: jest.fn(() => 'hash'),
    }));

    let handler;
    jest.isolateModules(() => {
        handler = require('../user/index.js');
    });
    return handler;
};

const ctx = () => ({ log: { error: jest.fn() }, bindings: {} });

describe('user function', () => {
    test('400 si champs manquants', async () => {
        const handler = loadHandler();
        const res = await handler(ctx(), { body: { pseudo: 'p' } });
        expect(res.status).toBe(400);
    });

    test('200 si user existe déjà', async () => {
        const handler = loadHandler({
            users: {
                item: () => ({
                    read: async () => ({ resource: { id: 'a@b.c', email: 'a@b.c', pseudo: 'A' } }),
                }),
            },
        });
        const res = await handler(ctx(), { body: { pseudo: 'A', email: 'a@b.c' } });
        expect(res.status).toBe(200);
        expect(res.body.exists).toBe(true);
    });

    test('201 si création ok (read => 404)', async () => {
        const handler = loadHandler({
            users: {
                item: () => ({
                    read: async () => {
                        const e = new Error('not found');
                        e.code = 404;
                        throw e;
                    },
                }),
            },
        });
        const c = ctx();
        const res = await handler(c, { body: { pseudo: 'A', email: 'a@b.c' } });
        expect(res.status).toBe(201);
        expect(c.bindings.doc).toMatchObject({ id: 'a@b.c', email: 'a@b.c', pseudo: 'A' });
    });

    test('500 si read error != 404', async () => {
        const handler = loadHandler({
            users: {
                item: () => ({
                    read: async () => {
                        const e = new Error('boom');
                        e.code = 500;
                        throw e;
                    },
                }),
            },
        });
        const res = await handler(ctx(), { body: { pseudo: 'A', email: 'a@b.c' } });
        expect(res.status).toBe(500);
    });
});
