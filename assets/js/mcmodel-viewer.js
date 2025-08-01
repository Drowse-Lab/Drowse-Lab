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
              
              this.materials[key] = new THREE.MeshLambertMaterial({
                map: texture,
                side: THREE.DoubleSide,
                alphaTest: 0.5
              });
              resolve();
            },
            undefined,
            (error) => {
              console.error(`Error loading texture ${texturePath}:`, error);
              // Create default gray material on error
              this.materials[key] = new THREE.MeshLambertMaterial({
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
          materials.push(this.materials[textureKey] || new THREE.MeshLambertMaterial({ color: 0x888888 }));
        } else {
          materials.push(new THREE.MeshLambertMaterial({ color: 0x888888 }));
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
        
        // Face indices for BoxGeometry:
        // 0-3: right (+X), 4-7: left (-X), 8-11: top (+Y), 
        // 12-15: bottom (-Y), 16-19: front (+Z), 20-23: back (-Z)
        const faceUVIndices = {
          'east': [0, 1, 2, 3],    // right
          'west': [4, 5, 6, 7],    // left
          'up': [8, 9, 10, 11],    // top
          'down': [12, 13, 14, 15], // bottom
          'south': [16, 17, 18, 19], // front
          'north': [20, 21, 22, 23]  // back
        };
        
        Object.keys(faceUVIndices).forEach(face => {
          if (element.faces[face] && element.faces[face].uv) {
            const uv = element.faces[face].uv;
            const u1 = uv[0] / 16;
            const v1 = 1 - uv[3] / 16; // Flip V coordinate
            const u2 = uv[2] / 16;
            const v2 = 1 - uv[1] / 16; // Flip V coordinate
            
            const indices = faceUVIndices[face];
            // UV layout for each face (4 vertices)
            uvArray[indices[0] * 2] = u1;
            uvArray[indices[0] * 2 + 1] = v1;
            uvArray[indices[1] * 2] = u2;
            uvArray[indices[1] * 2 + 1] = v1;
            uvArray[indices[2] * 2] = u1;
            uvArray[indices[2] * 2 + 1] = v2;
            uvArray[indices[3] * 2] = u2;
            uvArray[indices[3] * 2 + 1] = v2;
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
  renderer.setClearColor(0xf0f0f0, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(20, 20, 20);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.update();

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0x888888);
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
