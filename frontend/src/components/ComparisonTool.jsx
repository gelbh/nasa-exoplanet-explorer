import React, { useState } from "react";

/**
 * Planet Comparison Tool Component
 * Allows users to compare multiple exoplanets side-by-side
 */
const ComparisonTool = ({
  selectedPlanets = [],
  onRemovePlanet,
  onClearAll,
  onViewIn3D,
}) => {
  const [showEarth, setShowEarth] = useState(true);

  // Earth reference data
  const earthData = {
    name: "Earth",
    radius: 1.0,
    mass: 1.0,
    temperature: 288,
    distance: 0,
    type: "terrestrial",
    hostStar: "Sun",
    orbitalPeriod: 365.25,
  };

  const planetsToCompare = showEarth
    ? [earthData, ...selectedPlanets]
    : selectedPlanets;

  const getTypeColor = (type) => {
    const colors = {
      terrestrial: "#22c55e",
      "super-earth": "#3b82f6",
      neptune: "#8b5cf6",
      jupiter: "#f59e0b",
    };
    return colors[type] || "#6b7280";
  };

  const getTypeBadgeClass = (type) => {
    const classes = {
      terrestrial: "bg-success",
      "super-earth": "bg-primary",
      neptune: "bg-info",
      jupiter: "bg-warning",
    };
    return classes[type] || "bg-secondary";
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return Number(value).toFixed(decimals);
  };

  const getMaxValue = (property) => {
    return Math.max(...planetsToCompare.map((p) => p[property] || 0));
  };

  const getBarWidth = (value, property) => {
    const max = getMaxValue(property);
    if (max === 0) return 0;
    return ((value || 0) / max) * 100;
  };

  return (
    <div className="comparison-tool p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="text-white mb-0">
          <i className="bx bx-bar-chart-alt-2"></i> Planet Comparison
        </h6>
        <div className="d-flex gap-2">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="showEarthToggle"
              checked={showEarth}
              onChange={(e) => setShowEarth(e.target.checked)}
            />
            <label
              className="form-check-label text-white"
              htmlFor="showEarthToggle"
              style={{ fontSize: "0.875rem" }}
            >
              Show Earth
            </label>
          </div>
          {selectedPlanets.length > 0 && (
            <>
              <button
                className="btn btn-sm btn-primary"
                onClick={onViewIn3D}
                aria-label="View comparison in 3D"
                title="View these planets side-by-side in 3D"
              >
                <i className="bx bx-cube"></i> View in 3D
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={onClearAll}
                aria-label="Clear all planets from comparison"
              >
                <i className="bx bx-trash"></i> Clear
              </button>
            </>
          )}
        </div>
      </div>

      {planetsToCompare.length === 0 ? (
        <div className="text-center text-muted py-4">
          <i
            className="bx bx-bar-chart-square"
            style={{ fontSize: "3rem" }}
          ></i>
          <p className="mb-0 mt-2">No planets to compare</p>
          <small>Select planets to add them to comparison</small>
        </div>
      ) : (
        <div className="comparison-content">
          {/* Visual Size Comparison */}
          <div className="mb-4">
            <label className="form-label text-white fw-semibold mb-3">
              Visual Size Comparison
            </label>
            <div
              className="visual-comparison p-4 rounded"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                minHeight: "200px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: "20px",
                flexWrap: "wrap",
                position: "relative",
              }}
            >
              {planetsToCompare.map((planet, index) => {
                const maxRadius = Math.max(
                  ...planetsToCompare.map((p) => p.radius)
                );
                const scale = Math.min(1, planet.radius / maxRadius);
                const size = 40 + scale * 120; // 40px to 160px

                return (
                  <div
                    key={index}
                    className="planet-visual text-center"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      className="planet-sphere"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 30% 30%, ${getTypeColor(
                          planet.type
                        )}dd, ${getTypeColor(planet.type)}44)`,
                        boxShadow: `0 4px 20px ${getTypeColor(
                          planet.type
                        )}66, inset -10px -10px 20px rgba(0,0,0,0.3)`,
                        border: `2px solid ${getTypeColor(planet.type)}`,
                        position: "relative",
                        transition: "transform 0.3s ease",
                        cursor: "pointer",
                      }}
                      title={`${planet.name}: ${formatNumber(
                        planet.radius
                      )} R⊕`}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      {/* Shine effect */}
                      <div
                        style={{
                          position: "absolute",
                          top: "15%",
                          left: "20%",
                          width: "30%",
                          height: "30%",
                          borderRadius: "50%",
                          background:
                            "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                    <div className="planet-label">
                      <div
                        className="text-white fw-semibold"
                        style={{ fontSize: "0.8rem" }}
                      >
                        {planet.name}
                      </div>
                      <div
                        className="text-white-50"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {formatNumber(planet.radius)} R⊕
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-2">
              <small className="text-white-50">
                <i className="bx bx-info-circle"></i> Planet sizes scaled by
                radius (hover to see details)
              </small>
            </div>
          </div>

          {/* Planet Cards */}
          <div className="row g-2 mb-4">
            {planetsToCompare.map((planet, index) => (
              <div key={index} className="col-md-4">
                <div
                  className="card text-white h-100"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    border: `2px solid ${getTypeColor(planet.type)}`,
                  }}
                >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="card-title mb-0">{planet.name}</h6>
                      {planet.name !== "Earth" && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onRemovePlanet(planet)}
                          aria-label={`Remove ${planet.name} from comparison`}
                        >
                          <i className="bx bx-x"></i>
                        </button>
                      )}
                    </div>
                    <span
                      className={`badge ${getTypeBadgeClass(planet.type)} mb-2`}
                      style={{ fontSize: "0.7rem" }}
                    >
                      {planet.type}
                    </span>
                    <div className="small">
                      <div className="mb-1">
                        <i className="bx bx-sun me-1"></i>{" "}
                        {planet.hostStar || "Unknown"}
                      </div>
                      {planet.distance > 0 && (
                        <div className="mb-1">
                          <i className="bx bx-target-lock me-1"></i>{" "}
                          {formatNumber(planet.distance, 1)} ly
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Charts */}
          <div className="comparison-charts">
            {/* Radius Comparison */}
            <div className="mb-4">
              <label className="form-label text-white fw-semibold">
                Radius (Earth radii)
              </label>
              {planetsToCompare.map((planet, index) => (
                <div key={index} className="mb-2">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-white small">{planet.name}</span>
                    <span className="text-white small">
                      {formatNumber(planet.radius)} R⊕
                    </span>
                  </div>
                  <div
                    className="progress"
                    style={{
                      height: "20px",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="progress-bar"
                      style={{
                        width: `${getBarWidth(planet.radius, "radius")}%`,
                        background: getTypeColor(planet.type),
                      }}
                      role="progressbar"
                      aria-valuenow={planet.radius}
                      aria-valuemin="0"
                      aria-valuemax={getMaxValue("radius")}
                      aria-label={`${planet.name} radius: ${formatNumber(
                        planet.radius
                      )} Earth radii`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mass Comparison */}
            <div className="mb-4">
              <label className="form-label text-white fw-semibold">
                Mass (Earth masses)
              </label>
              {planetsToCompare.map((planet, index) => (
                <div key={index} className="mb-2">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-white small">{planet.name}</span>
                    <span className="text-white small">
                      {formatNumber(planet.mass)} M⊕
                    </span>
                  </div>
                  <div
                    className="progress"
                    style={{
                      height: "20px",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="progress-bar"
                      style={{
                        width: `${getBarWidth(planet.mass, "mass")}%`,
                        background: getTypeColor(planet.type),
                      }}
                      role="progressbar"
                      aria-valuenow={planet.mass}
                      aria-valuemin="0"
                      aria-valuemax={getMaxValue("mass")}
                      aria-label={`${planet.name} mass: ${formatNumber(
                        planet.mass
                      )} Earth masses`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Temperature Comparison */}
            <div className="mb-4">
              <label className="form-label text-white fw-semibold">
                Temperature (Kelvin)
              </label>
              {planetsToCompare.map((planet, index) => (
                <div key={index} className="mb-2">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-white small">{planet.name}</span>
                    <span className="text-white small">
                      {formatNumber(planet.temperature, 0)} K
                    </span>
                  </div>
                  <div
                    className="progress"
                    style={{
                      height: "20px",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="progress-bar"
                      style={{
                        width: `${getBarWidth(
                          planet.temperature,
                          "temperature"
                        )}%`,
                        background: `hsl(${Math.min(
                          planet.temperature / 10,
                          360
                        )}, 70%, 50%)`,
                      }}
                      role="progressbar"
                      aria-valuenow={planet.temperature}
                      aria-valuemin="0"
                      aria-valuemax={getMaxValue("temperature")}
                      aria-label={`${planet.name} temperature: ${formatNumber(
                        planet.temperature,
                        0
                      )} Kelvin`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Distance Comparison */}
            {planetsToCompare.some((p) => p.distance > 0) && (
              <div className="mb-4">
                <label className="form-label text-white fw-semibold">
                  Distance (light-years)
                </label>
                {planetsToCompare.map((planet, index) => (
                  <div key={index} className="mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-white small">{planet.name}</span>
                      <span className="text-white small">
                        {planet.distance > 0
                          ? `${formatNumber(planet.distance, 1)} ly`
                          : "N/A"}
                      </span>
                    </div>
                    {planet.distance > 0 && (
                      <div
                        className="progress"
                        style={{
                          height: "20px",
                          background: "rgba(255,255,255,0.1)",
                        }}
                      >
                        <div
                          className="progress-bar bg-info"
                          style={{
                            width: `${getBarWidth(
                              planet.distance,
                              "distance"
                            )}%`,
                          }}
                          role="progressbar"
                          aria-valuenow={planet.distance}
                          aria-valuemin="0"
                          aria-valuemax={getMaxValue("distance")}
                          aria-label={`${planet.name} distance: ${formatNumber(
                            planet.distance,
                            1
                          )} light-years`}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="d-grid gap-2 mt-4">
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => {
                const json = JSON.stringify(planetsToCompare, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `planet-comparison-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              aria-label="Export comparison data as JSON"
            >
              <i className="bx bx-download"></i> Export Comparison (JSON)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonTool;
