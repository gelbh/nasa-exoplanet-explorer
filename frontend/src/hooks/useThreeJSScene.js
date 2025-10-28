import { useRef, useEffect } from "react";
import * as THREE from "three";
import { SceneManager } from "../lib/rendering/scenes/SceneManager.js";
import { PlanetRenderer } from "../lib/rendering/planets/PlanetRenderer.js";
import { SystemRenderer } from "../lib/rendering/scenes/SystemRenderer.js";
import { GalaxyRenderer } from "../lib/rendering/scenes/GalaxyRenderer.js";
import { CameraManager } from "../lib/managers/interactions/CameraManager.js";

/**
 * Custom hook for managing Three.js scene and renderers
 * Handles initialization, animation loop, and cleanup
 */
export const useThreeJSScene = (canvasRef, canvasLoadingRef) => {
  const sceneManagerRef = useRef(null);
  const planetRendererRef = useRef(null);
  const systemRendererRef = useRef(null);
  const galaxyRendererRef = useRef(null);
  const cameraManagerRef = useRef(null);
  const raycasterRef = useRef(null);
  const mouseRef = useRef(null);
  const animationIdRef = useRef(null);
  const isTabVisibleRef = useRef(true);

  /**
   * Initialize Three.js scene
   */
  const initThreeJS = () => {
    sceneManagerRef.current = new SceneManager(canvasRef.current);
    sceneManagerRef.current.initialize();

    planetRendererRef.current = new PlanetRenderer(
      sceneManagerRef.current.scene
    );
    systemRendererRef.current = new SystemRenderer(
      sceneManagerRef.current.scene,
      planetRendererRef.current
    );
    galaxyRendererRef.current = new GalaxyRenderer(
      sceneManagerRef.current.scene
    );

    // Initialize camera manager now that sceneManager is ready
    cameraManagerRef.current = new CameraManager(sceneManagerRef.current);

    // Setup raycaster for object detection
    raycasterRef.current = new THREE.Raycaster();
    mouseRef.current = new THREE.Vector2();

    // Hide loading indicator
    if (canvasLoadingRef.current) {
      canvasLoadingRef.current.style.display = "none";
    }
  };

  /**
   * Render basic galaxy structure immediately
   */
  const renderBasicGalaxyStructure = () => {
    if (!galaxyRendererRef.current) return;

    galaxyRendererRef.current.addMilkyWayStructure();
    galaxyRendererRef.current.addGalacticCenter();
    galaxyRendererRef.current.addGalacticCenterMarker();

    const initialDistance = 100;
    sceneManagerRef.current.camera.position.set(
      0,
      initialDistance * 0.4,
      initialDistance * 0.6
    );
    sceneManagerRef.current.camera.lookAt(0, 0, 0);
    sceneManagerRef.current.controls.target.set(0, 0, 0);
    sceneManagerRef.current.controls.update();
  };

  /**
   * Cleanup Three.js resources
   */
  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (sceneManagerRef.current) {
      sceneManagerRef.current.cleanup();
    }
  };

  return {
    sceneManagerRef,
    planetRendererRef,
    systemRendererRef,
    galaxyRendererRef,
    cameraManagerRef,
    raycasterRef,
    mouseRef,
    animationIdRef,
    isTabVisibleRef,
    initThreeJS,
    renderBasicGalaxyStructure,
    cleanup,
  };
};
