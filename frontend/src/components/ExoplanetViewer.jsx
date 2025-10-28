import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SceneManager } from '../lib/SceneManager';
import { PlanetRenderer } from '../lib/PlanetRenderer';
import { GalaxyRenderer } from '../lib/GalaxyRenderer';
import { ApiManager } from '../lib/ApiManager';
import { FilterManager } from '../lib/FilterManager';
import SearchPanel from './SearchPanel';
import InfoPanel from './InfoPanel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ExoplanetViewer() {
  const canvasContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exoplanetCount, setExoplanetCount] = useState(0);
  const [currentPlanet, setCurrentPlanet] = useState(null);
  const [viewMode, setViewMode] = useState('galaxy'); // 'galaxy' or 'planet'
  const [searchResults, setSearchResults] = useState([]);

  // Managers (stored in refs to persist across renders)
  const managersRef = useRef({
    scene: null,
    planet: null,
    galaxy: null,
    api: null,
    filter: null
  });

  // Initialize Three.js and fetch data
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Initialize managers
    const sceneManager = new SceneManager(container);
    sceneManager.initialize();

    const planetRenderer = new PlanetRenderer(sceneManager.scene);
    const galaxyRenderer = new GalaxyRenderer(sceneManager.scene);
    const apiManager = new ApiManager(`${API_URL}/api/exoplanets`);
    const filterManager = new FilterManager();

    managersRef.current = {
      scene: sceneManager,
      planet: planetRenderer,
      galaxy: galaxyRenderer,
      api: apiManager,
      filter: filterManager
    };

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      sceneManager.updateControls();

      if (viewMode === 'planet') {
        planetRenderer.rotatePlanet();
      } else if (viewMode === 'galaxy') {
        galaxyRenderer.animateGalaxy();
      }

      sceneManager.render();
    };
    animate();

    // Fetch exoplanet data
    apiManager.fetchExoplanets(
      // On batch
      (batch, all) => {
        setExoplanetCount(all.length);
        filterManager.setExoplanets(all);

        // Load galaxy view on first batch
        if (all.length === batch.length && all.length > 0) {
          const systems = filterManager.getNotableSystems();
          galaxyRenderer.renderGalaxy(systems);
        }
      },
      // On complete
      (all) => {
        setLoading(false);
        setExoplanetCount(all.length);
        const systems = filterManager.getNotableSystems();
        setSearchResults(systems);
      },
      // On error
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // Raycaster for clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, sceneManager.camera);

      if (viewMode === 'galaxy') {
        const intersects = raycaster.intersectObjects(galaxyRenderer.getAllClickableObjects());
        if (intersects.length > 0) {
          const system = intersects[0].object.userData.system;
          if (system && system.planets.length > 0) {
            selectPlanet(system.planets[0]);
          }
        }
      }
    };

    container.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('click', handleClick);
      sceneManager.cleanup();
      planetRenderer.cleanup();
      galaxyRenderer.cleanup();
    };
  }, []); // Run once on mount

  const selectPlanet = (planet) => {
    const { scene, planet: planetRenderer } = managersRef.current;

    // Clear galaxy view
    managersRef.current.galaxy.cleanup();

    // Render planet
    const radius = planetRenderer.renderPlanet(planet);
    const distance = scene.calculateOptimalCameraDistance(radius);

    scene.smoothCameraTransition(new THREE.Vector3(0, 0, distance));

    setCurrentPlanet(planet);
    setViewMode('planet');
  };

  const returnToGalaxy = () => {
    const { planet, galaxy, filter } = managersRef.current;

    planet.cleanup();
    const systems = filter.getNotableSystems();
    galaxy.renderGalaxy(systems);

    setViewMode('galaxy');
    setCurrentPlanet(null);
  };

  const handleSearch = (query) => {
    const { filter } = managersRef.current;
    const results = filter.searchByName(query);

    if (viewMode === 'galaxy') {
      setSearchResults(filter.getNotableSystems());
    } else {
      setSearchResults(results);
    }
  };

  const handleRandomPlanet = () => {
    const { filter } = managersRef.current;
    const randomPlanet = filter.getRandomPlanet();
    if (randomPlanet) {
      selectPlanet(randomPlanet);
    }
  };

  return (
    <div className="exoplanet-viewer">
      {/* Canvas */}
      <div ref={canvasContainerRef} className="canvas-container" />

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner" />
            <p>Loading NASA Exoplanet Data...</p>
            <p className="loading-count">{exoplanetCount} planets loaded</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-overlay">
          <div className="error-content">
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls-overlay">
        {viewMode === 'planet' && (
          <button onClick={returnToGalaxy} className="btn-back">
            ← Back to Galaxy
          </button>
        )}
        <button onClick={handleRandomPlanet} className="btn-random">
          🎲 Random Planet
        </button>
      </div>

      {/* Search Panel */}
      <SearchPanel
        results={searchResults}
        onSearch={handleSearch}
        onSelectPlanet={selectPlanet}
        viewMode={viewMode}
      />

      {/* Info Panel */}
      <InfoPanel planet={currentPlanet} viewMode={viewMode} totalCount={exoplanetCount} />
    </div>
  );
}
