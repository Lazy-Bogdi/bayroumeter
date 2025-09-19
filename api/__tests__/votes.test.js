// api/__tests__/votes.test.js
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
        handler = require('../votes/index.js');
    });
    return handler;
};

const ctx = () => ({ log: { error: jest.fn() }, bindings: {} });

describe('votes function', () => {
    test('200 + liste', async () => {
        const handler = loadHandler({
            votes: {
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
            },
        });
        const res = await handler(ctx(), { method: 'GET' });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });
});
