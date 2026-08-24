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
  signIn: (email: string, password: string, captchaToken: string) => Promise<void>;
  signUp: (email: string, password: string, captchaToken: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  error: null,

  init: () => {
    let lastUserId: string | null = null;

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        lastUserId = data.session?.user.id ?? null;
        set({ session: data.session, user: data.session?.user ?? null, loading: false });
      })
      .catch((error: unknown) => set({
        session: null,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : "Couldn't restore your session.",
      }));

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

  signIn: async (email, password, captchaToken) => {
    set({ error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });
      if (error) throw error;
      set({ session: data.session, user: data.user, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Login failed." });
    }
  },

  signUp: async (email, password, captchaToken) => {
    set({ error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { captchaToken },
      });
      if (error) throw error;
      set({ session: data.session, user: data.user, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Signup failed." });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
