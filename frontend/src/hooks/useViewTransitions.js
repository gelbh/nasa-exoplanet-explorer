import { useRef } from "react";
import * as THREE from "three";

/**
 * Custom hook for view transitions and object selection
 * Manages switching between galaxy, system, and planet views
 */
export const useViewTransitions = ({
  sceneManagerRef,
  planetRendererRef,
  systemRendererRef,
  galaxyRendererRef,
  cameraManagerRef,
  filterManagerRef,
  uiManagerRef,
  infoTabManagerRef,
  domRefs,
  updateInfoTab,
  switchToInfoTab,
  updateSettingsVisibility,
}) => {
  // View state
  const currentPlanetRef = useRef(null);
  const currentSystemRef = useRef(null);
  const viewModeRef = useRef("galaxy"); // galaxy, system, planet, galacticCenter
  const animateOrbitsRef = useRef(true);

  // ============================================
  // PLANET SELECTION
  // ============================================

  const transitionToPlanetFromSystem = (
    planet,
    planetWorldPosition,
    planetMesh
  ) => {
    cameraManagerRef.current.setTransitioning(true);

    const boundingBox = new THREE.Box3().setFromObject(planetMesh);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const actualPlanetRadius = Math.max(size.x, size.y, size.z) / 2;

    const closeUpDistance =
      sceneManagerRef.current.calculateOptimalCameraDistance(
        actualPlanetRadius,
        false,
        null
      );

    const safeDistance = Math.max(
      closeUpDistance * 1.5,
      actualPlanetRadius * 5
    );

    sceneManagerRef.current.smoothCameraTransitionTrackingTarget(
      planetMesh,
      safeDistance,
      2000,
      () => {
        viewModeRef.current = "planet";
        currentPlanetRef.current = planet;

        systemRendererRef.current.focusOnPlanet(planet);

        updateUIForPlanetView();
        uiManagerRef.current.updateResultsList(
          filterManagerRef.current.getFilteredExoplanets()
        );
        uiManagerRef.current.updateActiveListItem(
          planet,
          filterManagerRef.current.getFilteredExoplanets()
        );

        const currentDistance =
          sceneManagerRef.current.camera.position.length();
        cameraManagerRef.current.updateLastCameraDistance(currentDistance);
        cameraManagerRef.current.setFollowPlanet(false);

        updateInfoTab();
        switchToInfoTab();

        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 500);
      }
    );
  };

  const selectPlanet = (planet, systemData = null) => {
    currentPlanetRef.current = planet;
    cameraManagerRef.current.setTransitioning(true);

    if (!systemData && planet.hostStar) {
      const systemPlanets = filterManagerRef.current.getPlanetsForSystem(
        planet.hostStar
      );

      if (systemPlanets.length > 0) {
        systemData = {
          starName: planet.hostStar,
          planets: systemPlanets,
          distance: planet.distance,
        };
      }
    }

    if (systemData) {
      const alreadyInSystem =
        viewModeRef.current === "system" &&
        currentSystemRef.current &&
        currentSystemRef.current.starName === systemData.starName;

      if (!alreadyInSystem) {
        selectSystem({
          starName: systemData.starName,
          planets: systemData.planets,
          distance: systemData.distance,
        });

        setTimeout(() => {
          const planetMesh = systemRendererRef.current.getPlanetMesh(planet);
          if (planetMesh) {
            const planetWorldPosition = new THREE.Vector3();
            planetMesh.getWorldPosition(planetWorldPosition);
            transitionToPlanetFromSystem(
              planet,
              planetWorldPosition,
              planetMesh
            );
          }
        }, 1500);
      } else {
        const planetMesh = systemRendererRef.current.getPlanetMesh(planet);
        if (planetMesh) {
          const planetWorldPosition = new THREE.Vector3();
          planetMesh.getWorldPosition(planetWorldPosition);
          transitionToPlanetFromSystem(planet, planetWorldPosition, planetMesh);
        }
      }

      return;
    }

    // Fallback: Standard planet view
    const planetRadius = planetRendererRef.current.renderPlanet(planet);
    const targetDistance =
      sceneManagerRef.current.calculateOptimalCameraDistance(planetRadius);

    sceneManagerRef.current.smoothCameraTransition(
      new THREE.Vector3(0, 0, targetDistance),
      1500,
      () => {
        cameraManagerRef.current.updateLastCameraDistance(targetDistance);
        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 500);
      }
    );

    updateInfoTab();
    switchToInfoTab();
  };

  const selectRandomPlanet = () => {
    const randomPlanet = filterManagerRef.current.getRandomPlanet();
    if (randomPlanet) {
      selectPlanet(randomPlanet);
    }
  };

  // ============================================
  // SYSTEM SELECTION
  // ============================================

  const selectSystem = (system) => {
    currentSystemRef.current = system;

    if (viewModeRef.current === "galaxy") {
      galaxyRendererRef.current.cleanup();
    }

    viewModeRef.current = "system";
    updateUIForSystemView();
    cameraManagerRef.current.setTransitioning(true);

    if (currentPlanetRef.current) {
      cameraManagerRef.current.setFollowPlanet(true);
    }

    const systemInfo = systemRendererRef.current.renderSystem(
      system.planets,
      animateOrbitsRef.current,
      infoTabManagerRef.current?.settingsManager?.useOrbitalInclination || false
    );

    const maxRadius = systemInfo.maxOrbitRadius * systemInfo.scaleFactor;
    const cameraDistance =
      sceneManagerRef.current.calculateOptimalCameraDistance(
        maxRadius,
        true,
        maxRadius
      );

    sceneManagerRef.current.smoothCameraTransition(
      new THREE.Vector3(0, cameraDistance * 0.3, cameraDistance),
      1500,
      () => {
        cameraManagerRef.current.updateLastCameraDistance(cameraDistance);
        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 500);
      }
    );

    updateInfoTab();
    switchToInfoTab();
  };

  const selectRandomSystem = () => {
    const randomSystem = filterManagerRef.current.getRandomSystem(2);
    if (randomSystem) {
      selectSystem(randomSystem);
    }
  };

  // ============================================
  // VIEW SWITCHING
  // ============================================

  const switchToSystemView = () => {
    cameraManagerRef.current.setFollowPlanet(false);
    updateUIForSystemView();
    updateOrbitSpeedDisplay();
    domRefs.canvasRef.current.classList.remove("grabbing", "moving", "pointer");
    domRefs.canvasRef.current.classList.add("grab");

    const notableSystems = filterManagerRef.current.getNotableSystems();
    uiManagerRef.current.updateSystemsList(notableSystems);
    planetRendererRef.current.cleanup();

    if (currentPlanetRef.current) {
      const systemPlanets = filterManagerRef.current.getPlanetsForSystem(
        currentPlanetRef.current.hostStar
      );
      if (systemPlanets.length > 1) {
        selectSystem({
          starName: currentPlanetRef.current.hostStar,
          planets: systemPlanets,
          count: systemPlanets.length,
        });
      } else if (notableSystems.length > 0) {
        selectSystem(notableSystems[0]);
      }
    } else if (notableSystems.length > 0) {
      selectSystem(notableSystems[0]);
    }
  };

  const switchToPlanetView = () => {
    cameraManagerRef.current.setFollowPlanet(false);
    updateUIForPlanetView();
    domRefs.canvasRef.current.classList.remove("pointer", "grabbing", "moving");
    domRefs.canvasRef.current.classList.add("grab");

    uiManagerRef.current.updateResultsList(
      filterManagerRef.current.getFilteredExoplanets()
    );
    systemRendererRef.current.cleanup();

    if (
      currentSystemRef.current &&
      currentSystemRef.current.planets.length > 0
    ) {
      selectPlanet(currentSystemRef.current.planets[0]);
    }
  };

  const switchToGalaxyView = () => {
    viewModeRef.current = "galaxy";
    const previousSystem = currentSystemRef.current;

    systemRendererRef.current.cleanup();
    planetRendererRef.current.cleanup();

    const notableSystems = filterManagerRef.current.getNotableSystems();
    const galaxyInfo = galaxyRendererRef.current.renderGalaxy(notableSystems);

    if (previousSystem) {
      const systemPosition =
        galaxyRendererRef.current.getSystemPosition(previousSystem);

      if (systemPosition) {
        const distance = 30;
        const offset = new THREE.Vector3(0, 1, 1.5)
          .normalize()
          .multiplyScalar(distance);
        const cameraPos = systemPosition.clone().add(offset);

        sceneManagerRef.current.camera.position.copy(cameraPos);
        sceneManagerRef.current.controls.target.copy(systemPosition);
        sceneManagerRef.current.camera.lookAt(systemPosition);
        sceneManagerRef.current.controls.update();
      } else {
        sceneManagerRef.current.camera.position.set(0, 30, 30);
        sceneManagerRef.current.camera.lookAt(0, 0, 0);
        sceneManagerRef.current.controls.target.set(0, 0, 0);
        sceneManagerRef.current.controls.update();
      }
    } else {
      sceneManagerRef.current.camera.position.set(0, 60, 60);
      sceneManagerRef.current.camera.lookAt(0, 0, 0);
      sceneManagerRef.current.controls.target.set(0, 0, 0);
      sceneManagerRef.current.controls.update();
    }

    updateInfoTab();
    switchToInfoTab();
    updateSettingsVisibility("galaxy");
  };

  // ============================================
  // UI UPDATES
  // ============================================

  const updateOrbitSpeedDisplay = () => {
    if (!domRefs.orbitSpeedValueRef.current) return;
    const displayText =
      infoTabManagerRef.current?.settingsManager?.getOrbitSpeedDisplay?.() ||
      "60.0s";
    domRefs.orbitSpeedValueRef.current.textContent = displayText;
  };

  const updateUIForSystemView = () => {
    const searchTitle = document.getElementById("searchTitle");
    if (searchTitle) {
      searchTitle.textContent = "Search Star Systems";
    }

    const randomPlanetBtn = document.getElementById("randomPlanetBtn");
    const randomSystemBtn = document.getElementById("randomSystemBtn");
    if (randomPlanetBtn) randomPlanetBtn.style.display = "none";
    if (randomSystemBtn) randomSystemBtn.style.display = "block";

    const systemInstructions = document.getElementById("systemInstructions");
    if (systemInstructions) systemInstructions.style.display = "block";

    if (domRefs.searchInputRef.current) {
      domRefs.searchInputRef.current.placeholder = "Search star systems...";
    }

    updateSettingsVisibility("system");
  };

  const updateUIForPlanetView = () => {
    const searchTitle = document.getElementById("searchTitle");
    if (searchTitle) {
      searchTitle.textContent = "Search Exoplanets";
    }

    const randomPlanetBtn = document.getElementById("randomPlanetBtn");
    const randomSystemBtn = document.getElementById("randomSystemBtn");
    if (randomPlanetBtn) randomPlanetBtn.style.display = "block";
    if (randomSystemBtn) randomSystemBtn.style.display = "none";

    const systemInstructions = document.getElementById("systemInstructions");
    if (systemInstructions) systemInstructions.style.display = "none";

    if (domRefs.searchInputRef.current) {
      domRefs.searchInputRef.current.placeholder = "Search by name...";
    }

    updateSettingsVisibility("planet");
  };

  return {
    currentPlanetRef,
    currentSystemRef,
    viewModeRef,
    animateOrbitsRef,
    selectPlanet,
    selectSystem,
    selectRandomPlanet,
    selectRandomSystem,
    transitionToPlanetFromSystem,
    switchToSystemView,
    switchToPlanetView,
    switchToGalaxyView,
  };
};
