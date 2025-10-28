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
    this.comparisonGroup.visible = false; // Start hidden
    this.scene.add(this.comparisonGroup);
    this.planets = [];
    this.labelSprites = [];
    this.animationFrameCount = 0;
    this.comparisonLight = null;
    this.ambientLight = null;
    console.log("📦 ComparisonRenderer initialized");
  }

  /**
   * Set up comparison view with multiple planets
   */
  setupComparison(planetsData) {
    console.log("🌍 Setting up comparison with planets:", planetsData);

    // Clear existing comparison
    this.clearComparison();

    if (!planetsData || planetsData.length === 0) {
      console.warn("No planets data provided for comparison");
      return;
    }

    // Add lighting for comparison view
    this.setupLighting();

    // Calculate spacing based on largest planet
    const maxRadius = Math.max(...planetsData.map((p) => p.radius || 1));
    const spacing = Math.max(maxRadius * 3, 5); // Space between planets, minimum 5 units

    // Calculate total width to center the group
    const totalWidth = (planetsData.length - 1) * spacing;
    const startX = -totalWidth / 2;

    console.log(
      `📐 Max radius: ${maxRadius}, Spacing: ${spacing}, Total width: ${totalWidth}`
    );

    // Create each planet
    planetsData.forEach((planetData, index) => {
      const xPosition = startX + index * spacing;

      console.log(
        `Creating planet ${index}: ${planetData.name} at x=${xPosition}`
      );

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
        console.log(`✅ Added planet mesh for ${planetData.name}`);

        // Add atmosphere if applicable
        const atmosphere = this.planetRenderer.createAtmosphere(planetData);
        if (atmosphere) {
          atmosphere.position.set(xPosition, 0, 0);
          this.comparisonGroup.add(atmosphere);
          console.log(`💨 Added atmosphere for ${planetData.name}`);
        }

        // Add rings if it's a gas giant
        if (this.shouldHaveRings(planetData)) {
          const rings = this.planetRenderer.createRings(planetData);
          if (rings) {
            rings.position.set(xPosition, 0, 0);
            this.comparisonGroup.add(rings);
            console.log(`💍 Added rings for ${planetData.name}`);
          }
        }

        // Add label
        this.createLabel(planetData.name, xPosition, planetData.radius);
      } else {
        console.error(`❌ Failed to create mesh for ${planetData.name}`);
      }
    });

    // Position group and camera for best view
    this.comparisonGroup.position.set(0, 0, 0);
    this.positionCameraForComparison(maxRadius, planetsData.length);

    console.log(
      `📹 Camera positioned. Group has ${this.comparisonGroup.children.length} children`
    );
    console.log(`🎭 Comparison group visible: ${this.comparisonGroup.visible}`);
  }

  /**
   * Set up lighting for comparison view
   */
  setupLighting() {
    // Remove old lights if they exist
    if (this.comparisonLight) {
      this.scene.remove(this.comparisonLight);
    }
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
    }

    // Add directional light from the front
    this.comparisonLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.comparisonLight.position.set(0, 5, 10);
    this.comparisonLight.name = "ComparisonLight";
    this.scene.add(this.comparisonLight);

    // Add ambient light for overall illumination
    this.ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this.ambientLight.name = "ComparisonAmbient";
    this.scene.add(this.ambientLight);

    console.log("💡 Comparison lighting set up");
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
    const spacing = Math.max(maxRadius * 3, 5);
    const totalWidth = (planetCount - 1) * spacing;
    const distance = Math.max(totalWidth * 0.8, maxRadius * 5, 15);

    console.log(
      `📷 Positioning camera: distance=${distance}, looking at (0, 0, 0)`
    );

    this.camera.position.set(0, maxRadius * 1.5, distance);
    this.camera.lookAt(0, 0, 0);

    // Update camera if there are controls
    if (this.camera.parent && this.camera.parent.controls) {
      this.camera.parent.controls.target.set(0, 0, 0);
      this.camera.parent.controls.update();
    }
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
    console.log("🧹 Clearing comparison view");

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

    // Remove lights
    if (this.comparisonLight) {
      this.scene.remove(this.comparisonLight);
      this.comparisonLight = null;
    }
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight = null;
    }

    this.planets = [];
    this.labelSprites = [];
  }

  /**
   * Show comparison view
   */
  show() {
    this.comparisonGroup.visible = true;
    if (this.comparisonLight) this.comparisonLight.visible = true;
    if (this.ambientLight) this.ambientLight.visible = true;
    console.log("👁️ Comparison view shown");
  }

  /**
   * Hide comparison view
   */
  hide() {
    this.comparisonGroup.visible = false;
    if (this.comparisonLight) this.comparisonLight.visible = false;
    if (this.ambientLight) this.ambientLight.visible = false;
    console.log("🙈 Comparison view hidden");
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
