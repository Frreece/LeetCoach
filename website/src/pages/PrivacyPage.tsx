// src/pages/Privacy.tsx
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">
            Privacy <span className="text-brand-400">Policy</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            How LeetCoach collects, uses, and protects your data
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">

        {/* Meta */}
        <div className="card">
          <p className="text-sm text-slate-400">
            <strong className="text-slate-200">Effective Date:</strong> June 23, 2026
          </p>
          <p className="text-sm text-slate-400 mt-2">
            <strong className="text-slate-200">Last Updated:</strong> June 23, 2026
          </p>
        </div>

        {/* Intro */}
        <div className="card space-y-3">
          <p className="text-slate-300 leading-relaxed">
            LeetCoach is a Chrome extension and web application that enhances the LeetCode experience
            by providing AI-powered feedback, learning insights, and spaced repetition scheduling.
          </p>
          <p className="text-slate-400 text-sm">
            This Privacy Policy explains what data we access, how it is used, and how it is stored.
          </p>
        </div>

        {/* 1 */}
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>

          <div className="space-y-4 text-sm text-slate-300">

            <div>
              <h3 className="font-semibold text-slate-200 mb-1">LeetCode Activity Data</h3>
              <ul className="list-disc ml-5 text-slate-400 space-y-1">
                <li>Problem submissions (code, runtime, memory, results)</li>
                <li>Problem metadata (title, difficulty, tags)</li>
                <li>Submission timestamps</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-1">Account Data</h3>
              <p className="text-slate-400">
                If you create an account, we may store a user identifier and authentication tokens
                required for secure login sessions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-1">Usage Data</h3>
              <p className="text-slate-400">
                We may collect feature usage events such as hint requests, review completions,
                and learning progress updates.
              </p>
            </div>

            <p className="text-slate-400 italic">
              We do not collect browsing activity outside of LeetCode.
            </p>
          </div>
        </div>

        {/* 2 */}
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">2. How We Use Information</h2>
          <ul className="list-disc ml-5 text-slate-400 space-y-1">
            <li>Generate AI-powered explanations and Socratic hints</li>
            <li>Track learning progress and schedule spaced repetition reviews</li>
            <li>Improve product performance and features</li>
          </ul>
        </div>

        {/* 3 */}
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">3. Data Storage</h2>
          <p className="text-slate-400">
            Data is securely stored using AWS infrastructure, including DynamoDB and Lambda services.
          </p>
          <p className="text-slate-400">
            We retain data only as long as necessary to provide core functionality.
          </p>
        </div>

        {/* 4 */}
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">4. Third-Party Services</h2>
          <p className="text-slate-400">LeetCoach uses the following services:</p>

          <ul className="list-disc ml-5 text-slate-400 space-y-1">
            <li>
              <span className="text-slate-200 font-medium">Anthropic Claude API</span> — AI-powered feedback and hints
            </li>
            <li>
              <span className="text-slate-200 font-medium">AWS (Amazon Web Services)</span> — backend processing and storage
            </li>
            <li>
              <span className="text-slate-200 font-medium">LeetCode</span> — data accessed only while you use the platform
            </li>
          </ul>
        </div>

        {/* 5 */}
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">5. Data Sharing</h2>
          <p className="text-slate-400">
            We do not sell or rent user data. Data is only shared with third-party providers
            strictly for core functionality.
          </p>
        </div>

        {/* 6 */}
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">6. Data Security</h2>
          <p className="text-slate-400">
            We use secure HTTPS communication, authenticated APIs, and restricted database access
            to protect user data.
          </p>
          <p className="text-slate-400">
            However, no system can be guaranteed 100% secure.
          </p>
        </div>

        {/* 7 */}
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">7. User Control</h2>
          <ul className="list-disc ml-5 text-slate-400 space-y-1">
            <li>Uninstalling the extension stops all data collection</li>
            <li>You may request deletion of your data by contacting support</li>
          </ul>
        </div>

        {/* 8 */}
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
          <p className="text-slate-400">
            We may update this Privacy Policy as the product evolves. Updates will be posted on this page.
          </p>
        </div>

        {/* 9 */}
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p className="text-slate-400">
            For questions, contact{" "}
            <span className="text-brand-400 font-medium">
              support@leetcoach.org
            </span>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-600 text-center pt-6">
          LeetCoach © {new Date().getFullYear()} · Privacy Policy
        </p>
      </div>
    </div>
  );
}