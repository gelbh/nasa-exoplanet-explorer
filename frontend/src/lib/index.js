/**
 * Barrel export for lib directory
 * Provides centralized access to all library modules
 */

// Rendering - Planets
export { PlanetRenderer } from "./rendering/planets/PlanetRenderer.js";
export { PlanetMaterialGenerator } from "./rendering/planets/PlanetMaterialGenerator.js";
export { PlanetAtmosphereRenderer } from "./rendering/planets/PlanetAtmosphereRenderer.js";
export { PlanetRingRenderer } from "./rendering/planets/PlanetRingRenderer.js";
export { TextureGenerator } from "./rendering/planets/TextureGenerator.js";

// Rendering - Stars
export { StarRenderer } from "./rendering/stars/StarRenderer.js";

// Rendering - Scenes
export { SceneManager } from "./rendering/scenes/SceneManager.js";
export { SystemRenderer } from "./rendering/scenes/SystemRenderer.js";
export { GalaxyRenderer } from "./rendering/scenes/GalaxyRenderer.js";
export { OrbitalMechanics } from "./rendering/scenes/OrbitalMechanics.js";

// Rendering - Shaders
export * from "./rendering/shaders/index.js";

// Managers - Data
export { ApiManager } from "./managers/data/ApiManager.js";
export { FilterManager } from "./managers/data/FilterManager.js";
export { generateSolarSystemData } from "./managers/data/SolarSystemData.js";

// Managers - UI
export { UIManager } from "./managers/ui/UIManager.js";
export { InfoTabManager } from "./managers/ui/InfoTabManager.js";
export { PanelManager } from "./managers/ui/PanelManager.js";
export { TooltipManager } from "./managers/ui/TooltipManager.js";

// Managers - Interactions
export { CameraManager } from "./managers/interactions/CameraManager.js";
export { SearchCoordinator } from "./managers/interactions/SearchCoordinator.js";

// Managers - Settings
export { SettingsManager } from "./managers/settings/SettingsManager.js";

// Physics
export * as RealisticPhysics from "./physics/index.js";

// Utils
export * from "./utils/helpers.js";
export * from "./utils/constants.js";
