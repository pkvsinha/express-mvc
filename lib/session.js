const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);

// Configure the session and session storage.
const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.SECRET || 'secret',
  signed: true,
  prefix: 'sess'
};

// In production use the App Engine Memcache instance to store session data,
// otherwise fallback to the default MemoryStore in development.
// && process.env.MEMCACHE_URL) {
// TODO: host and port to be abstracted

if (process.env.NODE_ENV === 'production') {
  const RedisClient = redis.createClient();
  sessionConfig.store = new RedisStore({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    client: RedisClient
  });
}

exports.enable = function (app) {
  app.use(session(sessionConfig));
};
