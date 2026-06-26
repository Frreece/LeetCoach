// src/pages/LandingPage.tsx
import { Link } from "react-router-dom";
import { Zap, Brain, RotateCcw, TrendingUp, Chrome, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  { icon: Brain,      title: "AI Code Analysis",         desc: "Claude evaluates your time & space complexity and identifies suboptimal patterns instantly after submission." },
  { icon: Zap,        title: "Socratic Follow-ups",       desc: "Instead of handing you answers, LeetCoach asks guiding questions that make you think through the optimization yourself." },
  { icon: RotateCcw,  title: "Spaced Repetition (SM-2)",  desc: "Every problem gets a review date based on your solution quality — revisit at the exact moment your memory starts to fade." },
  { icon: TrendingUp, title: "Progress Dashboard",        desc: "Track streaks, topic weaknesses, complexity trends, and your full submission history in one clean dashboard." },
];

const steps = [
  {
    text: "Install the Chrome extension",
    href: "https://chromewebstore.google.com/detail/bebajlkfgjannhichmndmeeeihiokmnh?utm_source=item-share-cb",
    external: true,
  },
  {
    text: "Create your free LeetCoach account",
  },
  {
    text: "Solve any LeetCode problem as usual",
  },
  {
    text: "Get instant AI analysis + follow-up questions",
  },
  {
    text: "Complete your spaced repetition reviews on schedule",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl">Leet<span className="text-brand-400">Coach</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Sign in</Link>
            <Link to="/signup" className="btn-primary text-sm px-4 py-2">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-600/20 rounded-full px-4 py-1.5 text-sm text-brand-400 mb-8">
          <Chrome size={14} /> Chrome extension + web dashboard
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Stop grinding LeetCode.{" "}
          <span className="text-brand-400">Start retaining it.</span>
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
          LeetCoach detects your submissions, analyzes complexity with AI, asks Socratic questions
          when your solution is suboptimal, and schedules reviews with spaced repetition.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/signup" className="btn-primary px-6 py-3 text-base">
            Create free account <ArrowRight size={16} className="inline ml-1" />
          </Link>
          <a href="#features" className="btn-secondary px-6 py-3 text-base">See how it works</a>
        </div>
      </section>

      {/* Demo mockup */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            <span className="ml-2 text-xs text-slate-500 font-mono">leetcode.com/problems/two-sum</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 rounded-xl p-4 font-mono text-sm text-slate-300 leading-7">
              <span className="text-brand-400">def</span>{" "}<span className="text-sky-400">twoSum</span>(nums, target):<br />
              {"  "}<span className="text-brand-400">for</span> i <span className="text-brand-400">in</span> range(len(nums)):<br />
              {"    "}<span className="text-brand-400">for</span> j <span className="text-brand-400">in</span> range(i+<span className="text-orange-400">1</span>, len(nums)):<br />
              {"      "}<span className="text-brand-400">if</span> nums[i]+nums[j]==target:<br />
              {"        "}<span className="text-brand-400">return</span> [i,j]
            </div>
            <div className="bg-slate-900 border border-brand-600/30 rounded-xl p-4 text-sm space-y-3">
              <div className="text-brand-400 font-semibold text-sm">⚡ LeetCoach Analysis</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-500">Your Time</div>
                  <div className="font-mono font-bold text-amber-400">O(n²)</div>
                </div>
                <div className="bg-slate-950 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-500">Optimal</div>
                  <div className="font-mono font-bold text-emerald-400">O(n)</div>
                </div>
              </div>
              <div className="bg-brand-950/40 border-l-2 border-brand-500 rounded-r-lg px-3 py-2 text-xs text-brand-300">
                💭 What data structure gives you O(1) lookup? Could you check for a complement as you iterate?
              </div>
              <div className="flex items-center gap-2 text-xs text-sky-400">
                📅 Scheduled for review tomorrow
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-800">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to level up</h2>
        <div className="grid grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card">
              <div className="w-10 h-10 bg-brand-600/15 rounded-lg flex items-center justify-center mb-4">
                <Icon size={20} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-lg mx-auto px-6 py-20 border-t border-slate-800">
        <h2 className="text-3xl font-bold text-center mb-10">How it works</h2>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-600/15 border border-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                {i + 1}
              </div>

              {step.href ? (
                <a
                  href={step.href}
                  target={step.external ? "_blank" : undefined}
                  rel={step.external ? "noopener noreferrer" : undefined}
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-2"
                >
                  {step.text}
                </a>
              ) : (
                <span className="text-slate-300">{step.text}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-xl mx-auto px-6 py-24 text-center border-t border-slate-800">
        <h2 className="text-3xl font-bold mb-3">Ready to practice smarter?</h2>
        <p className="text-slate-400 mb-8">Free to use. No credit card needed.</p>
        <Link to="/signup" className="btn-primary px-8 py-3.5 text-base inline-block">
          Get started for free
        </Link>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-600">
        LeetCoach © {new Date().getFullYear()} · Powered by Claude AI + AWS
      </footer>
    </div>
  );
}
