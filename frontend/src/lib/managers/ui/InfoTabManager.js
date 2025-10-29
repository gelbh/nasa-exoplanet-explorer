import { escapeHtml, formatDistance } from "../../utils/helpers.js";
import { getPlanetTypeName, getTypeColor } from "../../utils/constants.js";

/**
 * InfoTabManager
 *
 * Manages the information tab content for different view modes:
 * - Galaxy information and statistics
 * - Star system details and planet composition
 * - Individual planet properties and discovery information
 */
export class InfoTabManager {
  constructor(infoContentTarget) {
    this.infoContentTarget = infoContentTarget;
    this.filterManager = null;
  }

  /**
   * Set filter manager reference
   */
  setFilterManager(filterManager) {
    this.filterManager = filterManager;
  }

  /**
   * Switch to the info tab
   */
  switchToInfoTab() {
    const infoTab = document.getElementById("info-tab");
    if (infoTab) {
      const bsTab = new bootstrap.Tab(infoTab);
      bsTab.show();
    }
  }

  /**
   * Update information tab based on current view mode
   */
  updateInfoTab(viewMode, { currentSystem, currentPlanet, currentStar }) {
    if (!this.infoContentTarget) return;

    if (viewMode === "galaxy") {
      this.updateGalaxyInfo();
    } else if (viewMode === "system" && currentSystem) {
      this.updateSystemInfo(currentSystem);
    } else if (viewMode === "planet" && currentPlanet) {
      this.updatePlanetInfo(currentPlanet);
    } else if (viewMode === "star" && currentStar) {
      this.updateStarInfo(currentStar);
    }
  }

  /**
   * Update info tab with galaxy (Milky Way) information
   */
  updateGalaxyInfo() {
    if (!this.infoContentTarget || !this.filterManager) return;

    const totalSystems = this.filterManager.getNotableSystems().length;
    const totalPlanets = this.filterManager.getAllExoplanets().length;

    const allPlanets = this.filterManager.getAllExoplanets();
    const avgDistance =
      allPlanets.length > 0
        ? (
            allPlanets.reduce((sum, p) => sum + (p.distance || 0), 0) /
            allPlanets.length
          ).toFixed(1)
        : 0;

    const closestPlanet = allPlanets.reduce((closest, planet) => {
      if (!planet.distance) return closest;
      if (!closest || planet.distance < closest.distance) return planet;
      return closest;
    }, null);

    this.infoContentTarget.innerHTML = `
      <div class="info-galaxy">
        <h5 class="text-white mb-3 d-flex align-items-center">
          <i class="bx bx-globe me-2 text-primary"></i> Milky Way Galaxy
        </h5>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Overview</h6>
          <p class="text-white-50 mb-3" style="font-size: 0.9rem; line-height: 1.6;">
            Our galaxy contains an estimated 100-400 billion stars. Currently, we have confirmed
            <strong class="text-white">${totalPlanets.toLocaleString()}</strong> exoplanets across
            <strong class="text-white">${totalSystems.toLocaleString()}</strong> star systems.
          </p>
        </div>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Statistics</h6>
          <div class="info-stats">
            <div class="stat-item mb-3 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-white-50">Total Confirmed Exoplanets</span>
                <span class="badge bg-primary">${totalPlanets.toLocaleString()}</span>
              </div>
            </div>
            <div class="stat-item mb-3 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-white-50">Multi-Planet Systems</span>
                <span class="badge bg-info">${totalSystems.toLocaleString()}</span>
              </div>
            </div>
            <div class="stat-item mb-3 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-white-50">Average Distance</span>
                <span class="badge bg-secondary">${avgDistance} ly</span>
              </div>
            </div>
            ${
              closestPlanet
                ? `
              <div class="stat-item mb-3 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-white-50">Closest Exoplanet</span>
                  <span class="text-white fs-sm">${escapeHtml(
                    closestPlanet.name
                  )}</span>
                </div>
                <div class="text-end mt-1">
                  <span class="badge bg-success">${formatDistance(
                    closestPlanet.distance
                  )}</span>
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="info-section">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">About</h6>
          <p class="text-white-50 mb-2" style="font-size: 0.85rem; line-height: 1.5;">
            The Milky Way is a barred spiral galaxy approximately 13.6 billion years old,
            containing our Solar System. It spans about 100,000 light-years in diameter.
          </p>
          <p class="text-white-50 mb-0" style="font-size: 0.85rem; line-height: 1.5;">
            Click on any star system to explore its planets in detail.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Update info tab with system information
   */
  updateSystemInfo(system) {
    if (!this.infoContentTarget) return;

    const planets = system.planets || [];
    const starName = system.starName || "Unknown";
    const distance = system.distance || planets[0]?.distance || 0;

    const planetTypes = planets.reduce((acc, planet) => {
      const type = planet.type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const avgTemp =
      planets.length > 0 && planets.some((p) => p.temperature)
        ? (
            planets
              .filter((p) => p.temperature)
              .reduce((sum, p) => sum + p.temperature, 0) /
            planets.filter((p) => p.temperature).length
          ).toFixed(0)
        : null;

    const avgRadius =
      planets.length > 0 && planets.some((p) => p.radius)
        ? (
            planets
              .filter((p) => p.radius)
              .reduce((sum, p) => sum + p.radius, 0) /
            planets.filter((p) => p.radius).length
          ).toFixed(2)
        : null;

    const spectralType = planets[0]?.spectralType || null;
    const starTemp = planets[0]?.starTemperature || null;

    this.infoContentTarget.innerHTML = `
      <div class="info-system">
        <h5 class="text-white mb-3 d-flex align-items-center">
          <i class="bx bx-sun me-2 text-warning"></i> ${escapeHtml(starName)}
        </h5>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Star System</h6>
          <div class="info-stats">
            <div class="stat-item mb-2 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-white-50">Distance from Earth</span>
                <span class="badge bg-primary">${formatDistance(
                  distance
                )}</span>
              </div>
            </div>
            <div class="stat-item mb-2 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-white-50">Number of Planets</span>
                <span class="badge bg-info">${planets.length}</span>
              </div>
            </div>
            ${
              spectralType
                ? `
              <div class="stat-item mb-2 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-white-50">Spectral Type</span>
                  <span class="badge bg-secondary">${escapeHtml(
                    spectralType
                  )}</span>
                </div>
              </div>
            `
                : ""
            }
            ${
              starTemp
                ? `
              <div class="stat-item mb-2 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-white-50">Star Temperature</span>
                  <span class="badge bg-warning text-dark">${starTemp} K</span>
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Planetary Composition</h6>
          <div class="planet-types">
            ${Object.entries(planetTypes)
              .map(
                ([type, count]) => `
              <div class="d-flex justify-content-between align-items-center mb-2 p-2 rounded"
                   style="background: rgba(255, 255, 255, 0.03);">
                <span class="text-white-50">${getPlanetTypeName(type)}</span>
                <span class="badge bg-${getTypeColor(type)}">${count}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        ${
          avgTemp || avgRadius
            ? `
          <div class="info-section mb-4">
            <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Average Values</h6>
            <div class="info-stats">
              ${
                avgTemp
                  ? `
                <div class="stat-item mb-2 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="text-white-50">Temperature</span>
                    <span class="badge bg-warning text-dark">${avgTemp} K</span>
                  </div>
                </div>
              `
                  : ""
              }
              ${
                avgRadius
                  ? `
                <div class="stat-item mb-2 p-3 rounded" style="background: rgba(255, 255, 255, 0.05);">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="text-white-50">Radius</span>
                    <span class="badge bg-info">${avgRadius} R⊕</span>
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }

        <div class="info-section">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Planets</h6>
          <div class="planet-list" style="max-height: 200px; overflow-y: auto;">
            ${planets
              .map(
                (planet) => `
              <div class="planet-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.03); cursor: pointer;"
                   onclick="this.closest('[data-controller]').dispatchEvent(new CustomEvent('planet-select', {detail: '${escapeHtml(
                     planet.name
                   )}'}))">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <div class="text-white fw-semibold fs-sm">${escapeHtml(
                      planet.name
                    )}</div>
                    ${
                      planet.temperature
                        ? `
                      <div class="text-white-50" style="font-size: 0.75rem;">${planet.temperature.toFixed(
                        0
                      )} K</div>
                    `
                        : ""
                    }
                  </div>
                  <span class="badge bg-${getTypeColor(
                    planet.type
                  )}">${getPlanetTypeName(planet.type)}</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update info tab with planet information
   */
  updatePlanetInfo(planet) {
    if (!this.infoContentTarget) return;

    const name = planet.name || "Unknown";
    const hostStar = planet.hostStar || "Unknown";
    const type = getPlanetTypeName(planet.type);
    const temperature = planet.temperature
      ? `${planet.temperature.toFixed(0)} K`
      : "Unknown";
    const radius = planet.radius ? `${planet.radius.toFixed(2)} R⊕` : "Unknown";
    const mass = planet.mass ? `${planet.mass.toFixed(2)} M⊕` : "Unknown";
    const distance = planet.distance
      ? formatDistance(planet.distance)
      : "Unknown";
    const orbitalPeriod = planet.orbitalPeriod
      ? `${planet.orbitalPeriod.toFixed(2)} days`
      : "Unknown";
    const semiMajorAxis = planet.semiMajorAxis
      ? `${planet.semiMajorAxis.toFixed(3)} AU`
      : "Unknown";
    const discoveryYear = planet.discoveryYear || "Unknown";
    const discoveryMethod = planet.discoveryMethod || "Unknown";
    const discoveryFacility = planet.discoveryFacility || "Unknown";

    this.infoContentTarget.innerHTML = `
      <div class="info-planet">
        <h5 class="text-white mb-3 d-flex align-items-center">
          <i class="bx bx-planet me-2 text-primary"></i> ${escapeHtml(name)}
        </h5>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Basic Properties</h6>
          <div class="property-grid">
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Host Star</div>
              <div class="text-white fw-semibold">${escapeHtml(hostStar)}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Type</div>
              <div>
                <span class="badge bg-${getTypeColor(
                  planet.type
                )}">${escapeHtml(type)}</span>
              </div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Distance</div>
              <div class="text-white fw-semibold">${distance}</div>
            </div>
          </div>
        </div>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Physical Characteristics</h6>
          <div class="property-grid">
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Temperature</div>
              <div class="text-white fw-semibold">${temperature}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Radius</div>
              <div class="text-white fw-semibold">${radius}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Mass</div>
              <div class="text-white fw-semibold">${mass}</div>
            </div>
          </div>
        </div>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Orbital Parameters</h6>
          <div class="property-grid">
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Orbital Period</div>
              <div class="text-white fw-semibold">${orbitalPeriod}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Semi-Major Axis</div>
              <div class="text-white fw-semibold">${semiMajorAxis}</div>
            </div>
          </div>
        </div>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Discovery Information</h6>
          <div class="property-grid">
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Discovery Year</div>
              <div class="text-white fw-semibold">${discoveryYear}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Method</div>
              <div class="text-white fw-semibold">${escapeHtml(
                discoveryMethod
              )}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Facility</div>
              <div class="text-white fw-semibold">${escapeHtml(
                discoveryFacility
              )}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update info tab with star information
   */
  updateStarInfo(currentStar) {
    if (!this.infoContentTarget) return;

    const starData = currentStar.starData;
    const system = currentStar.system;

    // Extract stellar properties
    const starName = system.starName || "Unknown Star";
    const spectralType = starData.spectralType || "Unknown";
    const stellarTemp = starData.stellarTemp
      ? `${starData.stellarTemp.toFixed(0)} K`
      : "Unknown";
    const stellarRadius = starData.stellarRadius
      ? `${starData.stellarRadius.toFixed(2)} R☉`
      : "Unknown";
    const stellarMass = starData.stellarMass
      ? `${starData.stellarMass.toFixed(2)} M☉`
      : "Unknown";
    const stellarLuminosity = starData.stellarLuminosity
      ? `${Math.pow(10, starData.stellarLuminosity).toFixed(2)} L☉`
      : "Unknown";
    const stellarAge = starData.stellarAge
      ? `${starData.stellarAge.toFixed(2)} Gyr`
      : "Unknown";
    const distance = starData.distance
      ? formatDistance(starData.distance)
      : "Unknown";
    const numberOfPlanets = system.count || system.planets?.length || 0;
    const numberOfStars = starData.numberOfStars || 1;

    // Determine star classification
    let starClass = "Main Sequence Star";
    if (spectralType) {
      const mainClass = spectralType.charAt(0).toUpperCase();
      if (mainClass === "O" || mainClass === "B") {
        starClass = "Blue Giant";
      } else if (mainClass === "A") {
        starClass = "Blue-White Main Sequence";
      } else if (mainClass === "F") {
        starClass = "Yellow-White Main Sequence";
      } else if (mainClass === "G") {
        starClass = "Yellow Main Sequence (Sun-like)";
      } else if (mainClass === "K") {
        starClass = "Orange Main Sequence";
      } else if (mainClass === "M") {
        starClass = "Red Dwarf";
      }
    }

    // Calculate comparison to Sun
    const tempComparison =
      starData.stellarTemp && starData.stellarTemp > 0
        ? ((starData.stellarTemp / 5778) * 100).toFixed(0)
        : null;
    const radiusComparison =
      starData.stellarRadius && starData.stellarRadius > 0
        ? ((starData.stellarRadius / 1.0) * 100).toFixed(0)
        : null;
    const massComparison =
      starData.stellarMass && starData.stellarMass > 0
        ? ((starData.stellarMass / 1.0) * 100).toFixed(0)
        : null;

    this.infoContentTarget.innerHTML = `
      <div class="info-star">
        <h5 class="text-white mb-3 d-flex align-items-center">
          <i class="bx bx-star me-2 text-warning"></i> ${escapeHtml(starName)}
        </h5>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Stellar Classification</h6>
          <div class="property-grid">
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Spectral Type</div>
              <div class="text-white fw-semibold">${escapeHtml(spectralType)}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Classification</div>
              <div class="text-white fw-semibold">${escapeHtml(starClass)}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Temperature</div>
              <div class="text-white fw-semibold">${stellarTemp}</div>
            </div>
          </div>
        </div>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Physical Properties</h6>
          <div class="property-grid">
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Radius</div>
              <div class="text-white fw-semibold">${stellarRadius}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Mass</div>
              <div class="text-white fw-semibold">${stellarMass}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Luminosity</div>
              <div class="text-white fw-semibold">${stellarLuminosity}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Age</div>
              <div class="text-white fw-semibold">${stellarAge}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Distance</div>
              <div class="text-white fw-semibold">${distance}</div>
            </div>
          </div>
        </div>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Comparison to Our Sun</h6>
          <div class="property-grid">
            ${
              tempComparison
                ? `<div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
                <div class="text-white-50 fs-sm">Temperature</div>
                <div class="text-white fw-semibold">${tempComparison}% of Sun</div>
              </div>`
                : ""
            }
            ${
              radiusComparison
                ? `<div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
                <div class="text-white-50 fs-sm">Radius</div>
                <div class="text-white fw-semibold">${radiusComparison}% of Sun</div>
              </div>`
                : ""
            }
            ${
              massComparison
                ? `<div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
                <div class="text-white-50 fs-sm">Mass</div>
                <div class="text-white fw-semibold">${massComparison}% of Sun</div>
              </div>`
                : ""
            }
          </div>
        </div>

        <div class="info-section mb-4">
          <h6 class="text-white-50 mb-3 fs-sm text-uppercase">Planetary System</h6>
          <div class="property-grid">
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Number of Stars</div>
              <div class="text-white fw-semibold">${numberOfStars === 1 ? "Single Star" : `${numberOfStars} Stars (Multiple Star System)`}</div>
            </div>
            <div class="property-item mb-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.05);">
              <div class="text-white-50 fs-sm">Confirmed Planets</div>
              <div class="text-white fw-semibold">${numberOfPlanets}</div>
            </div>
          </div>
        </div>

        <div class="alert alert-info" style="font-size: 0.85rem;">
          <i class="bx bx-info-circle me-1"></i>
          <strong>Note:</strong> The star's surface features (sunspots, granulation, flares, corona) 
          are procedurally generated based on its spectral type and physical properties.
        </div>
      </div>
    `;
  }
}
