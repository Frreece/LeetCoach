// src/pages/LandingPage.tsx
import { Link } from "react-router-dom";
import { Zap, Brain, RotateCcw, TrendingUp, Chrome, ArrowRight, BookOpen, Layers } from "lucide-react";

const features = [
  {
    icon: Chrome,
    color: "bg-sky-500/10 text-sky-400",
    title: "Automatic submission capture",
    desc: "The Chrome extension detects every LeetCode submission the moment you click submit — no copy-pasting, no manual logging.",
  },
  {
    icon: Brain,
    color: "bg-brand-500/10 text-brand-400",
    title: "AI complexity analysis",
    desc: "Claude evaluates your time and space complexity, identifies suboptimal patterns, and asks Socratic questions that make you think rather than just handing you answers.",
  },
  {
    icon: RotateCcw,
    color: "bg-violet-500/10 text-violet-400",
    title: "Spaced repetition for LeetCode",
    desc: "Every problem gets a review date based on how well you solved it. Revisit at the exact moment your memory starts to fade, not before and not after.",
  },
  {
    icon: BookOpen,
    color: "bg-emerald-500/10 text-emerald-400",
    title: "System design flashcards",
    desc: "200+ flashcards across 12 system design categories — caching, distributed systems, networking, and more — with the same spaced repetition engine underneath.",
  },
  {
    icon: Layers,
    color: "bg-amber-500/10 text-amber-400",
    title: "Unified review queue",
    desc: "Due LeetCode problems and system design cards surface together in one daily session. Nothing falls through the cracks.",
  },
  {
    icon: TrendingUp,
    color: "bg-rose-500/10 text-rose-400",
    title: "Progress tracking",
    desc: "Streaks, topic breakdowns, complexity trends, and your full submission history in one dashboard. See exactly where your weak spots are.",
  },
];

const leetcodeSteps = [
  { text: "Install the Chrome extension", href: "https://chromewebstore.google.com/detail/bebajlkfgjannhichmndmeeeihiokmnh?utm_source=item-share-cb", external: true },
  { text: "Create your free LeetCoach account" },
  { text: "Solve any LeetCode problem as usual" },
  { text: "Get instant AI analysis and follow-up questions" },
  { text: "Work through your spaced repetition reviews on schedule" },
];

const systemDesignSteps = [
  { text: "Create your free LeetCoach account" },
  { text: "Browse 200+ system design flashcards across 12 categories" },
  { text: "Add cards to your personal review queue" },
  { text: "Study due cards each day — the algorithm handles the scheduling" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 py-4 sticky top-0 z-20 bg-slate-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="#">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl">Leet<span className="text-brand-400">Coach</span></span>
          </div>
          </a>
          <div className="flex items-center gap-3">
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden sm:block">How it works</a>
            <a href="#features" className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden sm:block">Features</a>
            <Link to="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Sign in</Link>
            <Link to="/signup" className="btn-primary text-sm px-4 py-2">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-3xl mx-auto px-6 pt-24 pb-20 text-center">

        <p className="text-sm font-medium text-brand-400 uppercase tracking-widest mb-6">
          LeetCode + System Design
        </p>
        <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
          Interview prep that{" "}
          <span className="text-brand-400">actually sticks.</span>
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
          LeetCoach combines AI-powered LeetCode analysis with a system design flashcard library —
          both backed by spaced repetition so you retain what you study.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/signup" className="btn-primary px-6 py-3 text-base flex items-center gap-2">
            Create free account <ArrowRight size={16} />
          </Link>
          <a href="#features" className="btn-secondary px-6 py-3 text-base">See features</a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest text-center mb-3">What's inside</p>
        <h2 className="text-3xl font-bold text-center mb-12">Everything in one place</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="card hover:border-slate-700 transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color.split(" ")[0]}`}>
                <Icon size={20} className={color.split(" ")[1]} />
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest text-center mb-3">Two workflows</p>
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LeetCode track */}
          <div className="card space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-brand-600/15 rounded-lg flex items-center justify-center">
                <Chrome size={16} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-base">LeetCode practice</h3>
            </div>
            <div className="space-y-4">
              {leetcodeSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-600/15 border border-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  {step.href ? (
                    <a
                      href={step.href}
                      target={step.external ? "_blank" : undefined}
                      rel={step.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-brand-400 hover:text-brand-300 underline underline-offset-2"
                    >
                      {step.text}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-300">{step.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* System design track */}
          <div className="card space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-emerald-400" />
              </div>
              <h3 className="font-semibold text-base">System design prep</h3>
            </div>
            <div className="space-y-4">
              {systemDesignSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-sm text-slate-300">{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-xl mx-auto px-6 py-24 text-center border-t border-slate-800/60">
        <h2 className="text-3xl font-bold mb-3">Start retaining what you study.</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Most people grind problems and forget them a week later.<br />
          LeetCoach makes sure that doesn't happen.
        </p>
        <Link to="/signup" className="btn-primary px-8 py-3.5 text-base inline-flex items-center gap-2">
          Get started free <ArrowRight size={16} />
        </Link>
        <p className="text-xs text-slate-600 mt-4">No credit card needed.</p>
      </section>

      <footer className="border-t border-slate-800/60 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold">LeetCoach</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}