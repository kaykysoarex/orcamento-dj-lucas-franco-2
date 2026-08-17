/**
 * Generates asset paths that work with GitHub Pages base URL
 * Uses import.meta.env.BASE_URL from Vite
 */
export function assetPath(path) {
  const base = import.meta.env?.BASE_URL || "/";
  return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
}
