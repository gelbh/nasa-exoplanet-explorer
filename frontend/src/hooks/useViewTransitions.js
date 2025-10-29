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
  const currentStarRef = useRef(null);
  const viewModeRef = useRef("galaxy"); // galaxy, system, planet, star, galacticCenter
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

    // Calculate distance with no max clamp (pass null as maxDistance)
    const closeUpDistance =
      sceneManagerRef.current.calculateOptimalCameraDistance(
        actualPlanetRadius,
        false,
        null,
        null // No max distance clamp
      );

    // Improved safety distance that works better for small planets
    // Use the larger of: 1.2x optimal distance OR 4x planet radius
    const safeDistance = Math.max(
      closeUpDistance * 1.2,
      actualPlanetRadius * 4
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

        // Sync state after ref updates
        if (transitionToPlanetFromSystem.syncState) {
          transitionToPlanetFromSystem.syncState();
        }

        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 500);
      }
    );
  };

  // ============================================
  // STAR SELECTION
  // ============================================

  const transitionToStarFromSystem = (system, starWorldPosition, starMesh) => {
    cameraManagerRef.current.setTransitioning(true);

    // Get star radius from the mesh
    const boundingBox = new THREE.Box3().setFromObject(starMesh);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const actualStarRadius = Math.max(size.x, size.y, size.z) / 2;

    // Calculate distance for star view - stars are typically larger than planets
    // Use a more conservative multiplier for better viewing
    const closeUpDistance =
      sceneManagerRef.current.calculateOptimalCameraDistance(
        actualStarRadius,
        false,
        null,
        null // No max distance clamp
      );

    // Stars can be very large, so we want to pull back a bit more
    const safeDistance = Math.max(
      closeUpDistance * 1.5,
      actualStarRadius * 5
    );

    sceneManagerRef.current.smoothCameraTransitionTrackingTarget(
      starMesh,
      safeDistance,
      2000,
      () => {
        viewModeRef.current = "star";
        currentStarRef.current = {
          system: system,
          starData: starMesh.userData.stellarData || system.planets[0], // Extract stellar data
        };

        // Hide planets and orbit lines when viewing star
        systemRendererRef.current.planetMeshes.forEach((mesh) => {
          mesh.visible = false;
        });
        systemRendererRef.current.orbitLines.forEach((line) => {
          line.visible = false;
        });

        updateUIForStarView();
        
        const currentDistance =
          sceneManagerRef.current.camera.position.length();
        cameraManagerRef.current.updateLastCameraDistance(currentDistance);

        updateInfoTab();
        switchToInfoTab();

        // Sync state after ref updates
        if (transitionToStarFromSystem.syncState) {
          transitionToStarFromSystem.syncState();
        }

        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 500);
      }
    );
  };

  const selectStar = (system) => {
    currentStarRef.current = {
      system: system,
      starData: system.planets[0], // Stellar data is in planet objects
    };

    // Sync state immediately after ref update
    if (selectStar.syncState) {
      selectStar.syncState();
    }

    cameraManagerRef.current.setTransitioning(true);

    // If we're already in the system view, just transition to the star
    const alreadyInSystem =
      viewModeRef.current === "system" &&
      currentSystemRef.current &&
      currentSystemRef.current.starName === system.starName;

    if (alreadyInSystem) {
      // Get the central star mesh
      const centralStar = systemRendererRef.current.centralStar;
      if (centralStar) {
        const starWorldPosition = new THREE.Vector3();
        centralStar.getWorldPosition(starWorldPosition);
        transitionToStarFromSystem(system, starWorldPosition, centralStar);
      }
    } else {
      // First switch to system view, then transition to star
      selectSystem(system);

      setTimeout(() => {
        const centralStar = systemRendererRef.current.centralStar;
        if (centralStar) {
          const starWorldPosition = new THREE.Vector3();
          centralStar.getWorldPosition(starWorldPosition);
          transitionToStarFromSystem(system, starWorldPosition, centralStar);
        }
      }, 1600);
    }
  };

  const selectPlanet = (planet, systemData = null) => {
    currentPlanetRef.current = planet;

    // Sync state immediately after ref update
    if (selectPlanet.syncState) {
      selectPlanet.syncState();
    }

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
    // Remove max clamp for better planet framing
    const targetDistance =
      sceneManagerRef.current.calculateOptimalCameraDistance(
        planetRadius,
        false,
        null,
        null // No max distance clamp
      );

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

    const wasStarView = viewModeRef.current === "star";

    if (viewModeRef.current === "galaxy") {
      galaxyRendererRef.current.cleanup();
    }

    viewModeRef.current = "system";

    // Sync state immediately after ref update
    if (selectSystem.syncState) {
      selectSystem.syncState();
    }

    updateUIForSystemView();
    cameraManagerRef.current.setTransitioning(true);

    if (currentPlanetRef.current) {
      cameraManagerRef.current.setFollowPlanet(true);
    }

    // If coming from star view, just show planets instead of re-rendering
    if (wasStarView && currentSystemRef.current?.starName === system.starName) {
      systemRendererRef.current.showAllPlanets();
      
      // Still need to get system info for camera positioning
      const maxRadius = systemRendererRef.current.calculateMaxOrbitRadius(system.planets);
      const scaleFactor = systemRendererRef.current.calculateScaleFactor(maxRadius);
      const cameraDistance = Math.max(15, maxRadius * scaleFactor * 3.0);

      sceneManagerRef.current.smoothCameraTransition(
        new THREE.Vector3(0, cameraDistance * 0.4, cameraDistance * 0.9),
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
      return;
    }

    const systemInfo = systemRendererRef.current.renderSystem(
      system.planets,
      animateOrbitsRef.current,
      infoTabManagerRef.current?.settingsManager?.useOrbitalInclination || false
    );

    // Reapply settings after rendering new system
    if (infoTabManagerRef.current?.settingsManager) {
      infoTabManagerRef.current.settingsManager.reapplySystemSettings();
    }

    const maxRadius = systemInfo.maxOrbitRadius * systemInfo.scaleFactor;
    // Remove distance clamping for system view to allow large systems to be fully visible
    const cameraDistance = Math.max(15, maxRadius * 3.0);

    sceneManagerRef.current.smoothCameraTransition(
      new THREE.Vector3(0, cameraDistance * 0.4, cameraDistance * 0.9),
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

    // Sync state immediately after ref update
    if (switchToGalaxyView.syncState) {
      switchToGalaxyView.syncState();
    }

    systemRendererRef.current.cleanup();
    planetRendererRef.current.cleanup();

    const notableSystems = filterManagerRef.current.getNotableSystems();
    galaxyRendererRef.current.renderGalaxy(notableSystems);

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

  const updateUIForStarView = () => {
    const searchTitle = document.getElementById("searchTitle");
    if (searchTitle) {
      searchTitle.textContent = "Search Exoplanets";
    }

    const randomPlanetBtn = document.getElementById("randomPlanetBtn");
    const randomSystemBtn = document.getElementById("randomSystemBtn");
    if (randomPlanetBtn) randomPlanetBtn.style.display = "none";
    if (randomSystemBtn) randomSystemBtn.style.display = "none";

    const systemInstructions = document.getElementById("systemInstructions");
    if (systemInstructions) systemInstructions.style.display = "none";

    if (domRefs.searchInputRef.current) {
      domRefs.searchInputRef.current.placeholder = "Search by name...";
    }

    updateSettingsVisibility("star");
  };

  return {
    currentPlanetRef,
    currentSystemRef,
    currentStarRef,
    viewModeRef,
    animateOrbitsRef,
    selectPlanet,
    selectSystem,
    selectStar,
    selectRandomPlanet,
    selectRandomSystem,
    transitionToPlanetFromSystem,
    transitionToStarFromSystem,
    switchToSystemView,
    switchToPlanetView,
    switchToGalaxyView,
  };
};
