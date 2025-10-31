import { Analytics } from "@vercel/analytics/next";
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
