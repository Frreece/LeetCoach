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
    console.log("1. Starting login for:", email);
    
    try {
      const response = await signIn({ username: email, password });
      console.log("2. Amplify signIn response:", response);

      // Check for the unconfirmed user step
      if (response.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
        console.log("3. User needs confirmation! Throwing custom error...");
        const customError = new Error("User is not confirmed");
        customError.name = "UserNotConfirmedException";
        throw customError; // This forces the AuthPage catch block to trigger
      }

      // If fully signed in, set up the session
      if (response.isSignedIn) {
        console.log("4. User is fully signed in!");
        const u = await getCurrentUser();
        const session = await fetchAuthSession();
        localStorage.setItem("lc_id_token", session.tokens?.idToken?.toString() ?? "");
        setUser({ email, userId: u.userId });
      }
      
    } catch (err) {
      console.log("5. Amplify threw a native error:", err);
      throw err; // Re-throw the error so AuthPage can catch it!
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