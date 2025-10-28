import { useState } from 'react';

export default function SearchPanel({ results, onSearch, onSelectPlanet, viewMode }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className={`search-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="panel-header">
        <h3>🔍 Search</h3>
        <button onClick={() => setIsOpen(!isOpen)} className="toggle-btn">
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {isOpen && (
        <div className="panel-content">
          <input
            type="text"
            placeholder={viewMode === 'galaxy' ? 'Search star systems...' : 'Search exoplanets...'}
            value={query}
            onChange={handleSearch}
            className="search-input"
          />

          <div className="results-header">
            <span>{results.length} results</span>
          </div>

          <div className="results-list">
            {viewMode === 'galaxy' ? (
              // System results
              results.map((system, index) => (
                <div
                  key={index}
                  className="result-item system-item"
                  onClick={() => onSelectPlanet(system.planets[0])}
                >
                  <div className="result-name">{system.starName}</div>
                  <div className="result-meta">
                    <span>{system.planets.length} planets</span>
                    <span>{system.distance.toFixed(1)} ly</span>
                  </div>
                </div>
              ))
            ) : (
              // Planet results
              results.map((planet, index) => (
                <div
                  key={index}
                  className="result-item planet-item"
                  onClick={() => onSelectPlanet(planet)}
                >
                  <div className="result-name">{planet.name}</div>
                  <div className="result-meta">
                    <span className={`type-badge type-${planet.type}`}>
                      {planet.type}
                    </span>
                    <span>{planet.distance.toFixed(1)} ly</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
