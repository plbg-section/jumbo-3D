/**
 * ==========================================
 * JumboBag — คลาสสร้างโมเดลถุงจัมโบ้ 3D (Baffle Bag)
 * ==========================================
 * รับผิดชอบ geometry ทุกส่วน: ตัวถุง, Baffle, เส้นเย็บ, ปากถุง/domed cap,
 * หูหิ้ว และเม็ดพลาสติก
 */

// ชื่อฟอนต์ Font Awesome 6 (CDN: font-awesome/6.4.0)
const FA_FONT_FAMILY = '"Font Awesome 6 Free"';

/**
 * โหลดฟอนต์ Font Awesome 6 Free ให้พร้อมก่อนวาด glyph ลง canvas
 * (กัน tofu กล่องสี่เหลี่ยมตอน fillText glyph)
 * @returns {Promise<void>}
 */
function ensureLogoFontsLoaded() {
  if (!document.fonts) return Promise.resolve();
  const loads = [
    document.fonts.load(`900 100px ${FA_FONT_FAMILY}`).catch(() => {}),
    document.fonts.load(`400 100px ${FA_FONT_FAMILY}`).catch(() => {}),
  ];
  const ready = Promise.all(loads).catch(() => {});
  // กันค้าง: ถ้าโหลดช้าเกิน 2.5 วินาที ให้ไปต่อ (ได้ tofu ดีกว่าไม่ขึ้นเลย)
  const timeout = new Promise((res) => setTimeout(res, 2500));
  return Promise.race([ready, timeout]);
}

/**
 * สร้าง CanvasTexture จากโลโก้ POLIMAXX + แถว hazard pictogram 7 ช่อง
 * (ใช้ Font Awesome เป็นทรงไอคอน + วาดเส้นขีดฆ่า/ตกแต่งเพิ่มด้วย Canvas เอง)
 * - ถ้า opaqueBackground = false พื้นจะโปร่ง (เฉพาะโลโก้/ไอคอน/ตัวอักษรทึบ)
 *   ทำให้ด้านที่ไม่แปะโลโก้ (map ไปมุมโปร่ง) ยังเห็นสีถุงได้
 * หมายเหตุ: ต้องเรียก ensureLogoFontsLoaded() ให้เสร็จก่อน (ไม่งั้น glyph เป็น tofu)
 * @param {object} opt - ตัวเลือกจาก BAG_CONFIG.logo
 * @returns {THREE.CanvasTexture}
 */
function createLogoTexture(opt) {
  const size = (opt && opt.canvasSize) || 1024;
  const opaqueBg = !!(opt && opt.opaqueBackground);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // พื้นหลัง: ทึบ หรือ โปร่ง
  if (opaqueBg) {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ใช้ระบบพิกัด 1024 แล้ว scale ให้พอดีกับ size จริง
  const S = size / 1024;
  ctx.save();
  ctx.scale(S, S);

  const cx = 512;

  const FA_FAMILY = FA_FONT_FAMILY;
  const INK = "#222222";

  // ============================================================
  // กลุ่มโลโก้ POLIMAXX (คำ + วง O + หนอน A) — ค่าตำแหน่งดึงจาก BAG_CONFIG.logo.logoPos
  // ปรับได้จาก js/config.js หัวข้อ logo.logoPos (ไม่ต้องแก้โค้ดตรงนี้)
  // ============================================================
  const lp = (opt && opt.logoPos) || {};
  const LOGO_X = lp.x || 0; // เลื่อนทั้งกลุ่ม ซ้าย/ขวา
  const LOGO_Y = lp.y || 0; // เลื่อนทั้งกลุ่ม ขึ้น/ลง
  const LOGO_SCALE = lp.scale !== undefined ? lp.scale : 1; // ย่อ/ขยายทั้งกลุ่ม

  ctx.save();
  // อ้างอิงจุดหมุนที่กึ่งกลางโลโก้ (cx, ~y=180) เพื่อย่อ/ขยายรอบจุดนั้น
  const LOGO_PIVOT_X = cx;
  const LOGO_PIVOT_Y = 180;
  ctx.translate(LOGO_PIVOT_X + LOGO_X, LOGO_PIVOT_Y + LOGO_Y);
  ctx.scale(LOGO_SCALE, LOGO_SCALE);
  ctx.translate(-LOGO_PIVOT_X, -LOGO_PIVOT_Y);

  // 1. โลโก้ POLIMAXX — วาดคำเต็มปกติ
  ctx.fillStyle = "#002b49"; // น้ำเงินเข้ม
  ctx.font = "bold 95px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("POLIMAXX", cx, 220);

  // 1.1 ซ้อนวงกลม 2 ชั้น "ทับ" บนตัว O (ไข่ดาว: ขอบเทา + วงนอกขาว + วงในส้ม)
  const oX = lp.oX !== undefined ? lp.oX : 422;
  const oY = lp.oY !== undefined ? lp.oY : 188;
  const oOuterR = lp.oOuterR !== undefined ? lp.oOuterR : 24;
  const oInnerR = lp.oInnerR !== undefined ? lp.oInnerR : 12;
  // วงนอก (ขาว + ขอบเทา)
  ctx.fillStyle = lp.oOuterFill || "#FFFFFF";
  ctx.beginPath();
  ctx.arc(oX, oY, oOuterR, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth =
    lp.oOuterStrokeWidth !== undefined ? lp.oOuterStrokeWidth : 1.4;
  ctx.strokeStyle = lp.oOuterStroke || "#CBD5E1";
  ctx.stroke();
  // วงใน (ส้ม)
  ctx.fillStyle = lp.oInnerFill || "#FF7A00";
  ctx.beginPath();
  ctx.arc(oX, oY, oInnerR, 0, Math.PI * 2);
  ctx.fill();

  // 1.2 ตัวหนอน (SVG Path2D 3 ชั้น: เงาเทา + ขอบขาว + ตัวส้ม) บนตัว A
  const aX = lp.aX !== undefined ? lp.aX : 645;
  const aY = lp.aY !== undefined ? lp.aY : 140;
  const wormD =
    lp.wormPath ||
    "M2.2 14.2 C4.8 8.4, 8.8 8.4, 12.3 12.1 C15.2 15.2, 18.6 15.0, 21.8 10.6 C22.1 10.2, 22.5 10.5, 22.2 11.0 C19.2 16.8, 15.0 17.6, 11.3 14.0 C8.4 11.2, 5.2 11.2, 2.6 14.6 C2.3 15.0, 1.9 14.7, 2.2 14.2 Z";
  const vb = lp.wormViewBox !== undefined ? lp.wormViewBox : 24;
  const wormScale = lp.wormScale !== undefined ? lp.wormScale : 1.6;
  const wormLayers = lp.wormLayers || [
    ["#CBD5E1", 5.2],
    ["#FFFFFF", 3.8],
    ["#FF8C00", 2.2],
  ];
  const wormPath = new Path2D(wormD);
  ctx.save();
  ctx.translate(aX, aY);
  ctx.scale(wormScale, wormScale);
  ctx.translate(-vb / 2, -vb / 2); // ชดเชยกึ่งกลาง viewBox → จุด (0,0)
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // วาดทุกเลเยอร์ซ้อนกัน (ล่าง→บน)
  for (let li = 0; li < wormLayers.length; li++) {
    ctx.lineWidth = wormLayers[li][1];
    ctx.strokeStyle = wormLayers[li][0];
    ctx.stroke(wormPath);
  }
  ctx.restore();

  ctx.restore(); // จบกลุ่มโลโก้ POLIMAXX

  // ข้อความจีน
  ctx.fillStyle = "#333333";
  ctx.font = "bold 36px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("普 力 迈", cx, 280);

  // ---- 2. แถว hazard pictogram 7 ช่อง (FA glyph + เส้นวาดเพิ่ม) ----
  const iconsY = 400;
  const iconCount = 7;
  const iconSpacing = 118;
  const startX = cx - ((iconCount - 1) / 2) * iconSpacing;
  const iconR = 44;
  const RED = "#d32f2f";

  // helper: สัญลักษณ์ "ห้าม" แบบ prohibition sign
  //   วาดวงกลมแดง + ขีดทับแดงเฉียง ภายในวงเดียว (ขีดต้องอยู่ "ใน" วง ไม่ล้น)
  const drawProhibition = (x, y, r) => {
    ctx.save();
    // วงกลมแดง (เฉพาะเส้นขอบ)
    ctx.beginPath();
    ctx.arc(x, y, r * 0.98, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = RED;
    ctx.stroke();
    // ขีดทับแดงเฉียง พาดผ่านกลางวง (ความยาว ≤ เส้นผ่านศูนย์กลาง เพื่อไม่ล้น)
    // ใช้ 0.62r (จากครึ่ง = 0.87r ของครึ่งวง) ให้ปลายขีดอยู่ภายในขอบวง
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - r * 0.62, y - r * 0.62);
    ctx.lineTo(x + r * 0.62, y + r * 0.62);
    ctx.stroke();
    ctx.restore();
  };

  // แต่ละช่อง: glyph, decorate (วาดทับ), prohibited (ใส่เครื่องหมายห้ามหรือไม่), tilt
  const pictograms = [
    // 1) ห้ามเปียก — ร่ม (ไม่มีเครื่องหมายห้าม)
    { glyph: "\uf0e9", prohibited: false },
    // 2) ห้ามโดนแดด — ดวงอาทิตย์ + บ้าน (เก็บในที่ร่ม/มีหลังคา)
    {
      glyph: "\uf185", // fa-sun
      glyph2: "\uf015", // fa-house (วางด้านล่าง)
      prohibited: false,
    },
    // 3) ห้ามใกล้ไฟ — เปลวไฟ + เครื่องหมายห้าม
    { glyph: "\uf06d", prohibited: true },
    // 4) ห้ามใช้ตะขอ — สมอ + เครื่องหมายห้าม
    { glyph: "\uf13d", prohibited: true },
    // 5) ห้ามยกผิดวิธี — กล่องเอียง + เครื่องหมายห้าม
    { glyph: "\uf466", prohibited: true, tilt: -0.12 },
    // 6) รีไซเคิล เบอร์ 5 — รีไซเคิล + เลข 5 (ไม่บังเส้นรีไซเคิล)
    {
      glyph: "\uf1b8",
      prohibited: false,
      decorate: (x, y, r) => {
        ctx.save();
        // เลข 5 ใส่ "ขอบขาว" (stroke) บางๆ เพื่อให้อ่านออก แต่ไม่บังรีไซเคิล
        ctx.font = "bold 30px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#ffffff";
        ctx.strokeText("5", x, y + 1);
        ctx.fillStyle = INK;
        ctx.fillText("5", x, y + 1);
        ctx.restore();
      },
    },
    // 7) ผ่าน RoHS — เครื่องหมายถูก (ขยับขึ้น) + "RoHS" ด้านล่างภายในวง
    {
      glyph: "\uf00c",
      prohibited: false,
      // ขยับ glyph ขึ้นเล็กน้อยให้มีที่ให้คำว่า RoHS ด้านล่าง (ไม่ถูกวงทับ)
      glyphDy: -0.28,
      decorate: (x, y, r) => {
        ctx.save();
        ctx.fillStyle = INK;
        ctx.font = "bold 18px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // วาง RoHS ไว้ในวง ใกล้ขอบล่าง (0.55r จากกลาง ยังอยู่ในวง r)
        ctx.fillText("RoHS", x, y + r * 0.55);
        ctx.restore();
      },
    },
  ];

  for (let i = 0; i < pictograms.length; i++) {
    const p = pictograms[i];
    const icx = startX + i * iconSpacing;
    const icy = iconsY;

    // วงกลมกรอบ (ดำ) — ไม่ถูกวาดถ้าช่องนี้ใช้เครื่องหมายห้าม (มีวงแดงของตัวเอง)
    if (!p.prohibited) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(icx, icy, iconR, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.restore();
    } else {
      // พื้นขาว (ไม่มีขอบดำ) ให้glyph อ่านง่ายก่อนใส่เครื่องหมายห้ามทับ
      ctx.save();
      ctx.beginPath();
      ctx.arc(icx, icy, iconR, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
    }

    // วาด glyph FA (รองรับไอคอนเดี่ยวหรือไอคอนคู่)
    ctx.save();
    ctx.translate(icx, icy);
    if (p.tilt) ctx.rotate(p.tilt);
    // ขยับ glyph แนวตั้งถ้ากำหนด (เช่น C7 ให้มีที่ให้คำใต้)
    const glyphY = (p.glyphDy || 0) * iconR;
    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (p.glyph2) {
      // ไอคอนคู่ (เช่น C2 = ดวงอาทิตย์ + บ้าน)
      // ดวงอาทิตย์: บน; บ้าน: ล่าง — ย่อลงให้อยู่ในวงพอดี
      ctx.font = `900 ${iconR * 0.72}px ${FA_FAMILY}`;
      ctx.fillText(p.glyph, 0, glyphY - iconR * 0.36);
      ctx.font = `900 ${iconR * 0.72}px ${FA_FAMILY}`;
      ctx.fillText(p.glyph2, 0, glyphY + iconR * 0.42);
    } else {
      ctx.font = `900 ${iconR * 1.15}px ${FA_FAMILY}`;
      ctx.fillText(p.glyph, 0, glyphY);
    }
    ctx.restore();

    // วาดเส้นทับ / ตกแต่งเพิ่ม
    if (p.decorate) p.decorate(icx, icy, iconR);

    // เครื่องหมายห้าม (วงแดง + ขีด) — เฉพาะช่องที่กำหนด
    if (p.prohibited) drawProhibition(icx, icy, iconR);
  }

  // 3. ชื่อบริษัท / ผลิตที่
  ctx.fillStyle = "#111111";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("IRPC PUBLIC COMPANY LIMITED", cx, 540);

  // MADE IN THAILAND — ทำให้น้ำหนักชัด (ตัวหนา + สีเข้ม + stroke บางช่วยให้ดูหนา)
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // ขอบบางสีเดียวกับตัวอักษร ช่วยให้ stroke ดูหนาขึ้นเมื่อ map ลง 3D
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "#111111";
  ctx.strokeText("MADE IN THAILAND", cx, 588);
  ctx.fillStyle = "#111111"; // เทาเข้ม (เข้มกว่า #555 เดิม → ดูเป็นตัวหนาชัด)
  ctx.fillText("MADE IN THAILAND", cx, 588);

  // 4. ป้ายขนาด dimension (กว้าง × สูง × ลึก) ด้านล่างของถุง
  if (opt && opt.showDimension) {
    const dims = BAG_CONFIG.dimensions;
    const unit = opt.dimensionUnit || "cm";
    // Three.js units → cm (×100) แล้วปัดเป็นจำนวนเต็ม
    const toCm = (u) => Math.round(u * 100);
    const wCm = toCm(dims.width); // แกน X (กว้าง)
    const hCm = toCm(dims.height); // แกน Y (สูง)
    const lCm = toCm(dims.length); // แกน Z (ลึก)
    const dimText = `W ${wCm}  ×  H ${hCm}  ×  D ${lCm} ${unit}`;

    // ขยับลงมาแถวล่าง (bottom) ของถุง — canvas สูง 1024, วางไว้ใกล้ขอบล่าง
    const dimY = 930;
    const fontSize = 34;
    const fontStr = `bold ${fontSize}px Arial, sans-serif`;

    ctx.save();
    ctx.font = fontStr;

    // วัดความกว้างข้อความจริง → กำหนดกรอบให้ใหญ่กว่าข้อความเสมอ (+ padding)
    const textWidth = ctx.measureText(dimText).width;
    const padX = 36; // padding ซ้าย/ขวา
    const padY = 22; // padding บน/ล่าง
    const boxW = textWidth + padX * 2;
    const boxH = fontSize + padY * 2;
    const boxX = cx - boxW / 2;
    const boxY = dimY - boxH / 2;

    // กรอบมน (ใหญ่กว่าข้อความเสมอ)
    const rr = 14;
    ctx.beginPath();
    ctx.moveTo(boxX + rr, boxY);
    ctx.lineTo(boxX + boxW - rr, boxY);
    ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + rr);
    ctx.lineTo(boxX + boxW, boxY + boxH - rr);
    ctx.quadraticCurveTo(
      boxX + boxW,
      boxY + boxH,
      boxX + boxW - rr,
      boxY + boxH,
    );
    ctx.lineTo(boxX + rr, boxY + boxH);
    ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - rr);
    ctx.lineTo(boxX, boxY + rr);
    ctx.quadraticCurveTo(boxX, boxY, boxX + rr, boxY);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111111";
    ctx.stroke();

    // ข้อความ dimension (จัดกึ่งกลางในกรอบ)
    ctx.fillStyle = "#111111";
    ctx.font = fontStr;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dimText, cx, dimY);
    ctx.restore();
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  if ("anisotropy" in texture) texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

class JumboBag extends THREE.Group {
  constructor(config = {}) {
    super();

    const dim = BAG_CONFIG.dimensions;
    this.bagWidth = dim.width;
    this.bagLength = dim.length;
    this.bagHeight = dim.height;
    this.cornerInset = dim.cornerInset;

    this.bulgeFactor = (config.bulge !== undefined ? config.bulge : 120) / 100;
    this.baffleThickness =
      (config.baffleThickness !== undefined ? config.baffleThickness : 2) /
      1000;
    this.maxPelletCount = BAG_CONFIG.maxPelletCount;
    this.pelletCount =
      config.pelletCount !== undefined ? config.pelletCount : 22000;
    this.topType = config.topType || "open";
    this.showInnerVoid =
      config.showInnerVoid !== undefined ? config.showInnerVoid : true;
    this.bagColorHex = Number(config.bagColor || 0xfafafa);
    this.loopColorHex = Number(config.loopColor || 0x388e3c);
    this.pelletColorHex = Number(config.pelletColor || 0xf8fafc);
    this.opacityVal =
      (config.opacity !== undefined ? config.opacity : 100) / 100;

    // Cached random seed vectors for pellet packing consistency
    this.pelletSeeds = [];
    this.initPelletSeeds(this.maxPelletCount);

    this.initMaterials();
    this.rebuild();
  }

  // ---- helper: เรียกใช้ math กับ context ของ bag ----
  getDistortedPosition(x, y, z) {
    return BagMath.getDistortedPosition(this, x, y, z);
  }

  initPelletSeeds(count) {
    for (let i = 0; i < count; i++) {
      this.pelletSeeds.push({
        randX: (Math.random() - 0.5) * 2,
        randY: Math.random(),
        randZ: (Math.random() - 0.5) * 2,
        // ความสูงภายในกอง (0 = ก้นถุง, 1 = ผิวบนของเนินที่ตำแหน่งนั้น)
        // ยกกำลัง 0.7 → เอียงไปทางบนนิด ให้ดูโปร่งเหมือนเม็ดหลวมๆ
        // (คำนวณใน createPelletFill ร่วมกับรัศมี)
        randH: Math.pow(Math.random(), 0.7),
        jx: (Math.random() - 0.5) * 0.004,
        jz: (Math.random() - 0.5) * 0.004,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        scale: 0.85 + Math.random() * 0.35,
      });
    }
  }

  initMaterials() {
    this.fabricMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.bagColorHex),
      roughness: 0.85,
      metalness: 0.01,
      side: THREE.DoubleSide,
      transparent: this.opacityVal < 1.0,
      opacity: this.opacityVal,
      depthWrite: this.opacityVal >= 1.0,
    });

    // โลโก้ (ถ้าเปิดใช้งาน) — แปะเป็น map บนผ้าด้านหน้า
    if (BAG_CONFIG.logo && BAG_CONFIG.logo.enabled) {
      this.logoTexture = createLogoTexture(BAG_CONFIG.logo);
      this.fabricMaterial.map = this.logoTexture;
      // ต้อง transparent=true เพราะพื้นรอบโลโก้อาจโปร่ง (opaqueBackground=false)
      this.fabricMaterial.transparent = true;
      this.fabricMaterial.needsUpdate = true;

      // ถ้าฟอนต์ FA ยังโหลดไม่เสร็จตอนสร้าง texture แรก glyph จะเป็น tofu
      // → รอฟอนต์โหลดเสร็จแล้วสร้าง texture ใหม่ + อัปเดต material
      ensureLogoFontsLoaded().then(() => {
        const freshTexture = createLogoTexture(BAG_CONFIG.logo);
        this.logoTexture = freshTexture;
        this.fabricMaterial.map = freshTexture;
        this.fabricMaterial.needsUpdate = true;
        // อัปเดต texture ของยอดถุง/ฝา ถ้าเปิดใช้ (ถ้ามี)
        if (this.topCapMaterial) {
          this.topCapMaterial.map = freshTexture;
          this.topCapMaterial.needsUpdate = true;
        }
      });
    }

    this.baffleMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x10b981),
      roughness: 0.7,
      metalness: 0.02,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    this.spoutMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.bagColorHex),
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.DoubleSide,
      transparent: this.opacityVal < 1.0,
      opacity: this.opacityVal,
      depthWrite: this.opacityVal >= 1.0,
    });

    this.loopMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.loopColorHex),
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    this.pelletMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.pelletColorHex),
      roughness: 0.45,
      metalness: 0.02,
    });

    this.stitchMaterial = new THREE.LineBasicMaterial({
      color: 0xf97316,
      linewidth: 2,
    });
  }

  rebuild() {
    while (this.children.length > 0) {
      const obj = this.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.remove(obj);
    }

    this.createChubbyBody();
    this.makeBaffle();
    this.createStitchLines();
    this.createTopStructure();
    this.createCornerLoopsSymmetric();
    this.createPelletFill();
  }

  // ------------------------------------------
  // Baffle (แผ่นกั้นมุม)
  // ------------------------------------------
  makeBaffle() {
    const cfg = BAG_CONFIG.baffle;
    const baffleGroup = new THREE.Group();
    const halfW = this.bagWidth / 2;
    const halfL = this.bagLength / 2;
    const h = this.bagHeight;
    const inset = this.cornerInset;

    const baffleHeight = h * cfg.heightRatio;
    // ความกว้าง = เส้นทแยงระหว่างจุดเย็บสองฝั่ง × widthScale (ย่อให้อยู่ใต้เส้นเย็บ)
    const baffleWidth =
      Math.sqrt(inset * inset + inset * inset) * cfg.widthScale;

    const shape = new THREE.Shape();
    shape.moveTo(-baffleWidth / 2, -baffleHeight / 2);
    shape.lineTo(baffleWidth / 2, -baffleHeight / 2);
    shape.lineTo(baffleWidth / 2, baffleHeight / 2);
    shape.lineTo(-baffleWidth / 2, baffleHeight / 2);
    shape.closePath();

    const numHoles = cfg.holeCount;
    const holeRadius = baffleWidth * cfg.holeRadiusRatio;
    const spacing = baffleHeight / (numHoles + 1);

    for (let i = 1; i <= numHoles; i++) {
      const holeY = -baffleHeight / 2 + i * spacing;
      const holePath = new THREE.Path();
      holePath.absarc(0, holeY, holeRadius, 0, Math.PI * 2, false);
      shape.holes.push(holePath);
    }

    const extrudeSettings = {
      depth: this.baffleThickness,
      bevelEnabled: false,
      curveSegments: 24,
    };
    const baffleGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    baffleGeo.translate(0, 0, -extrudeSettings.depth / 2);

    const pullIn = cfg.pullIn;

    const corners = [
      { x: halfW - inset / 2, z: halfL - inset / 2, rotY: Math.PI / 4 },
      { x: -halfW + inset / 2, z: halfL - inset / 2, rotY: -Math.PI / 4 },
      { x: -halfW + inset / 2, z: -halfL + inset / 2, rotY: Math.PI / 4 },
      { x: halfW - inset / 2, z: -halfL + inset / 2, rotY: -Math.PI / 4 },
    ];

    corners.forEach((c) => {
      const mesh = new THREE.Mesh(baffleGeo, this.baffleMaterial);
      const sxDir = c.x < 0 ? -1 : 1;
      const szDir = c.z < 0 ? -1 : 1;
      mesh.position.set(
        c.x - sxDir * pullIn,
        h - baffleHeight / 2 - 0.02,
        c.z - szDir * pullIn,
      );
      mesh.rotation.y = c.rotY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      baffleGroup.add(mesh);
    });

    this.add(baffleGroup);
  }

  // ------------------------------------------
  // เส้นเย็บ (stitch lines)
  // ------------------------------------------
  createStitchLines() {
    const halfW = this.bagWidth / 2;
    const halfL = this.bagLength / 2;
    const h = this.bagHeight;
    const seamX = halfW - this.cornerInset;
    const seamZ = halfL - this.cornerInset;

    const stitchSegments = 60;
    const stitchOffset = 0.003;

    const tracks = [
      { xStart: seamX, zStart: halfL + stitchOffset },
      { xStart: -seamX, zStart: halfL + stitchOffset },
      { xStart: seamX, zStart: -halfL - stitchOffset },
      { xStart: -seamX, zStart: -halfL - stitchOffset },
      { xStart: halfW + stitchOffset, zStart: seamZ },
      { xStart: halfW + stitchOffset, zStart: -seamZ },
      { xStart: -halfW - stitchOffset, zStart: seamZ },
      { xStart: -halfW - stitchOffset, zStart: -seamZ },
    ];

    const stitchPoints = [];

    tracks.forEach((track) => {
      for (let s = 0; s < stitchSegments; s++) {
        const y1 = (s / stitchSegments) * h;
        const y2 = ((s + 0.6) / stitchSegments) * h;

        const pos1 = this.getDistortedPosition(track.xStart, y1, track.zStart);
        const pos2 = this.getDistortedPosition(track.xStart, y2, track.zStart);

        const ext = 0.002;
        const ox1 =
          track.xStart === halfW + stitchOffset
            ? ext
            : track.xStart === -halfW - stitchOffset
              ? -ext
              : 0;
        const oz1 =
          track.zStart === halfL + stitchOffset
            ? ext
            : track.zStart === -halfL - stitchOffset
              ? -ext
              : 0;

        stitchPoints.push(
          new THREE.Vector3(pos1.x + ox1, pos1.y, pos1.z + oz1),
        );
        stitchPoints.push(
          new THREE.Vector3(pos2.x + ox1, pos2.y, pos2.z + oz1),
        );
      }
    });

    const stitchGeo = new THREE.BufferGeometry().setFromPoints(stitchPoints);
    const stitchLines = new THREE.LineSegments(stitchGeo, this.stitchMaterial);
    this.add(stitchLines);
  }

  // ------------------------------------------
  // เม็ดพลาสติก (InstancedMesh)
  // ------------------------------------------
  createPelletFill() {
    const radius = 0.0035;
    const height = 0.004;
    const pelletGeo = new THREE.CylinderGeometry(radius, radius, height, 5);

    const maxCount = this.maxPelletCount;
    this.pelletInstancedMesh = new THREE.InstancedMesh(
      pelletGeo,
      this.pelletMaterial,
      maxCount,
    );
    this.pelletInstancedMesh.castShadow = false;
    this.pelletInstancedMesh.receiveShadow = false;

    const dummy = new THREE.Object3D();
    const halfW = this.bagWidth / 2;
    const halfL = this.bagLength / 2;
    const innerScale = 0.97;

    // ---- ถุงบรรจุ 750kg+ : เม็ดเต็มเกือบทั้งถุง + ผิวบนเป็นเนินนูนกลาง ----
    const bagHeight = this.bagHeight;
    const floorY = 0.04; // ระดับก้นกอง
    // ระดับฐานกอง (ที่ริมผนัง) — สูงเกือบเต็มถุง
    const heapEdge = bagHeight * 0.88;
    // ระดับผิวเนินตรงกลาง — สูงกว่าฐาน (พูนขึ้นกลาง)
    const heapPeak = bagHeight * 0.96;

    for (let i = 0; i < maxCount; i++) {
      const seed = this.pelletSeeds[i];

      // รัศมีจากศูนย์กลาง (0 = กลาง, 1 = ริมผนัง)
      const radialNorm = Math.min(
        1,
        Math.sqrt(seed.randX * seed.randX + seed.randZ * seed.randZ) /
          Math.SQRT2,
      );

      // ผิวบนของเนินที่ตำแหน่งนี้: กลางสูง (heapPeak) → ริม (heapEdge)
      // ฐานกองสูงเกือบเต็มถุง (heapEdge 88%) แล้วยกเนินขึ้นกลางอีกนิด
      const t = 1 - radialNorm;
      const surfaceH = heapEdge + (heapPeak - heapEdge) * (t * t);
      // ความสูงจริงของเม็ด = floorY..surfaceH (seed.randH=0 ก้น .. 1 ผิวเนิน)
      const y = floorY + seed.randH * (surfaceH - floorY);

      // ตำแหน่ง x/z: บีบเข้าหากลางเล็กน้อยเฉพาะช่วงบนเนิน
      const spread = 1 - 0.18 * (seed.randH * (1 - radialNorm));
      let rawX = seed.randX * halfW * spread;
      let rawZ = seed.randZ * halfL * spread;

      // ปรับให้อยู่ภายในผนัง (distort ตามผนังถุงที่ระดับ y)
      const maxAbs = Math.max(Math.abs(rawX) / halfW, Math.abs(rawZ) / halfL);
      let finalX = rawX;
      let finalZ = rawZ;

      if (maxAbs > 1e-5) {
        const boundaryX = rawX / maxAbs;
        const boundaryZ = rawZ / maxAbs;
        const wallPos = this.getDistortedPosition(boundaryX, y, boundaryZ);

        finalX = wallPos.x * maxAbs * innerScale;
        finalZ = wallPos.z * maxAbs * innerScale;
      }

      dummy.position.set(finalX, y + seed.jx, finalZ + seed.jz);
      dummy.rotation.set(seed.rotX, seed.rotY, seed.rotZ);
      dummy.scale.set(seed.scale, seed.scale, seed.scale);
      dummy.updateMatrix();

      this.pelletInstancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.pelletInstancedMesh.instanceMatrix.needsUpdate = true;
    this.pelletInstancedMesh.count = this.pelletCount;
    this.add(this.pelletInstancedMesh);
  }

  // ------------------------------------------
  // ตัวถุง (body)
  // ------------------------------------------
  createChubbyBody() {
    const segX = 64;
    const segY = 48;
    const segZ = 64;

    let geo = new THREE.BoxGeometry(
      this.bagWidth,
      this.bagHeight,
      this.bagLength,
      segX,
      segY,
      segZ,
    );

    // ---- กำหนด UV ใหม่: โลโก้เฉพาะด้านหน้า (ก่อน translate/distort) ----
    // หมายเหตุ: BoxGeometry แบบแบ่ง segment มี vertex จำนวนมากต่อหน้า
    // จึงใช้ normal ของแต่ละ vertex เพื่อระบุว่าอยู่หน้าไหน แล้วคำนวณ UV
    // จากตำแหน่งจริง (linear map เข้า 0..1 ของขอบเขตหน้า)
    if (this.logoTexture) {
      const uvAttr = geo.attributes.uv;
      const posAttr0 = geo.attributes.position;
      const normAttr = geo.attributes.normal;

      const halfW = this.bagWidth / 2;
      const halfH = this.bagHeight / 2;
      const halfL = this.bagLength / 2;

      const targetFace = BAG_CONFIG.logo.face || "front";
      const PLAIN_U = 0.002;
      const PLAIN_V = 0.002;

      for (let i = 0; i < posAttr0.count; i++) {
        const nx = normAttr.getX(i);
        const ny = normAttr.getY(i);
        const nz = normAttr.getZ(i);
        const vx = posAttr0.getX(i);
        const vy = posAttr0.getY(i);
        const vz = posAttr0.getZ(i);

        // ระบุหน้าจาก normal หลัก (ค่าสูงสุดแบบ abs)
        let faceName;
        if (Math.abs(nx) >= Math.abs(ny) && Math.abs(nx) >= Math.abs(nz)) {
          faceName = nx > 0 ? "right" : "left";
        } else if (
          Math.abs(ny) >= Math.abs(nx) &&
          Math.abs(ny) >= Math.abs(nz)
        ) {
          faceName = ny > 0 ? "top" : "bottom";
        } else {
          faceName = nz > 0 ? "front" : "back";
        }

        if (faceName === targetFace) {
          let u, v;
          if (faceName === "front") {
            u = (vx + halfW) / this.bagWidth;
            v = (vy + halfH) / this.bagHeight;
          } else if (faceName === "back") {
            u = (halfW - vx) / this.bagWidth;
            v = (vy + halfH) / this.bagHeight;
          } else if (faceName === "right") {
            u = (vz + halfL) / this.bagLength;
            v = (vy + halfH) / this.bagHeight;
          } else if (faceName === "left") {
            u = (halfL - vz) / this.bagLength;
            v = (vy + halfH) / this.bagHeight;
          } else {
            // top/bottom — ไม่คาดว่าจะถูกเลือก แต่กันไว้
            u = (vx + halfW) / this.bagWidth;
            v = (vz + halfL) / this.bagLength;
          }
          uvAttr.setXY(i, u, v);
        } else {
          uvAttr.setXY(i, PLAIN_U, PLAIN_V);
        }
      }
      uvAttr.needsUpdate = true;
    }

    geo.translate(0, this.bagHeight / 2, 0);

    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      const distorted = this.getDistortedPosition(vx, vy, vz);
      posAttr.setXYZ(i, distorted.x, distorted.y, distorted.z);
    }

    geo.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(geo, this.fabricMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.add(bodyMesh);
  }

  // ------------------------------------------
  // ฝาปิดปากถุง ทรงระฆังคว่ำ (นูนขึ้น แต่อยู่ในขอบผนัง ไม่ล้นออกนอก)
  // ------------------------------------------
  /**
   * สร้างฝาปิดปากถุง ทรงระฆังคว่ำ (convex, นูนขึ้นด้านบน)
   * - ขอบบน (ring) อยู่ที่ระดับ y = h ตามผนังจริง แล้ว "ดึงเข้าใน" ด้วย rimInset
   *   → ขอบฝาอยู่ภายในขอบผนัง ไม่ล้นออกไปด้านนอก
   * - จุดกลางยกขึ้นไปที่ y = h + domeHeight (อยู่เหนือขอบปากถุง)
   * - อยู่ภายในขอบเขตผนัง จึงไม่ overlap กับหูถุงที่โค้งพ้นปาก
   * @param {number} holeRadius รัศมีรูตรงกลาง (0 = ปิดทึบ)
   */
  createTopCap(holeRadius) {
    const cfg = BAG_CONFIG.topCap;
    const h = this.bagHeight;

    const holeR = Math.max(0.0, holeRadius);
    const domeHeight =
      cfg.domeHeight + cfg.domeHeightPerBulge * this.bulgeFactor;

    const rings = cfg.radialRings;

    // 1) หาเส้นรอบขอบบน (outer ring ที่ y = h, ตามผนังจริง) แล้วดึงเข้าใน
    const halfW = this.bagWidth / 2;
    const halfL = this.bagLength / 2;
    const corners = [
      [-halfW, -halfL],
      [halfW, -halfL],
      [halfW, halfL],
      [-halfW, halfL],
    ];
    const outerRing = []; // array of THREE.Vector3 ที่ระดับ y=h
    const perSide = cfg.edgeSegmentsPerSide;
    for (let e = 0; e < 4; e++) {
      const a = corners[e];
      const b = corners[(e + 1) % 4];
      for (let s = 0; s < perSide; s++) {
        const t = s / perSide;
        const x = a[0] + (b[0] - a[0]) * t;
        const z = a[1] + (b[1] - a[1]) * t;
        const p = this.getDistortedPosition(x, h, z);
        // rimInset: ดึงขอบฝา "เข้าหาศูนย์กลาง" ตามทิศ (x,z) เพื่อไม่ให้ล้นผนัง
        const len = Math.hypot(p.x, p.z) || 1;
        const ix = (p.x / len) * cfg.rimInset;
        const iz = (p.z / len) * cfg.rimInset;
        outerRing.push(new THREE.Vector3(p.x - ix, h, p.z - iz));
      }
    }

    // 2) สร้างผิวระฆังคว่ำ: ring 0 = ขอบบน, ring สุดท้าย = จุดกลาง (ยกสุด)
    //    radius หดเข้าศูนย์ + Y เพิ่มขึ้น (sin) → โดมนูนขึ้น
    const positions = [];
    const indices = [];
    const n = outerRing.length;

    const ringVerts = [];
    for (let r = 0; r <= rings; r++) {
      const t = r / rings; // 0 = ขอบ, 1 = กลาง
      // ยกขึ้นด้านบน: y เพิ่มจาก h ไป h + domeHeight (sin นุ่ม)
      const lift = Math.sin(t * (Math.PI / 2)) * domeHeight;
      const shrink = Math.cos(t * (Math.PI / 2)); // 1 ที่ขอบ -> 0 ที่กลาง
      const idxRow = [];
      for (let i = 0; i < n; i++) {
        const base = outerRing[i];
        const rad = Math.hypot(base.x, base.z) || 1;
        const dirX = base.x / rad;
        const dirZ = base.z / rad;
        const targetRad = holeR + (rad - holeR) * shrink;
        const px = dirX * targetRad;
        const pz = dirZ * targetRad;
        const py = h + lift; // <-- นูนขึ้นเหนือขอบ (ระฆังคว่ำ)
        idxRow.push(positions.length / 3);
        positions.push(px, py, pz);
      }
      ringVerts.push(idxRow);
    }

    // สร้าง triangle ระหว่าง ring
    for (let r = 0; r < rings; r++) {
      const rowA = ringVerts[r];
      const rowB = ringVerts[r + 1];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const a = rowA[i];
        const b = rowA[j];
        const c = rowB[i];
        const d = rowB[j];
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    const capGeo = new THREE.BufferGeometry();
    capGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    capGeo.setIndex(indices);
    capGeo.computeVertexNormals();

    const capMat = this.fabricMaterial.clone();
    capMat.map = null; // ฝาไม่มี UV — ใช้สีพื้นล้วน
    capMat.transparent = false;
    capMat.opacity = 1.0;
    capMat.depthWrite = true;
    capMat.side = THREE.DoubleSide;
    this.topCapMaterial = capMat;

    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    this.add(capMesh);
  }

  // ------------------------------------------
  // โครงสร้างปากถุง (open / spout) + dome cap
  // ------------------------------------------
  createTopStructure() {
    const cfg = BAG_CONFIG.topCap;
    const h = this.bagHeight;
    const halfW = this.bagWidth / 2;
    const halfL = this.bagLength / 2;

    const innerVoidMaterial = new THREE.MeshBasicMaterial({
      color: 0x090d16,
      side: THREE.DoubleSide,
    });
    // เก็บอ้างอิง material/เมช แผ่นดำปากถุง เพื่อ toggle ภายหลังได้
    this.innerVoidMaterial = innerVoidMaterial;
    this.innerVoidMeshes = [];
    const innerVoidVisible = this.showInnerVoid !== false;

    if (this.topType === "spout") {
      const spoutRadius =
        Math.min(this.bagWidth, this.bagLength) * cfg.spoutRadiusRatio;
      const spoutHeight = cfg.spoutHeight;

      // ฝาระฆังคว่ำ เจาะรูตรงกลางพอดีปากท่อ
      this.createTopCap(spoutRadius * 0.98);

      // ปลายยอดฝา (ระฆังคว่ำ) = h + domeHeight
      const domeTopY =
        h + cfg.domeHeight + cfg.domeHeightPerBulge * this.bulgeFactor;
      const spoutGeo = new THREE.CylinderGeometry(
        spoutRadius,
        spoutRadius,
        spoutHeight,
        32,
        10,
        true,
      );
      spoutGeo.translate(0, domeTopY + spoutHeight / 2, 0);

      const spoutMesh = new THREE.Mesh(spoutGeo, this.spoutMaterial);
      spoutMesh.castShadow = true;
      this.add(spoutMesh);

      const holeGeo = new THREE.CircleGeometry(spoutRadius * 0.96, 32);
      holeGeo.rotateX(-Math.PI / 2);
      holeGeo.translate(0, domeTopY + 0.005, 0);
      const holeMesh = new THREE.Mesh(holeGeo, innerVoidMaterial);
      holeMesh.visible = innerVoidVisible;
      this.innerVoidMeshes.push(holeMesh);
      this.add(holeMesh);

      const tieGeo = new THREE.TorusGeometry(spoutRadius + 0.01, 0.008, 12, 32);
      tieGeo.rotateX(Math.PI / 2);
      tieGeo.translate(0, domeTopY + spoutHeight * 0.5, 0);
      const tieMesh = new THREE.Mesh(
        tieGeo,
        new THREE.MeshStandardMaterial({ color: 0x334155 }),
      );
      this.add(tieMesh);
    } else {
      const holeRadius = Math.min(halfW, halfL) * cfg.openHoleRadiusRatio;
      const rimRadius = Math.min(halfW, halfL) * 0.95;

      // ฝาระฆังคว่ำ เจาะรูตรงกลาง (ปากเปิด)
      this.createTopCap(holeRadius * 0.99);

      // ยอดฝา (ระฆังคว่ำ) = h + domeHeight
      const domeTopY =
        h + cfg.domeHeight + cfg.domeHeightPerBulge * this.bulgeFactor;

      const duffelGeo = new THREE.RingGeometry(holeRadius, rimRadius, 32, 8);
      duffelGeo.rotateX(-Math.PI / 2);
      duffelGeo.translate(0, domeTopY + 0.01, 0);

      const duffelMesh = new THREE.Mesh(duffelGeo, this.spoutMaterial);
      duffelMesh.castShadow = true;
      this.add(duffelMesh);

      const innerHoleGeo = new THREE.CircleGeometry(holeRadius * 0.99, 32);
      innerHoleGeo.rotateX(-Math.PI / 2);
      innerHoleGeo.translate(0, domeTopY + 0.02, 0);
      const innerHoleMesh = new THREE.Mesh(innerHoleGeo, innerVoidMaterial);
      innerHoleMesh.visible = innerVoidVisible;
      this.innerVoidMeshes.push(innerHoleMesh);
      this.add(innerHoleMesh);
    }
  }

  // ------------------------------------------
  // หูหิ้วมุมทั้ง 4 (symmetric loops)
  // ------------------------------------------
  createCornerLoopsSymmetric() {
    const loopGroup = new THREE.Group();
    const masterLoop = this.buildSingleMasterLoop();
    const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

    angles.forEach((angle) => {
      const cornerInstance = masterLoop.clone();
      cornerInstance.rotation.y = angle;
      loopGroup.add(cornerInstance);
    });

    this.add(loopGroup);
  }

  buildSingleMasterLoop() {
    const masterGroup = new THREE.Group();

    const halfW = this.bagWidth / 2;
    const halfL = this.bagLength / 2;
    const h = this.bagHeight;
    const strapWidth = 0.06;
    const strapLength = 0.45;

    // ---- ขา A (แนบผนังด้าน +Z) ----
    const legAGeo = new THREE.PlaneGeometry(strapWidth, strapLength, 8, 24);
    legAGeo.translate(0, -strapLength / 2, 0);

    const posA = legAGeo.attributes.position;
    for (let i = 0; i < posA.count; i++) {
      const lx = posA.getX(i) + (halfW - 0.12);
      const ly = posA.getY(i) + h;
      const lz = halfL;

      const surfacePos = this.getDistortedPosition(lx, ly, lz);
      posA.setXYZ(i, surfacePos.x, surfacePos.y, surfacePos.z + 0.005);
    }
    legAGeo.computeVertexNormals();
    const legAMesh = new THREE.Mesh(legAGeo, this.loopMaterial);
    legAMesh.castShadow = true;
    masterGroup.add(legAMesh);

    // ---- ขา B (แนบผนังด้าน +X) ----
    const legBGeo = new THREE.PlaneGeometry(strapWidth, strapLength, 8, 24);
    legBGeo.translate(0, -strapLength / 2, 0);

    const posB = legBGeo.attributes.position;
    for (let i = 0; i < posB.count; i++) {
      const lx = halfW;
      const ly = posB.getY(i) + h;
      const lz = posB.getX(i) + (halfL - 0.12);

      const surfacePos = this.getDistortedPosition(lx, ly, lz);
      posB.setXYZ(i, surfacePos.x + 0.005, surfacePos.y, surfacePos.z);
    }
    legBGeo.computeVertexNormals();
    const legBMesh = new THREE.Mesh(legBGeo, this.loopMaterial);
    legBMesh.castShadow = true;
    masterGroup.add(legBMesh);

    // ---- ส่วนโค้งพาดขอบมุม ----
    const anchorA = this.getDistortedPosition(halfW - 0.12, h, halfL);
    const anchorB = this.getDistortedPosition(halfW, h, halfL - 0.12);

    const pA = new THREE.Vector3(anchorA.x, anchorA.y, anchorA.z + 0.005);
    const pB = new THREE.Vector3(anchorB.x + 0.005, anchorB.y, anchorB.z);
    const topApex = new THREE.Vector3(
      (pA.x + pB.x) / 2 + 0.03,
      h + 0.32,
      (pA.z + pB.z) / 2 + 0.03,
    );

    const curve = new THREE.CatmullRomCurve3([
      pA,
      new THREE.Vector3(pA.x, h + 0.18, pA.z),
      topApex,
      new THREE.Vector3(pB.x, h + 0.18, pB.z),
      pB,
    ]);

    const tubularSegments = 36;
    const radialSegments = 12;
    const archGeo = new THREE.TubeGeometry(
      curve,
      tubularSegments,
      strapWidth / 2,
      radialSegments,
      false,
    );

    const archPos = archGeo.attributes.position;
    const ringVertexCount = radialSegments + 1;
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const center = curve.getPointAt(t);

      const pinchStart = Math.pow(Math.max(0, 1 - t * 3.5), 2);
      const pinchEnd = Math.pow(Math.max(0, (t - (1 - 1 / 3.5)) * 3.5), 2);

      const scaleZ = 1 - 0.94 * pinchStart;
      const scaleX = 1 - 0.94 * pinchEnd;

      for (let j = 0; j < ringVertexCount; j++) {
        const idx = i * ringVertexCount + j;
        const ox = archPos.getX(idx) - center.x;
        const oy = archPos.getY(idx) - center.y;
        const oz = archPos.getZ(idx) - center.z;

        archPos.setXYZ(
          idx,
          center.x + ox * scaleX,
          center.y + oy,
          center.z + oz * scaleZ,
        );
      }
    }
    archGeo.computeVertexNormals();

    const archMesh = new THREE.Mesh(archGeo, this.loopMaterial);
    archMesh.castShadow = true;
    masterGroup.add(archMesh);

    return masterGroup;
  }

  // ------------------------------------------
  // Setters
  // ------------------------------------------
  setBagColor(colorHex) {
    this.bagColorHex = Number(colorHex);
    this.fabricMaterial.color.setHex(this.bagColorHex);
    this.spoutMaterial.color.setHex(this.bagColorHex);
    if (this.topCapMaterial) this.topCapMaterial.color.setHex(this.bagColorHex);
  }

  setLoopColor(colorHex) {
    this.loopColorHex = Number(colorHex);
    this.loopMaterial.color.setHex(this.loopColorHex);
  }

  setPelletColor(colorHex) {
    this.pelletColorHex = Number(colorHex);
    this.pelletMaterial.color.setHex(this.pelletColorHex);
  }

  setBulge(val) {
    this.bulgeFactor = val / 100;
    this.rebuild();
  }

  setBaffleThickness(mm) {
    this.baffleThickness = mm / 1000;
    this.rebuild();
  }

  setPelletCount(count) {
    this.pelletCount = Math.min(this.maxPelletCount, Math.max(0, count));
    if (this.pelletInstancedMesh) {
      this.pelletInstancedMesh.count = this.pelletCount;
    }
  }

  setOpacity(val) {
    this.opacityVal = val / 100;
    const isTransparent = this.opacityVal < 1.0;

    this.fabricMaterial.transparent = isTransparent;
    this.fabricMaterial.opacity = this.opacityVal;
    this.fabricMaterial.depthWrite = !isTransparent;
    this.fabricMaterial.needsUpdate = true;

    this.spoutMaterial.transparent = isTransparent;
    this.spoutMaterial.opacity = this.opacityVal;
    this.spoutMaterial.depthWrite = !isTransparent;
    this.spoutMaterial.needsUpdate = true;
  }

  setTopType(type) {
    this.topType = type;
    this.rebuild();
  }

  // แสดง/ซ่อนแผ่นสีดำ (inner void) ที่ปากถุง — ไม่ต้อง rebuild
  setShowInnerVoid(show) {
    this.showInnerVoid = show;
    if (this.innerVoidMeshes) {
      this.innerVoidMeshes.forEach((m) => {
        m.visible = show;
      });
    }
  }
}
