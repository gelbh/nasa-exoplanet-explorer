/**
 * ApiManager
 * Handles fetching and processing exoplanet data from NASA API via backend
 */
export class ApiManager {
  constructor(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
    this.exoplanets = [];
    this.isProcessing = false;
    this.pendingCallbacks = [];
  }

  /**
   * Cancel any ongoing batch processing
   */
  cancelProcessing() {
    if (!this.isProcessing) return;

    this.pendingCallbacks.forEach((callback) => {
      if (callback.type === 'idle') {
        cancelIdleCallback(callback.id);
      } else if (callback.type === 'raf') {
        cancelAnimationFrame(callback.id);
      } else if (callback.type === 'timeout') {
        clearTimeout(callback.id);
      }
    });

    this.pendingCallbacks = [];
    this.isProcessing = false;
  }

  /**
   * Fetch exoplanets from backend API
   * Processes data in batches for smoother UI experience
   */
  async fetchExoplanets(onBatchProcessed, onComplete, onError) {
    this.cancelProcessing();
    this.isProcessing = true;

    try {
      const response = await fetch(this.apiEndpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.exoplanets = [];

      // Process data in batches
      const batchSize = 100;
      let currentBatch = 0;

      const processBatch = () => {
        if (!this.isProcessing) return;

        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, data.length);

        const batchPlanets = data
          .slice(start, end)
          .map((planet) => this.processPlanetData(planet));

        this.exoplanets.push(...batchPlanets);

        if (onBatchProcessed) {
          onBatchProcessed(batchPlanets, this.exoplanets);
        }

        currentBatch++;

        if (end < data.length) {
          if ('requestIdleCallback' in window) {
            const callbackId = requestIdleCallback(processBatch);
            this.pendingCallbacks.push({ type: 'idle', id: callbackId });
          } else {
            const rafId = requestAnimationFrame(() => {
              const timeoutId = setTimeout(processBatch, 1);
              this.pendingCallbacks.push({ type: 'timeout', id: timeoutId });
            });
            this.pendingCallbacks.push({ type: 'raf', id: rafId });
          }
        } else {
          this.isProcessing = false;
          this.pendingCallbacks = [];

          if (onComplete) {
            onComplete(this.exoplanets);
          }
        }
      };

      processBatch();
    } catch (error) {
      this.isProcessing = false;
      this.pendingCallbacks = [];
      console.error('Error fetching exoplanets:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Process and classify planet data
   */
  processPlanetData(raw) {
    const radius = Math.max(0.1, Math.min(raw.pl_rade || 1.0, 100));
    const mass = Math.max(0.01, Math.min(raw.pl_bmasse || 1.0, 10000));
    const temp = Math.max(0, Math.min(raw.pl_eqt || 288, 10000));
    const distance = Math.max(0, raw.sy_dist || 0);
    const density = raw.pl_dens ? Math.max(0.01, Math.min(raw.pl_dens, 50)) : null;

    return {
      name: raw.pl_name || 'Unknown',
      radius,
      mass,
      temperature: temp,
      density,
      orbitalPeriod: raw.pl_orbper || 0,
      semiMajorAxis: raw.pl_orbsmax || null,
      hostStar: raw.hostname || 'Unknown',
      distance: distance * 3.26156, // Convert parsecs to light-years
      discoveryYear: raw.disc_year || 'Unknown',
      stellarTemp: Math.max(0, Math.min(raw.st_teff || 5778, 100000)),
      stellarRadius: Math.max(0.01, Math.min(raw.st_rad || 1.0, 2000)),
      numberOfPlanets: raw.sy_pnum || 1,
      type: this.classifyPlanet(radius, temp, density, mass),
      raw
    };
  }

  /**
   * Classify planet based on radius, temperature, density, and mass
   */
  classifyPlanet(radius, temp, density, mass) {
    if (density !== null && density !== undefined) {
      if (density > 3.5) {
        return radius < 1.5 ? 'terrestrial' : 'super-earth';
      } else if (density >= 1.0 && density <= 2.5) {
        return 'neptune';
      } else if (density < 1.5) {
        return 'jupiter';
      }
    }

    if (radius < 1.25) {
      return 'terrestrial';
    } else if (radius < 2.0) {
      return 'super-earth';
    } else if (radius < 4.0) {
      return 'neptune';
    } else {
      return 'jupiter';
    }
  }

  getAllExoplanets() {
    return this.exoplanets;
  }
}
