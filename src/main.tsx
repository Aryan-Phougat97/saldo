import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import Landing from "./landing/Landing";

function Root() {
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.location.hash === "#/app" ? "app" : "landing",
  );
  const viewRef = useRef(view);

  useEffect(() => {
    const onHash = () => {
      const next = window.location.hash === "#/app" ? "app" : "landing";
      // Only reset scroll when switching views. In-page anchors (#maths, #faq…)
      // must keep the browser's default scroll-to-section behavior.
      if (viewRef.current !== next) {
        viewRef.current = next;
        setView(next);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return view === "app" ? <App /> : <Landing />;
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
