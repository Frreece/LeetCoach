import React, { createContext, useContext, useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    }
  }
});

interface AuthUser {
  email: string;
  userId: string;
  idToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(async (u) => {
        const session = await fetchAuthSession();
        setUser({
          email: u.signInDetails?.loginId ?? "",
          userId: u.userId,
          idToken: session.tokens?.idToken?.toString() ?? "",
        });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const { isSignedIn } = await signIn({ username: email, password });
    if (isSignedIn) {
      const u = await getCurrentUser();
      const session = await fetchAuthSession();
      setUser({
        email,
        userId: u.userId,
        idToken: session.tokens?.idToken?.toString() ?? "",
      });
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    await signUp({ username: email, password, options: { userAttributes: { email } } });
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
  };

  const getIdToken = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
      getIdToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}