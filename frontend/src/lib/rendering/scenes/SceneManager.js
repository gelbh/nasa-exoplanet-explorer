import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/**
 * SceneManager
 * Manages Three.js scene setup, camera, lighting, starfield, and rendering
 */
export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.composer = null;
    this.bloomPass = null;
    this.starField = null;
    this.ambientLight = null;
    this.starLight = null;
    this.animationId = null;
    this.starAnimationFrameCount = 0; // Counter for throttling star updates
    this.isMobileDevice = this.detectMobileDevice(); // Detect mobile for performance optimization
    this.cameraTransitionId = null; // Track ongoing camera transitions
  }

  /**
   * Detect if device is mobile for performance optimizations
   */
  detectMobileDevice() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints >= 2)
    );
  }

  /**
   * Initialize Three.js scene, camera, renderer, and controls
   */
  initialize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (width === 0 || height === 0) {
      console.error("❌ Container has zero dimensions!", {
        width: this.container.clientWidth,
        height: this.container.clientHeight,
        offsetWidth: this.container.offsetWidth,
        offsetHeight: this.container.offsetHeight,
      });
    }

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Black space background

    // Camera (60° FOV for better viewing area, standard for 3D applications)
    // Near plane of 0.5 (instead of 0.1) to reduce z-fighting on lower-end GPUs
    // Far plane of 5000 to accommodate galaxy view with distant systems
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 5000);
    this.camera.position.set(0, 0, 5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.autoClear = true;
    this.renderer.autoClearColor = true;
    this.renderer.autoClearDepth = true;
    this.renderer.autoClearStencil = true;
    this.container.appendChild(this.renderer.domElement);

    // Ensure canvas gets pointer events and is on top
    this.renderer.domElement.style.pointerEvents = "auto";
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.left = "0";
    this.renderer.domElement.style.zIndex = "10";

    // Handle WebGL context loss/restoration
    this.handleContextLoss();

    // Post-processing
    this.setupPostProcessing(width, height);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 500; // Allow zoom out to view entire galaxy

    // Add a one-time listener to verify controls are receiving events
    const testControlsWorking = () => {
      this.controls.removeEventListener("change", testControlsWorking);
    };
    this.controls.addEventListener("change", testControlsWorking);

    // Lighting
    this.setupLighting();

    // Starfield
    this.addStarfield();

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());

    // Handle fullscreen changes (they don't always trigger resize events)
    document.addEventListener("fullscreenchange", () => {
      this.onWindowResize();
    });
    document.addEventListener("webkitfullscreenchange", () => {
      this.onWindowResize();
    });
    document.addEventListener("mozfullscreenchange", () => {
      this.onWindowResize();
    });
    document.addEventListener("MSFullscreenChange", () => {
      this.onWindowResize();
    });
  }

  /**
   * Handle WebGL context loss and restoration
   */
  handleContextLoss() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        console.warn("WebGL context lost. Attempting to restore...");

        // Cancel any ongoing animations
        if (this.animationId) {
          cancelAnimationFrame(this.animationId);
          this.animationId = null;
        }
      },
      false
    );

    canvas.addEventListener(
      "webglcontextrestored",
      () => {
        console.log("WebGL context restored");

        // Test if context restoration succeeded
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) {
          console.error("Failed to restore WebGL context");
          // Notify user that page reload is needed
          alert("WebGL context could not be restored. Please reload the page.");
          return;
        }

        // Reinitialize the scene
        // Note: This creates a new scene - view state will be lost
        // TODO: Implement state preservation for better UX
        this.initialize();
        console.log("Scene reinitialized after context restoration");
      },
      false
    );
  }

  /**
   * Setup lighting for the scene
   */
  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.starLight = new THREE.PointLight(0xffffff, 2, 100);
    this.starLight.position.set(5, 3, 5);
    this.scene.add(this.starLight);
  }

  /**
   * Add starfield background with twinkling stars
   */
  addStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];
    const starsSizes = [];
    const starsColors = [];

    // Create a much larger starfield to cover entire view (matching camera far plane)
    // Use spherical distribution for better coverage
    const starCount = 3000; // More stars for better coverage
    const sphereRadius = 4500; // Near the camera's far plane (5000)

    for (let i = 0; i < starCount; i++) {
      // Use spherical distribution to ensure even coverage
      const theta = Math.random() * Math.PI * 2; // Azimuthal angle
      const phi = Math.acos(2 * Math.random() - 1); // Polar angle (uniform on sphere)
      const radius = sphereRadius * (0.7 + Math.random() * 0.3); // Vary distance slightly

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      starsVertices.push(x, y, z);

      // Smaller sizes for background stars
      starsSizes.push(Math.random() * 1.0 + 0.3);

      // Subtle color variation for realism
      const color = new THREE.Color();
      color.setHSL(0.6, 0.15, 0.7 + Math.random() * 0.3);
      starsColors.push(color.r, color.g, color.b);
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    starsGeometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(starsSizes, 1)
    );
    starsGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(starsColors, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.08, // Much smaller to appear distant
      vertexColors: true,
      transparent: true,
      opacity: 0.4, // More transparent to appear in background
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
    });

    this.starField = new THREE.Points(starsGeometry, starsMaterial);
    this.starField.renderOrder = -1000; // Render stars well before other objects
    this.scene.add(this.starField);
  }

  /**
   * Animate twinkling stars (throttled to every 3 frames for performance)
   * Very subtle twinkling for distant background stars
   */
  animateStars() {
    if (!this.starField) return;

    // Throttle star animation to every 3 frames (~20 FPS instead of 60 FPS)
    // This reduces CPU load by ~67% with minimal visual difference
    this.starAnimationFrameCount++;
    if (this.starAnimationFrameCount < 3) {
      return;
    }
    this.starAnimationFrameCount = 0;

    const time = Date.now() * 0.0003; // Slower twinkling for distant stars
    const sizes = this.starField.geometry.attributes.size.array;

    // Store original sizes on first run to prevent accumulation
    if (!this.starFieldOriginalSizes) {
      this.starFieldOriginalSizes = new Float32Array(sizes);
    }
    const originalSizes = this.starFieldOriginalSizes;

    for (let i = 0; i < sizes.length; i++) {
      const twinkle = Math.abs(Math.sin(time + i * 0.5)) * 0.5 + 0.5;
      // Much more subtle twinkling (±10% instead of ±30%) for background stars
      sizes[i] = (originalSizes[i] || 1) * (0.9 + twinkle * 0.2);
    }
    this.starField.geometry.attributes.size.needsUpdate = true;
  }

  /**
   * Setup post-processing effects (disabled on mobile for performance)
   */
  setupPostProcessing(width, height) {
    // Skip post-processing on mobile devices for better performance
    if (this.isMobileDevice) {
      console.log("📱 Skipping post-processing on mobile device");
      this.composer = null;
      return;
    }

    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.5, // Strength
      0.4, // Radius
      0.85 // Threshold
    );
    this.composer.addPass(this.bloomPass);
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (width === 0 || height === 0) {
      console.warn("⚠️ Warning: Resizing to zero dimensions!");
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  /**
   * Update controls
   */
  updateControls() {
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }
  }

  /**
   * Render the scene
   */
  render() {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Reset camera to default position
   */
  resetCamera(optimalDistance = 5) {
    if (!this.camera || !this.controls) return;

    const distance = Math.max(2.5, Math.min(25, optimalDistance));

    this.camera.position.set(0, 0, distance);
    this.camera.rotation.set(0, 0, 0);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);

    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  /**
   * Smooth camera transition animation
   */
  smoothCameraTransition(targetPosition, duration = 1200, onComplete = null) {
    if (!this.camera || !this.controls) return;

    // Cancel previous transition if one is running
    if (this.cameraTransitionId !== null) {
      cancelAnimationFrame(this.cameraTransitionId);
      this.cameraTransitionId = null;
    }

    const startPosition = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const targetControlsTarget = new THREE.Vector3(0, 0, 0); // Always look at origin
    const startTime = Date.now();
    const transitionId = Symbol("transition");
    this.cameraTransitionId = transitionId;

    const animateCamera = () => {
      // Check if this transition was cancelled
      if (this.cameraTransitionId !== transitionId) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth motion (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      // Smoothly transition both camera position and controls target
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      this.controls.target.lerpVectors(
        startTarget,
        targetControlsTarget,
        eased
      );
      this.controls.update();

      if (progress < 1) {
        const rafId = requestAnimationFrame(animateCamera);
        // Store RAF ID for potential cancellation (stored as number)
        if (this.cameraTransitionId === transitionId) {
          this.cameraTransitionId = rafId;
        }
      } else {
        this.cameraTransitionId = null;
        if (onComplete) {
          onComplete();
        }
      }
    };

    animateCamera();
  }

  /**
   * Smooth camera transition with custom target (for cinematic camera movements)
   * Transitions both camera position and the point it's looking at
   */
  smoothCameraTransitionWithTarget(
    targetPosition,
    targetLookAt,
    duration = 1500,
    onComplete = null
  ) {
    if (!this.camera || !this.controls) return;

    const startPosition = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth motion (ease-in-out cubic for more cinematic feel)
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Smoothly transition both camera position and look-at target
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      this.controls.target.lerpVectors(startTarget, targetLookAt, eased);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else if (onComplete) {
        onComplete();
      }
    };

    animateCamera();
  }

  /**
   * Smooth camera transition that tracks a moving target (for following orbiting planets)
   * The camera continuously follows the target as it moves during the animation
   */
  smoothCameraTransitionTrackingTarget(
    targetMesh,
    desiredDistance,
    duration = 2000,
    onComplete = null
  ) {
    if (!this.camera || !this.controls) return;

    const startPosition = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const startTime = Date.now();

    // Get initial planet position
    const initialPlanetPosition = new THREE.Vector3();
    targetMesh.getWorldPosition(initialPlanetPosition);

    // Calculate the initial ideal camera position relative to planet
    const cameraOffset = new THREE.Vector3(
      0,
      desiredDistance * 0.2,
      desiredDistance
    );
    const initialIdealPosition = initialPlanetPosition
      .clone()
      .add(cameraOffset);

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth motion (ease-in-out cubic for more cinematic feel)
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Get the target's current world position (updates as it orbits)
      const currentPlanetPosition = new THREE.Vector3();
      targetMesh.getWorldPosition(currentPlanetPosition);

      // The final target position is the initial ideal position plus the delta from planet movement
      const planetDelta = currentPlanetPosition
        .clone()
        .sub(initialPlanetPosition);
      const movingTargetPosition = initialIdealPosition
        .clone()
        .add(planetDelta);

      // Smoothly interpolate from start position to the moving target position
      this.camera.position.lerpVectors(
        startPosition,
        movingTargetPosition,
        eased
      );

      // Smoothly interpolate the look-at target from start to current planet position
      this.controls.target.lerpVectors(
        startLookAt,
        currentPlanetPosition,
        eased
      );
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else if (onComplete) {
        onComplete();
      }
    };

    animateCamera();
  }

  /**
   * Calculate optimal camera distance based on object size
   */
  calculateOptimalCameraDistance(
    objectRadius,
    showOrbit = false,
    orbitRadius = null,
    maxDistance = 25 // Default to 25 for backward compatibility, null = no limit
  ) {
    const fov = this.camera.fov * (Math.PI / 180);

    // Use different multipliers based on context
    const multiplier = showOrbit ? 2.5 : 3.5; // Larger multiplier for direct object viewing
    let distance = Math.abs((objectRadius * multiplier) / Math.tan(fov / 2));

    if (showOrbit && orbitRadius) {
      distance = Math.abs((orbitRadius * 2.5) / Math.tan(fov / 2));
    }

    // Apply clamping only if maxDistance is specified
    if (maxDistance !== null) {
      return Math.max(2.5, Math.min(maxDistance, distance));
    }

    return Math.max(2.5, distance);
  }

  /**
   * Show background stars
   */
  showStars() {
    if (this.starField) {
      this.starField.visible = true;
    } else {
      console.warn("⚠️ Cannot show starfield - it does not exist");
    }
  }

  /**
   * Hide background stars
   */
  hideStars() {
    if (this.starField) {
      this.starField.visible = false;
    }
  }

  /**
   * Update star density (0.0 to 1.0)
   * Regenerates the starfield with new density
   */
  updateStarDensity(density) {
    // Remove existing starfield
    if (this.starField) {
      this.scene.remove(this.starField);
      this.starField.geometry.dispose();
      this.starField.material.dispose();
    }

    // Calculate number of stars based on density
    const baseStarCount = 2000;
    const starCount = Math.floor(baseStarCount * density);

    // Don't create stars if density is 0
    if (starCount === 0) {
      this.starField = null;
      return;
    }

    // Create new starfield with updated density
    const starsGeometry = new THREE.BufferGeometry();
    const starsVertices = [];
    const starsSizes = [];
    const starsColors = [];

    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starsVertices.push(x, y, z);

      starsSizes.push(Math.random() * 2 + 0.5);

      const color = new THREE.Color();
      color.setHSL(0.6, 0.2, 0.8 + Math.random() * 0.2);
      starsColors.push(color.r, color.g, color.b);
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    starsGeometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(starsSizes, 1)
    );
    starsGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(starsColors, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
    });

    this.starField = new THREE.Points(starsGeometry, starsMaterial);
    this.starField.renderOrder = -1;
    this.scene.add(this.starField);
  }

  /**
   * Promise-based camera transition wrapper
   * Returns a promise that resolves when transition completes
   */
  smoothCameraTransitionAsync(targetPosition, targetLookAt, duration = 1500) {
    return new Promise((resolve) => {
      this.smoothCameraTransitionWithTarget(
        targetPosition,
        targetLookAt,
        duration,
        resolve
      );
    });
  }

  /**
   * Cancel all active camera transitions
   */
  cancelAllTransitions() {
    if (this.cameraTransitionId) {
      cancelAnimationFrame(this.cameraTransitionId);
      this.cameraTransitionId = null;
    }
    // Clear any transition-related animation frames
    // (Future: track all transitions if we add more cancellable ones)
  }

  /**
   * Smooth continuous waypoint transition
   * Camera moves through all waypoints in ONE continuous motion without stopping
   *
   * @param {Array} waypoints - Array of waypoints
   * Each waypoint: {
   *   position: THREE.Vector3 - Camera position
   *   lookAt: THREE.Vector3 - Look-at target
   *   duration: number - Time to reach this waypoint from previous (ms)
   *   onReach: function - Optional callback when reaching this waypoint
   * }
   * @returns {Promise} - Resolves when transition completes
   */
  smoothWaypointTransition(waypoints) {
    return new Promise((resolve) => {
      if (!waypoints || waypoints.length === 0) {
        resolve();
        return;
      }

      const startPosition = this.camera.position.clone();
      const startLookAt = this.controls.target.clone();

      // Calculate total duration and cumulative times
      let totalDuration = 0;
      const cumulativeTimes = [0];

      for (let i = 0; i < waypoints.length; i++) {
        totalDuration += waypoints[i].duration || 1000;
        cumulativeTimes.push(totalDuration);
      }

      const startTime = performance.now();

      const animate = () => {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;

        if (elapsed >= totalDuration) {
          // Transition complete - snap to final waypoint
          const finalWaypoint = waypoints[waypoints.length - 1];
          this.camera.position.copy(finalWaypoint.position);
          this.camera.lookAt(finalWaypoint.lookAt);
          this.controls.target.copy(finalWaypoint.lookAt);
          this.controls.update();

          // Execute final callback if provided
          if (finalWaypoint.onReach) {
            finalWaypoint.onReach();
          }

          resolve();
          return;
        }

        // Find which segment we're in
        let segmentIndex = 0;
        for (let i = 0; i < cumulativeTimes.length - 1; i++) {
          if (
            elapsed >= cumulativeTimes[i] &&
            elapsed < cumulativeTimes[i + 1]
          ) {
            segmentIndex = i;
            break;
          }
        }

        // Calculate progress within current segment
        const segmentStart = cumulativeTimes[segmentIndex];
        const segmentEnd = cumulativeTimes[segmentIndex + 1];
        const segmentDuration = segmentEnd - segmentStart;
        const segmentProgress = (elapsed - segmentStart) / segmentDuration;

        // Apply global easing (ease-in-out cubic for smooth continuous motion)
        const easedProgress =
          segmentProgress < 0.5
            ? 4 * segmentProgress * segmentProgress * segmentProgress
            : 1 - Math.pow(-2 * segmentProgress + 2, 3) / 2;

        // Determine start and end points for current segment
        const segmentStartPos =
          segmentIndex === 0
            ? startPosition
            : waypoints[segmentIndex - 1].position;
        const segmentStartLookAt =
          segmentIndex === 0 ? startLookAt : waypoints[segmentIndex - 1].lookAt;
        const segmentEndPos = waypoints[segmentIndex].position;
        const segmentEndLookAt = waypoints[segmentIndex].lookAt;

        // Interpolate position and look-at
        const newPosition = new THREE.Vector3().lerpVectors(
          segmentStartPos,
          segmentEndPos,
          easedProgress
        );
        const newLookAt = new THREE.Vector3().lerpVectors(
          segmentStartLookAt,
          segmentEndLookAt,
          easedProgress
        );

        this.camera.position.copy(newPosition);
        this.camera.lookAt(newLookAt);
        this.controls.target.copy(newLookAt);
        this.controls.update();

        // Check if we just reached a waypoint (trigger callback once)
        if (
          segmentIndex > 0 &&
          easedProgress > 0.99 &&
          waypoints[segmentIndex - 1].onReach
        ) {
          if (!waypoints[segmentIndex - 1]._reached) {
            waypoints[segmentIndex - 1]._reached = true;
            waypoints[segmentIndex - 1].onReach();
          }
        }

        requestAnimationFrame(animate);
      };

      animate();
    });
  }

  /**
   * Multi-stage camera transition helper
   * Executes multiple camera transitions in sequence
   *
   * @param {Array} stages - Array of transition stages
   * Each stage: {
   *   position: THREE.Vector3 - Target camera position
   *   lookAt: THREE.Vector3 - Target look-at point
   *   duration: number - Transition duration in ms
   *   beforeStage: function - Optional callback before stage starts
   *   afterStage: function - Optional callback after stage completes
   * }
   * @returns {Promise} - Resolves when all stages complete
   */
  async multiStageTransition(stages) {
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];

      // Execute beforeStage callback if provided
      if (stage.beforeStage) {
        await stage.beforeStage();
      }

      // Execute the camera transition for this stage
      await this.smoothCameraTransitionAsync(
        stage.position,
        stage.lookAt,
        stage.duration || 1500
      );

      // Execute afterStage callback if provided
      if (stage.afterStage) {
        await stage.afterStage();
      }
    }
  }

  /**
   * Cleanup scene objects
   */
  cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
