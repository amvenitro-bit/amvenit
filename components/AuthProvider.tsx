"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type UserRole = "client" | "courier" | null;

type ProfileRow = {
  id: string;
  role: "client" | "courier";
  full_name: string | null;
  phone: string | null;
  created_at?: string;
};

type Profile = ProfileRow | null;

type AuthCtx = {
  authLoading: boolean; // doar sesiunea
  profileLoading: boolean; // doar profilul
  userId: string | null;
  email: string | null;
  role: UserRole;
  profile: Profile;
  refreshProfile: (uidOverride?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>(null);

  const inflightProfile = useRef<Promise<void> | null>(null);
  const profileTimeoutMs = 12000;

  async function clearLocalSession() {
    // curăță state + sesiune locală ca să nu mai apară refresh token errors
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore
    } finally {
      setUserId(null);
      setEmail(null);
      setProfile(null);
    }
  }

  async function refreshProfile(uidOverride?: string | null): Promise<void> {
    const uid = uidOverride ?? userId;

    if (!uid) {
      setProfile(null);
      return;
    }

    // dacă deja rulează, nu mai porni încă unul
    if (inflightProfile.current) return inflightProfile.current;

    const task = (async () => {
      setProfileLoading(true);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("profile timeout")), profileTimeoutMs)
      );

      try {
        const fetcher = supabase
          .from("profiles")
          .select("id, role, full_name, phone, created_at")
          .eq("id", uid)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) throw error;
            setProfile((data as ProfileRow) ?? null);
          });

        await Promise.race([fetcher, timeout]);
      } catch {
        // dacă e lent/eroare, nu blocăm UI-ul
      } finally {
        setProfileLoading(false);
        inflightProfile.current = null;
      }
    })();

    inflightProfile.current = task;
    return task;
  }

  async function bootstrap() {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();

      // IMPORTANT: dacă există eroare de sesiune / refresh token, curățăm local
      if (error) {
        await clearLocalSession();
        return;
      }

      const session = data.session;

      if (!session?.user) {
        setUserId(null);
        setEmail(null);
        setProfile(null);
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email ?? null);

      // pornește profilul async (cu uid explicit, nu din state)
      void refreshProfile(session.user.id);
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
  void bootstrap();

  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    // dacă nu mai există user (logout / expirare / sesiune invalidă)
    if (!session?.user) {
      setUserId(null);
      setEmail(null);
      setProfile(null);
      setAuthLoading(false);
      return;
    }

    setUserId(session.user.id);
    setEmail(session.user.email ?? null);

    // profil async cu uid explicit
    void refreshProfile(session.user.id);

    setAuthLoading(false);
  });

  return () => {
    data.subscription.unsubscribe();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const role: UserRole = useMemo(() => profile?.role ?? null, [profile]);

  async function signOut() {
    await clearLocalSession();
  }

  const value: AuthCtx = {
    authLoading,
    profileLoading,
    userId,
    email,
    role,
    profile,
    refreshProfile,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider />");
  return v;
}