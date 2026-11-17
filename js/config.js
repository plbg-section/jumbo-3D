/**
 * ==========================================
 * CONFIG — ค่าคงที่/ค่าตั้งต้นทั้งหมดของ Jumbo Bag
 * ==========================================
 * แก้ไขค่า tweak ต่าง ๆ ได้ที่ไฟล์นี้ไฟล์เดียว
 */

const BAG_CONFIG = {
  // ---- ขนาดถุงมาตรฐาน (normalized Three.js units) ----
  dimensions: {
    width: 1.05, // 105 cm (แกน X)
    length: 1.05, // 105 cm (แกน Z)
    height: 1.45, // 145 cm (แกน Y)
    cornerInset: 0.28, // ระยะแนวเย็บ Baffle เข้ามาจากขอบมุม (28 cm)
  },

  // ---- ค่าเริ่มต้นของ slider / ตัวเลือก ----
  defaults: {
    bulge: 120, // แรงดันเบ่งถุง (%) 0-120
    opacity: 100, // ความโปร่งใสของผ้า (%) 15-100
    baffleThickness: 2, // ความหนาแผ่นกั้น (mm)
    pelletCount: 22000, // จำนวนเม็ดพลาสติก
    topType: "open", // "open" | "spout"
    bagColor: 0xfafafa, // สีถุง
    loopColor: 0x388e3c, // สีหูหิ้ว
    pelletColor: 0xf8fafc, // สีเม็ดพลาสติก
    showInnerVoid: true, // แสดงแผ่นสีดำ (inner void) ที่ปากถุง
  },

  // ---- จำนวนเม็ดพลาสติกสูงสุดที่ pre-generate ----
  maxPelletCount: 150000,

  // ---- พาเลท (PlasticPallet N4-1210) วางใต้ถุง ----
  pallet: {
    enabled: true, // เปิด/ปิดการแสดงพาเลท
    width: 1.2, // 1200 mm (แกน X)
    depth: 1.0, // 1000 mm (แกน Z)
    height: 0.15, // 150 mm (แกน Y)
    color: 0x005ce6, // สีน้ำเงิน
  },

  // ---- พารามิเตอร์ดีไซน์ Baffle ----
  baffle: {
    heightRatio: 0.84, // ความสูงแผ่น Baffle เทียบค่าความสูงถุง
    widthScale: 0.92, // ย่อความกว้างลงให้อยู่ใต้เส้นเย็บ (กันโผล่พ้นผนัง)
    pullIn: 0.025, // ดันแผ่นเข้าหาศูนย์กลาง (กันโผล่พ้นผนังเมื่อถุงทึบ)
    holeCount: 5, // จำนวนรูระบาย
    holeRadiusRatio: 0.18, // รัศมีรู เทียบค่าความกว้างแผ่น
  },

  // ---- ฝาปิดปากถุง (ทรงระฆังคว่ำ นูนขึ้น แต่อยู่ในขอบผนัง ไม่ล้นออกนอก) ----
  topCap: {
    // ความสูงยอดฝา (ระฆังคว่ำ) เหนือขอบปากถุง
    domeHeight: 0.16,
    domeHeightPerBulge: 0.05, // ยิ่งเบ่งยิ่งนูนขึ้น (0 = ไม่ผูกกับ bulge)
    // ดึงขอบฝา "เข้าใน" จากผนังเท่านี้ เพื่อไม่ให้ล้นออกนอกผนัง (หน่วย Three.js)
    rimInset: 0.03,
    edgeSegmentsPerSide: 16, // จำนวน segment ต่อด้านของขอบล่าง (ความเนียนของทรง)
    radialRings: 10, // จำนวนวงแหวนแนวรัศมีจากขอบถึงกลางฝา
    // สำหรับ Open Top: สัดส่วนรัศมีรูกลาง เทียบ min(halfW, halfL)
    openHoleRadiusRatio: 0.65,
    // สำหรับ Spout: สัดส่วนรัศมีปากท่อ เทียบ min(width, length)
    spoutRadiusRatio: 0.22,
    spoutHeight: 0.35,
  },

  // ---- โลโก้บนผิวถุง (UV texture) ----
  logo: {
    enabled: true, // เปิด/ปิดการแสดงโลโก้
    // ด้านที่แปะโลโก้ (face ของ BoxGeometry):
    // "front" = +Z, "back" = -Z, "left" = -X, "right" = +X
    // ผนังอื่นจะ map ไปมุมขาวของ texture → เห็นสีถุง (ไม่เห็นโลโก้)
    face: "front",
    // พื้นหลังโลโก้: ต้อง true เพื่อให้หน้าที่ไม่แปะโลโก้ (map ไปมุมขาว) แสดงสีถุงได้
    // (white × bagColor = bagColor). ถ้าตั้ง false ด้านอื่นจะโปร่งหายไป
    opaqueBackground: true,
    // ความละเอียด texture (px)
    canvasSize: 1024,

    // ---- ป้ายขนาด dimension ด้านล่างของถุง (ใต้ MADE IN THAILAND) ----
    showDimension: true, // เปิด/ปิดการแสดงป้ายขนาด
    dimensionUnit: "cm", // หน่วยที่แสดง (แปลงจาก Three.js units ×100 = cm)

    // ---- ตำแหน่ง/ขนาด โลโก้ POLIMAXX (ปรับได้จากที่นี่ ไม่ต้องแก้ในซอกโค้ด) ----
    // ระบบพิกัด canvas 1024×1024, (0,0)=มุมบนซ้าย, x เพิ่มไปทางขวา, y เพิ่มลงล่าง
    logoPos: {
      // ทั้งกลุ่ม (คำ POLIMAXX + วง O + หนอน A) — เลื่อน/ย่อขยายพร้อมกัน
      x: 0, // เลื่อนทั้งกลุ่ม ซ้าย(-)/ขวา(+)
      y: 0, // เลื่อนทั้งกลุ่ม ขึ้น(-)/ลง(+)
      scale: 1, // ย่อ(<1)/ขยาย(>1) ทั้งกลุ่ม (จุดหมุนกึ่งกลางโลโก้)

      // วงกลม 2 ชั้น บนตัว O — ปรับแยกอิสระ (SVG ไข่ดาว: ขอบเทา + ในส้ม)
      oX: 385,
      oY: 200,
      oOuterR: 18, // รัศมีวงนอก (ขาว)
      oInnerR: 9, // รัศมีวงใน (ส้ม)
      oOuterFill: "#FFFFFF", // สีวงนอก
      oOuterStroke: "#CBD5E1", // สีขอบวงนอก (เทา)
      oOuterStrokeWidth: 1.4, // ความหนาขอบวงนอก
      oInnerFill: "#FF7A00", // สีวงใน (ส้ม)

      // ตัวหนอน (SVG Path2D 3 ชั้น: เงาเทา + ขอบขาว + ตัวส้ม) บนตัว A
      aX: 615,
      aY: 185,
      wormPath:
        "M2.2 14.2 C4.8 8.4, 8.8 8.4, 12.3 12.1 C15.2 15.2, 18.6 15.0, 21.8 10.6 C22.1 10.2, 22.5 10.5, 22.2 11.0 C19.2 16.8, 15.0 17.6, 11.3 14.0 C8.4 11.2, 5.2 11.2, 2.6 14.6 C2.3 15.0, 1.9 14.7, 2.2 14.2 Z",
      wormViewBox: 24, // ขนาด viewBox (ใช้ชดเชยกึ่งกลาง)
      wormScale: 1.6, // เทียบ viewBox 24 → ขนาดจริงบน canvas
      // 3 เลเยอร์ (วาดล่าง→บน): [สีเส้น, ความหนา]
      wormLayers: [
        ["#CBD5E1", 5.2], // เงา/outerline เทา
        ["#FFFFFF", 3.8], // ขอบขาว
        ["#FF8C00", 2.2], // ตัวส้ม (เส้นบางลงให้เห็นขอบ)
      ],
    },
  },

  // ---- ไฟ / เงา ----
  lights: {
    ambientIntensity: 0.65,
    mainIntensity: 0.9,
    fillIntensity: 0.4,
  },

  // ---- กล้อง / controls ----
  camera: {
    fov: 45,
    initialPosition: { x: 2.8, y: 2.2, z: 3.2 },
    initialTarget: { x: 0, y: 0.85, z: 0 },
    minDistance: 1.2,
    maxDistance: 7.0,
    fitMargin: 1.18, // margin ตอน fit ให้เห็นถุงทั้งหมด
    smallScreenBreakpoint: 768, // px — ต่ำกว่านี้ถือเป็นจอเล็ก

    // ---- หมุนกล้องอัตโนมัติตอนเปิดครั้งแรก ----
    autoRotate: true, // เปิด auto-rotate ตอนโหลด
    autoRotateSpeed: 10, // ความเร็วหมุน (องศา/วินาที) — ยิ่งมากยิ่งหมุนเร็ว
  },
};
