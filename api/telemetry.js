// api/telemetry.js
const appInsights = require('applicationinsights');

if (!appInsights.defaultClient) {
    const cs = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (cs) {
        appInsights.setup(cs)
            .setAutoCollectRequests(true)
            .setAutoCollectPerformance(true)
            .setAutoCollectExceptions(true)
            .setAutoCollectDependencies(true)
            .setSendLiveMetrics(true)
            .start();
    }
}

const crypto = require('crypto');
function hashId(id) {
    return crypto.createHash('sha256').update(id || '').digest('hex');
}

module.exports = {
    ai: appInsights.defaultClient,
    hashId
};
