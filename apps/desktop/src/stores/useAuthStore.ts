import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useUIStore } from "@/stores/useUIStore";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  init: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  error: null,

  init: () => {
    let lastUserId: string | null = null;

    supabase.auth.getSession().then(({ data }) => {
      lastUserId = data.session?.user.id ?? null;
      set({ session: data.session, user: data.session?.user ?? null, loading: false });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      if (userId !== lastUserId) {
        // Switched accounts (or logged out) within the same running app,
        // in-memory UI state and cached query data belong to the old user.
        lastUserId = userId;
        useUIStore.getState().clearActiveConversation();
        queryClient.clear();
      }
      set({ session, user: session?.user ?? null, loading: false });
    });

    return () => subscription.subscription.unsubscribe();
  },

  signIn: async (email, password) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) set({ error: error.message });
    else set({ session: data.session, user: data.user, loading: false });
  },

  signUp: async (email, password) => {
    set({ error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) set({ error: error.message });
    else set({ session: data.session, user: data.user, loading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
