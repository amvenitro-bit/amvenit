"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "client" | "courier" | "admin" | null;

type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
};

type AuthState = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  role: Role;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used within <AuthProvider />");
  return v;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  async function loadProfile(uid: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, full_name, phone")
      .eq("id", uid)
      .single();

    if (error) {
      // dacă nu există profil (rar), nu blocăm UX-ul
      setProfile(null);
      return;
    }
    setProfile(data as Profile);
  }

  async function refreshProfile() {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    if (!uid) {
      setProfile(null);
      return;
    }
    await loadProfile(uid);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUserId(null);
    setEmail(null);
    setProfile(null);
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const sess = data.session;

      if (!alive) return;

      if (!sess?.user) {
        setUserId(null);
        setEmail(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUserId(sess.user.id);
      setEmail(sess.user.email ?? null);
      await loadProfile(sess.user.id);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;

      if (!u) {
        setUserId(null);
        setEmail(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUserId(u.id);
      setEmail(u.email ?? null);
      await loadProfile(u.id);
      setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      userId,
      email,
      profile,
      role: profile?.role ?? null,
      refreshProfile,
      signOut,
    }),
    [loading, userId, email, profile]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}