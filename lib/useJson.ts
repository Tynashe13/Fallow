"use client";

import { useEffect, useState } from "react";

export interface Loadable<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useJson<T = any>(url: string | null): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({
    data: null,
    error: null,
    loading: Boolean(url),
  });

  useEffect(() => {
    if (!url) return;
    let alive = true;
    setState({ data: null, error: null, loading: true });
    fetch(url)
      .then(async (res) => {
        const json = await res.json();
        if (!alive) return;
        if (!res.ok || json?.error) {
          setState({ data: null, error: json?.error ?? `HTTP ${res.status}`, loading: false });
        } else {
          setState({ data: json, error: null, loading: false });
        }
      })
      .catch((e) => {
        if (alive) setState({ data: null, error: String(e), loading: false });
      });
    return () => {
      alive = false;
    };
  }, [url]);

  return state;
}
