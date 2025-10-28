import * as THREE from 'three';

/**
 * GalaxyRenderer
 * Renders a galaxy view showing multiple star systems
 */
export class GalaxyRenderer {
  constructor(scene) {
    this.scene = scene;
    this.systemMarkers = [];
  }

  renderGalaxy(systems) {
    this.cleanup();

    const maxSystems = Math.min(systems.length, 100);

    for (let i = 0; i < maxSystems; i++) {
      const system = systems[i];
      this.addSystemMarker(system, i, maxSystems);
    }
  }

  addSystemMarker(system, index, total) {
    // Distribute systems in a spiral galaxy pattern
    const angle = (index / total) * Math.PI * 4;
    const radius = 20 + (index / total) * 80;
    const height = (Math.random() - 0.5) * 20;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = height;

    // Create marker (sphere representing the star system)
    const size = Math.log(system.planets.length + 1) * 0.5 + 0.3;
    const geometry = new THREE.SphereGeometry(size, 16, 16);

    // Color based on number of planets
    let color;
    if (system.planets.length >= 7) {
      color = 0xffd700; // Gold for large systems
    } else if (system.planets.length >= 4) {
      color = 0xff8c00; // Orange
    } else {
      color = 0x4169e1; // Blue
    }

    const material = new THREE.MeshBasicMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5
    });

    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(x, y, z);
    marker.userData.system = system;

    // Add glow
    const glowGeometry = new THREE.SphereGeometry(size * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    marker.add(glow);

    this.scene.add(marker);
    this.systemMarkers.push(marker);
  }

  getAllClickableObjects() {
    return this.systemMarkers;
  }

  getSystemPosition(system) {
    const marker = this.systemMarkers.find(m => m.userData.system?.starName === system.starName);
    return marker ? marker.position.clone() : null;
  }

  animateGalaxy() {
    // Subtle rotation
    this.systemMarkers.forEach((marker, index) => {
      marker.rotation.y += 0.001;

      // Pulse effect
      const scale = 1 + Math.sin(Date.now() * 0.001 + index) * 0.1;
      marker.scale.setScalar(scale);
    });
  }

  cleanup() {
    this.systemMarkers.forEach(marker => {
      this.scene.remove(marker);
      if (marker.geometry) marker.geometry.dispose();
      if (marker.material) marker.material.dispose();
    });
    this.systemMarkers = [];
  }
}
