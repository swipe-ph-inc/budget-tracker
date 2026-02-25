export function safeRedirect(origin: string, path: string): string | URL {
    const base = origin;
    const pathTrimmed = path.startsWith('/') ? path : `/${path}`;
    const full = `${base}${pathTrimmed}`;
    if (full.startsWith(origin)) return full;
    return `${origin}/dashboard`;
}