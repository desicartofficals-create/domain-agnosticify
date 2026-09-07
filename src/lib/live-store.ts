import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * A tiny shared cache: every component that reads the same key gets the same
 * data from memory (instant render, no duplicate network calls) and a single
 * realtime channel keeps it fresh for all of them.
 */
type Store<T> = {
  data: T;
  loaded: boolean;
  listeners: Set<(v: T) => void>;
  fetching: Promise<void> | null;
  refs: number;
  cleanup: (() => void) | null;
};

const stores = new Map<string, Store<unknown>>();

export function createLiveStore<T>(key: string, table: string, fetcher: () => Promise<T>, initial: T) {
  function get(): Store<T> {
    let s = stores.get(key) as Store<T> | undefined;
    if (!s) {
      s = { data: initial, loaded: false, listeners: new Set(), fetching: null, refs: 0, cleanup: null };
      stores.set(key, s as Store<unknown>);
    }
    return s;
  }

  function load() {
    const s = get();
    if (s.fetching) return s.fetching;
    s.fetching = fetcher()
      .then((d) => {
        s.data = d;
        s.loaded = true;
        s.listeners.forEach((l) => l(d));
      })
      .catch((e) => console.error(`[${key}] load failed`, e))
      .finally(() => {
        s.fetching = null;
      });
    return s.fetching;
  }

  function useStore(): { data: T; loading: boolean } {
    const s = get();
    const [data, setData] = useState<T>(s.data);
    const [loading, setLoading] = useState(!s.loaded);

    useEffect(() => {
      const store = get();
      const listener = (v: T) => {
        setData(v);
        setLoading(false);
      };
      store.listeners.add(listener);
      store.refs += 1;

      if (store.loaded) listener(store.data);
      else load();

      if (!store.cleanup) {
        const ch = supabase
          .channel(`${key}-${Math.random().toString(36).slice(2)}`)
          .on("postgres_changes", { event: "*", schema: "public", table }, () => load())
          .subscribe();
        store.cleanup = () => supabase.removeChannel(ch);
      }

      return () => {
        store.listeners.delete(listener);
        store.refs -= 1;
        if (store.refs <= 0 && store.cleanup) {
          store.cleanup();
          store.cleanup = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { data, loading };
  }

  return { useStore, reload: load, peek: () => get().data };
}
