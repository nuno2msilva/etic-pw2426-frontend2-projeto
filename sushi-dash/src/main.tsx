/**
 * ==========================================================================
 * main.tsx — Application entry point
 * ==========================================================================
 *
 * Mounts the root React component (<App />) into the DOM.
 * The #root div is defined in index.html.
 *
 * Global CSS (index.css) is imported here — it includes Tailwind base
 * styles, custom CSS variables for theming, and font imports.
 * ==========================================================================
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
