import Wordmark from "../../components/Wordmark";
import HeroDemo from "./HeroDemo";
import { CtaSection, FaqSection, MathsSection } from "./InfoSections";
import { StorySections } from "./StorySections";

/** Marketing front door: hero with a playable demo, stories, maths, FAQ. */
export default function Landing() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-hairline)] bg-[#fafaf7]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <p className="text-base font-semibold tracking-tight">
            <Wordmark />
          </p>
          <nav aria-label="Page" className="hidden items-center gap-6 text-sm sm:flex">
            <a href="#moments" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              Moments
            </a>
            <a href="#how" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              How it works
            </a>
            <a href="#maths" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              The maths
            </a>
            <a href="#faq" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
              FAQ
            </a>
          </nav>
          <a
            href="#/app"
            className="flex min-h-[44px] items-center rounded-xl bg-[#1c1c1a] px-4 text-sm font-medium text-white active:scale-[0.98]"
          >
            Open the demo
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section
          aria-labelledby="landing-title"
          className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
              Saldo · a 30-day budget companion
            </p>
            <h1
              id="landing-title"
              className="mt-3 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
            >
              Know what a purchase costs before you buy.
            </h1>
            <p className="mt-4 max-w-[45ch] text-base leading-relaxed text-[var(--color-ink-soft)]">
              Saldo turns a ₹10,000 month into one daily number. Simulate any spend, see what moves,
              then decide.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="#/app"
                className="flex min-h-[44px] items-center rounded-xl bg-[var(--color-accent)] px-5 text-base font-medium text-white active:scale-[0.98]"
              >
                Open the full demo
              </a>
              <a
                href="#maths"
                className="flex min-h-[44px] items-center rounded-xl border border-[var(--color-hairline)] bg-white px-5 text-base font-medium active:scale-[0.98]"
              >
                How the maths works
              </a>
            </div>
          </div>
          <HeroDemo />
        </section>

        <div className="border-y border-[var(--color-hairline)] py-3">
          <p className="text-center text-sm text-[var(--color-ink-faint)]">
            Mock data · No login · No real money · Built in a 6-hour hackathon
          </p>
        </div>

        <StorySections />
        <MathsSection testCount={12} />
        <FaqSection />
        <CtaSection />
      </main>

      <footer className="border-t border-[var(--color-hairline)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1fr_1fr_1fr] sm:px-6">
          <div>
            <p className="text-base font-semibold tracking-tight">
              <Wordmark />
            </p>
            <p className="mt-2 max-w-[35ch] text-sm leading-relaxed text-[var(--color-ink-soft)]">
              A calm budget companion for a ₹10,000 month. Simulate first, spend second.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-2 grid gap-1 text-sm text-[var(--color-ink-soft)]">
              <li>
                <a href="#/app" className="inline-flex min-h-[32px] items-center hover:text-[var(--color-ink)]">
                  Live demo
                </a>
              </li>
              <li>
                <a href="#moments" className="inline-flex min-h-[32px] items-center hover:text-[var(--color-ink)]">
                  Moments
                </a>
              </li>
              <li>
                <a href="#how" className="inline-flex min-h-[32px] items-center hover:text-[var(--color-ink)]">
                  How it works
                </a>
              </li>
              <li>
                <a href="#maths" className="inline-flex min-h-[32px] items-center hover:text-[var(--color-ink)]">
                  The maths
                </a>
              </li>
            </ul>
          </nav>
          <div>
            <p className="text-sm font-semibold">Project</p>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-[var(--color-ink-soft)]">
              A 6-hour hackathon build with mock data. Nothing here moves real money, and nothing
              leaves your browser.
            </p>
          </div>
        </div>
        <div className="border-t border-[var(--color-hairline)]">
          <p className="mx-auto w-full max-w-6xl px-4 py-4 text-sm text-[var(--color-ink-faint)] sm:px-6">
            Saldo — spend second, simulate first.
          </p>
        </div>
      </footer>
    </>
  );
}
