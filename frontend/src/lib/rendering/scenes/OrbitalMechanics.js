import * as THREE from "three";

/**
 * OrbitalMechanics
 * Handles orbital calculations and scaling for planetary systems
 */
export class OrbitalMechanics {
  constructor() {
    this.useRealisticDistances = false;
    this.multiStarMinOrbitRadius = null;
  }

  /**
   * Set realistic distances mode
   * @param {boolean} realistic - Whether to use realistic distances
   */
  setRealisticDistances(realistic) {
    this.useRealisticDistances = realistic;
  }

  /**
   * Set minimum orbit radius for multi-star systems
   * @param {number} radius - Minimum radius
   */
  setMultiStarMinOrbitRadius(radius) {
    this.multiStarMinOrbitRadius = radius;
  }

  /**
   * Calculate orbit radius with proper scaling
   * @param {Object} planet - Planet data
   * @param {number} index - Planet index in system
   * @param {number} scaleFactor - Scale factor for visualization
   * @returns {number} Calculated orbit radius
   */
  calculateOrbitRadius(planet, index, scaleFactor) {
    let orbitRadius;

    // Use semi-major axis if available (most accurate)
    if (planet.semiMajorAxis && planet.semiMajorAxis > 0) {
      orbitRadius = planet.semiMajorAxis * scaleFactor;
    }
    // Fallback to orbital period (Kepler's third law approximation)
    else if (planet.orbitalPeriod && planet.orbitalPeriod > 0) {
      // R^3 ∝ T^2 (simplified, assuming solar-mass star)
      const au = Math.pow(planet.orbitalPeriod / 365.25, 2 / 3);
      orbitRadius = au * scaleFactor;
    }
    // Last resort: equal spacing
    else {
      orbitRadius = (index + 1) * 3;
    }

    // In realistic distance mode, don't enforce minimum spacing
    // This preserves the actual relative distances between planets
    if (this.useRealisticDistances) {
      // For multi-star systems, still ensure planets orbit outside the star system
      if (this.multiStarMinOrbitRadius) {
        return Math.max(orbitRadius, this.multiStarMinOrbitRadius);
      }
      return orbitRadius;
    }

    // Compressed mode: ensure minimum spacing between planets for visibility
    let minRadius = 2 + index * 2;

    // For multi-star systems, ensure all planets orbit outside the star system extent
    if (this.multiStarMinOrbitRadius) {
      minRadius = Math.max(minRadius, this.multiStarMinOrbitRadius);
    }

    return Math.max(orbitRadius, minRadius);
  }

  /**
   * Calculate maximum orbit radius in the system
   * @param {Array} planets - Array of planet data
   * @returns {number} Maximum orbit radius
   */
  calculateMaxOrbitRadius(planets) {
    let maxRadius = 0;

    planets.forEach((planet) => {
      if (planet.semiMajorAxis && planet.semiMajorAxis > maxRadius) {
        maxRadius = planet.semiMajorAxis;
      }
    });

    // If no semi-major axis data, use orbital period
    if (maxRadius === 0) {
      planets.forEach((planet) => {
        if (planet.orbitalPeriod) {
          const au = Math.pow(planet.orbitalPeriod / 365.25, 2 / 3);
          if (au > maxRadius) maxRadius = au;
        }
      });
    }

    return maxRadius || 10; // Default if no data
  }

  /**
   * Calculate scale factor to fit system in view
   * @param {number} maxOrbitRadius - Maximum orbit radius in AU
   * @returns {number} Scale factor
   */
  calculateScaleFactor(maxOrbitRadius) {
    if (this.useRealisticDistances) {
      // Realistic mode: use logarithmic scaling for better visualization
      // 1 AU = 3 units (allows viewing of wide-range systems)
      // This shows true relative distances while keeping everything visible
      return 3.0;
    } else {
      // Compressed mode: fit everything into viewable area
      // We want the outermost planet at roughly 15-20 units from center
      const targetMaxRadius = 18;

      if (maxOrbitRadius < 1) {
        // Very compact system (hot Jupiters, etc.)
        return 30;
      } else if (maxOrbitRadius < 5) {
        // Compact system
        return targetMaxRadius / maxOrbitRadius;
      } else if (maxOrbitRadius < 50) {
        // Normal system
        return targetMaxRadius / maxOrbitRadius;
      } else {
        // Very large system
        return targetMaxRadius / maxOrbitRadius;
      }
    }
  }

  /**
   * Calculate planet visual size (scaled for system view)
   * @param {Object} planet - Planet data
   * @returns {number} Calculated planet radius
   */
  calculatePlanetSize(planet) {
    // Scale down planets for system view, but keep them visible
    const baseRadius = Math.max(0.2, Math.min(1.5, planet.radius * 0.3));

    // Ensure gas giants are visibly larger than terrestrials
    if (planet.type === "jupiter") {
      return baseRadius * 1.5;
    } else if (planet.type === "neptune") {
      return baseRadius * 1.2;
    }

    return baseRadius;
  }

  /**
   * Calculate star radius based on stellar data and distance mode
   * @param {Object} stellarData - Stellar data
   * @returns {number} Calculated star radius
   */
  calculateStarRadius(stellarData) {
    const stellarRadius = stellarData.stellarRadius || 1.0; // In solar radii

    if (this.useRealisticDistances) {
      // Realistic mode: 1 solar radius = 0.00465 AU
      // Scale it up by 100x to keep it visible (otherwise it's a tiny dot)
      // This keeps relative sizes accurate while maintaining visibility
      const solarRadiusInAU = 0.00465;
      const scaleFactor = 3.0; // Same as orbit scaling (1 AU = 3 units)
      const visibilityBoost = 100; // Make it visible but keep proportions
      return stellarRadius * solarRadiusInAU * scaleFactor * visibilityBoost;
    } else {
      // Compressed mode: Use clamped visual size
      return Math.max(0.5, Math.min(2, stellarRadius * 0.5));
    }
  }

  /**
   * Calculate positions for multiple stars in a system
   * @param {number} numberOfStars - Number of stars
   * @param {number} starRadius - Radius of star
   * @returns {Array<THREE.Vector3>} Array of star positions
   */
  calculateStarPositions(numberOfStars, starRadius) {
    const positions = [];
    const separation = starRadius * 4; // Distance between stars

    if (numberOfStars === 2) {
      // Binary system: position stars on either side
      positions.push(new THREE.Vector3(-separation / 2, 0, 0));
      positions.push(new THREE.Vector3(separation / 2, 0, 0));
    } else if (numberOfStars === 3) {
      // Triple system: equilateral triangle
      const angle = (Math.PI * 2) / 3;
      for (let i = 0; i < 3; i++) {
        const x = Math.cos(angle * i) * separation;
        const z = Math.sin(angle * i) * separation;
        positions.push(new THREE.Vector3(x, 0, z));
      }
    } else {
      // 4+ stars: circular arrangement
      const angle = (Math.PI * 2) / numberOfStars;
      for (let i = 0; i < numberOfStars; i++) {
        const x = Math.cos(angle * i) * separation;
        const z = Math.sin(angle * i) * separation;
        positions.push(new THREE.Vector3(x, 0, z));
      }
    }

    return positions;
  }

  /**
   * Calculate minimum orbit radius for planets in multi-star systems
   * @param {Object} stellarData - Stellar data
   * @param {number} starRadius - Star radius
   * @returns {number} Minimum orbit radius
   */
  calculateMultiStarMinOrbitRadius(stellarData, starRadius) {
    // Account for star radius, glow (1.5x), and corona (2x for hot stars)
    const maxStarExtent = stellarData.stellarTemp > 6000 ? 2.0 : 1.5;
    const separation = starRadius * 4; // Distance between stars

    // For circular arrangements (3+ stars), planets must orbit outside
    // the circle that contains all stars plus their glows
    // Add extra margin for safety and visual clarity (1.5x buffer)
    return (separation + starRadius * maxStarExtent) * 1.5;
  }
}
