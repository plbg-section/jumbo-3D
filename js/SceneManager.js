/**
 * ==========================================
 * SceneManager — จัดการ scene / camera / lights / controls / renderer
 * ==========================================
 */
class SceneManager {
  constructor(containerId) {
    const cam = BAG_CONFIG.camera;
    const lights = BAG_CONFIG.lights;

    this.container = document.getElementById(containerId);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    this.camera = new THREE.PerspectiveCamera(
      cam.fov,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.set(
      cam.initialPosition.x,
      cam.initialPosition.y,
      cam.initialPosition.z,
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement,
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.9;
    this.controls.zoomSpeed = 0.9;
    this.controls.panSpeed = 0.8;
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.minDistance = cam.minDistance;
    this.controls.maxDistance = cam.maxDistance;
    this.controls.target.set(
      cam.initialTarget.x,
      cam.initialTarget.y,
      cam.initialTarget.z,
    );

    this.controls.domElement.style.touchAction = "none";

    this.bag = null; // จะถูก set ภายหลังใน main.js

    // ---- Auto-rotate state (หมุนกล้องอัตโนมัติตอนเปิด) ----
    this.autoRotate = false;
    this.autoRotateSpeed =
      (cam.autoRotateSpeed !== undefined ? cam.autoRotateSpeed : 1.2) *
      (Math.PI / 180); // แปลง องศา/วินาที → เรเดียน/วินาที
    this._lastTime = performance.now();
    // callback ให้ UI อัปเดตสถานะปุ่มเมื่อ auto-rotate หยุดเอง (จาก user)
    this.onAutoRotateChange = null;

    this.initLights(lights);
    this.initEnvironment();
    this.initListeners();
    this.initAutoRotate();

    this.animate = this.animate.bind(this);
    this.animate();
  }

  initLights(lights) {
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      lights.ambientIntensity,
    );
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(
      0xffffff,
      lights.mainIntensity,
    );
    mainLight.position.set(4, 7, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0003;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(
      0x90b0ff,
      lights.fillIntensity,
    );
    fillLight.position.set(-4, 3, -4);
    this.scene.add(fillLight);
  }

  initEnvironment() {
    const gridHelper = new THREE.GridHelper(10, 20, 0x334155, 0x1e293b);
    gridHelper.position.y = -0.001;
    this.scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  initListeners() {
    const bp = BAG_CONFIG.camera.smallScreenBreakpoint;
    let lastIsSmall = window.innerWidth < bp;

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      // สลับโหมดจอเล็ก/จอใหญ่ → จัดเฟรมถุงใหม่ให้เห็นทั้งหมด
      const isSmall = window.innerWidth < bp;
      if (isSmall !== lastIsSmall && this.bag) {
        lastIsSmall = isSmall;
        this.fitCameraToBag();
      }
    });
  }

  // ---- Auto-rotate ----
  initAutoRotate() {
    if (BAG_CONFIG.camera.autoRotate) {
      this.startAutoRotate();
    }

    // หยุดการหมุนเมื่อ user มีปฏิสัมพันธ์กับ canvas (ลาก/แตะ/ล้อ)
    const stopOnInteract = () => this.stopAutoRotate();
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", stopOnInteract);
    el.addEventListener("wheel", stopOnInteract, { passive: true });
    el.addEventListener("touchstart", stopOnInteract, { passive: true });
  }

  startAutoRotate() {
    this.autoRotate = true;
    this._lastTime = performance.now();
    if (typeof this.onAutoRotateChange === "function") {
      this.onAutoRotateChange(true);
    }
  }

  stopAutoRotate() {
    if (!this.autoRotate) return;
    this.autoRotate = false;
    if (typeof this.onAutoRotateChange === "function") {
      this.onAutoRotateChange(false);
    }
  }

  toggleAutoRotate() {
    if (this.autoRotate) {
      this.stopAutoRotate();
    } else {
      this.startAutoRotate();
    }
    return this.autoRotate;
  }

  animate() {
    requestAnimationFrame(this.animate);

    // หมุนกล้องรอบถุง (แกน Y) เมื่อ auto-rotate ทำงาน
    if (this.autoRotate) {
      const now = performance.now();
      const dt = Math.min((now - this._lastTime) / 1000, 0.1); // กันกระโดดตอน tab สลับ
      this._lastTime = now;

      const target = this.controls.target;
      const offset = new THREE.Vector3().subVectors(
        this.camera.position,
        target,
      );
      const angle = this.autoRotateSpeed * dt;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      // หมุน offset รอบแกน Y
      const nx = offset.x * cosA - offset.z * sinA;
      const nz = offset.x * sinA + offset.z * cosA;
      offset.x = nx;
      offset.z = nz;
      this.camera.position.copy(target).add(offset);
      this.camera.lookAt(target);
    } else {
      this._lastTime = performance.now();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  resetCamera() {
    const cam = BAG_CONFIG.camera;
    this.camera.position.set(
      cam.initialPosition.x,
      cam.initialPosition.y,
      cam.initialPosition.z,
    );
    this.controls.target.set(
      cam.initialTarget.x,
      cam.initialTarget.y,
      cam.initialTarget.z,
    );
    this.controls.update();
    this.fitCameraToBag();
  }

  /**
   * โฟกัสและซูมให้เห็นถุงทั้งหมด (สำคัญบนมือถือ/หน้าจอเล็ก)
   */
  fitCameraToBag(targetObject) {
    // ลำดับความสำคัญ: targetObject ที่ส่งมา > fitTarget (กลุ่มถุง+พาเลท) > bag
    const bag = targetObject || this.fitTarget || this.bag;
    if (!bag) return;

    const box = new THREE.Box3().setFromObject(bag);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const radius =
      0.5 * Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);

    const fov = (this.camera.fov * Math.PI) / 180;
    const aspect = this.camera.aspect;

    const fitHeightDist = radius / Math.tan(fov / 2);
    const fitWidthDist = radius / (Math.tan(fov / 2) * aspect);
    let distance =
      Math.max(fitHeightDist, fitWidthDist) * BAG_CONFIG.camera.fitMargin;

    const dir = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();
    if (dir.lengthSq() < 1e-6) dir.set(0.6, 0.5, 0.75).normalize();

    this.controls.target.copy(center);

    distance = Math.min(
      Math.max(distance, this.controls.minDistance),
      this.controls.maxDistance,
    );

    this.camera.position.copy(center).addScaledVector(dir, distance);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
}
