import { useState, useEffect, useCallback } from "react";
import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";


export function useAuth() {
  const [user, setUser] = useState<{ email: string; userId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  getCurrentUser()
    .then(async (u) => {
      const session = await fetchAuthSession();
      localStorage.setItem("lc_id_token", session.tokens?.idToken?.toString() ?? "");
      setUser({ email: u.signInDetails?.loginId ?? "", userId: u.userId });
    })
    .catch(() => setUser(null))
    .finally(() => setLoading(false));
}, []);

  const login = useCallback(async (email: string, password: string) => {
    const { isSignedIn } = await signIn({ username: email, password });
    if (isSignedIn) {
      const u = await getCurrentUser();
      const session = await fetchAuthSession();
      localStorage.setItem("lc_id_token", session.tokens?.idToken?.toString() ?? "");
      setUser({ email, userId: u.userId });
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await signUp({ username: email, password, options: { userAttributes: { email } } });
  }, []);

  const confirm = useCallback(async (email: string, code: string) => {
    await confirmSignUp({ username: email, confirmationCode: code });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    localStorage.removeItem("lc_id_token");
    setUser(null);
  }, []);

  return { user, loading, error, login, register, confirm, logout };
}