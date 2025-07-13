// mcmodel-viewer.js

// Three.js の初期化
const container = document.getElementById("mcmodel-viewer");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
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

// モデルとテクスチャのパス（必要に応じて書き換え）
const modelPath = "/assets/models/yukiba.json";
loader.loadModel(modelPath, () => {
  animate();
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
