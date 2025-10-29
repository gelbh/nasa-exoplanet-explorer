import * as THREE from "three";

/**
 * Custom hook for info tab management
 * Handles info updates, galactic center interaction, and planet selection from tabs
 */
export const useInfoTab = ({
  infoTabManagerRef,
  filterManagerRef,
  systemRendererRef,
  galaxyRendererRef,
  sceneManagerRef,
  cameraManagerRef,
  domRefs,
  viewModeRef,
  currentSystemRef,
  currentPlanetRef,
  transitionToPlanetFromSystem,
  updateSettingsVisibility,
}) => {
  // ============================================
  // INFO TAB OPERATIONS
  // ============================================

  const initInfoTabPlanetClicks = () => {
    const handlePlanetSelect = (event) => {
      const planetName = event.detail;
      const allPlanets = filterManagerRef.current.getAllExoplanets();
      const planet = allPlanets.find((p) => p.name === planetName);

      if (planet && currentSystemRef.current) {
        const planetMesh = systemRendererRef.current.getPlanetMesh(planet);
        if (planetMesh) {
          const planetWorldPosition = new THREE.Vector3();
          planetMesh.getWorldPosition(planetWorldPosition);
          transitionToPlanetFromSystem(planet, planetWorldPosition, planetMesh);
        }
      }
    };

    document.addEventListener("planet-select", handlePlanetSelect);
  };

  const switchToInfoTab = () => {
    infoTabManagerRef.current.switchToInfoTab();
  };

  const updateInfoTab = () => {
    infoTabManagerRef.current.updateInfoTab(viewModeRef.current, {
      currentSystem: currentSystemRef.current,
      currentPlanet: currentPlanetRef.current,
    });
  };

  const clearInfoTab = () => {
    if (domRefs.infoContentRef.current) {
      domRefs.infoContentRef.current.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <p>Click on a star system or Sagittarius A* to view details</p>
        </div>
      `;
    }
  };

  // ============================================
  // GALACTIC CENTER
  // ============================================

  const zoomToGalacticCenter = () => {
    const galacticCenterPos =
      galaxyRendererRef.current.getGalacticCenterPosition();

    if (!galacticCenterPos) {
      console.warn("Galactic center position not found");
      return;
    }

    cameraManagerRef.current.setTransitioning(true);
    viewModeRef.current = "galacticCenter";

    const zoomDistance = 25;
    const currentDir = sceneManagerRef.current.camera.position
      .clone()
      .sub(galacticCenterPos)
      .normalize();

    const targetCameraPos = galacticCenterPos
      .clone()
      .add(
        new THREE.Vector3(
          currentDir.x * zoomDistance,
          zoomDistance * 0.3,
          currentDir.z * zoomDistance
        )
      );

    sceneManagerRef.current.smoothCameraTransitionWithTarget(
      targetCameraPos,
      galacticCenterPos,
      1500,
      () => {
        displayGalacticCenterInfo();
        switchToInfoTab();

        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 300);
      }
    );
  };

  const displayGalacticCenterInfo = () => {
    const marker = galaxyRendererRef.current.galacticCenterMarker;
    if (!marker) return;

    const info = marker.userData;

    const html = `
      <div class="space-y-4">
        <div>
          <h3 class="text-xl font-bold text-purple-300 mb-2">${info.name}</h3>
          <p class="text-gray-300 text-sm mb-4">${info.description}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-400 uppercase">Mass</p>
            <p class="text-lg text-white font-semibold">${info.mass}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase">Distance</p>
            <p class="text-lg text-white font-semibold">${info.distance}</p>
          </div>
        </div>

        <div class="space-y-2 mt-4">
          <div class="bg-gray-800/50 p-3 rounded">
            <p class="text-xs text-gray-400 uppercase mb-1">Type</p>
            <p class="text-white">Supermassive Black Hole</p>
          </div>

          <div class="bg-gray-800/50 p-3 rounded">
            <p class="text-xs text-gray-400 uppercase mb-1">Schwarzschild Radius</p>
            <p class="text-white">~12 million km</p>
            <p class="text-xs text-gray-400 mt-1">Approximately 17 times the Sun's radius</p>
          </div>

          <div class="bg-gray-800/50 p-3 rounded">
            <p class="text-xs text-gray-400 uppercase mb-1">First Image</p>
            <p class="text-white">May 12, 2022</p>
            <p class="text-xs text-gray-400 mt-1">By Event Horizon Telescope collaboration</p>
          </div>

          <div class="bg-gray-800/50 p-3 rounded">
            <p class="text-xs text-gray-400 uppercase mb-1">About</p>
            <p class="text-white text-sm leading-relaxed">
              Sagittarius A* is the supermassive black hole at the center of our galaxy.
              It has a mass of 4.15 million times that of our Sun and is surrounded by
              a superheated accretion disk of gas and dust spiraling into the event horizon
              at near light speed.
            </p>
          </div>
        </div>

        <button
          class="w-full mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          onclick="document.dispatchEvent(new CustomEvent('return-to-galaxy'))"
        >
          ← Return to Galaxy View
        </button>
      </div>
    `;

    domRefs.infoContentRef.current.innerHTML = html;
  };

  const returnToGalaxyView = () => {
    cameraManagerRef.current.setTransitioning(true);
    viewModeRef.current = "galaxy";
    currentPlanetRef.current = null;
    currentSystemRef.current = null;
    
    // Sync state immediately after ref update
    if (returnToGalaxyView.syncState) {
      returnToGalaxyView.syncState();
    }

    const currentPos = sceneManagerRef.current.camera.position.clone();
    const targetCameraPos = currentPos.multiplyScalar(3);

    sceneManagerRef.current.smoothCameraTransitionWithTarget(
      targetCameraPos,
      new THREE.Vector3(0, 0, 0),
      1000,
      () => {
        updateSettingsVisibility("galaxy");
        clearInfoTab();

        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 300);
      }
    );
  };

  return {
    initInfoTabPlanetClicks,
    switchToInfoTab,
    updateInfoTab,
    clearInfoTab,
    zoomToGalacticCenter,
    displayGalacticCenterInfo,
    returnToGalaxyView,
  };
};
