import { lazy, ComponentType } from "react";

/**
 * Wraps dynamic imports in a retry handler that automatically reloads the page
 * once if a chunk fails to load (e.g. after a new deployment on Vercel where
 * asset file hashes change and old chunk URLs return 404).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("page_has_been_force_refreshed") || "false"
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem("page_has_been_force_refreshed", "false");
      return component;
    } catch (error: any) {
      console.warn("Chunk loading error caught in lazyWithRetry:", error);
      if (!pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem("page_has_been_force_refreshed", "true");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
