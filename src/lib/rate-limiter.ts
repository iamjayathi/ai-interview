interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

interface RateLimitConfig {
  maxTokens: number;
  refillRate: number;
  cost: number;
}

const CONFIGS: Record<string, RateLimitConfig> = {
  question:  { maxTokens: 20, refillRate: 0.5, cost: 1 },
  evaluate:  { maxTokens: 20, refillRate: 0.5, cost: 1 },
  transcribe: { maxTokens: 10, refillRate: 0.2, cost: 1 },
  execute:   { maxTokens: 30, refillRate: 1,   cost: 1 },
};

function refill(bucket: Bucket, config: RateLimitConfig): Bucket {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  const added = elapsed * config.refillRate;
  return {
    tokens: Math.min(config.maxTokens, bucket.tokens + added),
    lastRefill: now,
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export function checkRateLimit(key: string, endpoint: string): RateLimitResult {
  const config = CONFIGS[endpoint] ?? CONFIGS.question;
  const bucketKey = `${endpoint}:${key}`;

  let bucket = buckets.get(bucketKey) ?? { tokens: config.maxTokens, lastRefill: Date.now() };
  bucket = refill(bucket, config);

  if (bucket.tokens >= config.cost) {
    bucket.tokens -= config.cost;
    buckets.set(bucketKey, bucket);
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetInSeconds: 0,
    };
  }

  const needed = config.cost - bucket.tokens;
  const resetInSeconds = Math.ceil(needed / config.refillRate);
  buckets.set(bucketKey, bucket);

  return {
    allowed: false,
    remaining: 0,
    resetInSeconds,
  };
}

export function getClientKey(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
