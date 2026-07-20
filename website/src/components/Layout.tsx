// src/components/Layout.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LayoutDashboard, Clock, History, LogOut, Zap, CircleHelp, BookOpen, Brain } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/review",    label: "Review Queue", icon: Clock },
  { to: "/flashcards", label: "Flashcards", icon: BookOpen},
  { to: "/flashcards/review", label: "Flashcard Review", icon: Brain},
  { to: "/history",   label: "History", icon: History },
  { to: "/FAQ", label: "FAQ", icon: CircleHelp }
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-10">
        <div className="p-5 border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">LeetCoach</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
  active
    ? "bg-slate-600/20 text-slate-300"
    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
}`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-2 truncate px-1">{user?.email}</div>
          <button onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 w-full px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-56 p-8 min-h-screen">{children}</main>
    </div>
  );
}
