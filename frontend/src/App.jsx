import ExoplanetViewer from './components/ExoplanetViewer';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🪐 NASA Exoplanet Explorer</h1>
          <p>Discover distant worlds through interactive 3D visualization</p>
        </div>
      </header>

      <main className="app-main">
        <ExoplanetViewer />
      </main>

      <footer className="app-footer">
        <p>Data from <a href="https://exoplanetarchive.ipac.caltech.edu/" target="_blank" rel="noopener noreferrer">NASA Exoplanet Archive</a></p>
        <p>Built with React, Three.js, and Node.js</p>
      </footer>
    </div>
  );
}

export default App;
