import React, { useEffect, useState, useRef } from "react";
import {
  useThreeJSScene,
  useExoplanetData,
  useDOMRefs,
  useUIManagers,
  useCanvasInteraction,
  useSettingsHandlers,
  useViewTransitions,
  useInfoTab,
} from "../hooks";
import CanvasContainer from "./CanvasContainer";
import CombinedPanel from "./CombinedPanel";
import { BookmarkManager } from "../lib/managers/storage/BookmarkManager";
import { ExportManager } from "../lib/managers/export/ExportManager";

// NASA Exoplanet Archive API endpoint
// Import from constants (which uses environment variable)
import { EXOPLANET_API_ENDPOINT } from "../utils/constants";

/**
 * Exoplanet Viewer Component
 *
 * An interactive 3D exoplanet visualization tool powered by Three.js and NASA's Exoplanet Archive.
 * Features real exoplanet data, procedurally generated planets, and advanced filtering capabilities.
 *
 * Key Features:
 * - Real NASA exoplanet data from 5000+ confirmed planets
 * - Procedural planet generation based on physical properties
 * - Advanced filtering (type, temperature, distance)
 * - Orbit visualization with host star
 * - Realistic stellar lighting and atmospheric effects
 */
const ExoplanetViewer = () => {
  // ============================================
  // STATE FOR NEW FEATURES
  // ============================================

  // Comparison tool state
  const [comparisonPlanets, setComparisonPlanets] = useState([]);

  // Track current planet/system/star for Tools tab (state for re-rendering)
  const [currentPlanet, setCurrentPlanet] = useState(null);
  const [currentSystem, setCurrentSystem] = useState(null);
  const [currentStar, setCurrentStar] = useState(null);
  const [viewMode, setViewMode] = useState("galaxy");

  // Managers for new features
  const bookmarkManagerRef = useRef(null);
  const exportManagerRef = useRef(null);

  // ============================================
  // CUSTOM HOOKS - DOM & SCENE
  // ============================================

  const domRefs = useDOMRefs();

  const {
    sceneManagerRef,
    planetRendererRef,
    systemRendererRef,
    galaxyRendererRef,
    comparisonRendererRef,
    cameraManagerRef,
    raycasterRef,
    mouseRef,
    animationIdRef,
    isTabVisibleRef,
    initThreeJS,
    renderBasicGalaxyStructure,
    cleanup: cleanupThreeJS,
  } = useThreeJSScene(domRefs.canvasRef, domRefs.canvasLoadingRef);

  const {
    filterManagerRef,
    uiManagerRef,
    initializeDataManagers,
    fetchExoplanets,
  } = useExoplanetData(EXOPLANET_API_ENDPOINT, domRefs);

  const {
    tooltipManagerRef,
    settingsManagerRef,
    infoTabManagerRef,
    panelManagerRef,
    searchCoordinatorRef,
    initializeUIManagers,
    initializeSearchCoordinator,
    setRenderers,
    cleanup: cleanupUIManagers,
  } = useUIManagers();

  // ============================================
  // CUSTOM HOOKS - VIEW TRANSITIONS & INFO
  // ============================================

  const {
    currentPlanetRef,
    currentSystemRef,
    currentStarRef,
    viewModeRef,
    animateOrbitsRef,
    selectPlanet,
    selectSystem,
    selectStar,
    transitionToPlanetFromSystem,
    transitionToStarFromSystem,
    switchToGalaxyView,
  } = useViewTransitions({
    sceneManagerRef,
    planetRendererRef,
    systemRendererRef,
    galaxyRendererRef,
    cameraManagerRef,
    filterManagerRef,
    uiManagerRef,
    infoTabManagerRef,
    domRefs,
    updateInfoTab: () => {},
    switchToInfoTab: () => {},
    updateSettingsVisibility: (viewMode) => {
      settingsManagerRef.current?.updateSettingsVisibility?.(viewMode);
    },
  });

  const {
    initInfoTabPlanetClicks,
    switchToInfoTab,
    updateInfoTab,
    zoomToGalacticCenter,
    returnToGalaxyView,
  } = useInfoTab({
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
    updateSettingsVisibility: (viewMode) => {
      settingsManagerRef.current?.updateSettingsVisibility?.(viewMode);
    },
  });

  // Fix circular dependencies by updating the transition hook's functions
  useEffect(() => {
    if (selectPlanet) {
      selectPlanet.updateInfoTab = updateInfoTab;
      selectPlanet.switchToInfoTab = switchToInfoTab;
    }
  }, [updateInfoTab, switchToInfoTab, selectPlanet]);

  // Sync ref values to state for Tools tab re-rendering
  // Instead of polling, we'll update via callbacks when refs change
  useEffect(() => {
    // Create callbacks to update state when refs change
    const syncState = () => {
      setCurrentPlanet(currentPlanetRef.current);
      setCurrentSystem(currentSystemRef.current);
      setCurrentStar(currentStarRef.current);
      setViewMode(viewModeRef.current);
    };

    // Store callback reference so hooks can call it
    if (selectPlanet) {
      selectPlanet.syncState = syncState;
    }
    if (selectSystem) {
      selectSystem.syncState = syncState;
    }
    if (selectStar) {
      selectStar.syncState = syncState;
    }
    if (switchToGalaxyView) {
      switchToGalaxyView.syncState = syncState;
    }
    if (returnToGalaxyView) {
      returnToGalaxyView.syncState = syncState;
    }
    if (transitionToPlanetFromSystem) {
      transitionToPlanetFromSystem.syncState = syncState;
    }
    if (transitionToStarFromSystem) {
      transitionToStarFromSystem.syncState = syncState;
    }
  }, [
    currentPlanetRef,
    currentSystemRef,
    currentStarRef,
    viewModeRef,
    selectPlanet,
    selectSystem,
    selectStar,
    switchToGalaxyView,
    returnToGalaxyView,
    transitionToPlanetFromSystem,
    transitionToStarFromSystem,
  ]);

  // Update Info tab whenever planet/system/star/view changes
  useEffect(() => {
    if (updateInfoTab && infoTabManagerRef.current) {
      try {
        updateInfoTab(viewMode, {
          currentSystem: currentSystem,
          currentPlanet: currentPlanet,
          currentStar: currentStar,
        });
      } catch (error) {
        console.error("Error updating info tab:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlanet, currentSystem, currentStar, viewMode]);

  // ============================================
  // CUSTOM HOOKS - CANVAS INTERACTION
  // ============================================

  const handleSystemSelectFromCanvas = (system, systemPosition) => {
    cameraManagerRef.current.setTransitioning(true);

    const zoomDistance = 8;
    const direction = sceneManagerRef.current.camera.position
      .clone()
      .sub(systemPosition)
      .normalize();
    const targetCameraPos = systemPosition
      .clone()
      .add(direction.multiplyScalar(zoomDistance));

    sceneManagerRef.current.smoothCameraTransitionWithTarget(
      targetCameraPos,
      systemPosition,
      1000,
      () => {
        viewModeRef.current = "system";
        currentSystemRef.current = system;
        galaxyRendererRef.current.cleanup();
        selectSystem(system);

        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 300);
      }
    );
  };

  const handleStarSelectFromCanvas = (system, starWorldPosition, starMesh) => {
    // Transition to star view from system view
    transitionToStarFromSystem(system, starWorldPosition, starMesh);
  };

  const {
    setupCanvasEventListeners,
    removeCanvasEventListeners,
    updateCanvasCursor,
    updateGalaxyCursor,
  } = useCanvasInteraction({
    sceneManagerRef,
    raycasterRef,
    mouseRef,
    cameraManagerRef,
    tooltipManagerRef,
    galaxyRendererRef,
    systemRendererRef,
    viewModeRef,
    currentSystemRef,
    domRefs,
    onSystemSelect: handleSystemSelectFromCanvas,
    onPlanetSelect: transitionToPlanetFromSystem,
    onStarSelect: handleStarSelectFromCanvas,
    onGalacticCenterClick: zoomToGalacticCenter,
  });

  // ============================================
  // CUSTOM HOOKS - SETTINGS HANDLERS
  // ============================================

  const settingsHandlers = useSettingsHandlers({
    settingsManagerRef,
    systemRendererRef,
    sceneManagerRef,
    cameraManagerRef,
    currentSystemRef,
    animateOrbitsRef,
    domRefs,
  });

  // ============================================
  // SEARCH & FILTER HANDLERS
  // ============================================

  const search = () => {
    searchCoordinatorRef.current?.search();
  };

  const changeFilterMode = () => {
    searchCoordinatorRef.current?.changeFilterMode();
  };

  const applyFilters = () => {
    searchCoordinatorRef.current?.applyFilters();
  };

  const clearFilters = () => {
    searchCoordinatorRef.current?.clearFilters();
  };

  const toggleFilters = (event) => {
    const button = event.currentTarget;

    if (!domRefs.filtersSectionRef.current || !domRefs.filtersIconRef.current)
      return;

    const filtersSection = domRefs.filtersSectionRef.current;

    if (filtersSection.classList.contains("show")) {
      filtersSection.classList.remove("show");
      button.setAttribute("aria-expanded", "false");
    } else {
      filtersSection.classList.add("show");
      button.setAttribute("aria-expanded", "true");
    }
  };

  const toggleResults = (event) => {
    const button = event.currentTarget;

    if (!domRefs.resultsSectionRef.current || !domRefs.resultsIconRef.current)
      return;

    const resultsSection = domRefs.resultsSectionRef.current;

    if (resultsSection.classList.contains("show")) {
      resultsSection.classList.remove("show");
      button.setAttribute("aria-expanded", "false");
    } else {
      resultsSection.classList.add("show");
      button.setAttribute("aria-expanded", "true");
    }
  };

  // ============================================
  // CONTROL HANDLERS
  // ============================================

  const resetCamera = () => {
    cameraManagerRef.current.resetCamera(viewModeRef.current, {
      currentSystem: currentSystemRef.current,
      currentPlanet: currentPlanetRef.current,
      galaxyRenderer: galaxyRendererRef.current,
      systemRenderer: systemRendererRef.current,
    });
  };

  const toggleFullscreen = () => {
    const container = document.querySelector(".exoplanet-fullscreen-viewer");

    const fullscreenElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (!fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const togglePanelMinimize = (event) => {
    const button = event.currentTarget;
    const panelName = button.dataset.panelTarget;

    let panel;
    if (panelName === "combined" && domRefs.leftPanelRef.current) {
      panel = domRefs.leftPanelRef.current;
    }

    if (!panel) return;
    panel.classList.toggle("minimized");
  };

  // ============================================
  // ANIMATION
  // ============================================

  const handleVisibilityChange = () => {
    isTabVisibleRef.current = !document.hidden;
    if (isTabVisibleRef.current && !animationIdRef.current) {
      animate();
    }
  };

  const animate = () => {
    animationIdRef.current = requestAnimationFrame(() => animate());

    if (!isTabVisibleRef.current) {
      return;
    }

    sceneManagerRef.current.updateControls();

    // Check for auto-switch on zoom out
    if (viewModeRef.current === "planet" && currentPlanetRef.current) {
      cameraManagerRef.current.checkZoomOutToSystemView(
        currentPlanetRef.current,
        filterManagerRef.current
      );
    } else if (viewModeRef.current === "star" && currentStarRef.current) {
      // When zooming out from star view, return to system view
      cameraManagerRef.current.checkZoomOutToSystemView(
        currentStarRef.current.starData,
        filterManagerRef.current
      );
    } else if (viewModeRef.current === "system" && currentSystemRef.current) {
      cameraManagerRef.current.checkZoomOutToGalaxyView();
    }

    // Handle different view modes
    if (viewModeRef.current === "comparison") {
      // Comparison view
      comparisonRendererRef.current.update(0.016);
    } else if (viewModeRef.current === "planet") {
      if (
        currentSystemRef.current &&
        systemRendererRef.current.systemPlanets.length > 0
      ) {
        // Unified view: use systemRenderer
        systemRendererRef.current.rotatePlanets(0.005);
        systemRendererRef.current.updateShaderUniforms(
          sceneManagerRef.current.camera
        );
      } else {
        // Standalone planet view: use planetRenderer
        planetRendererRef.current.rotatePlanet(0.005);
        planetRendererRef.current.animateEffects();
        planetRendererRef.current.updateShaderUniforms(
          sceneManagerRef.current.camera
        );
      }
    } else if (viewModeRef.current === "star") {
      // Animate star surface (rotation, pulsation, flares)
      if (systemRendererRef.current?.starRenderer) {
        systemRendererRef.current.starRenderer.animateStars();
      }
      // Also update system renderer shaders in case we're showing the star
      systemRendererRef.current.updateShaderUniforms(
        sceneManagerRef.current.camera
      );
    } else if (viewModeRef.current === "system") {
      if (animateOrbitsRef.current) {
        systemRendererRef.current.animateOrbits(
          0.016,
          settingsManagerRef.current.orbitSpeed,
          settingsManagerRef.current.useOrbitalInclination
        );
      }
      systemRendererRef.current.rotatePlanets(0.005);
      systemRendererRef.current.updateShaderUniforms(
        sceneManagerRef.current.camera
      );
    } else if (
      viewModeRef.current === "galaxy" ||
      viewModeRef.current === "galacticCenter"
    ) {
      galaxyRendererRef.current.animateGalaxy(0.016);
    }

    // Follow planet if enabled
    if (cameraManagerRef.current.followPlanet && currentPlanetRef.current) {
      cameraManagerRef.current.updateCameraFollowing(
        currentPlanetRef.current,
        systemRendererRef.current
      );
    }

    sceneManagerRef.current.animateStars();
    sceneManagerRef.current.render();
  };

  // ============================================
  // INITIALIZATION EFFECT
  // ============================================

  useEffect(() => {
    // Initialize new feature managers
    bookmarkManagerRef.current = new BookmarkManager();

    // Initialize all managers
    initializeDataManagers();
    initializeUIManagers(domRefs.canvasRef, domRefs.infoContentRef);
    
    // Capture ref for cleanup to prevent stale ref warning
    const searchCoordinatorForCleanup = searchCoordinatorRef;

    // Set callbacks
    uiManagerRef.current.setPlanetSelectCallback((planet) =>
      selectPlanet(planet)
    );
    uiManagerRef.current.setSystemSelectCallback((system) =>
      selectSystem(system)
    );

    // Defer Three.js initialization for smooth page animations
    requestAnimationFrame(() => {
      setTimeout(() => {
        initThreeJS();

        // Initialize export manager after scene is ready
        exportManagerRef.current = new ExportManager(sceneManagerRef.current);

        // Set camera manager callbacks
        cameraManagerRef.current.setCallbacks({
          onSwitchToSystemView: (system) => selectSystem(system),
          onSwitchToGalaxyView: () => switchToGalaxyView(),
        });

        // Set renderer references
        setRenderers(
          sceneManagerRef.current,
          planetRendererRef.current,
          systemRendererRef.current,
          galaxyRendererRef.current
        );
        infoTabManagerRef.current.setFilterManager(filterManagerRef.current);

        // Setup canvas event listeners
        setupCanvasEventListeners();

        // Start animation loop
        animate();

        // Render basic galaxy structure immediately
        renderBasicGalaxyStructure();

        // Fetch exoplanet data
        fetchExoplanets(
          galaxyRendererRef,
          sceneManagerRef,
          // On first batch
          () => {
            const systems = filterManagerRef.current.getNotableSystems();
            if (systems.length > 0 && galaxyRendererRef.current) {
              galaxyRendererRef.current.renderGalaxy(systems);

              const maxDistance =
                galaxyRendererRef.current.calculateMaxSystemDistance();
              const optimalDistance = Math.max(50, maxDistance * 1.5);
              const camX = 0;
              const camY = optimalDistance * 0.4;
              const camZ = optimalDistance * 0.6;

              sceneManagerRef.current.camera.position.set(camX, camY, camZ);
              sceneManagerRef.current.camera.lookAt(0, 0, 0);
              sceneManagerRef.current.controls.target.set(0, 0, 0);
              sceneManagerRef.current.controls.update();
            }
          },
          // On complete
          () => {
            updateInfoTab();
          }
        );

        // Initialize search coordinator
        initializeSearchCoordinator(
          filterManagerRef.current,
          uiManagerRef.current,
          domRefs
        );

        panelManagerRef.current.initialize();
        initInfoTabPlanetClicks();
        settingsHandlers.updateSettingsVisibility("galaxy");
      }, 100);
    });

    // Cleanup on unmount
    return () => {
      cleanupThreeJS();
      cleanupUIManagers();
      removeCanvasEventListeners();

      // Cleanup search coordinator to prevent memory leaks
      if (searchCoordinatorForCleanup.current) {
        searchCoordinatorForCleanup.current.cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for galactic center return button
  useEffect(() => {
    const handleReturnToGalaxy = () => returnToGalaxyView();
    document.addEventListener("return-to-galaxy", handleReturnToGalaxy);
    return () =>
      document.removeEventListener("return-to-galaxy", handleReturnToGalaxy);
  }, [returnToGalaxyView]);

  // Visibility change listener
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update cursor when view mode changes
  useEffect(() => {
    if (viewMode === "galaxy") {
      updateGalaxyCursor();
    } else if (viewMode === "system") {
      updateCanvasCursor();
    } else {
      // Planet view - set to grab cursor
      if (domRefs.canvasRef.current) {
        domRefs.canvasRef.current.classList.remove("pointer");
        domRefs.canvasRef.current.classList.add("grab");
      }
    }
  }, [viewMode, updateCanvasCursor, updateGalaxyCursor, domRefs.canvasRef]);

  // ============================================
  // HANDLERS FOR NEW FEATURES
  // ============================================

  const handleAddToComparison = (planet) => {
    // Check if planet is already in comparison
    if (!comparisonPlanets.find((p) => p.name === planet.name)) {
      setComparisonPlanets([...comparisonPlanets, planet]);
    }
  };

  const handleRemoveFromComparison = (planet) => {
    setComparisonPlanets(
      comparisonPlanets.filter((p) => p.name !== planet.name)
    );
  };

  const handleClearComparison = () => {
    console.log("🧹 Clearing comparison...");
    setComparisonPlanets([]);

    // Exit comparison view if active
    if (viewModeRef.current === "comparison") {
      console.log("Exiting comparison view...");

      // Hide comparison renderer
      if (comparisonRendererRef.current) {
        comparisonRendererRef.current.hide();
        comparisonRendererRef.current.clearComparison();
      }

      // Return to galaxy view
      switchToGalaxyView();
    }
  };

  const handleViewComparisonIn3D = (planetsToView) => {
    console.log("🚀 Starting 3D comparison view...");

    // Use the planets passed from ComparisonTool (includes Earth if toggled)
    const planetsToCompare = planetsToView || comparisonPlanets;

    if (!planetsToCompare || planetsToCompare.length === 0) {
      console.warn("No planets to compare");
      return;
    }

    console.log("Planets to compare:", planetsToCompare);

    // Hide other renderers
    if (galaxyRendererRef.current) {
      galaxyRendererRef.current.cleanup();
    }
    if (systemRendererRef.current) {
      systemRendererRef.current.cleanup();
    }
    if (planetRendererRef.current) {
      planetRendererRef.current.cleanup();
    }

    // Setup comparison view with the planets array (includes Earth if enabled)
    comparisonRendererRef.current.setupComparison(planetsToCompare);
    comparisonRendererRef.current.show();

    // Update controls target
    if (sceneManagerRef.current?.controls) {
      sceneManagerRef.current.controls.target.set(0, 0, 0);
      sceneManagerRef.current.controls.update();
      console.log("✅ Controls updated for comparison view");
    }

    // Update view mode
    viewModeRef.current = "comparison";
    setViewMode("comparison");

    // Update settings visibility
    if (settingsManagerRef.current?.updateSettingsVisibility) {
      settingsManagerRef.current.updateSettingsVisibility("comparison");
    }

    console.log("✨ Comparison view setup complete!");
  };

  // Offline detection
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Connection restored");
      // Optionally show a toast notification
    };

    const handleOffline = () => {
      console.warn("⚠️ Connection lost - app running in offline mode");
      alert("You are currently offline. Some features may not be available.");
    };

    // Check initial state
    if (!navigator.onLine) {
      console.warn("⚠️ Starting in offline mode");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="exoplanet-viewer-page">
      <section className="exoplanet-fullscreen-viewer">
        {/* Canvas Container with Controls and Instructions */}
        <CanvasContainer
          canvasRef={domRefs.canvasRef}
          canvasLoadingRef={domRefs.canvasLoadingRef}
          instructionsRef={domRefs.instructionsRef}
          onResetCamera={resetCamera}
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Combined Panel with Settings, Search, Info, and Tools tabs */}
        <CombinedPanel
          leftPanelRef={domRefs.leftPanelRef}
          settingsRefs={{
            atmosphereToggleRef: domRefs.atmosphereToggleRef,
            starVisibilityToggleRef: domRefs.starVisibilityToggleRef,
            planetLabelsToggleRef: domRefs.planetLabelsToggleRef,
            orbitalInclinationToggleRef: domRefs.orbitalInclinationToggleRef,
            realisticDistancesToggleRef: domRefs.realisticDistancesToggleRef,
            orbitLinesToggleRef: domRefs.orbitLinesToggleRef,
            orbitSpeedSliderRef: domRefs.orbitSpeedSliderRef,
            orbitSpeedValueRef: domRefs.orbitSpeedValueRef,
            starDensitySliderRef: domRefs.starDensitySliderRef,
            starDensityValueRef: domRefs.starDensityValueRef,
            highQualityToggleRef: domRefs.highQualityToggleRef,
            cameraSpeedSliderRef: domRefs.cameraSpeedSliderRef,
            cameraSpeedValueRef: domRefs.cameraSpeedValueRef,
            autoRotateToggleRef: domRefs.autoRotateToggleRef,
          }}
          settingsHandlers={settingsHandlers}
          searchRefs={{
            searchInputRef: domRefs.searchInputRef,
            filtersIconRef: domRefs.filtersIconRef,
            filtersSectionRef: domRefs.filtersSectionRef,
            filterModeRef: domRefs.filterModeRef,
            planetFiltersRef: domRefs.planetFiltersRef,
            systemFiltersRef: domRefs.systemFiltersRef,
            typeFilterRef: domRefs.typeFilterRef,
            tempMinRef: domRefs.tempMinRef,
            tempMaxRef: domRefs.tempMaxRef,
            distanceMaxRef: domRefs.distanceMaxRef,
            discoveryMethodFilterRef: domRefs.discoveryMethodFilterRef,
            discoveryFacilityFilterRef: domRefs.discoveryFacilityFilterRef,
            minPlanetsRef: domRefs.minPlanetsRef,
            systemDistanceMaxRef: domRefs.systemDistanceMaxRef,
            spectralTypeFilterRef: domRefs.spectralTypeFilterRef,
            resultCountRef: domRefs.resultCountRef,
            resultsIconRef: domRefs.resultsIconRef,
            resultsSectionRef: domRefs.resultsSectionRef,
            loadingIndicatorRef: domRefs.loadingIndicatorRef,
            resultsListRef: domRefs.resultsListRef,
          }}
          searchHandlers={{
            onSearch: search,
            onApplyFilters: applyFilters,
            onClearFilters: clearFilters,
            onToggleFilters: toggleFilters,
            onToggleResults: toggleResults,
            onChangeFilterMode: changeFilterMode,
          }}
          infoContentRef={domRefs.infoContentRef}
          onTogglePanelMinimize={togglePanelMinimize}
          // New props for Tools tab
          bookmarkManager={bookmarkManagerRef.current}
          comparisonPlanets={comparisonPlanets}
          onAddToComparison={handleAddToComparison}
          onRemoveFromComparison={handleRemoveFromComparison}
          onClearComparison={handleClearComparison}
          onViewComparisonIn3D={handleViewComparisonIn3D}
          exportManager={exportManagerRef.current}
          viewState={{
            mode: viewMode,
            planet: currentPlanet?.name,
            system: currentSystem?.hostStar,
          }}
          currentPlanet={currentPlanet}
          onPlanetSelect={selectPlanet}
          onSystemSelect={selectSystem}
        />
      </section>
    </div>
  );
};

export default ExoplanetViewer;
