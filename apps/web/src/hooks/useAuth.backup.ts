import { useEffect, useMemo, useState } from "react";

type AuthMethod = "google" | "email" | "guest";

type SaraloUser = {
  id: string;
  name: string;
  email?: string;
  method: AuthMethod;
};

type StoredSession = {
  user: SaraloUser;
  authMethod: AuthMethod;
};

const STORAGE_KEY = "saralo.session";
const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function readStoredSession(): StoredSession | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<SaraloUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);

  useEffect(() => {
    const stored = readStoredSession();
    if (stored?.user) {
      setUser(stored.user);
      setAuthMethod(stored.authMethod);
    }
    setAuthLoading(false);
  }, []);

  async function persistSession(nextUser: SaraloUser, method: AuthMethod) {
    setAuthLoading(true);
    await delay(650);
    setUser(nextUser);
    setAuthMethod(method);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, authMethod: method }));
    setAuthLoading(false);
  }

  async function loginWithGoogle() {
    await persistSession(
      {
        id: "google-user",
        name: "Google User",
        email: "user@example.com",
        method: "google"
      },
      "google"
    );
  }

  async function loginWithEmail(email: string, _password: string) {
    await persistSession(
      {
        id: `email-${email.toLowerCase()}`,
        name: email.split("@")[0] || "Email User",
        email,
        method: "email"
      },
      "email"
    );
  }

  async function loginAsGuest() {
    await persistSession(
      {
        id: "guest-user",
        name: "Guest Explorer",
        method: "guest"
      },
      "guest"
    );
  }

  function logout() {
    setUser(null);
    setAuthMethod(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      authLoading,
      authMethod,
      loginWithGoogle,
      loginWithEmail,
      loginAsGuest,
      logout
    }),
    [authLoading, authMethod, user]
  );
}
