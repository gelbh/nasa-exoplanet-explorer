/**
 * Application constants
 */

// NASA Exoplanet Archive API endpoint
// Use environment variable for production, fallback to localhost for development
// Use relative protocol to match current page (avoid mixed content errors)
const getDefaultApiUrl = () => {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    return `${protocol}//localhost:5000/api/exoplanets`;
  }
  return "http://localhost:5000/api/exoplanets"; // SSR fallback
};

export const EXOPLANET_API_ENDPOINT =
  import.meta.env.VITE_API_URL || getDefaultApiUrl();

// View modes
export const VIEW_MODES = {
  GALAXY: "galaxy",
  GALACTIC_CENTER: "galacticCenter",
  SYSTEM: "system",
  PLANET: "planet",
};

// Interaction thresholds
export const INTERACTION = {
  DRAG_THRESHOLD: 5,
  CLICK_TIME_THRESHOLD: 200, // ms
};

// Animation speeds
export const ANIMATION = {
  DEFAULT_ORBIT_SPEED: 0.005,
  DEFAULT_ROTATION_SPEED: 0.005,
};
