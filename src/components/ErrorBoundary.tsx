import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort safety net: a friendly fallback with a reset button
 * instead of a blank screen if any view throws during render.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // Intentionally surfaced for diagnostics; no reporting backend exists.
    console.error("Saldo error boundary caught:", error);
  }

  private reset = (): void => {
    this.setState({ error: null });
    window.location.hash = "#";
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="mx-auto w-full max-w-md px-4 py-20 text-center">
          <p className="text-base font-semibold tracking-tight">
            sald<span className="text-[var(--color-accent)]">o</span>
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Something came loose.</h1>
          <p className="mt-2 text-base text-[var(--color-ink-soft)]">
            The numbers are safe — this is mock data and nothing was spent. Reload to start the
            month fresh.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-6 min-h-[44px] rounded-xl bg-[#1c1c1a] px-6 text-base font-medium text-white"
          >
            Start fresh
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
