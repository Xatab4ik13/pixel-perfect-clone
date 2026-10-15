import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const SessionContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export const useSession = () => useContext(SessionContext);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { setUser(session?.user ?? null); setReady(true); }
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (active) { setUser(data.user); setReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return <SessionContext.Provider value={{ user, ready }}>{children}</SessionContext.Provider>;
}