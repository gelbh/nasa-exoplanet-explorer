import * as THREE from "three";
import { getStarColor, hashCode, seededRandom } from "../../utils/helpers.js";
import { StarRenderer } from "../stars/StarRenderer.js";
import { OrbitalMechanics } from "./OrbitalMechanics.js";

/**
 * SystemRenderer
 * Handles rendering multiple planets in a single star system
 * with realistic orbital spacing and mechanics
 */
export class SystemRenderer {
  constructor(scene, planetRenderer) {
    this.scene = scene;
    this.planetRenderer = planetRenderer;
    this.systemPlanets = [];
    this.centralStar = null;
    this.dynamicStarLight = null;
    this.orbitLines = [];
    this.planetMeshes = [];
    this.animationTime = 0;
    this.showAtmospheres = false; // Toggle for atmosphere visibility
    this.multiStarMinOrbitRadius = null; // Minimum orbit radius for multi-star systems
    this.useRealisticStars = true; // Toggle for realistic star rendering
    this.useRealisticDistances = false; // Toggle for realistic orbital distances (vs compressed)

    // Use the material generator from the planet renderer
    this.materialGenerator = planetRenderer.materialGenerator;

    // Initialize star renderer for realistic stars
    this.starRenderer = new StarRenderer(scene);

    // Initialize orbital mechanics calculator
    this.orbitalMechanics = new OrbitalMechanics();
  }

  /**
   * Render entire planetary system
   * @param {Array} planets - Array of planet data for the same star system
   * @param {boolean} animateOrbits - Whether to animate planet orbits
   */
  renderSystem(planets, animateOrbits = false, useInclination = false) {
    // Clean up any existing system
    this.cleanup();

    if (!planets || planets.length === 0) {
      return;
    }

    // Store inclination setting
    this.useInclination = useInclination;

    // Sort planets by orbital distance (semi-major axis)
    const sortedPlanets = [...planets].sort((a, b) => {
      const aOrbit = a.semiMajorAxis || a.orbitalPeriod || 0;
      const bOrbit = b.semiMajorAxis || b.orbitalPeriod || 0;
      return aOrbit - bOrbit;
    });

    this.systemPlanets = sortedPlanets;

    // Get the stellar properties from the first planet (all share same star)
    const stellarData = sortedPlanets[0];

    // Add central star
    this.addCentralStar(stellarData);

    // Calculate scaling factor for orbit visualization
    const maxOrbitRadius = this.calculateMaxOrbitRadius(sortedPlanets);
    const scaleFactor = this.calculateScaleFactor(maxOrbitRadius);

    // Render each planet with its orbit
    sortedPlanets.forEach((planet, index) => {
      this.renderPlanetInSystem(
        planet,
        index,
        scaleFactor,
        animateOrbits,
        useInclination
      );
    });

    return {
      maxOrbitRadius,
      scaleFactor,
      planetCount: sortedPlanets.length,
    };
  }

  /**
   * Render a single planet within the system
   */
  renderPlanetInSystem(
    planet,
    index,
    scaleFactor,
    animateOrbits,
    useInclination = false
  ) {
    // Calculate orbit radius based on semi-major axis or orbital period
    const orbitRadius = this.calculateOrbitRadius(planet, index, scaleFactor);

    // Calculate planet visual size (scaled down for system view)
    const planetRadius = this.calculatePlanetSize(planet);

    // Create planet mesh
    const planetMesh = this.createPlanetMesh(planet, planetRadius);

    // Position planet on its orbit
    const initialAngle = Math.random() * Math.PI * 2; // Random starting position
    planetMesh.position.set(
      Math.cos(initialAngle) * orbitRadius,
      0,
      Math.sin(initialAngle) * orbitRadius
    );

    // Store planet data for animation
    planetMesh.userData = {
      planet: planet,
      orbitRadius: orbitRadius,
      orbitalPeriod: planet.orbitalPeriod || 365 * (index + 1),
      currentAngle: initialAngle,
      animateOrbits: animateOrbits,
    };

    this.planetMeshes.push(planetMesh);
    this.scene.add(planetMesh);

    // Add orbit line
    this.addOrbitLine(orbitRadius, planet, useInclination);

    // Add planet label
    this.addPlanetLabel(planetMesh, planet.name, planetRadius);

    // Add rings for Saturn or other ringed planets
    this.addPlanetRings(planet, planetRadius, planetMesh);
  }

  /**
   * Calculate orbit radius with proper scaling
   */
  calculateOrbitRadius(planet, index, scaleFactor) {
    return this.orbitalMechanics.calculateOrbitRadius(
      planet,
      index,
      scaleFactor
    );
  }

  /**
   * Calculate maximum orbit radius in the system
   */
  calculateMaxOrbitRadius(planets) {
    return this.orbitalMechanics.calculateMaxOrbitRadius(planets);
  }

  /**
   * Calculate scale factor to fit system in view
   */
  calculateScaleFactor(maxOrbitRadius) {
    return this.orbitalMechanics.calculateScaleFactor(maxOrbitRadius);
  }

  /**
   * Calculate planet visual size (scaled for system view)
   */
  calculatePlanetSize(planet) {
    return this.orbitalMechanics.calculatePlanetSize(planet);
  }

  /**
   * Create planet mesh with material
   */
  createPlanetMesh(planet, radius) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);

    // Get star color for realistic rendering
    const starColor = this.getStarColorVector(planet);

    // Generate material with realistic shader support
    const material = this.materialGenerator.generatePlanetMaterial(planet, {
      starPosition: new THREE.Vector3(0, 0, 0), // Star at origin in system view
      starColor: starColor,
      starIntensity: 2.0 + (planet.stellarLuminosity || 0) * 0.3,
      planetRadius: radius,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Store base radius in userData
    let actualRadius = radius;

    // Add simple atmosphere for gas giants (only if enabled)
    if (
      (planet.type === "jupiter" || planet.type === "neptune") &&
      this.showAtmospheres
    ) {
      const atmosphereRadius = radius * 1.15;
      const atmosphereGeometry = new THREE.SphereGeometry(
        atmosphereRadius,
        32,
        32
      );
      const atmosphereColor = planet.type === "jupiter" ? 0xf8e8d8 : 0xa8c8f8;
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: atmosphereColor,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      atmosphere.name = "atmosphere"; // Tag for easy identification
      mesh.add(atmosphere);
      actualRadius = atmosphereRadius; // Update actual size if atmosphere is shown
    }

    // Store actual rendered radius (including atmosphere if present)
    mesh.userData.actualRadius = actualRadius;
    mesh.userData.baseRadius = radius;

    return mesh;
  }

  /**
   * Get star color as THREE.Vector3 for shaders
   */
  getStarColorVector(planet) {
    const starColor = getStarColor({
      spectralType: planet.spectralType,
      stellarTemp: planet.stellarTemp,
    });

    // Convert THREE.Color hex to RGB vector
    const color = new THREE.Color(starColor);
    return new THREE.Vector3(color.r, color.g, color.b);
  }

  /**
   * Add rings to a planet if appropriate
   * @param {Object} planet - Planet data object
   * @param {number} planetRadius - Radius of the planet mesh
   * @param {THREE.Mesh} planetMesh - The planet mesh to attach rings to
   */
  addPlanetRings(planet, planetRadius, planetMesh) {
    const ringRenderer = this.planetRenderer.ringRenderer;

    // Add rings for Saturn (always, bright and prominent)
    if (planet.name === "Saturn") {
      ringRenderer.addSaturnRings(planetRadius, planetMesh);
    }
    // Add rings for Neptune (always, faint and dark)
    else if (planet.name === "Neptune") {
      ringRenderer.addNeptuneRings(planetRadius, planetMesh);
    }
    // Add rings for other gas giants (30% chance, seeded)
    else if (planet.type === "jupiter" || planet.type === "neptune") {
      // Use seeded random to ensure consistent ring presence for same planet
      const seed = hashCode(planet.name + "_hasRings");
      const random = seededRandom(seed);
      if (random() > 0.7) {
        ringRenderer.addPlanetRings(planet, planetRadius, planetMesh);
      }
    }
  }

  /**
   * Add orbit line for a planet with realistic 3D orientation
   */
  addOrbitLine(radius, planet, useInclination = false) {
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    const segments = 128;

    // Get orbital parameters (only use if enabled)
    const inclination = useInclination ? planet.orbitalInclination || 0 : 0; // degrees
    const longitudeOfPeriastron = useInclination
      ? planet.longitudeOfPeriastron || 0
      : 0; // degrees
    const eccentricity = planet.orbitalEccentricity || 0;

    // Convert to radians
    const incRad = (inclination * Math.PI) / 180;
    const longPerRad = (longitudeOfPeriastron * Math.PI) / 180;

    // Create orbit points with elliptical shape and 3D orientation
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      // Calculate position in orbital plane (elliptical orbit)
      // For simplicity, use circular approximation but account for eccentricity
      const r = radius * (1 - eccentricity * Math.cos(angle));
      let x = Math.cos(angle) * r;
      let y = 0;
      let z = Math.sin(angle) * r;

      // Apply 3D rotation for orbital inclination (only if enabled)
      if (useInclination && inclination !== 0) {
        // Rotate around X-axis for inclination
        const y_rot = y * Math.cos(incRad) - z * Math.sin(incRad);
        const z_rot = y * Math.sin(incRad) + z * Math.cos(incRad);
        y = y_rot;
        z = z_rot;
      }

      // Apply rotation for longitude of periastron (rotation around Z-axis)
      if (useInclination && longitudeOfPeriastron !== 0) {
        const x_rot = x * Math.cos(longPerRad) - y * Math.sin(longPerRad);
        const y_rot = x * Math.sin(longPerRad) + y * Math.cos(longPerRad);
        x = x_rot;
        y = y_rot;
      }

      orbitPoints.push(x, y, z);
    }

    orbitGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(orbitPoints, 3)
    );

    // Color-code orbit lines by planet type
    const orbitColor = this.getOrbitColor(planet.type);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: orbitColor,
      transparent: true,
      opacity: 0.4,
    });

    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);

    // Store orbital parameters for animation
    orbitLine.userData = {
      inclination: incRad,
      longitudeOfPeriastron: longPerRad,
      eccentricity: eccentricity,
    };

    this.orbitLines.push(orbitLine);
    this.scene.add(orbitLine);
  }

  /**
   * Get orbit line color based on planet type
   */
  getOrbitColor(planetType) {
    const colors = {
      terrestrial: 0x22c55e, // Green
      "super-earth": 0x3b82f6, // Blue
      neptune: 0x6366f1, // Indigo
      jupiter: 0xf59e0b, // Amber
    };
    return colors[planetType] || 0x6b7280; // Gray default
  }

  /**
   * Add text label for planet
   */
  addPlanetLabel(planetMesh, name, planetRadius) {
    // Create canvas for label
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 64;

    // Draw label background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, 256, 64);

    // Draw text
    context.font = "Bold 20px Arial";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Extract planet letter (e.g., "Kepler-90 b" -> "b")
    const planetLetter = name.split(" ").pop();
    context.fillText(planetLetter, 128, 32);

    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1, 0.25, 1);
    sprite.position.set(0, planetRadius + 0.5, 0);
    sprite.userData.isLabel = true;
    sprite.visible = false; // Labels hidden by default

    planetMesh.add(sprite);
  }

  /**
   * Add multiple stars for binary/triple star systems
   */
  addMultiStarSystem(stellarData, numberOfStars) {
    const starRadius = Math.max(
      0.5,
      Math.min(2, stellarData.stellarRadius * 0.5)
    );
    const starColor = getStarColor({
      spectralType: stellarData.spectralType,
      stellarTemp: stellarData.stellarTemp,
    });

    // Create a container for the multi-star system
    this.centralStar = new THREE.Group();

    // Position stars in the system
    const starPositions = this.calculateStarPositions(
      numberOfStars,
      starRadius
    );

    // Calculate minimum orbit radius for planets
    // Planets must orbit outside the entire multi-star configuration
    // Account for star radius, glow (1.5x), and corona (2x for hot stars)
    const maxStarExtent = stellarData.stellarTemp > 6000 ? 2.0 : 1.5;
    const separation = starRadius * 4; // Distance between stars

    // For circular arrangements (3+ stars), planets must orbit outside
    // the circle that contains all stars plus their glows
    // Add extra margin for safety and visual clarity (1.5x buffer)
    this.multiStarMinOrbitRadius =
      (separation + starRadius * maxStarExtent) * 1.5;
    this.orbitalMechanics.setMultiStarMinOrbitRadius(
      this.multiStarMinOrbitRadius
    );

    starPositions.forEach((position, index) => {
      const starGeometry = new THREE.SphereGeometry(starRadius, 32, 32);

      // Vary star colors slightly for visual distinction
      let individualStarColor = starColor;
      if (index > 0) {
        // Make companion stars slightly different colors
        individualStarColor = this.adjustColorForCompanion(starColor, index);
      }

      const starMaterial = new THREE.MeshBasicMaterial({
        color: individualStarColor,
      });

      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.copy(position);

      // Add glow
      const glowGeometry = new THREE.SphereGeometry(starRadius * 1.5, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: individualStarColor,
        transparent: true,
        opacity: 0.4,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      star.add(glow);

      this.centralStar.add(star);
    });

    this.scene.add(this.centralStar);
    this.updateLighting(stellarData);
  }

  /**
   * Calculate positions for multiple stars in a system
   */
  calculateStarPositions(numberOfStars, starRadius) {
    return this.orbitalMechanics.calculateStarPositions(
      numberOfStars,
      starRadius
    );
  }

  /**
   * Adjust star color for companion stars
   */
  adjustColorForCompanion(baseColor, companionIndex) {
    // Shift hue slightly for companion stars
    const colorShifts = [
      0xffe5b4, // Slightly warmer
      0xb4d4ff, // Slightly cooler
    ];
    return colorShifts[(companionIndex - 1) % colorShifts.length] || baseColor;
  }

  /**
   * Calculate star radius based on stellar data and distance mode
   */
  calculateStarRadius(stellarData) {
    return this.orbitalMechanics.calculateStarRadius(stellarData);
  }

  /**
   * Add central star (or multiple stars for binary/triple systems)
   */
  addCentralStar(stellarData) {
    const numberOfStars = stellarData.numberOfStars || 1;

    // For binary/triple star systems, create multiple stars
    if (numberOfStars > 1) {
      this.addMultiStarSystem(stellarData, numberOfStars);
      return;
    }

    // Reset multi-star minimum orbit radius for single-star systems
    this.multiStarMinOrbitRadius = null;
    this.orbitalMechanics.setMultiStarMinOrbitRadius(null);

    // Calculate realistic star radius
    const starRadius = this.calculateStarRadius(stellarData);

    // Check if this is our Sun - use realistic texture
    // Note: stellarData is actually a planet object, so we check hostStar
    const starName = stellarData.starName || stellarData.hostStar;
    if (starName === "Sun") {
      this.addRealisticSun(stellarData, starRadius);
      return;
    }

    // Use realistic star renderer if enabled
    if (this.useRealisticStars) {
      this.centralStar = this.starRenderer.createRealisticStar(
        stellarData,
        new THREE.Vector3(0, 0, 0),
        {
          showCorona: true,
          showFlares: stellarData.stellarTemp > 3000,
          animate: true,
          customRadius: starRadius,
        }
      );
      this.scene.add(this.centralStar);
    } else {
      // Legacy: Simple star system (generic)
      const starGeometry = new THREE.SphereGeometry(starRadius, 32, 32);
      const starColor = getStarColor({
        spectralType: stellarData.spectralType,
        stellarTemp: stellarData.stellarTemp,
      });

      const starMaterial = new THREE.MeshBasicMaterial({
        color: starColor, // MeshBasicMaterial is always full brightness (self-lit)
      });

      this.centralStar = new THREE.Mesh(starGeometry, starMaterial);

      // Add glow
      const glowGeometry = new THREE.SphereGeometry(starRadius * 1.5, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: starColor,
        transparent: true,
        opacity: 0.4,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      this.centralStar.add(glow);

      // Add corona for hot stars
      if (stellarData.stellarTemp > 6000) {
        const coronaGeometry = new THREE.SphereGeometry(starRadius * 2, 32, 32);
        const coronaMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.2,
        });
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.centralStar.add(corona);
      }

      this.centralStar.position.set(0, 0, 0);
      this.scene.add(this.centralStar);
    }

    // Update lighting
    this.updateLighting(stellarData);
  }

  /**
   * Add realistic Sun with texture
   */
  addRealisticSun(stellarData, starRadius) {
    const starGeometry = new THREE.SphereGeometry(starRadius, 64, 64);

    // Create material with realistic Sun appearance
    const starMaterial = new THREE.MeshBasicMaterial({
      color: 0xfdb813, // Fallback color if texture fails to load
    });

    this.centralStar = new THREE.Mesh(starGeometry, starMaterial);
    this.centralStar.position.set(0, 0, 0);
    this.scene.add(this.centralStar);

    // Store reference to ensure we can verify the star still exists when texture loads
    const sunMesh = this.centralStar;

    // Load realistic Sun texture from local assets
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/textures/planets/sun.jpg",
      (texture) => {
        // Verify the sun mesh still exists and hasn't been cleaned up
        if (!sunMesh || !sunMesh.parent || sunMesh.material !== starMaterial) {
          console.warn("Sun mesh was cleaned up before texture loaded");
          texture.dispose();
          return;
        }

        // Configure texture properties BEFORE assigning to material
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.flipY = false;
        texture.needsUpdate = true; // Mark texture for GPU upload

        // Apply texture to material
        starMaterial.map = texture;
        starMaterial.color.setHex(0xffffff); // Set to white so texture shows true colors
        starMaterial.needsUpdate = true;

        // Force material and texture update
        sunMesh.material = starMaterial; // Reassign to ensure mesh uses updated material

        // Log for debugging
        console.log("Sun texture loaded and applied successfully");
      },
      undefined,
      (_error) => {
        console.warn(
          "Failed to load Sun texture, using solid color. Ensure sun.jpg exists in public/textures/planets/",
          _error
        );
      }
    );

    // Update lighting with Sun-specific values
    this.updateLighting(stellarData);
  }

  /**
   * Update scene lighting based on stellar properties
   */
  updateLighting(stellarData) {
    if (this.dynamicStarLight) {
      this.scene.remove(this.dynamicStarLight);
    }

    const starColor = getStarColor({
      spectralType: stellarData.spectralType,
      stellarTemp: stellarData.stellarTemp,
    });
    const luminosity = stellarData.stellarLuminosity || 0;
    const intensity = 2.5 + luminosity * 0.3;

    this.dynamicStarLight = new THREE.PointLight(starColor, intensity, 100);
    this.dynamicStarLight.position.set(0, 0, 0);

    this.scene.add(this.dynamicStarLight);
  }

  /**
   * Animate orbital motion
   * Call this in the main animation loop
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {number} speedMultiplier - Speed multiplier (1.0 = 1 orbit per 60 seconds)
   */
  animateOrbits(
    deltaTime = 0.016,
    speedMultiplier = 1.0,
    useInclination = false
  ) {
    this.animationTime += deltaTime;

    this.planetMeshes.forEach((planetMesh) => {
      if (!planetMesh.userData.animateOrbits) return;

      const { orbitRadius, planet } = planetMesh.userData;

      // Calculate angular velocity
      // At speedMultiplier = 1.0: any planet completes 1 full orbit in 60 seconds
      // This gives us a consistent time scale where we can see relative speeds
      const baseOrbitTime = 60.0; // seconds for one complete orbit at speed 1.0
      const angularVelocity = ((2 * Math.PI) / baseOrbitTime) * speedMultiplier;

      // Update angle and normalize to prevent float accumulation over long sessions
      planetMesh.userData.currentAngle += angularVelocity * deltaTime;
      // Keep angle in 0-2π range to prevent floating point drift
      planetMesh.userData.currentAngle =
        planetMesh.userData.currentAngle % (2 * Math.PI);

      // Get orbital parameters (only use if enabled)
      const inclination = useInclination ? planet.orbitalInclination || 0 : 0;
      const longitudeOfPeriastron = useInclination
        ? planet.longitudeOfPeriastron || 0
        : 0;
      const eccentricity = planet.orbitalEccentricity || 0;

      // Convert to radians
      const incRad = (inclination * Math.PI) / 180;
      const longPerRad = (longitudeOfPeriastron * Math.PI) / 180;
      const angle = planetMesh.userData.currentAngle;

      // Calculate position in orbital plane (with eccentricity)
      const r = orbitRadius * (1 - eccentricity * Math.cos(angle));
      let x = Math.cos(angle) * r;
      let y = 0;
      let z = Math.sin(angle) * r;

      // Apply 3D rotation for orbital inclination (only if enabled)
      if (useInclination && inclination !== 0) {
        const y_rot = y * Math.cos(incRad) - z * Math.sin(incRad);
        const z_rot = y * Math.sin(incRad) + z * Math.cos(incRad);
        y = y_rot;
        z = z_rot;
      }

      // Apply rotation for longitude of periastron (only if enabled)
      if (useInclination && longitudeOfPeriastron !== 0) {
        const x_rot = x * Math.cos(longPerRad) - y * Math.sin(longPerRad);
        const y_rot = x * Math.sin(longPerRad) + y * Math.cos(longPerRad);
        x = x_rot;
        y = y_rot;
      }

      // Update planet position with 3D orbital mechanics
      planetMesh.position.set(x, y, z);

      // Rotate planet on its axis
      planetMesh.rotation.y += 0.01;
    });
  }

  /**
   * Rotate all planets on their axes
   */
  rotatePlanets(speed = 0.005) {
    this.planetMeshes.forEach((mesh) => {
      mesh.rotation.y += speed;
    });
  }

  /**
   * Update shader uniforms for all planets in the system
   * Must be called every frame for realistic shaders to work
   * @param {THREE.Camera} camera - The scene camera
   */
  updateShaderUniforms(camera) {
    this.planetMeshes.forEach((mesh) => {
      if (!mesh.material || !mesh.material.uniforms) return;

      // Update camera position for shaders
      if (mesh.material.uniforms.cameraPosition) {
        mesh.material.uniforms.cameraPosition.value.copy(camera.position);
      }

      // Update gas giant rotation offset
      if (mesh.material.userData && mesh.material.userData.isGasGiant) {
        if (mesh.material.uniforms.rotationOffset) {
          mesh.material.uniforms.rotationOffset.value += 0.0002;
        }
      }

      // Update atmosphere for each planet (if it has shader-based atmosphere)
      const atmosphere = mesh.children.find(
        (child) => child.name === "atmosphere"
      );
      if (atmosphere && atmosphere.material && atmosphere.material.uniforms) {
        if (atmosphere.material.uniforms.cameraPosition) {
          atmosphere.material.uniforms.cameraPosition.value.copy(
            camera.position
          );
        }
      }
    });

    // Animate realistic stars
    if (this.useRealisticStars) {
      this.starRenderer.animateStars(0.016);
    }
  }

  /**
   * Get all planet meshes
   */
  getAllPlanetMeshes() {
    return this.planetMeshes;
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    if (this.systemPlanets.length === 0) return null;

    const types = {
      terrestrial: 0,
      "super-earth": 0,
      neptune: 0,
      jupiter: 0,
    };

    let minOrbit = Infinity;
    let maxOrbit = 0;
    let totalMass = 0;
    let avgTemp = 0;

    this.systemPlanets.forEach((planet) => {
      types[planet.type]++;

      if (planet.semiMajorAxis) {
        minOrbit = Math.min(minOrbit, planet.semiMajorAxis);
        maxOrbit = Math.max(maxOrbit, planet.semiMajorAxis);
      }

      if (planet.mass) {
        totalMass += planet.mass;
      }

      avgTemp += planet.temperature;
    });

    avgTemp /= this.systemPlanets.length;

    return {
      starName: this.systemPlanets[0].hostStar,
      planetCount: this.systemPlanets.length,
      types: types,
      orbitalRange:
        minOrbit !== Infinity ? { min: minOrbit, max: maxOrbit } : null,
      totalMass: totalMass,
      avgTemperature: avgTemp,
    };
  }

  /**
   * Get the center and size of the entire system for camera framing
   * @returns {Object} { center: THREE.Vector3, size: { x, y, z } }
   */
  getSystemCenterAndSize() {
    // Default fallback if no system is rendered
    if (this.planetMeshes.length === 0) {
      return {
        center: new THREE.Vector3(0, 0, 0),
        size: { x: 20, y: 20, z: 20 },
      };
    }

    // Calculate bounding box from all planet meshes and their orbits
    let minX = 0,
      maxX = 0,
      minY = 0,
      maxY = 0,
      minZ = 0,
      maxZ = 0;

    this.planetMeshes.forEach((mesh) => {
      const orbitRadius = mesh.userData.orbitRadius || 0;
      const planetRadius =
        mesh.userData.actualRadius || mesh.userData.baseRadius || 0;

      // Account for the full orbital extent
      minX = Math.min(minX, -orbitRadius - planetRadius);
      maxX = Math.max(maxX, orbitRadius + planetRadius);
      minZ = Math.min(minZ, -orbitRadius - planetRadius);
      maxZ = Math.max(maxZ, orbitRadius + planetRadius);

      // Account for vertical extent (for inclined orbits)
      const planet = mesh.userData.planet;
      if (planet && planet.orbitalInclination && this.useInclination) {
        const inclinationRad = (planet.orbitalInclination * Math.PI) / 180;
        const verticalExtent = orbitRadius * Math.sin(inclinationRad);
        minY = Math.min(minY, -verticalExtent - planetRadius);
        maxY = Math.max(maxY, verticalExtent + planetRadius);
      } else {
        minY = Math.min(minY, -planetRadius);
        maxY = Math.max(maxY, planetRadius);
      }
    });

    // Also account for the central star size
    if (this.centralStar) {
      // Get star radius from geometry or default
      let starRadius = 1;
      if (this.centralStar.type === "Group") {
        // Multi-star system - find the largest extent
        this.centralStar.children.forEach((star) => {
          if (star.geometry && star.geometry.parameters) {
            starRadius = Math.max(
              starRadius,
              star.geometry.parameters.radius || 1
            );
          }
        });
      } else if (
        this.centralStar.geometry &&
        this.centralStar.geometry.parameters
      ) {
        starRadius = this.centralStar.geometry.parameters.radius || 1;
      }

      minX = Math.min(minX, -starRadius);
      maxX = Math.max(maxX, starRadius);
      minY = Math.min(minY, -starRadius);
      maxY = Math.max(maxY, starRadius);
      minZ = Math.min(minZ, -starRadius);
      maxZ = Math.max(maxZ, starRadius);
    }

    // Calculate center and size
    const center = new THREE.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );

    const size = {
      x: maxX - minX,
      y: maxY - minY,
      z: maxZ - minZ,
    };

    return { center, size };
  }

  /**
   * Focus on a specific planet (hide others, stop animations)
   * @param {Object} planet - The planet to focus on
   */
  focusOnPlanet(planet) {
    this.planetMeshes.forEach((mesh) => {
      if (mesh.userData.planet.name === planet.name) {
        // Keep the focused planet visible
        mesh.visible = true;
        // Stop its orbital animation
        mesh.userData.animateOrbits = false;
      } else {
        // Hide other planets
        mesh.visible = false;
      }
    });

    // Hide the central star initially (will show when orbit is enabled)
    if (this.centralStar) {
      this.centralStar.visible = false;
    }
    if (this.dynamicStarLight) {
      this.dynamicStarLight.visible = false;
    }

    // Hide all orbit lines initially
    this.orbitLines.forEach((line) => {
      line.visible = false;
    });
  }

  /**
   * Show/hide the central star
   */
  setCentralStarVisibility(visible) {
    if (this.centralStar) {
      this.centralStar.visible = visible;
    }
    if (this.dynamicStarLight) {
      this.dynamicStarLight.visible = visible;
    }
  }

  /**
   * Toggle between realistic and compressed orbital distances
   * @param {boolean} realistic - Whether to use realistic distances
   */
  setRealisticDistances(realistic) {
    this.useRealisticDistances = realistic;
    this.orbitalMechanics.setRealisticDistances(realistic);
  }

  /**
   * Re-render the entire system (used when settings change)
   */
  rerenderSystem() {
    if (this.systemPlanets.length === 0) return;

    // Store current settings AND system planets (cleanup will clear them!)
    const planets = [...this.systemPlanets]; // Create a copy
    const animateOrbits = this.planetMeshes[0]?.userData?.animateOrbits ?? true;
    const useInclination = this.useInclination;

    // Cleanup existing system (this clears this.systemPlanets)
    this.cleanup();

    // Re-render with new settings using our saved copy
    this.renderSystem(planets, animateOrbits, useInclination);
  }

  /**
   * Show orbit line for a specific planet
   */
  showOrbitForPlanet(planet, show = true) {
    const planetIndex = this.planetMeshes.findIndex(
      (mesh) => mesh.userData.planet.name === planet.name
    );

    if (planetIndex >= 0 && this.orbitLines[planetIndex]) {
      this.orbitLines[planetIndex].visible = show;
    }

    // Also enable/disable orbital animation for the planet
    if (planetIndex >= 0) {
      this.planetMeshes[planetIndex].userData.animateOrbits = show;
    }
  }

  /**
   * Return to system view (show all planets, resume animations)
   */
  showAllPlanets() {
    this.planetMeshes.forEach((mesh) => {
      mesh.visible = true;
      mesh.userData.animateOrbits = true;
    });

    if (this.centralStar) {
      this.centralStar.visible = true;
    }
    if (this.dynamicStarLight) {
      this.dynamicStarLight.visible = true;
    }

    this.orbitLines.forEach((line) => {
      line.visible = true;
    });
  }

  /**
   * Toggle atmosphere visibility for all gas giant planets
   */
  toggleAtmospheres(show) {
    this.showAtmospheres = show;

    this.planetMeshes.forEach((mesh) => {
      const planet = mesh.userData.planet;
      const isGasGiant = planet.type === "jupiter" || planet.type === "neptune";

      if (isGasGiant) {
        // Find and toggle existing atmosphere
        const atmosphere = mesh.children.find(
          (child) => child.name === "atmosphere"
        );

        if (show && !atmosphere) {
          // Create new atmosphere
          // Get base radius from userData or fallback to geometry parameters
          const baseRadius =
            mesh.userData.baseRadius || mesh.geometry.parameters.radius;

          // Validate baseRadius to prevent NaN
          if (!baseRadius || isNaN(baseRadius)) {
            console.warn(
              `Cannot create atmosphere for ${planet.name}: invalid radius`
            );
            return;
          }

          const atmosphereRadius = baseRadius * 1.15;
          const atmosphereGeometry = new THREE.SphereGeometry(
            atmosphereRadius,
            32,
            32
          );
          const atmosphereColor =
            planet.type === "jupiter" ? 0xf8e8d8 : 0xa8c8f8;
          const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: atmosphereColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
          });
          const newAtmosphere = new THREE.Mesh(
            atmosphereGeometry,
            atmosphereMaterial
          );
          newAtmosphere.name = "atmosphere";
          mesh.add(newAtmosphere);

          // Update userData if not already set
          if (!mesh.userData.baseRadius) {
            mesh.userData.baseRadius = baseRadius;
          }
          mesh.userData.actualRadius = atmosphereRadius;
        } else if (!show && atmosphere) {
          // Remove atmosphere
          mesh.remove(atmosphere);
          atmosphere.geometry.dispose();
          atmosphere.material.dispose();

          // Get base radius from userData or geometry
          const baseRadius =
            mesh.userData.baseRadius || mesh.geometry.parameters.radius;
          mesh.userData.actualRadius = baseRadius;
        }
      }
    });
  }

  /**
   * Get the mesh for a specific planet
   */
  getPlanetMesh(planet) {
    return this.planetMeshes.find(
      (mesh) => mesh.userData.planet.name === planet.name
    );
  }

  /**
   * Toggle planet labels visibility
   */
  toggleLabels(show) {
    this.planetMeshes.forEach((mesh) => {
      // Find sprite label child
      const label = mesh.children.find(
        (child) => child.userData && child.userData.isLabel
      );
      if (label) {
        label.visible = show;
      }
    });
  }

  /**
   * Toggle orbit lines visibility
   */
  toggleOrbitLines(show) {
    this.orbitLines.forEach((line) => {
      line.visible = show;
    });
  }

  /**
   * Set rendering quality
   * @param {boolean} high - Whether to use high quality rendering
   */
  setQuality(high) {
    // Update material quality for all planet meshes
    this.planetMeshes.forEach((mesh) => {
      if (mesh.material) {
        // Adjust material properties based on quality setting
        if (high) {
          mesh.material.flatShading = false;
          if (mesh.material.map) {
            mesh.material.map.anisotropy = 16; // Max anisotropic filtering
          }
        } else {
          mesh.material.flatShading = true;
          if (mesh.material.map) {
            mesh.material.map.anisotropy = 1; // Min anisotropic filtering
          }
        }
        mesh.material.needsUpdate = true;
      }
    });

    // Update central star quality
    if (this.centralStar && this.centralStar.material) {
      if (high) {
        this.centralStar.material.flatShading = false;
      } else {
        this.centralStar.material.flatShading = true;
      }
      this.centralStar.material.needsUpdate = true;
    }
  }

  /**
   * Cleanup all system objects after a delay
   * Useful for keeping system visible during camera transitions
   * @param {number} delay - Delay in milliseconds before cleanup
   * @returns {Promise} - Resolves after cleanup completes
   */
  cleanupAfterDelay(delay) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.cleanup();
        resolve();
      }, delay);
    });
  }

  /**
   * Cleanup all system objects
   */
  cleanup() {
    // Remove planet meshes
    this.planetMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    this.planetMeshes = [];

    // Remove orbit lines
    this.orbitLines.forEach((line) => {
      this.scene.remove(line);
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
    });
    this.orbitLines = [];

    // Remove central star
    if (this.centralStar) {
      // Properly dispose of geometry, material, and textures
      this.centralStar.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });

      this.scene.remove(this.centralStar);
      this.centralStar = null;
    }

    // Remove lighting
    if (this.dynamicStarLight) {
      this.scene.remove(this.dynamicStarLight);
      this.dynamicStarLight = null;
    }

    this.systemPlanets = [];
    this.animationTime = 0;
    this.multiStarMinOrbitRadius = null; // Reset multi-star configuration
  }
}
