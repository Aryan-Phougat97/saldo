import Reveal from "./Reveal";
import { CASCADE, MOMENTS } from "./content";

/** Scenario cards (staggered trio) + the five-step cascade list. */
export function StorySections() {
  return (
    <>
      <section aria-labelledby="moments-title" id="moments" className="scroll-mt-20 py-12 sm:py-16">
        <Reveal>
          <h2 id="moments-title" className="max-w-[22ch] text-2xl font-semibold tracking-tight md:text-4xl">
            Made for the moments that break budgets.
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {MOMENTS.map((s, i) => (
            <Reveal key={s.tag} className={i === 1 ? "lg:mt-10" : ""}>
              <article className="card flex h-full flex-col p-6">
                <p className="tnum text-sm font-semibold text-[var(--color-accent-ink)]">0{i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.tag}</h3>
                <p className="mt-2 text-base leading-relaxed text-[var(--color-ink-soft)]">{s.story}</p>
                <p className="mt-4 border-t border-[var(--color-hairline)] pt-4 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {s.move}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="cascade-title"
        id="how"
        className="grid scroll-mt-20 gap-8 border-t border-[var(--color-hairline)] py-12 sm:py-16 lg:grid-cols-[1fr_1.2fr]"
      >
        <Reveal>
          <div>
            <h2 id="cascade-title" className="text-2xl font-semibold tracking-tight md:text-4xl">
              One decision moves five things.
            </h2>
            <p className="mt-3 max-w-[45ch] text-base leading-relaxed text-[var(--color-ink-soft)]">
              Apply a simulated purchase and the page updates in order — so you can watch the consequence travel.
            </p>
            <a
              href="#/app"
              className="mt-5 inline-flex min-h-[44px] items-center rounded-xl border border-[var(--color-hairline)] bg-white px-5 text-base font-medium active:scale-[0.98]"
            >
              Watch it happen
            </a>
          </div>
        </Reveal>
        <Reveal>
          <ol className="card divide-y divide-[var(--color-hairline)] px-6">
            {CASCADE.map(([title, body], i) => (
              <li key={title} className="flex items-baseline gap-4 py-4">
                <span className="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas)] text-sm font-semibold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="text-sm text-[var(--color-ink-soft)]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
    </>
  );
}
