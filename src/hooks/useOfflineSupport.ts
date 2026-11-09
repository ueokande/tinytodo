import { useEffect } from "react";
export function useOfflineSupport(notify: (message: string) => void) {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    let active = true;
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {
        if (active)
          notify(
            "Offline setup failed. Reload while connected to the internet.",
          );
      });
    return () => {
      active = false;
    };
  }, [notify]);
}
