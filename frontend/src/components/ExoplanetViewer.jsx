import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SceneManager } from '../lib/SceneManager';
import { PlanetRenderer } from '../lib/PlanetRenderer';
import { SystemRenderer } from '../lib/SystemRenderer';
import { GalaxyRenderer } from '../lib/GalaxyRenderer';
import { ApiManager } from '../lib/ApiManager';
import { FilterManager } from '../lib/FilterManager';
import { UIManager } from '../lib/UIManager';
import { TooltipManager } from '../lib/TooltipManager';
import { SettingsManager } from '../lib/SettingsManager';
import { CameraManager } from '../lib/CameraManager';
import { InfoTabManager } from '../lib/InfoTabManager';
import { PanelManager } from '../lib/PanelManager';
import { SearchCoordinator } from '../lib/SearchCoordinator';

// NASA Exoplanet Archive API endpoint
const EXOPLANET_API_ENDPOINT = 'http://localhost:5000/api/exoplanets';

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
  // Refs for DOM elements
  const canvasRef = useRef(null);
  const canvasLoadingRef = useRef(null);
  const searchInputRef = useRef(null);
  const filterModeRef = useRef(null);
  const planetFiltersRef = useRef(null);
  const systemFiltersRef = useRef(null);
  const typeFilterRef = useRef(null);
  const tempMinRef = useRef(null);
  const tempMaxRef = useRef(null);
  const distanceMaxRef = useRef(null);
  const discoveryMethodFilterRef = useRef(null);
  const discoveryFacilityFilterRef = useRef(null);
  const minPlanetsRef = useRef(null);
  const systemDistanceMaxRef = useRef(null);
  const spectralTypeFilterRef = useRef(null);
  const resultsListRef = useRef(null);
  const resultCountRef = useRef(null);
  const loadingIndicatorRef = useRef(null);
  const instructionsRef = useRef(null);
  const leftPanelRef = useRef(null);
  const orbitSpeedSliderRef = useRef(null);
  const orbitSpeedValueRef = useRef(null);
  const orbitalInclinationToggleRef = useRef(null);
  const realisticDistancesToggleRef = useRef(null);
  const atmosphereToggleRef = useRef(null);
  const filtersIconRef = useRef(null);
  const filtersSectionRef = useRef(null);
  const resultsIconRef = useRef(null);
  const resultsSectionRef = useRef(null);
  const infoContentRef = useRef(null);
  const starVisibilityToggleRef = useRef(null);
  const planetLabelsToggleRef = useRef(null);
  const orbitLinesToggleRef = useRef(null);
  const starDensitySliderRef = useRef(null);
  const starDensityValueRef = useRef(null);
  const highQualityToggleRef = useRef(null);
  const cameraSpeedSliderRef = useRef(null);
  const cameraSpeedValueRef = useRef(null);
  const autoRotateToggleRef = useRef(null);

  // Refs for managers and state (use useRef to avoid re-renders)
  const currentPlanetRef = useRef(null);
  const currentSystemRef = useRef(null);
  const viewModeRef = useRef('galaxy'); // Always start with galaxy view
  const animateOrbitsRef = useRef(true); // Always animate in system view
  const animationIdRef = useRef(null);
  const raycasterRef = useRef(null);
  const mouseRef = useRef(null);
  const clickStartTimeRef = useRef(0);
  const clickStartPosRef = useRef({ x: 0, y: 0 });
  const boundEventListenersRef = useRef({});
  const isTabVisibleRef = useRef(true);

  // Manager refs
  const tooltipManagerRef = useRef(null);
  const settingsManagerRef = useRef(null);
  const cameraManagerRef = useRef(null);
  const infoTabManagerRef = useRef(null);
  const panelManagerRef = useRef(null);
  const searchCoordinatorRef = useRef(null);
  const sceneManagerRef = useRef(null);
  const planetRendererRef = useRef(null);
  const systemRendererRef = useRef(null);
  const galaxyRendererRef = useRef(null);
  const apiManagerRef = useRef(null);
  const filterManagerRef = useRef(null);
  const uiManagerRef = useRef(null);

  // Interaction state refs
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const mouseDownPositionRef = useRef(null);
  const dragThresholdRef = useRef(5);
  const selectedObjectForTooltipRef = useRef(null);

  /**
   * Initialize controller and setup managers
   */
  useEffect(() => {
    // Initialize managers
    tooltipManagerRef.current = new TooltipManager(canvasRef.current);
    settingsManagerRef.current = new SettingsManager();
    infoTabManagerRef.current = new InfoTabManager(infoContentRef.current);
    panelManagerRef.current = new PanelManager();
    apiManagerRef.current = new ApiManager(EXOPLANET_API_ENDPOINT);
    filterManagerRef.current = new FilterManager();
    uiManagerRef.current = new UIManager({
      resultsList: resultsListRef.current,
      resultCount: resultCountRef.current,
      loadingIndicator: loadingIndicatorRef.current,
      canvasLoading: canvasLoadingRef.current,
    });

    // Set callbacks
    uiManagerRef.current.setPlanetSelectCallback((planet) =>
      selectPlanet(planet)
    );
    uiManagerRef.current.setSystemSelectCallback((system) =>
      selectSystem(system)
    );

    // Defer Three.js initialization to allow page animations to complete smoothly
    requestAnimationFrame(() => {
      setTimeout(() => {
        initThreeJS();
        fetchExoplanets();

        // Initialize SearchCoordinator after refs are available
        searchCoordinatorRef.current = new SearchCoordinator({
          filterManager: filterManagerRef.current,
          uiManager: uiManagerRef.current,
          targets: {
            searchInput: searchInputRef.current,
            filterMode: filterModeRef.current,
            planetFilters: planetFiltersRef.current,
            systemFilters: systemFiltersRef.current,
            typeFilter: typeFilterRef.current,
            tempMin: tempMinRef.current,
            tempMax: tempMaxRef.current,
            distanceMax: distanceMaxRef.current,
            discoveryMethodFilter: discoveryMethodFilterRef.current,
            discoveryFacilityFilter: discoveryFacilityFilterRef.current,
            minPlanets: minPlanetsRef.current,
            systemDistanceMax: systemDistanceMaxRef.current,
            spectralTypeFilter: spectralTypeFilterRef.current,
          },
        });

        panelManagerRef.current.initialize();
        initInfoTabPlanetClicks();
        // Set initial settings visibility for galaxy view
        updateSettingsVisibility('galaxy');
      }, 100);
    });

    // Cleanup on unmount
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (sceneManagerRef.current) {
        sceneManagerRef.current.cleanup();
      }
      if (tooltipManagerRef.current) {
        tooltipManagerRef.current.cleanup();
      }
      if (panelManagerRef.current) {
        panelManagerRef.current.cleanup();
      }
      if (searchCoordinatorRef.current) {
        searchCoordinatorRef.current.cleanup();
      }

      // Remove all event listeners
      if (canvasRef.current && boundEventListenersRef.current) {
        const canvas = canvasRef.current;
        canvas.removeEventListener('click', boundEventListenersRef.current.canvasClick);
        canvas.removeEventListener('mousedown', boundEventListenersRef.current.canvasMouseDown);
        canvas.removeEventListener('mouseup', boundEventListenersRef.current.canvasMouseUp);
        canvas.removeEventListener('mousemove', boundEventListenersRef.current.canvasMouseMove);
        canvas.removeEventListener('mouseleave', boundEventListenersRef.current.canvasMouseLeave);
        canvas.removeEventListener('contextmenu', boundEventListenersRef.current.canvasContextMenu);
        canvas.removeEventListener('wheel', boundEventListenersRef.current.canvasWheel);
      }

      if (boundEventListenersRef.current.visibilityChange) {
        document.removeEventListener('visibilitychange', boundEventListenersRef.current.visibilityChange);
      }
    };
  }, []);

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize event listener for planet clicks in info tab
   */
  const initInfoTabPlanetClicks = () => {
    // Listen for custom planet-select events from info tab
    const handlePlanetSelect = (event) => {
      const planetName = event.detail;

      // Find the planet by name
      const allPlanets = filterManagerRef.current.getAllExoplanets();
      const planet = allPlanets.find((p) => p.name === planetName);

      if (planet && currentSystemRef.current) {
        // Get the planet mesh from the system
        const planetMesh = systemRendererRef.current.getPlanetMesh(planet);
        if (planetMesh) {
          const planetWorldPosition = new THREE.Vector3();
          planetMesh.getWorldPosition(planetWorldPosition);

          // Zoom into the planet
          transitionToPlanetFromSystem(planet, planetWorldPosition, planetMesh);
        }
      }
    };

    document.addEventListener('planet-select', handlePlanetSelect);
  };

  /**
   * Show tooltip with object information (delegates to TooltipManager)
   */
  const showTooltip = (objectData, x, y) => {
    tooltipManagerRef.current.show(objectData, x, y);
  };

  /**
   * Hide tooltip (delegates to TooltipManager)
   */
  const hideTooltip = () => {
    tooltipManagerRef.current.hide();
  };

  /**
   * Initialize Three.js Scene using SceneManager
   */
  const initThreeJS = () => {
    sceneManagerRef.current = new SceneManager(canvasRef.current);
    sceneManagerRef.current.initialize();

    // Increase max camera distance to allow galaxy view
    sceneManagerRef.current.controls.maxDistance = 150;

    planetRendererRef.current = new PlanetRenderer(sceneManagerRef.current.scene);
    systemRendererRef.current = new SystemRenderer(sceneManagerRef.current.scene, planetRendererRef.current);
    galaxyRendererRef.current = new GalaxyRenderer(sceneManagerRef.current.scene);

    // Initialize camera manager now that sceneManager is ready
    cameraManagerRef.current = new CameraManager(sceneManagerRef.current);
    cameraManagerRef.current.setCallbacks({
      onSwitchToSystemView: (system) => selectSystem(system),
      onSwitchToGalaxyView: () => switchToGalaxyView(),
    });

    // Set renderer references for managers
    settingsManagerRef.current.setRenderers({
      sceneManager: sceneManagerRef.current,
      planetRenderer: planetRendererRef.current,
      systemRenderer: systemRendererRef.current,
      galaxyRenderer: galaxyRendererRef.current,
    });
    infoTabManagerRef.current.setFilterManager(filterManagerRef.current);

    // Setup raycaster for planet click detection
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // Add event listeners with stored references for cleanup
    boundEventListenersRef.current.canvasClick = (event) => onCanvasClick(event);
    boundEventListenersRef.current.canvasMouseDown = (event) => onCanvasMouseDown(event);
    boundEventListenersRef.current.canvasMouseUp = () => onCanvasMouseUp();
    boundEventListenersRef.current.canvasMouseMove = (event) => onCanvasMouseMove(event);
    boundEventListenersRef.current.canvasMouseLeave = () => onCanvasMouseLeave();
    boundEventListenersRef.current.canvasContextMenu = (event) => event.preventDefault();
    boundEventListenersRef.current.canvasWheel = () => {
      if (cameraManagerRef.current.followPlanet) {
        cameraManagerRef.current.setFollowPlanet(false);
      }

      // Hide tooltip when zooming
      if (tooltipManagerRef.current.getSelectedObject && tooltipManagerRef.current.getSelectedObject()) {
        tooltipManagerRef.current.hide();
      }
    };

    canvasRef.current.addEventListener('click', boundEventListenersRef.current.canvasClick);
    canvasRef.current.addEventListener('mousedown', boundEventListenersRef.current.canvasMouseDown);
    canvasRef.current.addEventListener('mouseup', boundEventListenersRef.current.canvasMouseUp);
    canvasRef.current.addEventListener('mousemove', boundEventListenersRef.current.canvasMouseMove);
    canvasRef.current.addEventListener('mouseleave', boundEventListenersRef.current.canvasMouseLeave);
    canvasRef.current.addEventListener('contextmenu', boundEventListenersRef.current.canvasContextMenu);
    canvasRef.current.addEventListener('wheel', boundEventListenersRef.current.canvasWheel);

    // Listen for visibility changes to pause animation when tab is hidden
    boundEventListenersRef.current.visibilityChange = () => handleVisibilityChange();
    document.addEventListener('visibilitychange', boundEventListenersRef.current.visibilityChange);

    // Start animation loop
    animate();

    // Hide loading indicator
    if (canvasLoadingRef.current) {
      canvasLoadingRef.current.style.display = 'none';
    }
  };

  /**
   * Handle visibility change (pause animation when tab is hidden)
   */
  const handleVisibilityChange = () => {
    isTabVisibleRef.current = !document.hidden;

    if (isTabVisibleRef.current) {
      // Resume animation if it was paused
      if (!animationIdRef.current) {
        animate();
      }
    }
  };

  /**
   * Animation loop
   */
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(() => animate());

    // Skip rendering if tab is not visible to save resources
    if (!isTabVisibleRef.current) {
      return;
    }

    // Update controls
    sceneManagerRef.current.updateControls();

    // Check for auto-switch on zoom out (planet → system → galaxy)
    if (viewModeRef.current === 'planet' && currentPlanetRef.current) {
      cameraManagerRef.current.checkZoomOutToSystemView(currentPlanetRef.current, filterManagerRef.current);
    } else if (viewModeRef.current === 'system' && currentSystemRef.current) {
      cameraManagerRef.current.checkZoomOutToGalaxyView();
    }

    // Handle different view modes
    if (viewModeRef.current === 'planet') {
      // Check if we're in unified system view (planet focused) or standalone planet view
      if (currentSystemRef.current && systemRendererRef.current.systemPlanets.length > 0) {
        // Unified view: use systemRenderer
        systemRendererRef.current.rotatePlanets(0.005);
        systemRendererRef.current.updateShaderUniforms(sceneManagerRef.current.camera);
      } else {
        // Standalone planet view: use planetRenderer
        planetRendererRef.current.rotatePlanet(0.005);
        planetRendererRef.current.animateEffects();
        planetRendererRef.current.updateShaderUniforms(sceneManagerRef.current.camera);
      }
    } else if (viewModeRef.current === 'system') {
      // Animate orbital motion if enabled
      if (animateOrbitsRef.current) {
        systemRendererRef.current.animateOrbits(
          0.016,
          settingsManagerRef.current.orbitSpeed,
          settingsManagerRef.current.useOrbitalInclination
        );
      }

      // Always rotate planets realistically
      systemRendererRef.current.rotatePlanets(0.005);
      systemRendererRef.current.updateShaderUniforms(sceneManagerRef.current.camera);
    } else if (viewModeRef.current === 'galaxy' || viewModeRef.current === 'galacticCenter') {
      // Animate galaxy
      galaxyRendererRef.current.animateGalaxy(0.016);
    }

    // Follow planet if enabled
    if (cameraManagerRef.current.followPlanet && currentPlanetRef.current) {
      cameraManagerRef.current.updateCameraFollowing(currentPlanetRef.current, systemRendererRef.current);
    }

    // Animate stars
    sceneManagerRef.current.animateStars();

    // Render scene
    sceneManagerRef.current.render();
  };

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch exoplanets from NASA API using ApiManager
   */
  const fetchExoplanets = async () => {
    await apiManagerRef.current.fetchExoplanets(
      // On batch processed
      (batchPlanets, allExoplanets) => {
        filterManagerRef.current.setExoplanets(allExoplanets);

        if (resultCountRef.current) {
          resultCountRef.current.textContent = `Loading... ${allExoplanets.length}`;
        }

        // If this is the first batch, load galaxy view
        if (allExoplanets.length === batchPlanets.length && allExoplanets.length > 0) {
          const systems = filterManagerRef.current.getNotableSystems();
          if (systems.length > 0 && galaxyRendererRef.current) {
            galaxyRendererRef.current.renderGalaxy(systems);

            // Set initial camera position
            const maxDistance = galaxyRendererRef.current.calculateMaxSystemDistance();
            const optimalDistance = Math.max(150, maxDistance * 2.5);

            sceneManagerRef.current.camera.position.set(0, optimalDistance * 0.3, optimalDistance * 0.3);
            sceneManagerRef.current.camera.lookAt(0, 0, 0);
            sceneManagerRef.current.controls.target.set(0, 0, 0);
            sceneManagerRef.current.controls.update();
          }
        }
      },
      // On complete
      (allExoplanets) => {
        const buildList = () => {
          const results = filterManagerRef.current.searchUnified('');
          uiManagerRef.current.updateUnifiedResultsList(results);
        };

        if (window.requestIdleCallback) {
          window.requestIdleCallback(buildList, { timeout: 2000 });
        } else {
          requestAnimationFrame(() => {
            setTimeout(buildList, 1);
          });
        }

        const systems = filterManagerRef.current.getNotableSystems();
        if (systems.length > 0 && galaxyRendererRef.current) {
          galaxyRendererRef.current.renderGalaxy(systems);
        }

        updateInfoTab();
      },
      // On error
      (error) => {
        uiManagerRef.current.showError('Failed to load exoplanet data. Please try again later.');
      }
    );
  };

  // ============================================
  // SEARCH & FILTERING
  // ============================================

  const search = () => {
    searchCoordinatorRef.current.search();
  };

  const changeFilterMode = () => {
    searchCoordinatorRef.current.changeFilterMode();
  };

  const applyFilters = () => {
    searchCoordinatorRef.current.applyFilters();
  };

  const clearFilters = () => {
    searchCoordinatorRef.current.clearFilters();
  };

  // ============================================
  // PLANET SELECTION & RENDERING
  // ============================================

  const selectPlanet = (planet, systemData = null) => {
    currentPlanetRef.current = planet;
    cameraManagerRef.current.setTransitioning(true);

    if (!systemData && planet.hostStar) {
      const systemPlanets = filterManagerRef.current.getPlanetsForSystem(planet.hostStar);

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
        viewModeRef.current === 'system' &&
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
            transitionToPlanetFromSystem(planet, planetWorldPosition, planetMesh);
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
    const targetDistance = sceneManagerRef.current.calculateOptimalCameraDistance(planetRadius);

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
  // CONTROLS
  // ============================================

  const resetCamera = () => {
    cameraManagerRef.current.resetCamera(viewModeRef.current, {
      currentSystem: currentSystemRef.current,
      currentPlanet: currentPlanetRef.current,
      galaxyRenderer: galaxyRendererRef.current,
      systemRenderer: systemRendererRef.current,
    });
  };

  // ============================================
  // SYSTEM VIEW
  // ============================================

  const switchToSystemView = () => {
    cameraManagerRef.current.setFollowPlanet(false);
    updateUIForSystemView();
    updateOrbitSpeedDisplay();
    canvasRef.current.classList.remove('grabbing', 'moving', 'pointer');
    canvasRef.current.classList.add('grab');

    const notableSystems = filterManagerRef.current.getNotableSystems();
    uiManagerRef.current.updateSystemsList(notableSystems);
    planetRendererRef.current.cleanup();

    if (currentPlanetRef.current) {
      const systemPlanets = filterManagerRef.current.getPlanetsForSystem(currentPlanetRef.current.hostStar);
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
    canvasRef.current.classList.remove('pointer', 'grabbing', 'moving');
    canvasRef.current.classList.add('grab');

    uiManagerRef.current.updateResultsList(filterManagerRef.current.getFilteredExoplanets());
    systemRendererRef.current.cleanup();

    if (currentSystemRef.current && currentSystemRef.current.planets.length > 0) {
      selectPlanet(currentSystemRef.current.planets[0]);
    }
  };

  const switchToGalaxyView = () => {
    viewModeRef.current = 'galaxy';
    const previousSystem = currentSystemRef.current;

    systemRendererRef.current.cleanup();
    planetRendererRef.current.cleanup();

    const notableSystems = filterManagerRef.current.getNotableSystems();
    const galaxyInfo = galaxyRendererRef.current.renderGalaxy(notableSystems);

    if (previousSystem) {
      const systemPosition = galaxyRendererRef.current.getSystemPosition(previousSystem);

      if (systemPosition) {
        const distance = 30;
        const offset = new THREE.Vector3(0, 1, 1.5).normalize().multiplyScalar(distance);
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
    updateSettingsVisibility('galaxy');
  };

  const updateUIForSystemView = () => {
    const searchTitle = document.getElementById('searchTitle');
    if (searchTitle) {
      searchTitle.textContent = 'Search Star Systems';
    }

    const randomPlanetBtn = document.getElementById('randomPlanetBtn');
    const randomSystemBtn = document.getElementById('randomSystemBtn');
    if (randomPlanetBtn) randomPlanetBtn.style.display = 'none';
    if (randomSystemBtn) randomSystemBtn.style.display = 'block';

    const systemInstructions = document.getElementById('systemInstructions');
    if (systemInstructions) systemInstructions.style.display = 'block';

    if (searchInputRef.current) {
      searchInputRef.current.placeholder = 'Search star systems...';
    }

    updateSettingsVisibility('system');
  };

  const updateUIForPlanetView = () => {
    const searchTitle = document.getElementById('searchTitle');
    if (searchTitle) {
      searchTitle.textContent = 'Search Exoplanets';
    }

    const randomPlanetBtn = document.getElementById('randomPlanetBtn');
    const randomSystemBtn = document.getElementById('randomSystemBtn');
    if (randomPlanetBtn) randomPlanetBtn.style.display = 'block';
    if (randomSystemBtn) randomSystemBtn.style.display = 'none';

    const systemInstructions = document.getElementById('systemInstructions');
    if (systemInstructions) systemInstructions.style.display = 'none';

    if (searchInputRef.current) {
      searchInputRef.current.placeholder = 'Search by name...';
    }

    updateSettingsVisibility('planet');
  };

  const selectSystem = (system) => {
    currentSystemRef.current = system;

    if (viewModeRef.current === 'galaxy') {
      galaxyRendererRef.current.cleanup();
    }

    viewModeRef.current = 'system';
    updateUIForSystemView();
    cameraManagerRef.current.setTransitioning(true);

    if (currentPlanetRef.current) {
      cameraManagerRef.current.setFollowPlanet(true);
    }

    const systemInfo = systemRendererRef.current.renderSystem(
      system.planets,
      animateOrbitsRef.current,
      settingsManagerRef.current.useOrbitalInclination
    );

    const maxRadius = systemInfo.maxOrbitRadius * systemInfo.scaleFactor;
    const cameraDistance = sceneManagerRef.current.calculateOptimalCameraDistance(maxRadius, true, maxRadius);

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

  const updateOrbitSpeed = (event) => {
    const sliderValue = parseFloat(event.target.value);
    const displayText = settingsManagerRef.current.updateOrbitSpeed(sliderValue);

    if (orbitSpeedValueRef.current) {
      orbitSpeedValueRef.current.textContent = displayText;
    }
  };

  const updateOrbitSpeedDisplay = () => {
    if (!orbitSpeedValueRef.current) return;
    const displayText = settingsManagerRef.current.getOrbitSpeedDisplay();
    orbitSpeedValueRef.current.textContent = displayText;
  };

  const onCanvasClick = (event) => {
    if (isDraggingRef.current) return;

    const clickDuration = Date.now() - clickStartTimeRef.current;
    if (clickDuration < 100) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, sceneManagerRef.current.camera);

    if (viewModeRef.current === 'galaxy' || viewModeRef.current === 'galacticCenter') {
      const clickableObjects = galaxyRendererRef.current.getAllClickableObjects();
      const intersects = raycasterRef.current.intersectObjects(clickableObjects, true);

      if (intersects.length > 0) {
        let clickedMesh = intersects[0].object;

        // Check galactic center
        let galacticCenterParent = clickedMesh;
        while (galacticCenterParent) {
          if (galacticCenterParent.userData?.isGalacticCenter) {
            if (viewModeRef.current !== 'galacticCenter') {
              hideTooltip();
              zoomToGalacticCenter();
            }
            return;
          }
          galacticCenterParent = galacticCenterParent.parent;
        }

        // Find system mesh
        while (clickedMesh.parent && !clickedMesh.userData.isStarSystem) {
          clickedMesh = clickedMesh.parent;
        }

        const system = clickedMesh.userData.system || clickedMesh.userData.systemData;

        if (system) {
          hideTooltip();
          const systemPosition = galaxyRendererRef.current.getSystemPosition(system);

          if (systemPosition) {
            cameraManagerRef.current.setTransitioning(true);

            const zoomDistance = 8;
            const direction = sceneManagerRef.current.camera.position
              .clone()
              .sub(systemPosition)
              .normalize();
            const targetCameraPos = systemPosition.clone().add(direction.multiplyScalar(zoomDistance));

            sceneManagerRef.current.smoothCameraTransitionWithTarget(
              targetCameraPos,
              systemPosition,
              1000,
              () => {
                viewModeRef.current = 'system';
                currentSystemRef.current = system;
                galaxyRendererRef.current.cleanup();
                selectSystem(system);

                setTimeout(() => {
                  cameraManagerRef.current.setTransitioning(false);
                }, 300);
              }
            );
          }
        }
      } else {
        hideTooltip();
      }
    } else if (viewModeRef.current === 'system' && currentSystemRef.current) {
      const planetMeshes = systemRendererRef.current.getAllPlanetMeshes();
      const intersects = raycasterRef.current.intersectObjects(planetMeshes, true);

      if (intersects.length > 0) {
        let clickedMesh = intersects[0].object;

        while (clickedMesh.parent && !clickedMesh.userData.planet) {
          clickedMesh = clickedMesh.parent;
        }

        if (clickedMesh.userData.planet) {
          const planet = clickedMesh.userData.planet;
          hideTooltip();

          const planetWorldPosition = new THREE.Vector3();
          clickedMesh.getWorldPosition(planetWorldPosition);

          transitionToPlanetFromSystem(planet, planetWorldPosition, clickedMesh);
        }
      } else {
        hideTooltip();
      }
    }
  };

  const transitionToPlanetFromSystem = (planet, planetWorldPosition, planetMesh) => {
    cameraManagerRef.current.setTransitioning(true);

    const boundingBox = new THREE.Box3().setFromObject(planetMesh);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const actualPlanetRadius = Math.max(size.x, size.y, size.z) / 2;

    const closeUpDistance = sceneManagerRef.current.calculateOptimalCameraDistance(
      actualPlanetRadius,
      false,
      null
    );

    const safeDistance = Math.max(closeUpDistance * 1.5, actualPlanetRadius * 5);

    sceneManagerRef.current.smoothCameraTransitionTrackingTarget(
      planetMesh,
      safeDistance,
      2000,
      () => {
        viewModeRef.current = 'planet';
        currentPlanetRef.current = planet;

        systemRendererRef.current.focusOnPlanet(planet);

        updateUIForPlanetView();
        uiManagerRef.current.updateResultsList(filterManagerRef.current.getFilteredExoplanets());
        uiManagerRef.current.updateActiveListItem(planet, filterManagerRef.current.getFilteredExoplanets());

        const currentDistance = sceneManagerRef.current.camera.position.length();
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

  const zoomToGalacticCenter = () => {
    const galacticCenterPos = galaxyRendererRef.current.getGalacticCenterPosition();

    if (!galacticCenterPos) {
      console.warn('Galactic center position not found');
      return;
    }

    cameraManagerRef.current.setTransitioning(true);
    viewModeRef.current = 'galacticCenter';

    const zoomDistance = 25;
    const currentDir = sceneManagerRef.current.camera.position
      .clone()
      .sub(galacticCenterPos)
      .normalize();

    const targetCameraPos = galacticCenterPos.clone().add(
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

    infoContentRef.current.innerHTML = html;
  };

  const returnToGalaxyView = () => {
    cameraManagerRef.current.setTransitioning(true);
    viewModeRef.current = 'galaxy';
    currentPlanetRef.current = null;
    currentSystemRef.current = null;

    const currentPos = sceneManagerRef.current.camera.position.clone();
    const targetCameraPos = currentPos.multiplyScalar(3);

    sceneManagerRef.current.smoothCameraTransitionWithTarget(
      targetCameraPos,
      new THREE.Vector3(0, 0, 0),
      1000,
      () => {
        updateSettingsVisibility('galaxy');
        clearInfoTab();

        setTimeout(() => {
          cameraManagerRef.current.setTransitioning(false);
        }, 300);
      }
    );
  };

  const clearInfoTab = () => {
    if (infoContentRef.current) {
      infoContentRef.current.innerHTML = `
        <div class="text-center text-gray-400 py-8">
          <p>Click on a star system or Sagittarius A* to view details</p>
        </div>
      `;
    }
  };

  const onCanvasMouseDown = (event) => {
    isDraggingRef.current = false;
    mouseDownPositionRef.current = { x: event.clientX, y: event.clientY };
    clickStartTimeRef.current = Date.now();
    clickStartPosRef.current = { x: event.clientX, y: event.clientY };

    if (event.button === 0) {
      canvasRef.current.classList.add('grabbing');
      canvasRef.current.classList.remove('grab', 'pointer');
    } else if (event.button === 2) {
      isPanningRef.current = true;
      canvasRef.current.classList.add('moving');
      canvasRef.current.classList.remove('grab', 'pointer');

      if (cameraManagerRef.current.followPlanet) {
        cameraManagerRef.current.setFollowPlanet(false);
      }
    }
  };

  const onCanvasMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
    mouseDownPositionRef.current = null;
    canvasRef.current.classList.remove('grabbing', 'moving');
    updateCanvasCursor();
  };

  const onCanvasMouseMove = (event) => {
    if (event.buttons > 0 && mouseDownPositionRef.current) {
      const deltaX = event.clientX - mouseDownPositionRef.current.x;
      const deltaY = event.clientY - mouseDownPositionRef.current.y;
      const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distanceMoved > dragThresholdRef.current) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          if (event.buttons === 1) {
            canvasRef.current.classList.add('grabbing');
            canvasRef.current.classList.remove('grab', 'pointer');
          }
        }

        if (selectedObjectForTooltipRef.current) {
          hideTooltip();
        }
      }
    }

    if (!event.buttons && !isPanningRef.current) {
      if (viewModeRef.current === 'system') {
        updateCanvasCursor(event);
      } else if (viewModeRef.current === 'galaxy' || viewModeRef.current === 'galacticCenter') {
        updateGalaxyCursor(event);
      }
    }
  };

  const onCanvasMouseLeave = () => {
    canvasRef.current.classList.remove('grabbing', 'grab', 'pointer', 'moving');
    isDraggingRef.current = false;
    isPanningRef.current = false;
    mouseDownPositionRef.current = null;

    if (selectedObjectForTooltipRef.current) {
      hideTooltip();
    }
  };

  const updateCanvasCursor = (event = null) => {
    if (!currentSystemRef.current || viewModeRef.current !== 'system') {
      canvasRef.current.classList.remove('pointer');
      canvasRef.current.classList.add('grab');
      return;
    }

    if (event) {
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, sceneManagerRef.current.camera);
      const planetMeshes = systemRendererRef.current.getAllPlanetMeshes();
      const intersects = raycasterRef.current.intersectObjects(planetMeshes, true);

      if (intersects.length > 0) {
        canvasRef.current.classList.add('pointer');
        canvasRef.current.classList.remove('grab');
      } else {
        canvasRef.current.classList.remove('pointer');
        canvasRef.current.classList.add('grab');
      }
    } else {
      canvasRef.current.classList.remove('pointer');
      canvasRef.current.classList.add('grab');
    }
  };

  const updateGalaxyCursor = (event = null) => {
    if (viewModeRef.current !== 'galaxy' && viewModeRef.current !== 'galacticCenter') {
      canvasRef.current.classList.remove('pointer');
      canvasRef.current.classList.add('grab');
      return;
    }

    if (event) {
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, sceneManagerRef.current.camera);
      const clickableObjects = galaxyRendererRef.current.getAllClickableObjects();
      const intersects = raycasterRef.current.intersectObjects(clickableObjects, true);

      if (intersects.length > 0) {
        canvasRef.current.classList.add('pointer');
        canvasRef.current.classList.remove('grab');
      } else {
        canvasRef.current.classList.remove('pointer');
        canvasRef.current.classList.add('grab');
      }
    } else {
      canvasRef.current.classList.remove('pointer');
      canvasRef.current.classList.add('grab');
    }
  };

  const toggleOrbitalInclination = () => {
    const checked = orbitalInclinationToggleRef.current.checked;
    settingsManagerRef.current.toggleOrbitalInclination(checked, currentSystemRef.current, animateOrbitsRef.current);
  };

  const toggleRealisticDistances = () => {
    const checked = realisticDistancesToggleRef.current.checked;

    if (systemRendererRef.current && currentSystemRef.current) {
      const currentDistance = sceneManagerRef.current.camera.position.length();
      cameraManagerRef.current.setRealisticDistancesMode(checked);
      systemRendererRef.current.setRealisticDistances(checked);

      requestAnimationFrame(() => {
        systemRendererRef.current.rerenderSystem();

        const targetDistance = checked ? currentDistance * 2.0 : currentDistance * 0.5;
        const currentPos = sceneManagerRef.current.camera.position.clone();
        const direction = currentPos.normalize();
        const targetPos = direction.multiplyScalar(targetDistance);

        sceneManagerRef.current.smoothCameraTransition(targetPos, 800);
      });
    }
  };

  const toggleAtmospheres = () => {
    const checked = atmosphereToggleRef.current.checked;
    settingsManagerRef.current.toggleAtmospheres(checked);
  };

  const toggleFullscreen = () => {
    const container = document.querySelector('.exoplanet-fullscreen-viewer');

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
    if (panelName === 'combined' && leftPanelRef.current) {
      panel = leftPanelRef.current;
    }

    if (!panel) return;
    panel.classList.toggle('minimized');
  };

  const toggleFilters = (event) => {
    const button = event.currentTarget;

    if (!filtersSectionRef.current || !filtersIconRef.current) return;

    const filtersSection = filtersSectionRef.current;

    if (filtersSection.classList.contains('show')) {
      filtersSection.classList.remove('show');
      button.setAttribute('aria-expanded', 'false');
    } else {
      filtersSection.classList.add('show');
      button.setAttribute('aria-expanded', 'true');
    }
  };

  const toggleResults = (event) => {
    const button = event.currentTarget;

    if (!resultsSectionRef.current || !resultsIconRef.current) return;

    const resultsSection = resultsSectionRef.current;

    if (resultsSection.classList.contains('show')) {
      resultsSection.classList.remove('show');
      button.setAttribute('aria-expanded', 'false');
    } else {
      resultsSection.classList.add('show');
      button.setAttribute('aria-expanded', 'true');
    }
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

  const toggleStarVisibility = () => {
    if (!starVisibilityToggleRef.current) return;
    settingsManagerRef.current.toggleStarVisibility(starVisibilityToggleRef.current.checked);
  };

  const togglePlanetLabels = () => {
    if (!planetLabelsToggleRef.current) return;
    settingsManagerRef.current.togglePlanetLabels(planetLabelsToggleRef.current.checked);
  };

  const toggleOrbitLines = () => {
    if (!orbitLinesToggleRef.current) return;
    settingsManagerRef.current.toggleOrbitLines(orbitLinesToggleRef.current.checked);
  };

  const updateStarDensity = (event) => {
    if (!starDensitySliderRef.current || !starDensityValueRef.current) return;

    const sliderValue = parseFloat(event.target.value);
    const displayText = settingsManagerRef.current.updateStarDensity(sliderValue);
    starDensityValueRef.current.textContent = displayText;
  };

  const toggleHighQuality = () => {
    if (!highQualityToggleRef.current) return;
    settingsManagerRef.current.toggleHighQuality(highQualityToggleRef.current.checked);
  };

  const updateCameraSpeed = (event) => {
    if (!cameraSpeedSliderRef.current || !cameraSpeedValueRef.current) return;

    const sliderValue = parseFloat(event.target.value);
    const displayText = settingsManagerRef.current.updateCameraSpeed(sliderValue);
    cameraSpeedValueRef.current.textContent = displayText;
  };

  const toggleAutoRotate = () => {
    if (!autoRotateToggleRef.current) return;
    settingsManagerRef.current.toggleAutoRotate(autoRotateToggleRef.current.checked);
  };

  const resetSettings = () => {
    const defaults = settingsManagerRef.current.reset();

    if (starVisibilityToggleRef.current) {
      starVisibilityToggleRef.current.checked = defaults.showStars;
    }
    if (planetLabelsToggleRef.current) {
      planetLabelsToggleRef.current.checked = defaults.showPlanetLabels;
    }
    if (orbitLinesToggleRef.current) {
      orbitLinesToggleRef.current.checked = defaults.showOrbitLines;
    }
    if (starDensitySliderRef.current) {
      starDensitySliderRef.current.value = defaults.starDensity;
    }
    if (starDensityValueRef.current) {
      starDensityValueRef.current.textContent = defaults.starDensityText;
    }
    if (highQualityToggleRef.current) {
      highQualityToggleRef.current.checked = defaults.highQuality;
    }
    if (cameraSpeedSliderRef.current) {
      cameraSpeedSliderRef.current.value = defaults.cameraSpeed;
    }
    if (cameraSpeedValueRef.current) {
      cameraSpeedValueRef.current.textContent = defaults.cameraSpeedText;
    }
    if (autoRotateToggleRef.current) {
      autoRotateToggleRef.current.checked = defaults.autoRotate;
    }
    if (orbitSpeedSliderRef.current) {
      orbitSpeedSliderRef.current.value = defaults.orbitSpeed;
    }
    if (orbitSpeedValueRef.current) {
      orbitSpeedValueRef.current.textContent = defaults.orbitSpeedText;
    }
    if (orbitalInclinationToggleRef.current) {
      orbitalInclinationToggleRef.current.checked = defaults.useOrbitalInclination;
    }
    if (atmosphereToggleRef.current) {
      atmosphereToggleRef.current.checked = defaults.showAtmospheres;
    }
  };

  const updateSettingsVisibility = (viewMode) => {
    settingsManagerRef.current.updateSettingsVisibility(viewMode);
  };

  // Listen for custom event from galactic center return button
  useEffect(() => {
    const handleReturnToGalaxy = () => returnToGalaxyView();
    document.addEventListener('return-to-galaxy', handleReturnToGalaxy);
    return () => document.removeEventListener('return-to-galaxy', handleReturnToGalaxy);
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="exoplanet-viewer-page">
      {/* Main Viewer Section */}
      <section className="exoplanet-fullscreen-viewer">

        {/* Full-page 3D Canvas */}
        <div className="exoplanet-canvas-container">
          <div
            ref={canvasRef}
            className="exoplanet-threejs-canvas"
            style={{ background: '#000000' }}>
          </div>

          {/* Loading Overlay */}
          <div
            className="position-absolute top-50 start-50 translate-middle text-white text-center"
            ref={canvasLoadingRef}>
            <div className="spinner-border mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Initializing 3D Viewer...</p>
          </div>

          {/* Controls Overlay */}
          <div className="exoplanet-controls-overlay">
            <div className="d-flex gap-3 align-items-center flex-wrap">
              <button className="btn btn-sm btn-outline-light" onClick={resetCamera}>
                <i className="bx bx-reset"></i> Reset View
              </button>
              <button className="btn btn-sm btn-outline-light" onClick={toggleFullscreen}>
                <i className="bx bx-fullscreen"></i> Fullscreen
              </button>
            </div>
          </div>

          {/* Instructions Overlay */}
          <div className="exoplanet-instructions-overlay" ref={instructionsRef}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong>Controls:</strong>
              <button type="button" className="btn-close btn-close-white btn-sm" aria-label="Close" onClick={(e) => e.currentTarget.parentElement.parentElement.style.display='none'}></button>
            </div>
            <div><i className="bx bx-mouse"></i> Drag to rotate</div>
            <div><i className="bx bx-mouse"></i> Scroll to zoom</div>
            <div><i className="bx bx-mouse"></i> Right-click drag to pan</div>
            <div id="systemInstructions" style={{ display: 'none' }} className="mt-2 pt-2 border-top border-secondary">
              <div><i className="bx bx-pointer"></i> Click planet to view details</div>
            </div>
          </div>
        </div>

        {/* Combined Panel: Search & Information (Draggable Overlay) */}
        <div className="exoplanet-overlay-panel exoplanet-combined-panel" ref={leftPanelRef} data-panel="combined">
          {/* Panel Header with Drag Handle and Minimize Button */}
          <div className="exoplanet-panel-header" data-drag-handle>
            {/* Tabs Navigation */}
            <ul className="nav nav-tabs exoplanet-panel-tabs border-0 flex-grow-1" role="tablist">
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="settings-tab" data-bs-toggle="tab" data-bs-target="#settings-panel" type="button" role="tab" aria-controls="settings-panel" aria-selected="false">
                  <i className="bx bx-cog me-1"></i> Settings
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link active" id="search-tab" data-bs-toggle="tab" data-bs-target="#search-panel" type="button" role="tab" aria-controls="search-panel" aria-selected="true">
                  <i className="bx bx-search me-1"></i> Search
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="info-tab" data-bs-toggle="tab" data-bs-target="#info-panel" type="button" role="tab" aria-controls="info-panel" aria-selected="false">
                  <i className="bx bx-info-circle me-1"></i> Info
                </button>
              </li>
            </ul>

            <div className="exoplanet-panel-controls">
              <button className="btn btn-sm btn-link text-white p-0" onClick={togglePanelMinimize} data-panel-target="combined" title="Minimize Panel">
                <span className="exoplanet-minimize-icon">−</span>
              </button>
            </div>
          </div>

          {/* Panel Content with Tabs */}
          <div className="exoplanet-panel-content">
            <div className="tab-content" id="panelTabContent">
              {/* Settings Tab Content */}
              <div className="tab-pane fade" id="settings-panel" role="tabpanel" aria-labelledby="settings-tab">
                <div className="p-4">
                  <h6 className="text-white mb-4">Visualization Settings</h6>

                  {/* Visual Effects Section */}
                  <div className="settings-section mb-4" id="visualEffectsSection">
                    <div className="d-flex align-items-center mb-3">
                      <i className="bx bx-paint text-primary me-2"></i>
                      <h6 className="mb-0 text-white-50 fs-sm text-uppercase">Visual Effects</h6>
                    </div>

                    {/* Atmosphere Toggle */}
                    <div className="form-check mb-3" id="atmosphereSetting">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="atmosphereToggleSettings"
                        ref={atmosphereToggleRef}
                        onChange={toggleAtmospheres} />
                      <label className="form-check-label text-white" htmlFor="atmosphereToggleSettings">
                        <i className="bx bx-cloud me-1"></i> Show Atmospheres
                        <small className="d-block text-white-50 mt-1">Display atmospheric halos around planets</small>
                      </label>
                    </div>

                    {/* Star Visibility Toggle */}
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="starVisibilityToggle"
                        defaultChecked
                        ref={starVisibilityToggleRef}
                        onChange={toggleStarVisibility} />
                      <label className="form-check-label text-white" htmlFor="starVisibilityToggle">
                        <i className="bx bx-star me-1"></i> Show Background Stars
                        <small className="d-block text-white-50 mt-1">Display starfield in background</small>
                      </label>
                    </div>

                    {/* Planet Labels Toggle */}
                    <div className="form-check mb-3" id="planetLabelsSetting">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="planetLabelsToggle"
                        ref={planetLabelsToggleRef}
                        onChange={togglePlanetLabels} />
                      <label className="form-check-label text-white" htmlFor="planetLabelsToggle">
                        <i className="bx bx-label me-1"></i> Show Planet Labels
                        <small className="d-block text-white-50 mt-1">Display planet names in system view</small>
                      </label>
                    </div>
                  </div>

                  {/* Orbital Mechanics Section */}
                  <div className="settings-section mb-4" id="orbitalMechanicsSection">
                    <div className="d-flex align-items-center mb-3">
                      <i className="bx bx-target-lock text-info me-2"></i>
                      <h6 className="mb-0 text-white-50 fs-sm text-uppercase">Orbital Mechanics</h6>
                    </div>

                    {/* 3D Orbits Toggle */}
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="orbitalInclinationToggleSettings"
                        ref={orbitalInclinationToggleRef}
                        onChange={toggleOrbitalInclination} />
                      <label className="form-check-label text-white" htmlFor="orbitalInclinationToggleSettings">
                        <i className="bx bx-shape-circle me-1"></i> 3D Orbital Inclination
                        <small className="d-block text-white-50 mt-1">Use realistic 3D orbital planes</small>
                      </label>
                    </div>

                    {/* Realistic Distances Toggle */}
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="realisticDistancesToggleSettings"
                        ref={realisticDistancesToggleRef}
                        onChange={toggleRealisticDistances} />
                      <label className="form-check-label text-white" htmlFor="realisticDistancesToggleSettings">
                        <i className="bx bx-ruler me-1"></i> Realistic Orbital Distances
                        <small className="d-block text-white-50 mt-1">Use actual scaled distances (may be very spread out)</small>
                      </label>
                    </div>

                    {/* Orbit Lines Toggle */}
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="orbitLinesToggle"
                        defaultChecked
                        ref={orbitLinesToggleRef}
                        onChange={toggleOrbitLines} />
                      <label className="form-check-label text-white" htmlFor="orbitLinesToggle">
                        <i className="bx bx-trip me-1"></i> Show Orbit Paths
                        <small className="d-block text-white-50 mt-1">Display orbital trajectory lines</small>
                      </label>
                    </div>

                    {/* Orbit Speed Control */}
                    <div className="mb-3">
                      <label htmlFor="orbitSpeedSliderSettings" className="form-label text-white">
                        <i className="bx bx-time me-1"></i> Orbit Animation Speed
                      </label>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <input
                          type="range"
                          className="form-range"
                          id="orbitSpeedSliderSettings"
                          min="0"
                          max="100"
                          defaultValue="50"
                          ref={orbitSpeedSliderRef}
                          onInput={updateOrbitSpeed} />
                        <span className="badge bg-primary" ref={orbitSpeedValueRef} style={{ minWidth: '60px' }}>60.0s</span>
                      </div>
                      <small className="text-white-50">Time for one complete orbit</small>
                    </div>
                  </div>

                  {/* Performance Section */}
                  <div className="settings-section mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <i className="bx bx-tachometer text-warning me-2"></i>
                      <h6 className="mb-0 text-white-50 fs-sm text-uppercase">Performance</h6>
                    </div>

                    {/* Star Density Control */}
                    <div className="mb-3">
                      <label htmlFor="starDensitySlider" className="form-label text-white">
                        <i className="bx bx-star me-1"></i> Star Density
                      </label>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <input
                          type="range"
                          className="form-range"
                          id="starDensitySlider"
                          min="0"
                          max="100"
                          defaultValue="50"
                          ref={starDensitySliderRef}
                          onInput={updateStarDensity} />
                        <span className="badge bg-secondary" ref={starDensityValueRef} style={{ minWidth: '60px' }}>50%</span>
                      </div>
                      <small className="text-white-50">Number of background stars</small>
                    </div>

                    {/* Quality Toggle */}
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="highQualityToggle"
                        defaultChecked
                        ref={highQualityToggleRef}
                        onChange={toggleHighQuality} />
                      <label className="form-check-label text-white" htmlFor="highQualityToggle">
                        <i className="bx bx-sparkle me-1"></i> High Quality Rendering
                        <small className="d-block text-white-50 mt-1">Enhanced textures and effects (may reduce FPS)</small>
                      </label>
                    </div>
                  </div>

                  {/* Camera Controls Section */}
                  <div className="settings-section mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <i className="bx bx-camera text-success me-2"></i>
                      <h6 className="mb-0 text-white-50 fs-sm text-uppercase">Camera</h6>
                    </div>

                    {/* Camera Speed Control */}
                    <div className="mb-3">
                      <label htmlFor="cameraSpeedSlider" className="form-label text-white">
                        <i className="bx bx-mouse me-1"></i> Camera Rotation Speed
                      </label>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <input
                          type="range"
                          className="form-range"
                          id="cameraSpeedSlider"
                          min="0"
                          max="100"
                          defaultValue="50"
                          ref={cameraSpeedSliderRef}
                          onInput={updateCameraSpeed} />
                        <span className="badge bg-success" ref={cameraSpeedValueRef} style={{ minWidth: '60px' }}>1.0x</span>
                      </div>
                      <small className="text-white-50">Mouse rotation sensitivity</small>
                    </div>

                    {/* Auto-Rotate Toggle */}
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="autoRotateToggle"
                        ref={autoRotateToggleRef}
                        onChange={toggleAutoRotate} />
                      <label className="form-check-label text-white" htmlFor="autoRotateToggle">
                        <i className="bx bx-rotate-right me-1"></i> Auto-Rotate Camera
                        <small className="d-block text-white-50 mt-1">Automatically rotate around objects</small>
                      </label>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <div className="d-grid">
                    <button className="btn btn-outline-primary" onClick={resetSettings}>
                      <i className="bx bx-refresh me-1"></i> Reset All Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Tab Content */}
              <div className="tab-pane fade show active" id="search-panel" role="tabpanel" aria-labelledby="search-tab">
            <div className="p-4">
                {/* Search Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name..."
                    ref={searchInputRef}
                    onInput={search} />
                </div>

                {/* Filters */}
                <div className="mb-4 mt-4">
                  <button className="btn btn-link text-white p-0 w-100 text-start d-flex align-items-center justify-content-between" onClick={toggleFilters}>
                    <h6 className="mb-0 text-white">Filters</h6>
                    <i className="bx bx-chevron-down fs-5" ref={filtersIconRef}></i>
                  </button>

                  <div className="collapse" ref={filtersSectionRef} style={{ marginTop: '1rem' }}>

                  {/* Filter Mode Toggle */}
                  <div className="mb-3">
                    <label htmlFor="filterModeSelect" className="form-label fs-sm fw-semibold">Filter By</label>
                    <select id="filterModeSelect" className="form-select" ref={filterModeRef} onChange={changeFilterMode}>
                      <option value="planets">Planets</option>
                      <option value="systems">Systems</option>
                    </select>
                  </div>

                  {/* Planet Filters (visible when filtering planets) */}
                  <div ref={planetFiltersRef}>

                  {/* Planet Type Filter */}
                  <div className="mb-3">
                    <label htmlFor="planetTypeFilter" className="form-label fs-sm fw-semibold">Planet Type</label>
                    <select id="planetTypeFilter" className="form-select" ref={typeFilterRef} onChange={applyFilters}>
                      <option value="">All Types</option>
                      <option value="terrestrial">Terrestrial</option>
                      <option value="super-earth">Super-Earth</option>
                      <option value="neptune">Neptune-like</option>
                      <option value="jupiter">Jupiter-like</option>
                    </select>
                  </div>

                  {/* Temperature Range */}
                  <div className="mb-3">
                    <label htmlFor="tempMinFilter" className="form-label fs-sm fw-semibold">Temperature Range (K)</label>
                    <div className="row g-2">
                      <div className="col-6">
                        <input id="tempMinFilter" type="number" className="form-control" placeholder="Min" ref={tempMinRef} />
                      </div>
                      <div className="col-6">
                        <input id="tempMaxFilter" type="number" className="form-control" placeholder="Max" ref={tempMaxRef} />
                      </div>
                    </div>
                  </div>

                  {/* Distance Filter */}
                  <div className="mb-3">
                    <label htmlFor="distanceFilter" className="form-label fs-sm fw-semibold">Distance (light-years)</label>
                    <input id="distanceFilter" type="number" className="form-control" placeholder="Max distance" ref={distanceMaxRef} />
                  </div>

                  {/* Discovery Method Filter */}
                  <div className="mb-3">
                    <label htmlFor="discoveryMethodFilter" className="form-label fs-sm fw-semibold">Discovery Method</label>
                    <select id="discoveryMethodFilter" className="form-select" ref={discoveryMethodFilterRef} onChange={applyFilters}>
                      <option value="">All Methods</option>
                      <option value="Transit">Transit</option>
                      <option value="Radial Velocity">Radial Velocity</option>
                      <option value="Microlensing">Microlensing</option>
                      <option value="Imaging">Direct Imaging</option>
                      <option value="Astrometry">Astrometry</option>
                      <option value="Timing">Timing Variations</option>
                    </select>
                  </div>

                  {/* Discovery Facility Filter */}
                  <div className="mb-3">
                    <label htmlFor="discoveryFacilityFilter" className="form-label fs-sm fw-semibold">Telescope/Mission</label>
                    <select id="discoveryFacilityFilter" className="form-select" ref={discoveryFacilityFilterRef} onChange={applyFilters}>
                      <option value="">All Telescopes</option>
                      <option value="Kepler">Kepler</option>
                      <option value="TESS">TESS</option>
                      <option value="Hubble">Hubble Space Telescope</option>
                      <option value="James Webb">James Webb Space Telescope</option>
                      <option value="La Silla">La Silla Observatory</option>
                      <option value="Keck">Keck Observatory</option>
                      <option value="Spitzer">Spitzer Space Telescope</option>
                    </select>
                  </div>

                  </div>
                  {/* End Planet Filters */}

                  {/* System Filters (visible when filtering systems) */}
                  <div ref={systemFiltersRef} style={{ display: 'none' }}>

                  {/* Minimum Number of Planets */}
                  <div className="mb-3">
                    <label htmlFor="minPlanetsFilter" className="form-label fs-sm fw-semibold">Minimum Planets</label>
                    <input id="minPlanetsFilter" type="number" className="form-control" placeholder="Min planets" min="2" ref={minPlanetsRef} />
                  </div>

                  {/* Distance Filter (Systems) */}
                  <div className="mb-3">
                    <label htmlFor="systemDistanceFilter" className="form-label fs-sm fw-semibold">Distance (light-years)</label>
                    <input id="systemDistanceFilter" type="number" className="form-control" placeholder="Max distance" ref={systemDistanceMaxRef} />
                  </div>

                  {/* Star Spectral Type */}
                  <div className="mb-3">
                    <label htmlFor="spectralTypeFilter" className="form-label fs-sm fw-semibold">Star Spectral Type</label>
                    <select id="spectralTypeFilter" className="form-select" ref={spectralTypeFilterRef}>
                      <option value="">All Types</option>
                      <option value="O">O - Blue (Hot)</option>
                      <option value="B">B - Blue-White</option>
                      <option value="A">A - White</option>
                      <option value="F">F - Yellow-White</option>
                      <option value="G">G - Yellow (Sun-like)</option>
                      <option value="K">K - Orange</option>
                      <option value="M">M - Red (Cool)</option>
                    </select>
                  </div>

                  </div>
                  {/* End System Filters */}

                  <button className="btn btn-outline-primary w-100 mb-2" onClick={applyFilters}>
                    Apply Filters
                  </button>
                  <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                    Clear All
                  </button>
                  </div>
                </div>

                {/* Results List */}
                <div className="results-section">
                  <button className="btn btn-link text-white p-0 w-100 text-start d-flex align-items-center justify-content-between mb-2" onClick={toggleResults}>
                    <h6 className="mb-0 text-white">
                      Results
                      <span className="badge bg-secondary" ref={resultCountRef}>0</span>
                    </h6>
                    <i className="bx bx-chevron-down fs-5" ref={resultsIconRef}></i>
                  </button>

                  <div className="collapse" ref={resultsSectionRef}>
                    <div className="d-flex align-items-center justify-content-center py-5" ref={loadingIndicatorRef}>
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>

                    <div ref={resultsListRef} className="list-group">
                      {/* Planet results will be inserted here */}
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Information Tab Content */}
              <div className="tab-pane fade" id="info-panel" role="tabpanel" aria-labelledby="info-tab">
                <div className="p-4" ref={infoContentRef}>
                  <h5 className="text-white mb-3">Information</h5>
                  <p className="text-white-50">
                    Loading information...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
};

export default ExoplanetViewer;
