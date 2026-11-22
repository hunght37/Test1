const buckets = new Map<string, number[]>();

/**
 * Sliding-window rate limiter gọn nhẹ trong bộ nhớ.
 * Trả về true nếu hợp lệ, false nếu vượt giới hạn.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const timestamps = buckets.get(key) ?? [];
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= maxRequests) {
    buckets.set(key, valid);
    return false;
  }

  valid.push(now);
  buckets.set(key, valid);
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}
