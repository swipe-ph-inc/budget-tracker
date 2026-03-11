/**
 * Returns an absolute URL on the same origin as `origin`.
 * Rejects external redirects, absolute URLs, and protocol-relative paths.
 * Falls back to `${origin}/dashboard` if the path is unsafe.
 */
export function safeRedirect(origin: string, path: string): URL {
  try {
    // Only allow plain relative paths (must start with '/' and not '//')
    const trimmed = path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard"

    const resolved = new URL(trimmed, origin)

    // Ensure the resolved URL stays on the same origin
    if (resolved.origin !== new URL(origin).origin) {
      return new URL("/dashboard", origin)
    }

    return resolved
  } catch {
    return new URL("/dashboard", origin)
  }
}
