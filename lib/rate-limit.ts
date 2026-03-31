import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Returns null when Upstash env vars are not set so callers can skip limiting gracefully.
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

// Singletons — created once, reused across requests in the same instance.
let _loginLimiter: Ratelimit | null = null
let _registerLimiter: Ratelimit | null = null

// 5 attempts per IP per 15-minute sliding window.
export function getLoginLimiter(): Ratelimit | null {
  if (_loginLimiter) return _loginLimiter
  const redis = getRedis()
  if (!redis) return null
  _loginLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "rl:login",
  })
  return _loginLimiter
}

// 3 registrations per IP per hour.
export function getRegisterLimiter(): Ratelimit | null {
  if (_registerLimiter) return _registerLimiter
  const redis = getRedis()
  if (!redis) return null
  _registerLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "rl:register",
  })
  return _registerLimiter
}
