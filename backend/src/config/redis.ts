import Redis from 'ioredis';

let redis: Redis;

export async function connectRedis(): Promise<void> {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on('connect', () => console.log('✅ Redis connected'));
  redis.on('error', (err: Error) => console.error('❌ Redis error:', err));

  await redis.ping();
}

export function getRedis(): Redis {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
}

// Helpers
export const setOnlineStatus = async (userId: string, status: boolean) => {
  const key = `user:online:${userId}`;
  if (status) {
    await redis.set(key, '1', 'EX', 300); // 5 min TTL
  } else {
    await redis.del(key);
    await redis.set(`user:lastseen:${userId}`, Date.now().toString());
  }
};

export const getOnlineStatus = async (userId: string): Promise<boolean> => {
  const val = await redis.get(`user:online:${userId}`);
  return val === '1';
};

export const getLastSeen = async (userId: string): Promise<number | null> => {
  const val = await redis.get(`user:lastseen:${userId}`);
  return val ? parseInt(val) : null;
};

export const setTyping = async (chatId: string, userId: string, isTyping: boolean) => {
  const key = `typing:${chatId}:${userId}`;
  if (isTyping) {
    await redis.set(key, '1', 'EX', 5); // 5 sec TTL
  } else {
    await redis.del(key);
  }
};

export const storeOTP = async (identifier: string, otp: string) => {
  await redis.set(`otp:${identifier}`, otp, 'EX', 600); // 10 min
};

export const verifyOTP = async (identifier: string, otp: string): Promise<boolean> => {
  const stored = await redis.get(`otp:${identifier}`);
  if (stored === otp) {
    await redis.del(`otp:${identifier}`);
    return true;
  }
  return false;
};

export const storeRefreshToken = async (userId: string, token: string) => {
  await redis.set(`refresh:${userId}`, token, 'EX', 7 * 24 * 3600);
};

export const getRefreshToken = async (userId: string): Promise<string | null> => {
  return redis.get(`refresh:${userId}`);
};

export const deleteRefreshToken = async (userId: string) => {
  await redis.del(`refresh:${userId}`);
};
