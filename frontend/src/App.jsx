import { Analytics } from "@vercel/analytics/react";
import ExoplanetViewer from "./components/ExoplanetViewer";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <ExoplanetViewer />
      <Analytics />
    </ErrorBoundary>
  );
}

export default App;
