import ExoplanetViewer from "./components/ExoplanetViewer";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <ExoplanetViewer />
    </ErrorBoundary>
  );
}

export default App;
