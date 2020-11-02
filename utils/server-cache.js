const NodeCache = require("node-cache");
const cacheStore = new NodeCache({ stdTTL: 0, checkperiod: 600 });
// 86400 - day


exports.get = (key) => {
    return cacheStore.get(key)
};
exports.set = (key, value, ttl) => {
    cacheStore.set(key, value, ttl || 86400);
}

