// src/pages/AuthPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

type Mode = "signin" | "signup" | "confirm";

export default function AuthPage({ mode: initialMode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { login, register, confirm } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("TESTING")

    try {
      if (mode === "signin") {
        await login(email, password);
        navigate("/dashboard");
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          return;
        }
        await register(email, password);
        setPendingEmail(email);
        setMode("confirm");
      } else if (mode === "confirm") {
        await confirm(pendingEmail || email, code);
        // Auto sign-in after confirmation
        await login(pendingEmail || email, password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("THE CATCH BLOCK IS RUNNING! Name:", err.name, "Message:", err.message);
      if (mode === "signin" && err.name === "UserNotConfirmedException") {
        setPendingEmail(email);
        setMode("confirm");
        return; 
      }

      if (mode === "signup" && err.name === "UsernameExistsException") {
        // Intentionally swallowing this error based on your original code
        return; 
      }

      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center">
            <span className="font-bold text-2xl">LeetCoach</span>
          </Link>
        </div>

        <div className="card">
          <h1 className="text-xl font-bold mb-1">
            {mode === "signin" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "confirm" && "Check your email or spam folder"}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {mode === "signin" && "Sign in to access your dashboard and review queue."}
            {mode === "signup" && "Start tracking your LeetCode progress with AI analysis."}
            {mode === "confirm" && `We sent a confirmation code to ${pendingEmail || email}.`}
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "confirm" ? (
              <>
                {!pendingEmail && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                    <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmation code</label>
                  <input className="input text-center tracking-widest text-lg" type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" maxLength={6} required />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm password</label>
                    <input className="input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" required />
                  </div>
                )}
              </>
            )}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? "Please wait…" :
               mode === "signin" ? "Sign in" :
               mode === "signup" ? "Create account" :
               "Verify & continue"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-500">
            {mode === "signin" && (
              <>Don't have an account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); }} className="text-brand-400 hover:underline">Sign up</button>
              </>
            )}
            {mode === "signup" && (
              <>Already have an account?{" "}
                <button onClick={() => { setMode("signin"); setError(""); }} className="text-brand-400 hover:underline">Sign in</button>
              </>
            )}
            {mode === "confirm" && (
              <button onClick={() => { setMode("signup"); setError(""); }} className="text-brand-400 hover:underline">
                Back to sign up
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
