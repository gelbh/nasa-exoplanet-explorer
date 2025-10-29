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
   * Uses request deduplication to prevent redundant fetches
   */
  async fetchExoplanets(onBatchProcessed, onComplete, onError) {
    // Request deduplication: if already fetching, queue callbacks and return
    if (this.isProcessing && this.activeFetchPromise) {
      console.log("🔄 Deduplicating fetch request - using active request");
      // Wait for active fetch to complete, then call callbacks with existing data
      try {
        await this.activeFetchPromise;
        if (onComplete && this.exoplanets.length > 0) {
          onComplete(this.exoplanets);
        }
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
      return;
    }

    // Prevent race condition: check and set processing flag atomically
    if (this.isProcessing) {
      this.cancelProcessing();
    }

    // Mark as processing before any async operations
    this.isProcessing = true;
    
    // Create promise for request deduplication
    this.activeFetchPromise = (async () => {

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
        // Retry logic with exponential backoff
        const maxRetries = 3;
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            // Add timeout to prevent hanging forever
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(this.apiEndpoint, {
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            data = await response.json();

            // Save to cache for next time
            this.saveToCache(data);
            break; // Success - exit retry loop
          } catch (error) {
            lastError = error;

            // Don't retry on abort (timeout)
            if (error.name === "AbortError") {
              throw new Error(
                "Request timeout: NASA API is taking too long to respond"
              );
            }

            // If this isn't the last attempt, wait before retrying
            if (attempt < maxRetries - 1) {
              const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5s
              console.warn(
                `API fetch failed (attempt ${
                  attempt + 1
                }/${maxRetries}). Retrying in ${backoffDelay}ms...`
              );
              await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            }
          }
        }

        // If we exhausted all retries, throw the last error
        if (!data) {
          throw new Error(
            `Failed to fetch data after ${maxRetries} attempts: ${
              lastError?.message || "Unknown error"
            }`
          );
        }
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
    } finally {
      // Clear active fetch promise for deduplication
      this.activeFetchPromise = null;
    }
    })(); // End of activeFetchPromise wrapper
    
    // Wait for the promise to complete
    await this.activeFetchPromise;
  }

  /**
   * Process and classify planet data
   */
  processPlanetData(raw) {
    // Extract and validate with realistic physical bounds
    const radius = Math.max(0.1, Math.min(raw.pl_rade || 1.0, 100)); // 0.1-100 Earth radii
    const mass = Math.max(0.01, Math.min(raw.pl_bmasse || 1.0, 10000)); // 0.01-10000 Earth masses
    // Planet equilibrium temperature: Most planets are < 5000K, but allow up to 15000K
    // to accommodate ultra-hot Jupiters and planets around very hot stars
    const temp = Math.max(0, Math.min(raw.pl_eqt || 288, 15000)); // 0-15000 Kelvin
    const distance = Math.max(0, raw.sy_dist || 0); // parsecs (non-negative)
    const density = raw.pl_dens
      ? Math.max(0.01, Math.min(raw.pl_dens, 50)) // 0.01-50 g/cm³
      : null; // Null if not provided
    // Eccentricity: 0 = circular, <1 = elliptical, =1 = parabolic, >1 = hyperbolic
    // Allow up to 1.2 to accommodate measurement uncertainty while filtering clearly invalid data
    const orbitalEccentricity = Math.max(
      0,
      Math.min(raw.pl_orbeccen || 0, 1.2)
    );
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
    const stellarAge = raw.st_age ? Math.max(0, raw.st_age) : null; // Gyr (billion years), non-negative

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
      distance: distance * 3.26156, // Convert parsecs to light-years (1 parsec = 3.26156 light-years)
      discoveryYear: raw.disc_year ? parseInt(raw.disc_year, 10) : null,
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
      } else if (density >= 1.0 && density < 3.5) {
        // Density 1.0-3.5 g/cm³: gas giants (Neptune-like or Jupiter-like)
        return density <= 2.0 ? "jupiter" : "neptune";
      } else if (density < 1.0) {
        // Very low density: gas giant (Jupiter-like)
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
