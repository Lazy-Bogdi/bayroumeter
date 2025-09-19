// api/__tests__/vote.test.js
const loadHandler = (stubs = {}) => {
    jest.resetModules();

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

    jest.doMock('../telemetry', () => ({
        ai: { trackEvent: jest.fn(), trackMetric: jest.fn(), flush: jest.fn() },
        hashId: jest.fn(() => 'hash'),
    }));

    let handler;
    jest.isolateModules(() => {
        handler = require('../vote/index.js');
    });
    return handler;
};

const ctx = () => ({ log: { error: jest.fn() }, bindings: {} });

describe('vote function', () => {
    test('400 si payload invalide', async () => {
        const handler = loadHandler();
        const res = await handler(ctx(), { body: { userId: 'a@b.c', choice: 'MAYBE' } });
        expect(res.status).toBe(400);
    });

    test('403 si user inexistant (404)', async () => {
        const handler = loadHandler({
            users: {
                item: () => ({
                    read: async () => {
                        const e = new Error('nf');
                        e.code = 404;
                        throw e;
                    },
                }),
            },
        });
        const res = await handler(ctx(), { body: { userId: 'x@y.z', choice: 'Oui' } });
        expect(res.status).toBe(403);
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
        const res = await handler(ctx(), { body: { userId: 'x@y.z', choice: 'Oui' } });
        expect(res.status).toBe(500);
    });

    test('201 si vote créé', async () => {
        const handler = loadHandler({
            users: {
                item: () => ({
                    read: async () => ({ resource: { id: 'a@b.c' } }),
                }),
            },
        });
        const c = ctx();
        const res = await handler(c, { body: { userId: 'a@b.c', choice: 'Non' } });
        expect(res.status).toBe(201);
        expect(c.bindings.doc).toMatchObject({ id: 'a@b.c', userId: 'a@b.c', choice: 'Non' });
    });
});
