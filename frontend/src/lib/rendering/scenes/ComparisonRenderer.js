import * as THREE from "three";
import { PlanetRenderer } from "../planets/PlanetRenderer";

/**
 * ComparisonRenderer
 * Renders multiple planets side-by-side for visual comparison
 */
export class ComparisonRenderer {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.planetRenderer = new PlanetRenderer(scene, camera);
    this.comparisonGroup = new THREE.Group();
    this.comparisonGroup.name = "ComparisonGroup";
    this.scene.add(this.comparisonGroup);
    this.planets = [];
    this.labelSprites = [];
    this.animationFrameCount = 0;
  }

  /**
   * Set up comparison view with multiple planets
   */
  setupComparison(planetsData) {
    // Clear existing comparison
    this.clearComparison();

    if (!planetsData || planetsData.length === 0) {
      return;
    }

    // Calculate spacing based on largest planet
    const maxRadius = Math.max(...planetsData.map((p) => p.radius || 1));
    const spacing = maxRadius * 3; // Space between planets

    // Calculate total width to center the group
    const totalWidth = (planetsData.length - 1) * spacing;
    const startX = -totalWidth / 2;

    // Create each planet
    planetsData.forEach((planetData, index) => {
      const xPosition = startX + index * spacing;
      
      // Create planet mesh
      const planetMesh = this.planetRenderer.createPlanetMesh(
        planetData,
        false // Don't auto-add to scene
      );
      
      if (planetMesh) {
        planetMesh.position.set(xPosition, 0, 0);
        planetMesh.userData = {
          ...planetData,
          isComparisonPlanet: true,
          comparisonIndex: index,
        };
        
        this.comparisonGroup.add(planetMesh);
        this.planets.push(planetMesh);

        // Add atmosphere if applicable
        const atmosphere = this.planetRenderer.createAtmosphere(planetData);
        if (atmosphere) {
          atmosphere.position.set(xPosition, 0, 0);
          this.comparisonGroup.add(atmosphere);
        }

        // Add rings if it's a gas giant
        if (this.shouldHaveRings(planetData)) {
          const rings = this.planetRenderer.createRings(planetData);
          if (rings) {
            rings.position.set(xPosition, 0, 0);
            this.comparisonGroup.add(rings);
          }
        }

        // Add label
        this.createLabel(planetData.name, xPosition, planetData.radius);
      }
    });

    // Position group and camera for best view
    this.comparisonGroup.position.set(0, 0, 0);
    this.positionCameraForComparison(maxRadius, planetsData.length);
  }

  /**
   * Check if planet should have rings
   */
  shouldHaveRings(planetData) {
    const type = (planetData.type || "").toLowerCase();
    return (
      type.includes("gas") ||
      type.includes("jupiter") ||
      type.includes("saturn") ||
      (planetData.mass > 50 && planetData.radius > 5)
    );
  }

  /**
   * Create a text label for a planet
   */
  createLabel(text, x, planetRadius) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 128;

    // Draw text
    context.fillStyle = "rgba(0, 0, 0, 0)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "Bold 48px Arial";
    context.fillStyle = "rgba(255, 255, 255, 1)";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Position below planet
    const labelY = -(planetRadius + 2);
    sprite.position.set(x, labelY, 0);
    sprite.scale.set(4, 1, 1);

    this.comparisonGroup.add(sprite);
    this.labelSprites.push(sprite);
  }

  /**
   * Position camera to frame all planets
   */
  positionCameraForComparison(maxRadius, planetCount) {
    const totalWidth = (planetCount - 1) * (maxRadius * 3);
    const distance = Math.max(totalWidth * 0.8, maxRadius * 5);
    
    this.camera.position.set(0, maxRadius * 1.5, distance);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Update comparison view (animate planets)
   */
  update(deltaTime) {
    this.animationFrameCount++;

    // Rotate planets slowly
    this.planets.forEach((planet, index) => {
      if (planet) {
        planet.rotation.y += 0.001 * (index % 2 === 0 ? 1 : -1);
      }
    });

    // Make labels always face camera (billboard effect)
    if (this.animationFrameCount % 5 === 0) {
      this.labelSprites.forEach((sprite) => {
        if (sprite && this.camera) {
          sprite.quaternion.copy(this.camera.quaternion);
        }
      });
    }
  }

  /**
   * Clear comparison view
   */
  clearComparison() {
    // Remove all children from comparison group
    while (this.comparisonGroup.children.length > 0) {
      const child = this.comparisonGroup.children[0];
      this.comparisonGroup.remove(child);
      
      // Dispose of geometries and materials
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    this.planets = [];
    this.labelSprites = [];
  }

  /**
   * Show comparison view
   */
  show() {
    this.comparisonGroup.visible = true;
  }

  /**
   * Hide comparison view
   */
  hide() {
    this.comparisonGroup.visible = false;
  }

  /**
   * Check if comparison is active
   */
  isActive() {
    return this.comparisonGroup.visible && this.planets.length > 0;
  }

  /**
   * Get comparison group for raycasting
   */
  getGroup() {
    return this.comparisonGroup;
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    this.clearComparison();
    this.scene.remove(this.comparisonGroup);
  }
}

