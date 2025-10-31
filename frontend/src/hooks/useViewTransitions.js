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

    // Zoom in closer for better planet framing
    // Use a tighter distance for nice planet view (not too small, not clipped)
    const safeDistance = Math.max(
      closeUpDistance * 0.95, // Closer than before (was 1.2x, now 0.95x)
      actualPlanetRadius * 3 // Reduced minimum distance (was 4x, now 3x)
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
    if (!starMesh) {
      console.warn("Star mesh not provided for transition");
      return;
    }

    cameraManagerRef.current.setTransitioning(true);

    // Get star radius from userData if available (more accurate than bounding box)
    // Fallback to bounding box calculation if userData doesn't have starRadius
    let actualStarRadius;
    if (starMesh.userData && starMesh.userData.starRadius) {
      actualStarRadius = starMesh.userData.starRadius;
    } else {
      // Fallback: Calculate from bounding box
      const boundingBox = new THREE.Box3().setFromObject(starMesh);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      actualStarRadius = Math.max(size.x, size.y, size.z) / 2;

      // If bounding box is suspiciously small, use a minimum size
      if (actualStarRadius < 0.1) {
        actualStarRadius = 0.5; // Default minimum star radius
      }
    }

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
    // Use similar approach to planet view but with slightly more distance
    const safeDistance = Math.max(closeUpDistance * 1.2, actualStarRadius * 4);

    sceneManagerRef.current.smoothCameraTransitionTrackingTarget(
      starMesh,
      safeDistance,
      2000,
      () => {
        viewModeRef.current = "star";
        currentStarRef.current = {
          system: system,
          starData: starMesh.userData?.stellarData || system.planets[0], // Extract stellar data
        };

        // Hide planets and orbit lines when viewing star
        if (systemRendererRef.current.planetMeshes) {
          systemRendererRef.current.planetMeshes.forEach((mesh) => {
            mesh.visible = false;
          });
        }
        if (systemRendererRef.current.orbitLines) {
          systemRendererRef.current.orbitLines.forEach((line) => {
            line.visible = false;
          });
        }

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

  const selectSystem = async (system) => {
    currentSystemRef.current = system;

    const wasStarView = viewModeRef.current === "star";
    const wasGalaxyView = viewModeRef.current === "galaxy";

    viewModeRef.current = "system";

    // Sync state immediately after ref update
    if (selectSystem.syncState) {
      selectSystem.syncState();
    }

    updateUIForSystemView();
    cameraManagerRef.current.setTransitioning(true);

    // Ensure we are not following any planet when framing the system
    cameraManagerRef.current.setFollowPlanet(false);

    // If coming from star view, just show planets instead of re-rendering
    if (wasStarView && currentSystemRef.current?.starName === system.starName) {
      if (!systemRendererRef.current) {
        console.error(
          "SystemRenderer not available when returning from star view"
        );
        // Fall through to normal rendering path
      } else {
        systemRendererRef.current.showAllPlanets();

        // Compute bounds-based center and fit distance
        const { center, size } =
          systemRendererRef.current.getSystemCenterAndSize();
        const vFOV = (sceneManagerRef.current.camera.fov * Math.PI) / 180;
        const halfH = Math.max(size.y * 0.5, 0.001);
        const halfW = Math.max(size.x * 0.5, 0.001);
        const fitH = halfH / Math.tan(vFOV / 2);
        const fitW =
          halfW / (Math.tan(vFOV / 2) * sceneManagerRef.current.camera.aspect);
        let distance = Math.max(fitW, fitH) * 1.2; // padding
        if (!isFinite(distance) || distance <= 0) distance = 30;

        const direction = new THREE.Vector3(0, 0.4, 0.9).normalize();
        const position = direction.clone().multiplyScalar(distance).add(center);

        sceneManagerRef.current.camera.position.copy(position);
        sceneManagerRef.current.camera.lookAt(center);
        if (sceneManagerRef.current?.controls) {
          sceneManagerRef.current.controls.target.copy(center);
          sceneManagerRef.current.controls.update();
        }

        cameraManagerRef.current.updateLastCameraDistance(distance);
        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 500);

        updateInfoTab();
        switchToInfoTab();
        return;
      }
    }

    // Check if system renderer is available
    if (!systemRendererRef.current) {
      console.error("SystemRenderer not available for rendering system");
      cameraManagerRef.current.setTransitioning(false);
      return;
    }

    // Render the system at origin first
    systemRendererRef.current.renderSystem(
      system.planets,
      animateOrbitsRef.current,
      infoTabManagerRef.current?.settingsManager?.useOrbitalInclination || false
    );

    // Reapply settings after rendering new system
    if (infoTabManagerRef.current?.settingsManager) {
      infoTabManagerRef.current.settingsManager.reapplySystemSettings();
    }

    // Calculate final system framing
    const { center, size } = systemRendererRef.current.getSystemCenterAndSize();
    const vFOV = (sceneManagerRef.current.camera.fov * Math.PI) / 180;
    const halfH = Math.max(size.y * 0.5, 0.001);
    const halfW = Math.max(size.x * 0.5, 0.001);
    const fitH = halfH / Math.tan(vFOV / 2);
    const fitW =
      halfW / (Math.tan(vFOV / 2) * sceneManagerRef.current.camera.aspect);
    let distance = Math.max(fitW, fitH) * 1.2; // padding
    if (!isFinite(distance) || distance <= 0) distance = 30;

    const direction = new THREE.Vector3(0, 0.4, 0.9).normalize();
    const finalPosition = direction
      .clone()
      .multiplyScalar(distance)
      .add(center);

    // If coming from galaxy view, use continuous smooth zoom in
    if (wasGalaxyView) {
      // Get the star position in galaxy before we start transitioning
      const systemPosition =
        galaxyRendererRef.current.getSystemPosition(system);

      if (systemPosition) {
        // Define waypoints for continuous smooth zoom into system
        const waypoints = [];

        // Waypoint 1: Zoom toward star in galaxy (move closer)
        const zoomDistance = 15;
        const zoomOffset = new THREE.Vector3(0, 0.5, 1)
          .normalize()
          .multiplyScalar(zoomDistance);
        const intermediatePos = systemPosition.clone().add(zoomOffset);

        waypoints.push({
          position: intermediatePos,
          lookAt: systemPosition,
          duration: 1800,
          onReach: () => {
            // Cleanup galaxy as we zoom closer
            galaxyRendererRef.current.cleanup();
          },
        });

        // Waypoint 2: Final system framing (smooth transition to system view)
        waypoints.push({
          position: finalPosition,
          lookAt: center,
          duration: 2200,
        });

        // Execute continuous smooth zoom in
        await sceneManagerRef.current.smoothWaypointTransition(waypoints);
      } else {
        // Fallback: just cleanup galaxy and position
        galaxyRendererRef.current.cleanup();
        sceneManagerRef.current.camera.position.copy(finalPosition);
        sceneManagerRef.current.camera.lookAt(center);
        if (sceneManagerRef.current?.controls) {
          sceneManagerRef.current.controls.target.copy(center);
          sceneManagerRef.current.controls.update();
        }
      }
    } else {
      // Instant positioning for non-galaxy views
      sceneManagerRef.current.camera.position.copy(finalPosition);
      sceneManagerRef.current.camera.lookAt(center);
      if (sceneManagerRef.current?.controls) {
        sceneManagerRef.current.controls.target.copy(center);
        sceneManagerRef.current.controls.update();
      }
    }

    cameraManagerRef.current.updateLastCameraDistance(distance);
    cameraManagerRef.current.setTransitioning(false);

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

  const switchToSystemView = async () => {
    const wasPlanetView = viewModeRef.current === "planet";

    updateUIForSystemView();
    updateOrbitSpeedDisplay();
    domRefs.canvasRef.current.classList.remove("grabbing", "moving", "pointer");
    domRefs.canvasRef.current.classList.add("grab");

    const notableSystems = filterManagerRef.current.getNotableSystems();
    uiManagerRef.current.updateSystemsList(notableSystems);

    if (currentPlanetRef.current) {
      const systemPlanets = filterManagerRef.current.getPlanetsForSystem(
        currentPlanetRef.current.hostStar
      );
      if (systemPlanets.length > 1) {
        const system = {
          starName: currentPlanetRef.current.hostStar,
          planets: systemPlanets,
          count: systemPlanets.length,
        };

        // If coming from planet view, use continuous smooth transition
        if (wasPlanetView) {
          cameraManagerRef.current.setTransitioning(true);

          // Render the system first to get proper bounds
          if (systemRendererRef.current) {
            systemRendererRef.current.renderSystem(
              system.planets,
              animateOrbitsRef.current,
              infoTabManagerRef.current?.settingsManager
                ?.useOrbitalInclination || false
            );

            // Update state BEFORE transition so planets animate during zoom
            currentSystemRef.current = system;
            viewModeRef.current = "system";

            // Sync state immediately after ref update
            if (selectSystem.syncState) {
              selectSystem.syncState();
            }

            // Get the system bounds for proper framing
            const { center, size } =
              systemRendererRef.current.getSystemCenterAndSize();
            const vFOV = (sceneManagerRef.current.camera.fov * Math.PI) / 180;
            const halfH = Math.max(size.y * 0.5, 0.001);
            const halfW = Math.max(size.x * 0.5, 0.001);
            const fitH = halfH / Math.tan(vFOV / 2);
            const fitW =
              halfW /
              (Math.tan(vFOV / 2) * sceneManagerRef.current.camera.aspect);
            let distance = Math.max(fitW, fitH) * 1.2;
            if (!isFinite(distance) || distance <= 0) distance = 30;

            // Calculate final position with proper angle
            const direction = new THREE.Vector3(0, 0.4, 0.9).normalize();
            const finalPosition = direction
              .clone()
              .multiplyScalar(distance)
              .add(center);

            // Enable following the planet during zoom out
            cameraManagerRef.current.setFollowPlanet(true);

            // Create smooth continuous motion from planet to system view
            // Use a single smooth zoom out that centers on the star
            const waypoints = [];

            // Single waypoint for smooth continuous zoom out
            // Zoom out along a smooth path while centering on the star
            waypoints.push({
              position: finalPosition,
              lookAt: center,
              duration: 2500, // Longer duration for smooth continuous motion
              onReach: () => {
                // Cleanup planet renderer after transition completes
                planetRendererRef.current.cleanup();
                // Keep following planet even after transition
              },
            });

            // Execute continuous smooth transition
            await sceneManagerRef.current.smoothWaypointTransition(waypoints);

            cameraManagerRef.current.setTransitioning(false);
            cameraManagerRef.current.updateLastCameraDistance(distance);

            updateInfoTab();
            switchToInfoTab();
            return;
          }
        }

        // Fall back to normal selectSystem if not from planet view
        selectSystem(system);
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

  const switchToGalaxyView = async () => {
    cameraManagerRef.current.setTransitioning(true);
    viewModeRef.current = "galaxy";
    const previousSystem = currentSystemRef.current;

    // Sync state immediately after ref update
    if (switchToGalaxyView.syncState) {
      switchToGalaxyView.syncState();
    }

    // Cleanup renderers immediately to avoid seeing them behind galaxy
    planetRendererRef.current.cleanup();
    systemRendererRef.current.cleanup();

    // Render galaxy
    const notableSystems = filterManagerRef.current.getNotableSystems();
    galaxyRendererRef.current.renderGalaxy(notableSystems);

    // Calculate final galaxy overview position
    let finalCameraPos;
    let finalTarget;

    if (previousSystem) {
      const systemPosition =
        galaxyRendererRef.current.getSystemPosition(previousSystem);

      if (systemPosition) {
        // Position camera to show all stars in galaxy
        const distance = 30;
        const offset = new THREE.Vector3(0, 1, 1.5)
          .normalize()
          .multiplyScalar(distance);
        finalCameraPos = systemPosition.clone().add(offset);
        finalTarget = systemPosition;
      } else {
        finalCameraPos = new THREE.Vector3(0, 60, 60);
        finalTarget = new THREE.Vector3(0, 0, 0);
      }
    } else {
      finalCameraPos = new THREE.Vector3(0, 60, 60);
      finalTarget = new THREE.Vector3(0, 0, 0);
    }

    // Instant positioning - no animation
    sceneManagerRef.current.camera.position.copy(finalCameraPos);
    sceneManagerRef.current.camera.lookAt(finalTarget);
    if (sceneManagerRef.current?.controls) {
      sceneManagerRef.current.controls.target.copy(finalTarget);
      sceneManagerRef.current.controls.update();
    }

    // Update state
    cameraManagerRef.current.setTransitioning(false);
    cameraManagerRef.current.updateLastCameraDistance(
      sceneManagerRef.current.camera.position.length()
    );

    updateInfoTab();
    switchToInfoTab();
    updateSettingsVisibility("galaxy");
  };

  /**
   * Switch to galaxy view from planet view
   * Instantly switches to galaxy - no transition animation
   */
  const switchToGalaxyViewFromPlanet = async () => {
    if (viewModeRef.current !== "planet") {
      // Not in planet view, use regular switchToGalaxyView
      return switchToGalaxyView();
    }

    // Just use the regular switchToGalaxyView which now has no animation
    return switchToGalaxyView();
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
    switchToGalaxyViewFromPlanet,
  };
};
