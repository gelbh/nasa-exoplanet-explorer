import * as THREE from "three";
import * as RealisticPhysics from "../../physics/index.js";
import {
  planetSurfaceVertexShader,
  planetSurfaceFragmentShader,
  tidalLockVertexShader,
  tidalLockFragmentShader,
  gasGiantVertexShader,
  gasGiantFragmentShader,
} from "../shaders/index.js";
import { TextureGenerator } from "./TextureGenerator.js";

/**
 * PlanetMaterialGenerator
 * Handles procedural material generation for planets
 * Uses TextureGenerator for texture creation and provides shader-based materials
 * Enhanced with physically-based rendering
 */
export class PlanetMaterialGenerator {
  /**
   * Initialize the material generator
   * @param {Map} textureCache - Texture cache object from parent renderer
   * @param {Object} solarSystemTextureURLs - Map of planet names to texture URLs
   */
  constructor(textureCache, solarSystemTextureURLs) {
    this.textureCache = textureCache;
    this.solarSystemTextureURLs = solarSystemTextureURLs;
    this.textureLoader = new THREE.TextureLoader();
    this.useRealisticShaders = true; // Toggle for realistic rendering
    this.textureGenerator = new TextureGenerator();
  }

  /**
   * Generate procedural planet material
   * Main entry point for material generation
   * @param {Object} planet - Planet data object
   * @param {Object} options - Rendering options (starPosition, starColor, etc.)
   * @returns {THREE.Material} Generated material for the planet
   */
  generatePlanetMaterial(planet, options = {}) {
    // Check if this is a Solar System planet - use realistic texture
    if (this.isSolarSystemPlanet(planet)) {
      return this.createSolarSystemMaterial(planet);
    }

    // Use realistic shader-based materials if enabled
    if (this.useRealisticShaders && options.starPosition) {
      return this.createRealisticMaterial(planet, options);
    }

    // Otherwise, use procedural generation for exoplanets (legacy mode)
    // Check cache first to avoid regenerating the same texture
    const cacheKey = planet.name;
    let texture = this.textureCache.planet.get(cacheKey);

    if (!texture) {
      // Generate texture if not cached
      const color = this.textureGenerator.getPlanetColor(planet);
      texture = this.textureGenerator.generateBasicTexture(planet, color);

      // Cache the texture for future use
      this.textureCache.planet.set(cacheKey, texture);
    }

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: this.getPlanetRoughness(planet),
      metalness: 0.1,
    });
  }

  /**
   * Create realistic shader-based material with proper physics
   * @param {Object} planet - Planet data object
   * @param {Object} options - { starPosition, starColor, starIntensity, planetRadius }
   * @returns {THREE.ShaderMaterial} Physically accurate shader material
   */
  createRealisticMaterial(planet, options) {
    const {
      starPosition = new THREE.Vector3(5, 3, 5),
      starColor = new THREE.Vector3(1.0, 1.0, 1.0),
      starIntensity = 2.0,
      planetRadius = 1.0,
    } = options;

    // Get realistic physical properties
    const isTidallyLocked = RealisticPhysics.isTidallyLocked(planet);
    const isLavaWorld = RealisticPhysics.isLavaWorld(planet);
    const hasThermalEmission = RealisticPhysics.hasThermalEmission(planet);
    const thermalIntensity =
      RealisticPhysics.getThermalEmissionIntensity(planet);
    const thermalColor = RealisticPhysics.getThermalColor(
      planet.temperature || 300
    );
    const realisticColor = RealisticPhysics.getRealisticColor(planet);

    // Generate or retrieve surface texture
    const cacheKey = planet.name + "_realistic";
    let texture = this.textureCache.planet.get(cacheKey);

    if (!texture) {
      texture = this.textureGenerator.generateEnhancedTexture(
        planet,
        realisticColor
      );
      this.textureCache.planet.set(cacheKey, texture);
    }

    // For gas giants, use specialized shader
    if (planet.type === "jupiter" || planet.type === "neptune") {
      return this.createGasGiantMaterial(planet, texture, {
        starPosition,
        starColor,
        starIntensity,
        realisticColor,
      });
    }

    // For tidally locked planets, use specialized shader
    if (isTidallyLocked) {
      return this.createTidallyLockedMaterial(planet, texture, {
        starPosition,
        starColor,
        starIntensity,
        isLavaWorld,
        thermalColor,
        thermalIntensity,
      });
    }

    // For normal rotating planets, use standard surface shader
    return this.createRotatingPlanetMaterial(planet, texture, {
      starPosition,
      starColor,
      starIntensity,
      hasThermalEmission,
      thermalColor,
      thermalIntensity,
    });
  }

  /**
   * Create gas giant material with atmospheric bands
   */
  createGasGiantMaterial(planet, texture, options) {
    const { starPosition, starColor, starIntensity, realisticColor } = options;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        bandTexture: { value: texture },
        starPosition: { value: starPosition },
        starColor: { value: starColor },
        starIntensity: { value: starIntensity },
        rotationOffset: { value: 0.0 },
        baseColor: {
          value: new THREE.Vector3(
            realisticColor.r,
            realisticColor.g,
            realisticColor.b
          ),
        },
        turbulence: { value: planet.type === "jupiter" ? 0.15 : 0.08 },
      },
      vertexShader: gasGiantVertexShader,
      fragmentShader: gasGiantFragmentShader,
      side: THREE.FrontSide,
    });

    // Store for animation
    material.userData.isGasGiant = true;

    return material;
  }

  /**
   * Create tidally locked planet material
   */
  createTidallyLockedMaterial(planet, texture, options) {
    const {
      starPosition,
      starColor,
      starIntensity,
      isLavaWorld,
      thermalColor,
      thermalIntensity,
    } = options;

    const tempDiff = RealisticPhysics.getDayNightTemperatureDiff(planet);
    const realisticColor = RealisticPhysics.getRealisticColor(planet);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        surfaceTexture: { value: texture },
        starPosition: { value: starPosition },
        starColor: { value: starColor },
        starIntensity: { value: starIntensity },
        daySideColor: {
          value: new THREE.Vector3(
            realisticColor.r,
            realisticColor.g,
            realisticColor.b
          ),
        },
        nightSideColor: {
          value: new THREE.Vector3(
            thermalColor.r,
            thermalColor.g,
            thermalColor.b
          ),
        },
        temperature: { value: planet.temperature || 300 },
        nightSideEmission: { value: thermalIntensity },
        isLavaWorld: { value: isLavaWorld },
      },
      vertexShader: tidalLockVertexShader,
      fragmentShader: tidalLockFragmentShader,
      side: THREE.FrontSide,
    });

    material.userData.isTidallyLocked = true;

    return material;
  }

  /**
   * Create rotating planet material with day-night cycle
   */
  createRotatingPlanetMaterial(planet, texture, options) {
    const {
      starPosition,
      starColor,
      starIntensity,
      hasThermalEmission,
      thermalColor,
      thermalIntensity,
    } = options;

    const emissiveColor = hasThermalEmission
      ? new THREE.Vector3(thermalColor.r, thermalColor.g, thermalColor.b)
      : new THREE.Vector3(0, 0, 0);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        surfaceTexture: { value: texture },
        starPosition: { value: starPosition },
        starColor: { value: starColor },
        starIntensity: { value: starIntensity },
        planetRadius: { value: 1.0 },
        hasClouds: { value: false },
        cloudTexture: { value: null },
        cloudOpacity: { value: 0.0 },
        emissiveColor: { value: emissiveColor },
        emissiveIntensity: { value: thermalIntensity },
        ambientLight: { value: 0.05 },
      },
      vertexShader: planetSurfaceVertexShader,
      fragmentShader: planetSurfaceFragmentShader,
      side: THREE.FrontSide,
    });

    return material;
  }

  /**
   * Check if a planet is from our Solar System
   * @param {Object} planet - Planet data object
   * @returns {boolean} True if planet is from Solar System
   */
  isSolarSystemPlanet(planet) {
    return (
      planet.hostStar === "Sun" && this.solarSystemTextureURLs[planet.name]
    );
  }

  /**
   * Create realistic material for Solar System planets
   * Loads actual texture images for accurate planetary surfaces
   * @param {Object} planet - Planet data object
   * @returns {THREE.Material} Material with loaded or fallback texture
   */
  createSolarSystemMaterial(planet) {
    const material = new THREE.MeshStandardMaterial({
      roughness: this.getPlanetRoughness(planet),
      metalness: planet.name === "Earth" ? 0.3 : 0.1,
    });

    // Load texture asynchronously
    const textureURL = this.solarSystemTextureURLs[planet.name];
    if (textureURL) {
      this.textureLoader.load(
        textureURL,
        (texture) => {
          material.map = texture;
          material.needsUpdate = true;
        },
        undefined,
        (error) => {
          console.warn(
            `Failed to load texture for ${planet.name}, using procedural texture`
          );
          // Fallback to procedural texture
          const color = this.textureGenerator.getPlanetColor(planet);
          material.map = this.textureGenerator.generateBasicTexture(
            planet,
            color
          );
          material.needsUpdate = true;
        }
      );
    }

    // Special handling for Earth - add specular map for oceans
    if (planet.name === "Earth") {
      material.roughness = 0.7;
      material.metalness = 0.2;
    }

    // Special handling for Saturn - it has rings
    if (planet.name === "Saturn") {
      material.roughness = 0.8;
    }

    return material;
  }

  /**
   * Get planet surface roughness
   * Determines material roughness based on planet properties
   * @param {Object} planet - Planet data object
   * @returns {number} Roughness value (0.0 to 1.0)
   */
  getPlanetRoughness(planet) {
    if (planet.type === "jupiter" || planet.type === "neptune") {
      return 0.7;
    }

    if (planet.density !== null && planet.density !== undefined) {
      if (planet.density > 5.0) return 0.95;
      else if (planet.density > 3.5) return 0.85;
    }

    if (planet.temperature > 1000) return 0.6;

    return 0.9;
  }

  /**
   * Utility method for backwards compatibility
   * @deprecated Use textureGenerator.hashCode() instead
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Utility method for backwards compatibility
   * @deprecated Use textureGenerator.seededRandom() instead
   */
  seededRandom(seed) {
    let value = seed;
    return function () {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }
}
