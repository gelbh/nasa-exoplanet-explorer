/**
 * FilterManager
 * Handles search and filtering logic for exoplanets
 */
import { generateSolarSystemData } from "./SolarSystemData.js";

export class FilterManager {
  constructor() {
    this.exoplanets = [];
    this.filteredExoplanets = [];
    // Cache for unified search results
    this.unifiedSearchCache = null;
    this.unifiedSearchCacheQuery = null;
  }

  /**
   * Set the exoplanets list
   */
  setExoplanets(exoplanets) {
    // Add Solar System to the data
    const solarSystem = generateSolarSystemData();
    this.exoplanets = [...solarSystem, ...exoplanets];
    this.filteredExoplanets = [...this.exoplanets];
    
    // Invalidate search cache when data changes
    this.unifiedSearchCache = null;
    this.unifiedSearchCacheQuery = null;
  }

  /**
   * Search by name or host star
   */
  search(query) {
    const queryLower = query.toLowerCase().trim();

    if (!queryLower) {
      this.filteredExoplanets = [...this.exoplanets];
    } else {
      this.filteredExoplanets = this.exoplanets.filter(
        (planet) =>
          planet.name.toLowerCase().includes(queryLower) ||
          planet.hostStar.toLowerCase().includes(queryLower)
      );
    }

    return this.filteredExoplanets;
  }

  /**
   * Unified search that returns both systems and individual planets
   * Groups planets by system, showing systems as expandable items
   * @param {string} query - Search query
   * @returns {Array} Array of {type: 'system'|'planet', data: {...}, planets: [...]} objects
   */
  searchUnified(query) {
    const queryLower = query.toLowerCase().trim();

    // Check cache for performance
    if (
      this.unifiedSearchCache &&
      this.unifiedSearchCacheQuery === queryLower
    ) {
      return this.unifiedSearchCache;
    }

    let planetsToSearch = queryLower
      ? this.search(query)
      : this.filteredExoplanets;

    // Group planets by host star
    const systemsMap = new Map();

    planetsToSearch.forEach((planet) => {
      const starName = planet.hostStar;

      if (!systemsMap.has(starName)) {
        systemsMap.set(starName, []);
      }
      systemsMap.get(starName).push(planet);
    });

    // Convert to array of results
    const results = [];

    // Add systems (stars with 2+ planets) as expandable items
    systemsMap.forEach((planets, starName) => {
      if (planets.length >= 2) {
        // This is a system
        const systemDistance = planets[0].distance;
        results.push({
          type: "system",
          starName: starName,
          planetCount: planets.length,
          distance: systemDistance,
          planets: planets.sort((a, b) => {
            // Sort planets by orbital period or name
            if (a.orbitalPeriod && b.orbitalPeriod) {
              return a.orbitalPeriod - b.orbitalPeriod;
            }
            return a.name.localeCompare(b.name);
          }),
        });
      } else {
        // Single planet, add as standalone (but include system data for navigation)
        results.push({
          type: "planet",
          planet: planets[0],
          systemData: {
            starName: starName,
            planets: planets,
            distance: planets[0].distance,
          },
        });
      }
    });

    // Sort results: systems first, then standalone planets
    results.sort((a, b) => {
      if (a.type === "system" && b.type !== "system") return -1;
      if (a.type !== "system" && b.type === "system") return 1;

      // Within same type, sort by distance or name
      if (a.type === "system") {
        return a.distance - b.distance;
      } else {
        return a.planet.distance - b.planet.distance;
      }
    });

    // Cache the results for performance
    this.unifiedSearchCache = results;
    this.unifiedSearchCacheQuery = queryLower;

    return results;
  }

  /**
   * Apply filters (type, temperature, distance, discovery method, discovery facility)
   */
  applyFilters(filters) {
    const {
      type,
      tempMin,
      tempMax,
      distMax,
      discoveryMethod,
      discoveryFacility,
    } = filters;

    const tempMinValue = parseFloat(tempMin) || 0;
    const tempMaxValue = parseFloat(tempMax) || Infinity;
    const distMaxValue = parseFloat(distMax) || Infinity;

    // Invalidate unified search cache
    this.unifiedSearchCache = null;
    this.unifiedSearchCacheQuery = null;

    this.filteredExoplanets = this.exoplanets.filter((planet) => {
      const typeMatch = !type || planet.type === type;
      const tempMatch =
        planet.temperature >= tempMinValue &&
        planet.temperature <= tempMaxValue;
      const distMatch = planet.distance <= distMaxValue;

      // NEW: Discovery method filter
      const discoveryMethodMatch =
        !discoveryMethod ||
        (planet.discoveryMethod &&
          planet.discoveryMethod.includes(discoveryMethod));

      // NEW: Discovery facility filter (partial match for flexibility)
      const discoveryFacilityMatch =
        !discoveryFacility ||
        (planet.discoveryFacility &&
          planet.discoveryFacility.includes(discoveryFacility));

      return (
        typeMatch &&
        tempMatch &&
        distMatch &&
        discoveryMethodMatch &&
        discoveryFacilityMatch
      );
    });

    return this.filteredExoplanets;
  }

  /**
   * Apply system filters (filter systems, not individual planets)
   * @param {Object} filters - System filter criteria
   * @returns {Array} Array of filtered system results in unified format
   */
  applySystemFilters(filters) {
    const { minPlanets, distMax, spectralType } = filters;

    const minPlanetsValue = parseInt(minPlanets) || 2;
    const distMaxValue = parseFloat(distMax) || Infinity;

    // Get all systems
    const systems = this.getNotableSystems();

    // Filter systems based on criteria
    const filteredSystems = systems.filter((system) => {
      const planetCountMatch = system.planets.length >= minPlanetsValue;
      const distMatch = system.distance <= distMaxValue;

      // Spectral type filter (check first letter of spectral type)
      const spectralMatch =
        !spectralType ||
        (system.planets[0].spectralType &&
          system.planets[0].spectralType.startsWith(spectralType));

      return planetCountMatch && distMatch && spectralMatch;
    });

    // Convert to unified result format
    return filteredSystems.map((system) => ({
      type: "system",
      starName: system.starName,
      planetCount: system.planets.length,
      distance: system.distance,
      planets: system.planets,
    }));
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    // Invalidate unified search cache
    this.unifiedSearchCache = null;
    this.unifiedSearchCacheQuery = null;

    this.filteredExoplanets = [...this.exoplanets];
    return this.filteredExoplanets;
  }

  /**
   * Get filtered results
   */
  getFilteredExoplanets() {
    return this.filteredExoplanets;
  }

  /**
   * Get a random planet from filtered list
   */
  getRandomPlanet() {
    if (this.filteredExoplanets.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(
      Math.random() * this.filteredExoplanets.length
    );
    return this.filteredExoplanets[randomIndex];
  }

  /**
   * Group planets by their host star system
   * @returns {Map} Map of star names to arrays of planets
   */
  groupByStarSystem() {
    const systems = new Map();

    this.exoplanets.forEach((planet) => {
      const starName = planet.hostStar;
      if (!systems.has(starName)) {
        systems.set(starName, []);
      }
      systems.get(starName).push(planet);
    });

    return systems;
  }

  /**
   * Get multi-planet systems only
   * @param {number} minPlanets - Minimum number of planets required
   * @returns {Map} Map of star names to planet arrays (only systems with >= minPlanets)
   */
  getMultiPlanetSystems(minPlanets = 2) {
    const allSystems = this.groupByStarSystem();
    const multiPlanetSystems = new Map();

    allSystems.forEach((planets, starName) => {
      if (planets.length >= minPlanets) {
        multiPlanetSystems.set(starName, planets);
      }
    });

    return multiPlanetSystems;
  }

  /**
   * Get planets for a specific star system
   * @param {string} starName - Name of the host star
   * @returns {Array} Array of planets in that system
   */
  getPlanetsForSystem(starName) {
    return this.exoplanets.filter((planet) => planet.hostStar === starName);
  }

  /**
   * Get system statistics
   * @returns {Object} Statistics about star systems
   */
  getSystemStatistics() {
    const systems = this.groupByStarSystem();
    const multiPlanetSystems = this.getMultiPlanetSystems();

    const planetCounts = [];
    systems.forEach((planets) => {
      planetCounts.push(planets.length);
    });

    const maxPlanets = Math.max(...planetCounts);
    const largestSystem = [...systems.entries()].find(
      ([_name, planets]) => planets.length === maxPlanets
    );

    return {
      totalSystems: systems.size,
      multiPlanetSystems: multiPlanetSystems.size,
      singlePlanetSystems: systems.size - multiPlanetSystems.size,
      largestSystemName: largestSystem ? largestSystem[0] : null,
      largestSystemPlanetCount: maxPlanets,
      averagePlanetsPerSystem:
        planetCounts.reduce((a, b) => a + b, 0) / planetCounts.length,
    };
  }

  /**
   * Search for star systems
   * @param {string} query - Search query
   * @returns {Array} Array of {starName, planets[]} objects
   */
  searchSystems(query) {
    const queryLower = query.toLowerCase().trim();
    const systems = this.groupByStarSystem();
    const results = [];

    systems.forEach((planets, starName) => {
      if (starName.toLowerCase().includes(queryLower)) {
        results.push({
          starName: starName,
          planets: planets,
        });
      }
    });

    return results;
  }

  /**
   * Get notable multi-planet systems
   * (Systems with 3+ planets, sorted by planet count)
   * @returns {Array} Array of {starName, planets[], count} objects
   */
  getNotableSystems() {
    const systems = this.getMultiPlanetSystems(3);
    const notable = [];

    systems.forEach((planets, starName) => {
      // Calculate average distance for the system
      const distances = planets.map(p => p.distance).filter(d => d != null && d > 0);
      const systemDistance = distances.length > 0
        ? distances.reduce((sum, d) => sum + d, 0) / distances.length
        : (planets[0]?.distance || 0);

      notable.push({
        starName: starName,
        planets: planets,
        count: planets.length,
        distance: systemDistance, // Add distance for galactic positioning
      });
    });

    // Sort by planet count (descending)
    notable.sort((a, b) => b.count - a.count);

    return notable;
  }

  /**
   * Get a random multi-planet system
   * @param {number} minPlanets - Minimum number of planets required
   * @returns {Object} {starName, planets[]} or null
   */
  getRandomSystem(minPlanets = 2) {
    const systems = this.getMultiPlanetSystems(minPlanets);
    const systemArray = Array.from(systems.entries());

    if (systemArray.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * systemArray.length);
    const [starName, planets] = systemArray[randomIndex];

    return {
      starName: starName,
      planets: planets,
    };
  }

  /**
   * Get all exoplanets (unfiltered)
   * @returns {Array} All exoplanets
   */
  getAllExoplanets() {
    return this.exoplanets;
  }
}
