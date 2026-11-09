/** Shared by Vite and the service-worker builder; HTTPS hosting is path-based. */
export const basePath = process.env.VITE_BASE_PATH || "/";
if (!/^\/(?:[a-zA-Z0-9_~-][a-zA-Z0-9_.~-]*\/)*$/.test(basePath)) {
  throw new Error(
    "VITE_BASE_PATH must be an absolute path with a trailing slash, e.g. /tinytodo/",
  );
}
