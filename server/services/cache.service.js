const { createClient } = require('redis');

let redisClient = null;
let isRedisAvailable = false;

// Resilient In-Memory Fallback Cache to ensure caching/invalidation works even when Redis is offline
const localCache = new Map();

async function connectRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            console.warn('[CacheService] Redis reconnection limit reached. Falling back to local cache.');
            isRedisAvailable = false;
            return false; // stop reconnecting
          }
          return 1000; // wait 1s before reconnecting
        }
      }
    });

    redisClient.on('error', (err) => {
      console.warn('[CacheService] Redis connection error or offline. Falling back to local cache.');
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('Redis Connected');
    });

    await redisClient.connect();
  } catch (err) {
    console.warn('[CacheService] Could not initialize Redis client, falling back to local cache:', err.message);
    isRedisAvailable = false;
  }
}

async function get(key) {
  // Try Redis first
  if (isRedisAvailable && redisClient) {
    try {
      const val = await redisClient.get(key);
      if (val !== null) {
        console.log('Cache Hit');
        return JSON.parse(val);
      }
    } catch (err) {
      console.warn('[CacheService] Redis get error:', err.message);
    }
  }

  // Fallback to local in-memory cache
  const entry = localCache.get(key);
  if (entry) {
    if (entry.expiry > Date.now()) {
      console.log('Cache Hit');
      return entry.value;
    } else {
      localCache.delete(key);
    }
  }

  console.log('Cache Miss');
  return null;
}

async function set(key, value, ttlSeconds = 300) {
  // Store in local cache always as secondary/primary backup
  localCache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });

  // Store in Redis if available
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds
      });
    } catch (err) {
      console.warn('[CacheService] Redis set error:', err.message);
    }
  }
}

async function del(key) {
  localCache.delete(key);

  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn('[CacheService] Redis del error:', err.message);
    }
  }
}

async function keys(pattern) {
  const matching = [];
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  
  // Local cache keys
  for (const k of localCache.keys()) {
    if (regex.test(k)) {
      matching.push(k);
    }
  }

  // Redis keys if available
  if (isRedisAvailable && redisClient) {
    try {
      const redisKeys = await redisClient.keys(pattern);
      for (const rk of redisKeys) {
        if (!matching.includes(rk)) {
          matching.push(rk);
        }
      }
    } catch (err) {
      console.warn('[CacheService] Redis keys error:', err.message);
    }
  }

  return matching;
}

async function invalidatePattern(pattern) {
  try {
    const matchKeys = await keys(pattern);
    for (const key of matchKeys) {
      await del(key);
      console.log(`[CacheService] Invalidated cache key: ${key}`);
    }
  } catch (err) {
    console.warn('[CacheService] Invalidate error:', err.message);
  }
}

module.exports = {
  connectRedis,
  get,
  set,
  del,
  invalidatePattern,
  isAvailable: () => isRedisAvailable
};
