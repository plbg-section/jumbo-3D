/**
 * ==========================================
 * Pallet — พาเลทพลาสติก N4-1210 (Three.js r128, global THREE)
 * ==========================================
 * ดัดแปลงจาก pallet.html ให้เป็นคลาส reusable (OOP + Symmetry Mirroring)
 * ขนาด 1200 x 1000 x 150 mm (1.2 x 1.0 x 0.15 Three.js units)
 *
 * ใช้: const pallet = new PlasticPallet({ color: 0x005ce6 });
 *      pallet.position.set(0, 0, 0); // ฐานวางที่ y=0
 */
class PlasticPallet extends THREE.Group {
  static sharedResources = null;

  constructor(options = {}) {
    super();

    this.width = options.width || 1.2; // 1200 mm
    this.depth = options.depth || 1.0; // 1000 mm
    this.height = options.height || 0.15; // 150 mm
    this.color = options.color || 0x005ce6;

    // สร้าง Geometry ต้นแบบเก็บไว้ใน Static Cache เพียงครั้งเดียว
    // (ถ้าขนาดต่างกันให้ reset cache)
    const key = `${this.width}_${this.depth}_${this.height}`;
    if (!PlasticPallet.sharedResources || PlasticPallet.sharedResources.key !== key) {
      PlasticPallet.initResources(this.width, this.depth, this.height);
      PlasticPallet.sharedResources.key = key;
    }

    this.material = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.4,
      metalness: 0.12,
    });

    // วัสดุยางกันลื่นสีดำด้าน (Anti-Slip Rubber)
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.05,
    });

    this.buildSymmetrical();
  }

  static initResources(w, d, h) {
    const topH = 0.035; // พื้นบน 35mm
    const botH = 0.025; // คานล่าง 25mm
    const legH = h - topH - botH; // ช่องสอดงาสูง 90mm

    // ตุ่มยางกันลื่นทรงกระบอก: รัศมี 14mm, สูง 8mm
    const grommetRadius = 0.014;
    const grommetHeight = 0.008;

    PlasticPallet.sharedResources = {
      key: null,
      dims: { w, d, h, topH, botH, legH, grommetHeight },
      topDeckGeo: new THREE.BoxGeometry(w, topH, d),
      legGeo: new THREE.BoxGeometry(0.145, legH, 0.235),
      longRunnerGeo: new THREE.BoxGeometry(w, botH, 0.235),
      sideRunnerGeo: new THREE.BoxGeometry(0.145, botH, d),
      grommetGeo: new THREE.CylinderGeometry(
        grommetRadius,
        grommetRadius,
        grommetHeight,
        20,
      ),
    };
  }

  buildSymmetrical() {
    const { dims, topDeckGeo, legGeo, longRunnerGeo, sideRunnerGeo, grommetGeo } =
      PlasticPallet.sharedResources;

    // 1. แผ่นพื้นบน (Top Deck)
    const topDeck = this.createPart(
      topDeckGeo,
      0,
      dims.h - dims.topH / 2,
      0,
    );
    this.add(topDeck);

    // เส้นขอบเบาๆ ให้เห็นมิติของแผ่นบน
    const edges = new THREE.EdgesGeometry(topDeckGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.4,
    });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    topDeck.add(wireframe);

    // 2. ขาตั้งมุมทั้ง 4 (Mirror X และ Z)
    const legY = dims.botH + dims.legH / 2;
    const cornerX = dims.w / 2 - 0.145 / 2;
    const cornerZ = dims.d / 2 - 0.235 / 2;

    const grommetY = dims.h - dims.grommetHeight / 2 + 0.002;
    const grommetX = dims.w / 2 - 0.18;
    const grommetZ = dims.d / 2 - 0.16;

    const quadrants = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];

    quadrants.forEach(([sx, sz]) => {
      this.add(this.createPart(legGeo, cornerX * sx, legY, cornerZ * sz));
      this.add(
        this.createPart(
          grommetGeo,
          grommetX * sx,
          grommetY,
          grommetZ * sz,
          this.rubberMaterial,
        ),
      );
    });

    // 3. ชิ้นส่วนแกนกลาง + คานฐานล่าง (Mirror 2 ทิศทาง)
    const runnerY = dims.botH / 2;

    // แกนกลาง
    this.add(this.createPart(legGeo, 0, legY, 0));
    this.add(this.createPart(longRunnerGeo, 0, runnerY, 0));
    this.add(
      this.createPart(grommetGeo, 0, grommetY, 0, this.rubberMaterial),
    );

    // Mirror แกน X
    [-1, 1].forEach((sx) => {
      this.add(this.createPart(legGeo, cornerX * sx, legY, 0));
      this.add(this.createPart(sideRunnerGeo, cornerX * sx, runnerY, 0));
      this.add(
        this.createPart(grommetGeo, grommetX * sx, grommetY, 0, this.rubberMaterial),
      );
    });

    // Mirror แกน Z
    [-1, 1].forEach((sz) => {
      this.add(this.createPart(legGeo, 0, legY, cornerZ * sz));
      this.add(this.createPart(longRunnerGeo, 0, runnerY, cornerZ * sz));
      this.add(
        this.createPart(grommetGeo, 0, grommetY, grommetZ * sz, this.rubberMaterial),
      );
    });
  }

  createPart(geometry, x, y, z, customMaterial = this.material) {
    const mesh = new THREE.Mesh(geometry, customMaterial);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  setWireframe(enabled) {
    this.material.wireframe = enabled;
    this.rubberMaterial.wireframe = enabled;
  }
}
