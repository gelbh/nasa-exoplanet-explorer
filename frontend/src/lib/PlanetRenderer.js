import * as THREE from 'three';

/**
 * PlanetRenderer
 * Procedurally generates and renders exoplanets based on their properties
 */
export class PlanetRenderer {
  constructor(scene) {
    this.scene = scene;
    this.currentPlanet = null;
  }

  renderPlanet(planet) {
    this.cleanup();

    const radiusScale = Math.pow(planet.radius, 0.7) * 2;
    const geometry = new THREE.SphereGeometry(radiusScale, 64, 64);

    // Generate material based on planet type and properties
    const material = this.generatePlanetMaterial(planet);

    this.currentPlanet = new THREE.Mesh(geometry, material);
    this.currentPlanet.userData.planet = planet;

    this.scene.add(this.currentPlanet);

    // Add atmosphere for some planets
    if (planet.type !== 'terrestrial' || planet.temperature < 400) {
      this.addAtmosphere(planet, radiusScale);
    }

    // Add host star
    this.addHostStar(planet, radiusScale);

    return radiusScale;
  }

  generatePlanetMaterial(planet) {
    const { type, temperature } = planet;

    let color;
    let emissiveColor = 0x000000;
    let emissiveIntensity = 0;

    switch (type) {
      case 'terrestrial':
        if (temperature > 1000) {
          // Lava planet
          color = new THREE.Color(0xff4500);
          emissiveColor = 0xff2200;
          emissiveIntensity = 0.5;
        } else if (temperature > 400) {
          // Hot rocky planet
          color = new THREE.Color(0xd4a574);
        } else {
          // Earth-like
          color = new THREE.Color(0x4169e1);
        }
        break;

      case 'super-earth':
        if (temperature > 500) {
          color = new THREE.Color(0xcd853f);
        } else {
          color = new THREE.Color(0x6495ed);
        }
        break;

      case 'neptune':
        color = new THREE.Color(0x4682b4);
        break;

      case 'jupiter':
        if (temperature > 1500) {
          // Hot Jupiter
          color = new THREE.Color(0xffa500);
          emissiveColor = 0xff8800;
          emissiveIntensity = 0.3;
        } else {
          color = new THREE.Color(0xdaa520);
        }
        break;

      default:
        color = new THREE.Color(0x808080);
    }

    return new THREE.MeshStandardMaterial({
      color,
      emissive: emissiveColor,
      emissiveIntensity,
      roughness: type === 'jupiter' || type === 'neptune' ? 0.8 : 0.6,
      metalness: type === 'terrestrial' ? 0.3 : 0.1
    });
  }

  addAtmosphere(planet, radiusScale) {
    const atmosphereGeometry = new THREE.SphereGeometry(radiusScale * 1.1, 32, 32);

    let atmosphereColor;
    if (planet.type === 'terrestrial' && planet.temperature < 400) {
      atmosphereColor = 0x87ceeb;
    } else if (planet.type === 'jupiter' || planet.type === 'neptune') {
      atmosphereColor = 0xb0c4de;
    } else {
      atmosphereColor = 0xffa07a;
    }

    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: atmosphereColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.currentPlanet.add(atmosphere);
  }

  addHostStar(planet, planetRadius) {
    const starDistance = planetRadius * 5;
    const starRadius = planet.stellarRadius * 1.5;

    const starGeometry = new THREE.SphereGeometry(starRadius, 32, 32);

    // Determine star color based on temperature
    let starColor;
    const temp = planet.stellarTemp;
    if (temp > 10000) {
      starColor = 0x9bb0ff; // Blue
    } else if (temp > 7500) {
      starColor = 0xaabfff; // Blue-white
    } else if (temp > 6000) {
      starColor = 0xfff4ea; // White
    } else if (temp > 5200) {
      starColor = 0xfff4e8; // Yellow-white
    } else if (temp > 3700) {
      starColor = 0xffd2a1; // Orange
    } else {
      starColor = 0xffaa77; // Red
    }

    const starMaterial = new THREE.MeshBasicMaterial({
      color: starColor,
      emissive: starColor,
      emissiveIntensity: 1
    });

    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.set(starDistance, 0, 0);

    // Add star light
    const starLight = new THREE.PointLight(starColor, 2, starDistance * 3);
    star.add(starLight);

    this.scene.add(star);
  }

  rotatePlanet(speed = 0.005) {
    if (this.currentPlanet) {
      this.currentPlanet.rotation.y += speed;
    }
  }

  cleanup() {
    if (this.currentPlanet) {
      this.scene.remove(this.currentPlanet);
      if (this.currentPlanet.geometry) this.currentPlanet.geometry.dispose();
      if (this.currentPlanet.material) this.currentPlanet.material.dispose();
      this.currentPlanet = null;
    }

    // Remove host stars
    const objectsToRemove = [];
    this.scene.traverse((object) => {
      if (object.isMesh && object !== this.currentPlanet) {
        objectsToRemove.push(object);
      }
    });
    objectsToRemove.forEach((obj) => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
