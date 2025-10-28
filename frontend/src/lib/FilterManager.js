/**
 * FilterManager
 * Handles filtering and searching exoplanet data
 */
export class FilterManager {
  constructor() {
    this.exoplanets = [];
    this.filteredExoplanets = [];
  }

  setExoplanets(exoplanets) {
    this.exoplanets = exoplanets;
    this.filteredExoplanets = exoplanets;
  }

  searchByName(query) {
    if (!query || query.trim() === '') {
      this.filteredExoplanets = this.exoplanets;
      return this.filteredExoplanets;
    }

    const lowerQuery = query.toLowerCase();
    this.filteredExoplanets = this.exoplanets.filter(planet =>
      planet.name.toLowerCase().includes(lowerQuery) ||
      planet.hostStar.toLowerCase().includes(lowerQuery)
    );

    return this.filteredExoplanets;
  }

  applyFilters(filters) {
    this.filteredExoplanets = this.exoplanets.filter(planet => {
      // Type filter
      if (filters.type && filters.type !== '' && planet.type !== filters.type) {
        return false;
      }

      // Temperature range
      if (filters.tempMin !== null && filters.tempMin !== '' && planet.temperature < parseFloat(filters.tempMin)) {
        return false;
      }
      if (filters.tempMax !== null && filters.tempMax !== '' && planet.temperature > parseFloat(filters.tempMax)) {
        return false;
      }

      // Distance filter
      if (filters.distance !== null && filters.distance !== '' && planet.distance > parseFloat(filters.distance)) {
        return false;
      }

      return true;
    });

    return this.filteredExoplanets;
  }

  getFilteredExoplanets() {
    return this.filteredExoplanets;
  }

  getAllExoplanets() {
    return this.exoplanets;
  }

  getRandomPlanet() {
    if (this.filteredExoplanets.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.filteredExoplanets.length);
    return this.filteredExoplanets[randomIndex];
  }

  getPlanetsForSystem(hostStar) {
    return this.exoplanets.filter(planet => planet.hostStar === hostStar);
  }

  getNotableSystems() {
    const systemMap = new Map();

    this.exoplanets.forEach(planet => {
      const starName = planet.hostStar;
      if (!systemMap.has(starName)) {
        systemMap.set(starName, {
          starName,
          planets: [],
          distance: planet.distance
        });
      }
      systemMap.get(starName).planets.push(planet);
    });

    // Filter to multi-planet systems
    return Array.from(systemMap.values())
      .filter(system => system.planets.length > 1)
      .sort((a, b) => b.planets.length - a.planets.length)
      .slice(0, 50); // Top 50 systems
  }
}
