export default function InfoPanel({ planet, viewMode, totalCount }) {
  if (!planet && viewMode !== 'galaxy') {
    return null;
  }

  return (
    <div className="info-panel">
      {viewMode === 'galaxy' ? (
        <div className="info-content">
          <h2>🌌 NASA Exoplanet Explorer</h2>
          <p className="subtitle">Interactive 3D Visualization</p>

          <div className="info-section">
            <h3>About</h3>
            <p>
              Explore {totalCount.toLocaleString()} confirmed exoplanets from NASA's Exoplanet Archive.
              Each point of light represents a star system with discovered planets.
            </p>
          </div>

          <div className="info-section">
            <h3>Controls</h3>
            <ul className="control-list">
              <li><strong>Drag</strong> to rotate view</li>
              <li><strong>Scroll</strong> to zoom</li>
              <li><strong>Right-click + drag</strong> to pan</li>
              <li><strong>Click</strong> on a system to explore</li>
            </ul>
          </div>

          <div className="info-section">
            <h3>Color Legend</h3>
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ffd700' }}></span>
                <span>7+ planets</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ff8c00' }}></span>
                <span>4-6 planets</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#4169e1' }}></span>
                <span>2-3 planets</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="info-content">
          <h2>{planet.name}</h2>
          <p className="subtitle">Orbiting {planet.hostStar}</p>

          <div className="info-grid">
            <div className="info-item">
              <span className="label">Type</span>
              <span className={`value type-${planet.type}`}>
                {planet.type.replace('-', ' ')}
              </span>
            </div>

            <div className="info-item">
              <span className="label">Radius</span>
              <span className="value">{planet.radius.toFixed(2)} R⊕</span>
            </div>

            <div className="info-item">
              <span className="label">Mass</span>
              <span className="value">{planet.mass.toFixed(2)} M⊕</span>
            </div>

            <div className="info-item">
              <span className="label">Temperature</span>
              <span className="value">{planet.temperature.toFixed(0)} K</span>
            </div>

            <div className="info-item">
              <span className="label">Distance</span>
              <span className="value">{planet.distance.toFixed(1)} ly</span>
            </div>

            <div className="info-item">
              <span className="label">Discovered</span>
              <span className="value">{planet.discoveryYear}</span>
            </div>

            {planet.orbitalPeriod > 0 && (
              <div className="info-item">
                <span className="label">Orbital Period</span>
                <span className="value">{planet.orbitalPeriod.toFixed(1)} days</span>
              </div>
            )}

            {planet.semiMajorAxis && (
              <div className="info-item">
                <span className="label">Semi-major Axis</span>
                <span className="value">{planet.semiMajorAxis.toFixed(3)} AU</span>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>Host Star</h3>
            <div className="star-info">
              <div>Temperature: {planet.stellarTemp.toFixed(0)} K</div>
              <div>Radius: {planet.stellarRadius.toFixed(2)} R☉</div>
            </div>
          </div>

          <div className="info-note">
            <small>
              <strong>Note:</strong> Visual representation is procedurally generated based on scientific data.
              Actual appearance may differ.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
