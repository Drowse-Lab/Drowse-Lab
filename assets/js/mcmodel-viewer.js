// mcmodel-viewer.js

// BlockModelRenderer class for loading Minecraft-style JSON models
class BlockModelRenderer {
  constructor(scene, enableGlow = false) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
    this.materials = {};
    this.enableGlow = enableGlow;
    this.glowMaterials = {};
  }

  loadModel(modelPath, callback) {
    fetch(modelPath)
      .then(response => response.json())
      .then(modelData => {
        // Load textures first
        this.loadTextures(modelData.textures, () => {
          // Create model after textures are loaded
          this.createModel(modelData);
          if (callback) callback();
        });
      })
      .catch(error => {
        console.error('Error loading model:', error);
      });
  }

  loadTextures(textureData, callback) {
    const texturePromises = [];
    
    for (const [key, textureName] of Object.entries(textureData)) {
      if (key !== 'particle') {
        const promise = new Promise((resolve) => {
          // Build relative texture path using site base URL
          const baseUrl = window.location.pathname.includes('/Drowse-Lab/') ? '/Drowse-Lab' : '';
          const texturePath = `${baseUrl}/assets/textures/${textureName}.png`;
          
          this.textureLoader.load(
            texturePath,
            (texture) => {
              texture.magFilter = THREE.NearestFilter;
              texture.minFilter = THREE.NearestFilter;
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              
              this.materials[key] = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                alphaTest: 0.5,
                transparent: true
              });
              
              // Create glow material if enabled
              if (this.enableGlow) {
                this.glowMaterials[key] = new THREE.ShaderMaterial({
                  uniforms: {
                    tDiffuse: { value: texture },
                    time: { value: 0 },
                    glowColor1: { value: new THREE.Color(0x9b59b6) }, // Purple
                    glowColor2: { value: new THREE.Color(0xe8daef) }, // Light purple/white
                    glowIntensity: { value: 0.6 }
                  },
                  vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    void main() {
                      vUv = uv;
                      vNormal = normalize(normalMatrix * normal);
                      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                      vViewPosition = -mvPosition.xyz;
                      gl_Position = projectionMatrix * mvPosition;
                    }
                  `,
                  fragmentShader: `
                    uniform sampler2D tDiffuse;
                    uniform float time;
                    uniform vec3 glowColor1;
                    uniform vec3 glowColor2;
                    uniform float glowIntensity;
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    varying vec3 vViewPosition;
                    
                    void main() {
                      vec4 texColor = texture2D(tDiffuse, vUv);
                      
                      // Simple regular wave pattern moving diagonally
                      float wave1 = sin((vUv.x - vUv.y) * 8.0 + time * 3.0) * 0.5 + 0.5;
                      float wave2 = sin((vUv.x + vUv.y) * 8.0 - time * 3.0) * 0.5 + 0.5;
                      
                      // Combine waves for shimmer effect
                      float shimmer = (wave1 + wave2) * 0.5;
                      
                      // Pulsing glow intensity
                      float pulse = sin(time * 4.0) * 0.3 + 0.7;
                      
                      // Edge glow effect (rim lighting)
                      vec3 viewDir = normalize(vViewPosition);
                      float rim = 1.0 - abs(dot(viewDir, vNormal));
                      rim = pow(rim, 2.0) * 0.5;
                      
                      // Combine effects with more weight on the shimmer
                      float effect = shimmer * pulse + rim;
                      
                      // Smooth color transition between purple and white
                      float colorBlend = shimmer * pulse;
                      vec3 glowColor = mix(glowColor1, glowColor2, colorBlend);
                      
                      // Apply glow as overlay to preserve texture brightness
                      vec3 glowEffect = glowColor * effect * glowIntensity;
                      
                      // Keep original texture bright and add glow on top
                      vec3 finalColor = texColor.rgb + (glowEffect * texColor.a * 0.8);
                      
                      // Ensure minimum brightness
                      finalColor = max(texColor.rgb, finalColor);
                      
                      gl_FragColor = vec4(finalColor, texColor.a);
                    }
                  `,
                  side: THREE.DoubleSide,
                  transparent: true,
                  alphaTest: 0.5
                });
              }
              
              console.log(`Loaded texture ${key}: ${texturePath}`);
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Error loading texture ${texturePath}:`, error);
              // Create default gray material on error
              this.materials[key] = new THREE.MeshBasicMaterial({
                color: 0x888888,
                side: THREE.DoubleSide
              });
              resolve();
            }
          );
        });
        texturePromises.push(promise);
      }
    }

    Promise.all(texturePromises).then(callback);
  }

  createModel(modelData) {
    const group = new THREE.Group();
    
    // Process each element (cube) in the model
    modelData.elements.forEach(element => {
      const from = element.from;
      const to = element.to;
      
      // Calculate size and position
      const size = [
        to[0] - from[0],
        to[1] - from[1],
        to[2] - from[2]
      ];
      
      const position = [
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2,
        (from[2] + to[2]) / 2
      ];
      
      // Create geometry
      const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
      
      // Create materials array for each face
      const materials = [];
      const faceOrder = ['east', 'west', 'up', 'down', 'south', 'north'];
      
      faceOrder.forEach(face => {
        if (element.faces[face] && element.faces[face].texture) {
          const textureKey = element.faces[face].texture.replace('#', '');
          if (this.enableGlow && this.glowMaterials[textureKey]) {
            materials.push(this.glowMaterials[textureKey]);
          } else {
            materials.push(this.materials[textureKey] || new THREE.MeshBasicMaterial({ color: 0x888888 }));
          }
        } else {
          materials.push(new THREE.MeshBasicMaterial({ color: 0x888888 }));
        }
      });
      
      // Create mesh
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.position.set(position[0], position[1], position[2]);
      
      // Apply rotation if specified
      if (element.rotation) {
        const origin = element.rotation.origin || [8, 8, 8];
        const angle = element.rotation.angle || 0;
        const axis = element.rotation.axis || 'y';
        
        // Translate to rotation origin
        mesh.position.sub(new THREE.Vector3(origin[0], origin[1], origin[2]));
        
        // Apply rotation
        const rad = angle * Math.PI / 180;
        if (axis === 'x') mesh.rotateX(rad);
        else if (axis === 'y') mesh.rotateY(rad);
        else if (axis === 'z') mesh.rotateZ(rad);
        
        // Translate back
        mesh.position.add(new THREE.Vector3(origin[0], origin[1], origin[2]));
      }
      
      // Apply UV mapping if specified
      if (element.faces) {
        // Create custom UV mapping for each face
        const uvAttribute = geometry.attributes.uv;
        const uvArray = uvAttribute.array;
        
        // Face indices for BoxGeometry in Three.js:
        // The actual order is: right, left, top, bottom, front, back
        // Each face has 4 vertices (2 triangles)
        const faceUVIndices = {
          'east': [0, 1, 2, 3],     // right (+X)
          'west': [4, 5, 6, 7],     // left (-X)
          'up': [8, 9, 10, 11],     // top (+Y)
          'down': [12, 13, 14, 15], // bottom (-Y)
          'south': [16, 17, 18, 19], // front (+Z)
          'north': [20, 21, 22, 23]  // back (-Z)
        };
        
        Object.keys(faceUVIndices).forEach(face => {
          if (element.faces[face] && element.faces[face].uv) {
            const uv = element.faces[face].uv;
            // Convert UV coordinates from Minecraft format (0-16) to normalized (0-1)
            const u1 = uv[0] / 16;
            const v1 = 1 - (uv[3] / 16); // Flip V coordinate for Three.js
            const u2 = uv[2] / 16;
            const v2 = 1 - (uv[1] / 16); // Flip V coordinate for Three.js
            
            const indices = faceUVIndices[face];
            // UV layout for each face (4 vertices for 2 triangles)
            // Triangle 1: bottom-left, bottom-right, top-left
            // Triangle 2: bottom-right, top-right, top-left
            uvArray[indices[0] * 2] = u1;
            uvArray[indices[0] * 2 + 1] = v2;
            uvArray[indices[1] * 2] = u2;
            uvArray[indices[1] * 2 + 1] = v2;
            uvArray[indices[2] * 2] = u1;
            uvArray[indices[2] * 2 + 1] = v1;
            uvArray[indices[3] * 2] = u2;
            uvArray[indices[3] * 2 + 1] = v1;
            
            // Debug log for problematic element
            if (element.from[1] === 18.5 && element.from[2] === 17.1) {
              console.log(`Face ${face} UV:`, uv, '-> u1:', u1, 'v1:', v1, 'u2:', u2, 'v2:', v2);
            }
          }
        });
        
        uvAttribute.needsUpdate = true;
      }
      
      group.add(mesh);
    });
    
    this.scene.add(group);

    // Store the model group and bounding info for centering/camera fit
    this.modelGroup = group;
    this.updateBounds();
  }
  
  // Calculate bounding box center and size from all blocks
  updateBounds() {
    if (!this.modelGroup) return;
    const box = new THREE.Box3().setFromObject(this.modelGroup);
    this.modelCenter = box.getCenter(new THREE.Vector3());
    this.modelSize = box.getSize(new THREE.Vector3());
    this.modelRadius = this.modelSize.length() / 2;
  }

  // Update method for animating glow effect
  update(time) {
    if (this.enableGlow) {
      Object.values(this.glowMaterials).forEach(material => {
        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = time;
        }
      });
    }
  }
}

// Three.js の初期化
const container = document.getElementById("mcmodel-viewer");
if (container) {
  const viewerStyle = container.dataset.viewerStyle || 'default';
  const isBlockbench = viewerStyle === 'blockbench';
  const isGUI = viewerStyle === 'gui';

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !isBlockbench });
  renderer.setSize(container.clientWidth, container.clientHeight);
  if (isBlockbench) {
    renderer.setClearColor(0x21252b, 1);
  } else {
    renderer.setClearColor(0x000000, 0);
  }
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  let camera;
  if (isGUI) {
    // Minecraft GUI: orthographic camera for flat inventory look
    const aspect = container.clientWidth / container.clientHeight;
    const size = 18;
    camera = new THREE.OrthographicCamera(-size * aspect, size * aspect, size, -size, 0.1, 1000);
    // Minecraft item display angle: 30° X tilt, 225° Y rotation
    const dist = 40;
    const xRot = -30 * Math.PI / 180;
    const yRot = 225 * Math.PI / 180;
    camera.position.set(
      dist * Math.sin(yRot) * Math.cos(xRot),
      dist * -Math.sin(xRot),
      dist * Math.cos(yRot) * Math.cos(xRot)
    );
    camera.lookAt(0, 0, 0);
  } else {
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(20, 20, 20);
  }

  // OrbitControls (disabled for GUI mode)
  let controls = null;
  if (!isGUI) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.update();
  }

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, isGUI ? 0.85 : 1);
  scene.add(ambient);
  if (isGUI) {
    // Minecraft-style top-left directional light for shading
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(-1, 1.5, 1);
    scene.add(dirLight);
  }

  // Blockbench-only: Grid & Axis
  let gridHelper = null;
  let axisHelper = null;
  if (isBlockbench) {
    gridHelper = new THREE.GridHelper(48, 48, 0x3a3f4b, 0x2c313a);
    scene.add(gridHelper);
    axisHelper = new THREE.AxesHelper(24);
    scene.add(axisHelper);
  }

  // Check for enable_glow attribute
  const enableGlow = container.dataset.enableGlow === 'true';
  const loader = new BlockModelRenderer(scene, enableGlow);

  // Get model path from data attribute or use default
  const baseUrl = window.location.pathname.includes('/Drowse-Lab/') ? '/Drowse-Lab' : '';
  const modelPath = container.dataset.modelPath ? baseUrl + container.dataset.modelPath : baseUrl + "/assets/models/customkatanairon3d.json";
  function centerView() {
    if (!loader.modelGroup) return;
    loader.updateBounds();
    const center = loader.modelCenter;
    const radius = loader.modelRadius;

    if (isGUI) {
      // GUI mode: fixed camera, just look at center
      camera.lookAt(center);
      // Adjust ortho size to fit model
      const aspect = container.clientWidth / container.clientHeight;
      const size = radius * 1.4;
      camera.left = -size * aspect;
      camera.right = size * aspect;
      camera.top = size;
      camera.bottom = -size;
      camera.updateProjectionMatrix();
      // Reposition camera to keep angle but target center
      const dir = camera.position.clone().normalize();
      camera.position.copy(center).add(dir.multiplyScalar(40));
      camera.lookAt(center);
    } else {
      // Set orbit target to model center
      controls.target.copy(center);

      // Position camera to fit the entire model in view
      const fov = camera.fov * (Math.PI / 180);
      const dist = (radius / Math.sin(fov / 2)) * 1.2;
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(center).add(direction.multiplyScalar(dist));

      // Update distance limits based on model size
      controls.minDistance = radius * 0.5;
      controls.maxDistance = radius * 5;
      controls.update();
    }
  }

  loader.loadModel(modelPath, () => {
    // Apply initial scale from data attributes (set via front matter)
    const ix = parseFloat(container.dataset.initScaleX) || 1;
    const iy = parseFloat(container.dataset.initScaleY) || 1;
    const iz = parseFloat(container.dataset.initScaleZ) || 1;
    if (loader.modelGroup) {
      loader.modelGroup.scale.set(ix, iy, iz);
    }
    centerView();
    animate();
  });

  function animate() {
    requestAnimationFrame(animate);
    
    // Update glow animation
    const time = performance.now() * 0.001; // Convert to seconds
    loader.update(time);
    
    if (controls) controls.update();
    renderer.render(scene, camera);
  }

  // Handle window resize
  function updateSize() {
    if (camera.isOrthographicCamera) {
      const aspect = container.clientWidth / container.clientHeight;
      const size = (camera.top - camera.bottom) / 2;
      camera.left = -size * aspect;
      camera.right = size * aspect;
    } else {
      camera.aspect = container.clientWidth / container.clientHeight;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  window.addEventListener('resize', updateSize);

  // Model scale controls
  const scaleX = document.getElementById('scale-x');
  const scaleY = document.getElementById('scale-y');
  const scaleZ = document.getElementById('scale-z');
  const scaleReset = document.getElementById('scale-reset');

  function applyScale() {
    if (!loader.modelGroup) return;
    const x = parseFloat(scaleX.value) || 1;
    const y = parseFloat(scaleY.value) || 1;
    const z = parseFloat(scaleZ.value) || 1;
    loader.modelGroup.scale.set(x, y, z);
    centerView();
  }

  if (scaleX && scaleY && scaleZ) {
    scaleX.addEventListener('input', applyScale);
    scaleY.addEventListener('input', applyScale);
    scaleZ.addEventListener('input', applyScale);
  }

  if (scaleReset) {
    scaleReset.addEventListener('click', () => {
      scaleX.value = 1;
      scaleY.value = 1;
      scaleZ.value = 1;
      applyScale();
    });
  }

  // --- Blockbench toolbar (only when blockbench style) ---
  if (isBlockbench) {
    function toggleBtn(btn, obj) {
      const active = btn.classList.toggle('bb-btn-active');
      obj.visible = active;
    }

    const gridToggle = document.getElementById('bb-grid-toggle');
    if (gridToggle) gridToggle.addEventListener('click', () => toggleBtn(gridToggle, gridHelper));

    const axisToggle = document.getElementById('bb-axis-toggle');
    if (axisToggle) axisToggle.addEventListener('click', () => toggleBtn(axisToggle, axisHelper));

    let wireframeOn = false;
    const wireToggle = document.getElementById('bb-wireframe-toggle');
    if (wireToggle) {
      wireToggle.addEventListener('click', () => {
        wireframeOn = !wireframeOn;
        wireToggle.classList.toggle('bb-btn-active', wireframeOn);
        if (loader.modelGroup) {
          loader.modelGroup.traverse(child => {
            if (child.isMesh) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach(m => { if (m.wireframe !== undefined) m.wireframe = wireframeOn; });
            }
          });
        }
      });
    }

    const coordsEl = document.getElementById('bb-coords');
    if (coordsEl) {
      setInterval(() => {
        const p = camera.position;
        coordsEl.textContent = `cam: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
      }, 200);
    }
  }
}