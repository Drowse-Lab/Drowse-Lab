// mcmodel-viewer.js

// BlockModelRenderer class for loading Minecraft-style JSON models
class BlockModelRenderer {
  constructor(scene) {
    this.scene = scene;
    this.textureLoader = new THREE.TextureLoader();
    this.materials = {};
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
          materials.push(this.materials[textureKey] || new THREE.MeshBasicMaterial({ color: 0x888888 }));
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
    
    // Center the model
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);
    
    this.scene.add(group);
  }
}

// Three.js の初期化
const container = document.getElementById("mcmodel-viewer");
if (container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0xfafafa, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(20, 20, 20);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 50;
  controls.update();

  // Remove directional light since we're using MeshBasicMaterial
  // Add only ambient light for consistent brightness
  const ambient = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambient);

  const loader = new BlockModelRenderer(scene);

  // Get model path from data attribute or use default
  const baseUrl = window.location.pathname.includes('/Drowse-Lab/') ? '/Drowse-Lab' : '';
  const modelPath = container.dataset.modelPath ? baseUrl + container.dataset.modelPath : baseUrl + "/assets/models/customkatanairon3d.json";
  loader.loadModel(modelPath, () => {
    animate();
  });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}
