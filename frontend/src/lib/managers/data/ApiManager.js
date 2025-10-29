/**
 * ApiManager
 * Handles fetching and processing exoplanet data from NASA API with caching
 */
export class ApiManager {
  constructor(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
    this.exoplanets = [];
    this.isProcessing = false;
    this.pendingCallbacks = []; // Track pending idle/animation frame callbacks
    this.cacheKey = "nasa_exoplanets_cache";
    this.cacheTimestampKey = "nasa_exoplanets_cache_timestamp";
    this.cacheExpiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Check if cached data exists and is still valid
   */
  isCacheValid() {
    try {
      const timestamp = localStorage.getItem(this.cacheTimestampKey);
      if (!timestamp) return false;

      const age = Date.now() - parseInt(timestamp, 10);
      return age < this.cacheExpiration;
    } catch (error) {
      console.warn("Error checking cache validity:", error);
      return false;
    }
  }

  /**
   * Load data from cache
   */
  loadFromCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      return JSON.parse(cached);
    } catch (error) {
      console.warn("Error loading from cache:", error);
      return null;
    }
  }

  /**
   * Save data to cache
   */
  saveToCache(data) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
      localStorage.setItem(this.cacheTimestampKey, Date.now().toString());
    } catch (error) {
      console.warn(
        "Error saving to cache (localStorage might be full):",
        error
      );
    }
  }

  /**
   * Cancel any ongoing batch processing
   */
  cancelProcessing() {
    if (!this.isProcessing) return;

    // Cancel all pending callbacks
    this.pendingCallbacks.forEach((callback) => {
      if (callback.type === "idle") {
        cancelIdleCallback(callback.id);
      } else if (callback.type === "raf") {
        cancelAnimationFrame(callback.id);
      } else if (callback.type === "timeout") {
        clearTimeout(callback.id);
      }
    });

    // Clear tracking arrays
    this.pendingCallbacks = [];
    this.isProcessing = false;
  }

  /**
   * Fetch exoplanets from NASA API (via backend proxy) or load from cache
   * Processes data in batches for smoother UI experience
   */
  async fetchExoplanets(onBatchProcessed, onComplete, onError) {
    // Cancel any existing processing before starting new fetch
    this.cancelProcessing();

    // Mark as processing
    this.isProcessing = true;

    try {
      let data;

      // Try to load from cache first
      if (this.isCacheValid()) {
        const cached = this.loadFromCache();
        if (cached) {
          data = cached;
        }
      }

      // Fetch from API if no valid cache
      if (!data) {
        const response = await fetch(this.apiEndpoint);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        data = await response.json();

        // Save to cache for next time
        this.saveToCache(data);
      }

      // Initialize arrays
      this.exoplanets = [];

      // Process data in batches
      const batchSize = 100;
      let currentBatch = 0;

      const processBatch = () => {
        // Exit if processing was cancelled
        if (!this.isProcessing) return;

        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, data.length);

        // Process this batch of planets
        const batchPlanets = data
          .slice(start, end)
          .map((planet) => this.processPlanetData(planet));

        // Add to collection
        this.exoplanets.push(...batchPlanets);

        // Callback for UI updates
        if (onBatchProcessed) {
          onBatchProcessed(batchPlanets, this.exoplanets);
        }

        // Move to next batch
        currentBatch++;

        // Continue processing if there are more planets
        if (end < data.length) {
          if ("requestIdleCallback" in window) {
            const callbackId = requestIdleCallback(processBatch);
            this.pendingCallbacks.push({ type: "idle", id: callbackId });
          } else {
            // Fallback for browsers without requestIdleCallback (Safari)
            // Use requestAnimationFrame + setTimeout to better mimic idle behavior
            const rafId = requestAnimationFrame(() => {
              const timeoutId = setTimeout(processBatch, 1);
              this.pendingCallbacks.push({ type: "timeout", id: timeoutId });
            });
            this.pendingCallbacks.push({ type: "raf", id: rafId });
          }
        } else {
          // Processing complete
          this.isProcessing = false;
          this.pendingCallbacks = [];

          if (onComplete) {
            onComplete(this.exoplanets);
          }
        }
      };

      // Start processing batches
      processBatch();
    } catch (error) {
      // Clean up processing state on error
      this.isProcessing = false;
      this.pendingCallbacks = [];

      console.error("Error fetching exoplanets:", error);
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Process and classify planet data
   */
  processPlanetData(raw) {
    // Extract and validate with realistic physical bounds
    const radius = Math.max(0.1, Math.min(raw.pl_rade || 1.0, 100)); // 0.1-100 Earth radii
    const mass = Math.max(0.01, Math.min(raw.pl_bmasse || 1.0, 10000)); // 0.01-10000 Earth masses
    const temp = Math.max(0, Math.min(raw.pl_eqt || 288, 10000)); // 0-10000 Kelvin
    const distance = Math.max(0, raw.sy_dist || 0); // parsecs (non-negative)
    const density = raw.pl_dens
      ? Math.max(0.01, Math.min(raw.pl_dens, 50)) // 0.01-50 g/cm³
      : null; // Null if not provided
    const orbitalEccentricity = Math.max(0, Math.min(raw.pl_orbeccen || 0, 1)); // 0-1 (valid range)
    const semiMajorAxis =
      raw.pl_orbsmax && raw.pl_orbsmax > 0 ? raw.pl_orbsmax : null; // AU (positive)
    const insolationFlux =
      raw.pl_insol && raw.pl_insol > 0 ? raw.pl_insol : null; // Earth flux (positive)
    const stellarTemp = Math.max(0, Math.min(raw.st_teff || 5778, 100000)); // 0-100000 Kelvin
    const stellarRadius = Math.max(0.01, Math.min(raw.st_rad || 1.0, 2000)); // 0.01-2000 Solar radii
    const stellarMass = Math.max(0.01, Math.min(raw.st_mass || 1.0, 300)); // 0.01-300 Solar masses
    const stellarLuminosity = raw.st_lum || null; // Log solar luminosity
    const ra = raw.ra || null; // Right Ascension (degrees)
    const dec = raw.dec || null; // Declination (degrees)

    // Orbital mechanics (validated)
    const orbitalInclination = raw.pl_orbincl
      ? Math.max(0, Math.min(raw.pl_orbincl, 180)) // 0-180 degrees
      : null;
    const longitudeOfPeriastron = raw.pl_orblper
      ? Math.max(0, Math.min(raw.pl_orblper, 360)) // 0-360 degrees
      : null;

    // Discovery context
    const discoveryMethod = raw.discoverymethod || null; // e.g., "Transit", "Radial Velocity"
    const discoveryFacility = raw.disc_facility || null; // e.g., "Kepler", "TESS"

    // System context
    const numberOfStars = raw.sy_snum || 1; // Number of stars in system
    const numberOfPlanets = raw.sy_pnum || 1; // Number of planets in system

    // Stellar properties
    const spectralType = raw.st_spectype || null; // e.g., "G2V", "M3V"
    const stellarAge = raw.st_age || null; // Gyr (billion years)

    // Gas giant measurements (validated)
    const massJupiter =
      raw.pl_massj && raw.pl_massj > 0
        ? Math.min(raw.pl_massj, 80) // 0-80 Jupiter masses (brown dwarf limit)
        : null;
    const radiusJupiter =
      raw.pl_radj && raw.pl_radj > 0
        ? Math.min(raw.pl_radj, 10) // 0-10 Jupiter radii
        : null;

    return {
      name: raw.pl_name || "Unknown",
      radius: radius,
      mass: mass,
      temperature: temp,
      density: density,
      orbitalPeriod: raw.pl_orbper || 0,
      orbitalEccentricity: orbitalEccentricity,
      semiMajorAxis: semiMajorAxis,
      insolationFlux: insolationFlux,
      hostStar: raw.hostname || "Unknown",
      distance: distance * 3.26156, // Convert parsecs to light-years
      discoveryYear: raw.disc_year || "Unknown",
      stellarTemp: stellarTemp,
      stellarRadius: stellarRadius,
      stellarMass: stellarMass,
      stellarLuminosity: stellarLuminosity,
      ra: ra, // Right Ascension in degrees
      dec: dec, // Declination in degrees
      orbitalInclination: orbitalInclination,
      longitudeOfPeriastron: longitudeOfPeriastron,
      discoveryMethod: discoveryMethod,
      discoveryFacility: discoveryFacility,
      numberOfStars: numberOfStars,
      numberOfPlanets: numberOfPlanets,
      spectralType: spectralType,
      stellarAge: stellarAge,
      massJupiter: massJupiter,
      radiusJupiter: radiusJupiter,

      type: this.classifyPlanet(radius, temp, density, mass),
      raw: raw,
    };
  }

  /**
   * Classify planet based on radius, temperature, density, and mass
   */
  classifyPlanet(radius, temp, density, mass) {
    // Use density for more accurate classification when available
    if (density !== null && density !== undefined) {
      if (density > 3.5) {
        return radius < 1.5 ? "terrestrial" : "super-earth";
      } else if (density >= 1.0 && density <= 2.5) {
        return "neptune";
      } else if (density < 1.5) {
        return "jupiter";
      }
    }

    // Fallback to radius-based classification
    if (radius < 1.25) {
      return "terrestrial";
    } else if (radius < 2.0) {
      if (mass !== null && mass !== undefined) {
        const expectedMassForRocky = Math.pow(radius, 3.7);
        if (mass < expectedMassForRocky * 1.5) {
          return "super-earth";
        }
      }
      return "super-earth";
    } else if (radius < 4.0) {
      return "neptune";
    } else if (radius < 10.0) {
      return "neptune";
    } else {
      return "jupiter";
    }
  }

  /**
   * Get all exoplanets
   */
  getAllExoplanets() {
    return this.exoplanets;
  }
}
