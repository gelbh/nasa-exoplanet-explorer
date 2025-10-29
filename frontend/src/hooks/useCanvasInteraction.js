import { useRef } from "react";
import * as THREE from "three";

/**
 * Custom hook for canvas interaction handling
 * Manages mouse events, dragging, panning, and cursor updates
 */
export const useCanvasInteraction = ({
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
  onSystemSelect,
  onPlanetSelect,
  onStarSelect,
  onGalacticCenterClick,
}) => {
  // Interaction state
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const mouseDownPositionRef = useRef(null);
  const clickStartTimeRef = useRef(0);
  const clickStartPosRef = useRef({ x: 0, y: 0 });
  const dragThresholdRef = useRef(5);
  const selectedObjectForTooltipRef = useRef(null);
  const boundEventListenersRef = useRef({});

  // ============================================
  // CURSOR MANAGEMENT
  // ============================================

  const updateCanvasCursor = (event = null) => {
    if (!currentSystemRef.current || viewModeRef.current !== "system") {
      domRefs.canvasRef.current.classList.remove("pointer");
      domRefs.canvasRef.current.classList.add("grab");
      return;
    }

    if (event) {
      const rect = domRefs.canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(
        mouseRef.current,
        sceneManagerRef.current.camera
      );

      // Check for star hover first
      const centralStar = systemRendererRef.current.centralStar;
      if (centralStar) {
        const starIntersects = raycasterRef.current.intersectObjects(
          [centralStar],
          true
        );
        if (starIntersects.length > 0) {
          domRefs.canvasRef.current.classList.add("pointer");
          domRefs.canvasRef.current.classList.remove("grab");
          return;
        }
      }

      // Then check for planet hover
      const planetMeshes = systemRendererRef.current.getAllPlanetMeshes();
      const intersects = raycasterRef.current.intersectObjects(
        planetMeshes,
        true
      );

      if (intersects.length > 0) {
        domRefs.canvasRef.current.classList.add("pointer");
        domRefs.canvasRef.current.classList.remove("grab");
      } else {
        domRefs.canvasRef.current.classList.remove("pointer");
        domRefs.canvasRef.current.classList.add("grab");
      }
    } else {
      domRefs.canvasRef.current.classList.remove("pointer");
      domRefs.canvasRef.current.classList.add("grab");
    }
  };

  const updateGalaxyCursor = (event = null) => {
    if (
      viewModeRef.current !== "galaxy" &&
      viewModeRef.current !== "galacticCenter"
    ) {
      domRefs.canvasRef.current.classList.remove("pointer");
      domRefs.canvasRef.current.classList.add("grab");
      return;
    }

    if (event) {
      const rect = domRefs.canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(
        mouseRef.current,
        sceneManagerRef.current.camera
      );
      const clickableObjects =
        galaxyRendererRef.current.getAllClickableObjects();
      const intersects = raycasterRef.current.intersectObjects(
        clickableObjects,
        true
      );

      if (intersects.length > 0) {
        domRefs.canvasRef.current.classList.add("pointer");
        domRefs.canvasRef.current.classList.remove("grab");
      } else {
        domRefs.canvasRef.current.classList.remove("pointer");
        domRefs.canvasRef.current.classList.add("grab");
      }
    } else {
      domRefs.canvasRef.current.classList.remove("pointer");
      domRefs.canvasRef.current.classList.add("grab");
    }
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const hideTooltip = () => {
    if (tooltipManagerRef.current) {
      tooltipManagerRef.current.hide();
    }
  };

  const onCanvasClick = (event) => {
    if (isDraggingRef.current) return;

    const clickDuration = Date.now() - clickStartTimeRef.current;
    // Reduced threshold from 100ms to 50ms to allow quicker clicks
    if (clickDuration < 50) {
      return;
    }

    const rect = domRefs.canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(
      mouseRef.current,
      sceneManagerRef.current.camera
    );

    if (
      viewModeRef.current === "galaxy" ||
      viewModeRef.current === "galacticCenter"
    ) {
      const clickableObjects =
        galaxyRendererRef.current.getAllClickableObjects();
      const intersects = raycasterRef.current.intersectObjects(
        clickableObjects,
        true
      );

      if (intersects.length > 0) {
        let clickedMesh = intersects[0].object;

        // Check galactic center
        let galacticCenterParent = clickedMesh;
        while (galacticCenterParent) {
          if (galacticCenterParent.userData?.isGalacticCenter) {
            if (viewModeRef.current !== "galacticCenter") {
              hideTooltip();
              onGalacticCenterClick();
            }
            return;
          }
          galacticCenterParent = galacticCenterParent.parent;
        }

        // Find system mesh
        while (clickedMesh.parent && !clickedMesh.userData.isStarSystem) {
          clickedMesh = clickedMesh.parent;
        }

        const system =
          clickedMesh.userData.system || clickedMesh.userData.systemData;

        if (system) {
          hideTooltip();
          const systemPosition =
            galaxyRendererRef.current.getSystemPosition(system);

          if (systemPosition && onSystemSelect) {
            onSystemSelect(system, systemPosition);
          }
        }
      } else {
        hideTooltip();
      }
    } else if (viewModeRef.current === "system" && currentSystemRef.current) {
      // Check for star click first (higher priority)
      const centralStar = systemRendererRef.current.centralStar;
      if (centralStar) {
        const starIntersects = raycasterRef.current.intersectObjects(
          [centralStar],
          true
        );

        if (starIntersects.length > 0) {
          // Clicked on the central star
          let clickedMesh = starIntersects[0].object;

          // Traverse up to find the star group with userData
          while (clickedMesh.parent && !clickedMesh.userData.isStar) {
            clickedMesh = clickedMesh.parent;
          }

          if (clickedMesh.userData.isStar && onStarSelect) {
            hideTooltip();

            const starWorldPosition = new THREE.Vector3();
            clickedMesh.getWorldPosition(starWorldPosition);

            onStarSelect(currentSystemRef.current, starWorldPosition, clickedMesh);
            return; // Don't check planets if star was clicked
          }
        }
      }

      // If no star was clicked, check for planet clicks
      const planetMeshes = systemRendererRef.current.getAllPlanetMeshes();
      const intersects = raycasterRef.current.intersectObjects(
        planetMeshes,
        true
      );

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

          if (onPlanetSelect) {
            onPlanetSelect(planet, planetWorldPosition, clickedMesh);
          }
        }
      } else {
        hideTooltip();
      }
    }
  };

  const onCanvasMouseDown = (event) => {
    isDraggingRef.current = false;
    mouseDownPositionRef.current = { x: event.clientX, y: event.clientY };
    clickStartTimeRef.current = Date.now();
    clickStartPosRef.current = { x: event.clientX, y: event.clientY };

    if (event.button === 0) {
      domRefs.canvasRef.current.classList.add("grabbing");
      domRefs.canvasRef.current.classList.remove("grab", "pointer");
    } else if (event.button === 2) {
      isPanningRef.current = true;
      domRefs.canvasRef.current.classList.add("moving");
      domRefs.canvasRef.current.classList.remove("grab", "pointer");

      if (cameraManagerRef.current.followPlanet) {
        cameraManagerRef.current.setFollowPlanet(false);
      }
    }
  };

  const onCanvasMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
    mouseDownPositionRef.current = null;
    domRefs.canvasRef.current.classList.remove("grabbing", "moving");
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
            domRefs.canvasRef.current.classList.add("grabbing");
            domRefs.canvasRef.current.classList.remove("grab", "pointer");
          }
        }

        if (selectedObjectForTooltipRef.current) {
          hideTooltip();
        }
      }
    }

    if (!event.buttons && !isPanningRef.current) {
      if (viewModeRef.current === "system") {
        updateCanvasCursor(event);
      } else if (
        viewModeRef.current === "galaxy" ||
        viewModeRef.current === "galacticCenter"
      ) {
        updateGalaxyCursor(event);
      }
    }
  };

  const onCanvasMouseLeave = () => {
    domRefs.canvasRef.current.classList.remove(
      "grabbing",
      "grab",
      "pointer",
      "moving"
    );
    isDraggingRef.current = false;
    isPanningRef.current = false;
    mouseDownPositionRef.current = null;

    if (selectedObjectForTooltipRef.current) {
      hideTooltip();
    }
  };

  // ============================================
  // EVENT LISTENER SETUP
  // ============================================

  const setupCanvasEventListeners = () => {
    if (!sceneManagerRef.current?.renderer) return;

    const canvas = sceneManagerRef.current.renderer.domElement;

    boundEventListenersRef.current.canvasClick = (event) =>
      onCanvasClick(event);
    boundEventListenersRef.current.canvasMouseDown = (event) =>
      onCanvasMouseDown(event);
    boundEventListenersRef.current.canvasMouseUp = () => onCanvasMouseUp();
    boundEventListenersRef.current.canvasMouseMove = (event) =>
      onCanvasMouseMove(event);
    boundEventListenersRef.current.canvasMouseLeave = () =>
      onCanvasMouseLeave();
    boundEventListenersRef.current.canvasContextMenu = (event) =>
      event.preventDefault();
    boundEventListenersRef.current.canvasWheel = () => {
      if (cameraManagerRef.current.followPlanet) {
        cameraManagerRef.current.setFollowPlanet(false);
      }
      if (
        tooltipManagerRef.current.getSelectedObject &&
        tooltipManagerRef.current.getSelectedObject()
      ) {
        tooltipManagerRef.current.hide();
      }
    };

    canvas.addEventListener(
      "click",
      boundEventListenersRef.current.canvasClick
    );
    canvas.addEventListener(
      "mousedown",
      boundEventListenersRef.current.canvasMouseDown
    );
    canvas.addEventListener(
      "mouseup",
      boundEventListenersRef.current.canvasMouseUp
    );
    canvas.addEventListener(
      "mousemove",
      boundEventListenersRef.current.canvasMouseMove
    );
    canvas.addEventListener(
      "mouseleave",
      boundEventListenersRef.current.canvasMouseLeave
    );
    canvas.addEventListener(
      "contextmenu",
      boundEventListenersRef.current.canvasContextMenu
    );
    canvas.addEventListener(
      "wheel",
      boundEventListenersRef.current.canvasWheel
    );
  };

  const removeCanvasEventListeners = () => {
    if (
      sceneManagerRef.current &&
      sceneManagerRef.current.renderer &&
      boundEventListenersRef.current
    ) {
      const canvas = sceneManagerRef.current.renderer.domElement;
      canvas.removeEventListener(
        "click",
        boundEventListenersRef.current.canvasClick
      );
      canvas.removeEventListener(
        "mousedown",
        boundEventListenersRef.current.canvasMouseDown
      );
      canvas.removeEventListener(
        "mouseup",
        boundEventListenersRef.current.canvasMouseUp
      );
      canvas.removeEventListener(
        "mousemove",
        boundEventListenersRef.current.canvasMouseMove
      );
      canvas.removeEventListener(
        "mouseleave",
        boundEventListenersRef.current.canvasMouseLeave
      );
      canvas.removeEventListener(
        "contextmenu",
        boundEventListenersRef.current.canvasContextMenu
      );
      canvas.removeEventListener(
        "wheel",
        boundEventListenersRef.current.canvasWheel
      );
    }
  };

  return {
    setupCanvasEventListeners,
    removeCanvasEventListeners,
    updateCanvasCursor,
    updateGalaxyCursor,
  };
};
