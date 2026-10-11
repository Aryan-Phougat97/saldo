import { useState } from "react";
import Reveal from "./Reveal";
import { FAQS, FORMULAS } from "./content";

/** Open-formula grid with the test badge. */
export function MathsSection({ testCount }: { testCount: number }) {
  return (
    <section
      aria-labelledby="maths-title"
      id="maths"
      className="scroll-mt-20 border-t border-[var(--color-hairline)] py-12 sm:py-16"
    >
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="maths-title" className="max-w-[20ch] text-2xl font-semibold tracking-tight md:text-4xl">
            The maths is on the table.
          </h2>
          <p className="tnum rounded-full bg-[var(--color-good-bg)] px-3 py-1.5 text-sm font-medium text-[var(--color-good-ink)]">
            <span aria-hidden="true">● </span>
            {testCount} unit tests, all passing
          </p>
        </div>
        <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-[var(--color-ink-soft)]">
          No black box, no score-as-grade. Every number in the demo comes from these lines — tap any
          figure in the app to see its working.
        </p>
      </Reveal>
      <Reveal>
        <dl className="mt-8 grid gap-px overflow-hidden rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-hairline)] sm:grid-cols-2 lg:grid-cols-3">
          {FORMULAS.map(([term, def]) => (
            <div key={term} className="bg-white px-5 py-4">
              <dt className="text-sm font-semibold">{term}</dt>
              <dd className="tnum mt-0.5 text-sm text-[var(--color-ink-soft)]">{def}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

/** Honest accordion: four questions with plain answers. */
export function FaqSection() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  return (
    <section
      aria-labelledby="faq-title"
      id="faq"
      className="scroll-mt-20 border-t border-[var(--color-hairline)] py-12 sm:py-16"
    >
      <Reveal>
        <h2 id="faq-title" className="text-2xl font-semibold tracking-tight md:text-4xl">
          Fair questions.
        </h2>
      </Reveal>
      <div className="mx-auto mt-6 max-w-3xl">
        {FAQS.map((f, i) => {
          const open = faqOpen === i;
          return (
            <Reveal key={f.q}>
              <div className="border-b border-[var(--color-hairline)]">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                    onClick={() => setFaqOpen(open ? null : i)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 py-4 text-left text-base font-medium"
                  >
                    {f.q}
                    <span aria-hidden="true" className="tnum text-xl font-normal text-[var(--color-ink-faint)]">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                {open && (
                  <p
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-button-${i}`}
                    className="max-w-[65ch] pb-5 text-base leading-relaxed text-[var(--color-ink-soft)]"
                  >
                    {f.a}
                  </p>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/** Closing call to action. */
export function CtaSection() {
  return (
    <section aria-labelledby="cta-title" className="card mb-14 px-6 py-12 text-center sm:px-12 sm:py-16">
      <Reveal>
        <h2 id="cta-title" className="mx-auto max-w-[20ch] text-2xl font-semibold tracking-tight md:text-4xl">
          Decide your next purchase with open eyes.
        </h2>
        <p className="mx-auto mt-3 max-w-[50ch] text-base text-[var(--color-ink-soft)]">
          Day 12 of 30, ₹8,830 in hand, Goa on the horizon. Step in and try a decision.
        </p>
        <a
          href="#/app"
          className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-[var(--color-accent)] px-6 text-base font-medium text-white active:scale-[0.98]"
        >
          Enter the demo
        </a>
      </Reveal>
    </section>
  );
}
