export default function FAQ() {

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* Header */}
        <div className="border-b border-slate-800 px-6 py-6">
            <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold">
                <a href="/">
                Frequently Asked Questions
                </a>
            </h1>
            </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
            {/* 1 */}
            <div className="card space-y-3">
            <h2 className="text-xl font-semibold">1. How do I get started?</h2>

            <div className="space-y-4 text-sm text-slate-300">

                <div>
                <ul className="list-disc ml-5 text-slate-400 space-y-1">
                    <li> Download the Chrome Extension <a className="text-brand-400 hover:text-brand-300 underline underline-offset-2" href="https://chromewebstore.google.com/detail/bebajlkfgjannhichmndmeeeihiokmnh?utm_source=item-share-cb" target="_blank"> "LeetCoach"</a></li>
                    <li>Create your account</li>
                    <li>Sign into the extension</li>
                    <li> Submit a leetcode problem!</li>
                </ul>
                </div>

                <div>
                <h3 className="font-semibold text-slate-200 mb-1">This isn't clear!</h3>
                <p className="text-slate-400">
                    Look over the demo <a className="text-brand-400 hover:text-brand-300 underline underline-offset-2" href="https://private-user-images.githubusercontent.com/127095005/602958734-83011bd1-7edc-476e-b862-f7e7c9db7f18.MOV?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3ODI0ODU0MDUsIm5iZiI6MTc4MjQ4NTEwNSwicGF0aCI6Ii8xMjcwOTUwMDUvNjAyOTU4NzM0LTgzMDExYmQxLTdlZGMtNDc2ZS1iODYyLWY3ZTdjOWRiN2YxOC5NT1Y_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwNjI2JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDYyNlQxNDQ1MDVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00YWI4YzlhMTE5MzVmYWU5OGEyMWFmOWE0NWVlMmIyYTkxYjZkMTBhZTFkZmIxNjFmZjFlMWM4NDViZThmM2M4JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9dmlkZW8lMkZxdWlja3RpbWUifQ.lkstLvG3nMheB1-kH5vpU64Z_2FOc6s_xNUFCzfrREs"> Here </a>
                </p>
                </div>
            </div>
            </div>

            {/* 2 */}
            <div className="card space-y-3">
            <h2 className="text-xl font-semibold">2. I didn't receive a confirmation code!</h2>
            <p> Check your spam! The code often gets sent there.</p>
            </div>

            {/* 3 */}
            <div className="card space-y-3">
            <h2 className="text-xl font-semibold">3. How should I be doing spaced repetition? </h2>
            <p className="text-slate-400">
                Spaced Repetition is self-reported and you may do it however you'd like!
            </p>
            <p className="text-slate-400">
                In my practice, rather than simply typing out the code again, submitting, and rating how well I do it, I say the solution aloud, clarifying all of the nuances of implementation and intuition as if it were an interview.
            </p>
            <p> This is called Active Recall and is one the best ways to commit things to long term memory. In my practice it almost sounds like I am reciting the code  with comments.</p>
            </div>

            {/* 4 */}
            <div className="card space-y-3">
            <h2 className="text-xl font-semibold">4. Why do I only get 3 submissions? :( </h2>
            <p className="text-slate-400">Claude API calls are expensive. If there is sufficient interest in a paid tier (Significantly cheaper than competitors) then it will be created!</p>
            </div>

            {/* 5 */}
            <div className="card space-y-3">
            <h2 className="text-xl font-semibold">5. Something is Broken!</h2>
            <p className="text-slate-400">
                Please email <span className="text-brand-400 font-medium">
                support@leetcoach.org
                </span> as soon as possible!
            </p>
            </div>

            
            {/* 6 */}
            <div className="card space-y-3">
            <h2 className="text-xl font-semibold">6. I'd like to reach out.</h2>
            <p className="text-slate-400">
                For questions, comments, or concerns, contact{" "}
                <span className="text-brand-400 font-medium">
                support@leetcoach.org
                </span>
            </p>
            </div>

            {/* Footer note */}
            <p className="text-xs text-slate-600 text-center pt-6">
            LeetCoach © {new Date().getFullYear()} · Frequently Asked Questions
            </p>
        </div>
        </div>
    )
}