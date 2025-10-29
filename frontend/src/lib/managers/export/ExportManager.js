/**
 * ExportManager
 * Handles exporting and sharing functionality
 */
export class ExportManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
  }

  /**
   * Generate shareable URL with current view state
   * @param {Object} viewState - Current view state
   * @returns {string}
   */
  generateShareableURL(viewState) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();

    if (viewState.mode) {
      params.set("mode", viewState.mode);
    }

    if (viewState.planet) {
      params.set("planet", viewState.planet);
    }

    if (viewState.system) {
      params.set("system", viewState.system);
    }

    if (viewState.camera) {
      params.set("camera", JSON.stringify(viewState.camera));
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log("🔗 Generated shareable URL:", url);
    return url;
  }

  /**
   * Parse URL parameters to restore view state
   * @returns {Object|null}
   */
  parseURLState() {
    const params = new URLSearchParams(window.location.search);
    const state = {};

    if (params.has("mode")) {
      state.mode = params.get("mode");
    }

    if (params.has("planet")) {
      state.planet = params.get("planet");
    }

    if (params.has("system")) {
      state.system = params.get("system");
    }

    if (params.has("camera")) {
      try {
        state.camera = JSON.parse(params.get("camera"));
      } catch (_e) {
        console.warn("Failed to parse camera state from URL");
      }
    }

    return Object.keys(state).length > 0 ? state : null;
  }

  /**
   * Copy text to clipboard
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  }

  /**
   * Share via Web Share API if available
   * @param {Object} shareData
   * @returns {Promise<boolean>}
   */
  async shareViaWebAPI(shareData) {
    if (!navigator.share) {
      console.warn("Web Share API not supported");
      return false;
    }

    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
      }
      return false;
    }
  }

  /**
   * Capture screenshot of canvas
   * @param {number} width - Screenshot width
   * @param {number} height - Screenshot height
   * @returns {Promise<Blob>}
   */
  async captureScreenshot(width = 1920, height = 1080) {
    if (!this.sceneManager || !this.sceneManager.renderer) {
      throw new Error("Scene manager not initialized");
    }

    const canvas = this.sceneManager.renderer.domElement;
    
    // Store original size
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    try {
      // Render at high resolution
      this.sceneManager.renderer.setSize(width, height);
      this.sceneManager.render();

      // Get canvas data
      // Note: This can fail if canvas is tainted (cross-origin images without CORS)
      const dataUrl = canvas.toDataURL("image/png");

      // Restore original size
      this.sceneManager.renderer.setSize(originalWidth, originalHeight);
      this.sceneManager.render();

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      console.log(`📸 Screenshot captured: ${width}x${height}`);
      return blob;
    } catch (error) {
      // Restore original size on error
      this.sceneManager.renderer.setSize(originalWidth, originalHeight);
      this.sceneManager.render();
      
      console.error("Screenshot capture failed:", error);
      throw new Error(
        "Failed to capture screenshot. This may occur if the canvas contains cross-origin images without CORS headers."
      );
    }
  }

  /**
   * Download screenshot
   * @param {Blob} blob - Image blob
   * @param {string} filename - Download filename
   */
  downloadScreenshot(blob, filename = `exoplanet-${Date.now()}.png`) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    console.log(`💾 Screenshot downloaded: ${filename}`);
  }

  /**
   * Export planet data as JSON
   * @param {Object} planetData
   * @returns {string}
   */
  exportPlanetDataJSON(planetData) {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      planet: planetData,
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export planet data as CSV
   * @param {Array} planets - Array of planet objects
   * @returns {string}
   */
  exportPlanetsCSV(planets) {
    if (!planets || planets.length === 0) {
      return "";
    }

    // Get all unique keys
    const keys = new Set();
    planets.forEach((planet) => {
      Object.keys(planet).forEach((key) => {
        if (key !== "raw" && typeof planet[key] !== "object") {
          keys.add(key);
        }
      });
    });

    const headers = Array.from(keys);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(","));

    // Add data rows
    planets.forEach((planet) => {
      const values = headers.map((header) => {
        const value = planet[header];
        // Escape commas and quotes
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(","));
    });

    return csvRows.join("\n");
  }

  /**
   * Download file
   * @param {string} content - File content
   * @param {string} filename - Download filename
   * @param {string} mimeType - MIME type
   */
  downloadFile(content, filename, mimeType = "text/plain") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    console.log(`💾 File downloaded: ${filename}`);
  }

  /**
   * Export current view settings
   * @param {Object} settings
   * @returns {string}
   */
  exportSettings(settings) {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      settings,
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import settings
   * @param {string} jsonString
   * @returns {Object|null}
   */
  importSettings(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.settings) {
        throw new Error("Invalid settings format");
      }
      return data.settings;
    } catch (error) {
      console.error("Error importing settings:", error);
      return null;
    }
  }

  /**
   * Generate social media share text
   * @param {Object} planet - Planet data
   * @returns {string}
   */
  generateShareText(planet) {
    if (!planet) {
      return "Exploring exoplanets with NASA Exoplanet Explorer 🌍🔭";
    }

    const temp = planet.temperature ? `${Math.round(planet.temperature)}K` : "unknown";
    const distance = planet.distance ? `${planet.distance.toFixed(1)}ly` : "unknown";

    return `Check out ${planet.name} - an exoplanet ${distance} away with a temperature of ${temp}! 🪐🔭 #Exoplanets #Space`;
  }
}

