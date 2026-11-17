# Baffle Jumbo Bag 3D Configurator

โปรแกรมแสดงแบบจำลอง **ถุงจัมโบ้ (FIBC / Jumbo Bag) แบบ 3D แบบ Interactive** ด้วย Three.js
สำหรับงานบรรจุเม็ดพลาสติก (750 kg ขึ้นไป) พร้อม **พาเลทพลาสติก N4-1210** วางใต้ถุง

ผู้ใช้สามารถหมุน/ซูมดูโมเดล ปรับพารามิเตอร์ (แรงดันเบ่งถุง, ความโปร่งใส, ความหนาแผ่นกั้น,
จำนวนเม็ด) เปลี่ยนสีถุง/หูหิ้ว/เม็ด และสลับรูปแบบปากถุงได้แบบเรียลไทม์

---

## คุณสมบัติเด่น

- **โมเดลถุง 3D** — ตัวถุงพองตัว (bulge distortion) ตามแรงดัน, แผ่น Baffle กั้นมุม 4 ด้าน, เส้นเย็บ, ปากถุง 2 แบบ (Open Top / Filling Spout) และหูหิ้ว 4 มุม
- **เม็ดพลาสติก (InstancedMesh)** — กองเป็นเนินนูนกลาง (heap) เต็มเกือบทั้งถุง รองรับสูงสุด 150,000 เม็ด
- **พาเลทพลาสติก N4-1210** — วางใต้ถุง 1200×1000×150 mm (OOP + Symmetry Mirroring)
- **โลโก้บน UV texture** — โลโก้ POLIMAXX + แถว hazard pictogram + ป้ายขนาด dimension
- **Auto-rotate** — หมุนกล้องรอบโมเดลตอนเปิด หยุดได้เมื่อแตะ/ลาก หรือกดปุ่ม
- **Responsive** — จอเล็ก fit ให้เห็นทั้งถุง + ซ่อนเมนูอัตโนมัติ

---

## การรันโปรเจกต์

โปรเจกต์เป็น static site ล้วน (ไม่ต้อง build) ใช้ **CDN** ทั้ง Tailwind / Three.js / Font Awesome

### วิธีที่ 1: เปิดไฟล์ตรง ๆ
เปิด `index.html` ในเบราว์เซอร์ได้เลย

### วิธีที่ 2: รัน local server (แนะนำ)
เพื่อเลี่ยงข้อจำกัด CORS ของ `file://` บางเบราว์เซอร์:

```bash
# Python
python -m http.server 8080

# หรือ Node.js
npx serve .
```

แล้วเปิด `http://localhost:8080/index.html`

> **หมายเหตุ:** ต้องต่ออินเทอร์เน็ตเพื่อโหลด CDN (Three.js r128, Tailwind, Font Awesome)

---

## โครงสร้างไฟล์

```
Jumbo-Bag-3D/
├── index.html            # หน้าหลัก (UI + โหลดสคริปต์แบบ modular)
├── css/
│   └── style.css         # สไตล์พื้นฐาน / overlay / scrollbar
├── js/
│   ├── config.js         # ⭐ ค่าตั้งต้นทั้งหมด (แก้ tweak ที่นี่ไฟล์เดียว)
│   ├── utils.js          # BagMath — คณิตศาสตร์การพองตัวของผนังถุง
│   ├── Pallet.js         # PlasticPallet — พาเลท N4-1210
│   ├── JumboBag.js       # JumboBag — สร้างถุง + โลโก้ + เม็ด
│   ├── SceneManager.js   # scene / camera / lights / controls / auto-rotate
│   └── main.js           # UI controller & app init (ผูก event ทั้งหมด)
├── pallet.html           # ต้นแบบพาเลทเดี่ยว (Three.js r160, ES module)
└── README.md
```

ลำดับการโหลดสคริปต์ (สำคัญ — พึ่งพากัน):
`config.js → utils.js → Pallet.js → JumboBag.js → SceneManager.js → main.js`

> ไฟล์ `demo1-4.html`, `jumbo3D.html`, `index_legacy.html`, `pallet.html`
> เป็นไฟล์ standalone แบบ inline (ไม่ได้ใช้ `js/`) สำหรับทดลอง/ดูต้นแบบ

---

## สถาปัตยกรรมคลาส

### `BagMath` (`utils.js`)
ฟังก์ชันคณิตศาสตร์ล้วน (pure functions) สำหรับคำนวณตำแหน่งผิวถุงที่พองตัว
- `getDistortedPosition(bag, x, y, z)` → คืน `{x, y, z}` จริงบนผิวผนังที่บวมแล้ว

### `PlasticPallet` (`Pallet.js`)
พาเลทพลาสติกแบบ `THREE.Group` (OOP + Symmetry Mirroring + static geometry cache)
```js
const pallet = new PlasticPallet({ width: 1.2, depth: 1.0, height: 0.15, color: 0x005ce6 });
pallet.setWireframe(true); // แสดงโครงสร้าง
```

### `JumboBag` (`JumboBag.js`)
สร้างถุงทั้งหมดแบบ `THREE.Group` — method หลัก:

| Method | คำอธิบาย |
|--------|----------|
| `setBulge(val)` | ปรับแรงดันเบ่งถุง (rebuild) |
| `setOpacity(val)` | ปรับความโปร่งใสผ้า (%) |
| `setBaffleThickness(mm)` | ความหนาแผ่นกั้น (rebuild) |
| `setPelletCount(n)` | จำนวนเม็ดที่แสดง |
| `setBagColor / setLoopColor / setPelletColor(hex)` | เปลี่ยนสี |
| `setTopType("open" \| "spout")` | สลับรูปแบบปากถุง (rebuild) |
| `setShowInnerVoid(bool)` | แสดง/ซ่อนแผ่นดำปากถุง (ไม่ rebuild) |

### `SceneManager` (`SceneManager.js`)
จัดการ Three.js ทั้งหมด — method หลัก:

| Method | คำอธิบาย |
|--------|----------|
| `fitCameraToBag()` | จัดเฟรมให้เห็นทั้งชุด (`fitTarget` = กลุ่มถุง+พาเลท) |
| `resetCamera()` | คืนมุมกล้องเริ่มต้น |
| `startAutoRotate()` / `stopAutoRotate()` / `toggleAutoRotate()` | ควบคุมการหมุนอัตโนมัติ |
| `onAutoRotateChange` | callback อัปเดตปุ่มเมื่อสถานะหมุนเปลี่ยน |

---

## การปรับแต่ง (`js/config.js`)

ค่าที่ tweak บ่อยทั้งหมดอยู่ใน `BAG_CONFIG` ไฟล์เดียว

```js
// ----- ขนาดถุง (Three.js units: 1 = 100 cm) -----
dimensions: { width: 1.05, length: 1.05, height: 1.45, cornerInset: 0.28 }

// ----- ค่าเริ่มต้นของ UI -----
defaults: { bulge, opacity, baffleThickness, pelletCount, topType,
            bagColor, loopColor, pelletColor, showInnerVoid }

// ----- พาเลท (วางใต้ถุง) -----
pallet: { enabled, width, depth, height, color }

// ----- โลโก้ / ตำแหน่งบน UV -----
logo: {
  canvasSize, face, opaqueBackground,
  showDimension, dimensionUnit,   // ป้ายขนาดด้านล่างถุง
  logoPos: { x, y, scale,         // เลื่อน/ย่อ-ขยายทั้งกลุ่ม
             oX, oY, oOuterR, oInnerR, oFill...,   // วงกลม O (ไข่ดาว)
             aX, aY, wormPath, wormScale, wormLayers } // ตัวหนอน A (SVG multi-layer)
}

// ----- กล้อง / auto-rotate -----
camera: { fov, initialPosition, initialTarget,
          autoRotate, autoRotateSpeed,   // องศา/วินาที
          fitMargin, smallScreenBreakpoint }
```

### ตัวอย่าง: ให้กล้องหมุนเร็วขึ้น
```js
camera: { autoRotateSpeed: 3 }   // เดิม 1.2
```

### ตัวอย่าง: ปรับความสูงของกองเม็ด
ใน `JumboBag.js` ฟังก์ชัน `createPelletFill()`:
```js
const heapEdge = bagHeight * 0.88;  // ระดับเต็มที่ริมผนัง (สูงเกือบเต็มถุง)
const heapPeak = bagHeight * 0.96;  // ยอดเนินตรงกลาง
```

---

## UI Controls (แผงด้านขวา / toggle บนมือถือ)

- **แรงดันเบ่งถุง** (Bulge Pressure) 0–120%
- **ความโปร่งใสของผ้า** (Opacity) 15–100%
- **ความหนาแผ่นกั้น** (Baffle Thickness) 1–8 mm
- **จำนวนเม็ดพลาสติก** (Pellet Count) 5,000–150,000
- **สีเม็ด / สีถุง / สีหูหิ้ว**
- **ปากถุง**: Open Top / Filling Spout
- **แผ่นสีดำปากถุง** (Inner Void) เปิด/ปิด
- ปุ่ม **หยุดหมุน / หมุนกล้อง**, **Reset View**, ย่อ/ขยายแผง

### การควบคุมกล้อง
- **ลากคลิกซ้าย / 1 นิ้ว**: หมุน
- **สกรอลล์ / หยิก**: ซูม
- **คลิกขวา / 2 นิ้ว**: เลื่อน (pan)
- แตะ/ลากบน canvas → **หยุด auto-rotate อัตโนมัติ**

---

## เทคโนโลยี

- [Three.js r128](https://threejs.org/) (โหลดแบบ global `THREE`, CDN)
- [Tailwind CSS](https://tailwindcss.com/) (CDN)
- [Font Awesome 6](https://fontawesome.com/) (CDN)
- HTML Canvas 2D (สร้าง UV texture โลโก้)

---

## หมายเหตุ

- เม็ดพลาสติกใช้ `InstancedMesh` — pre-generate seed สูงสุด `maxPelletCount` (150,000) แล้วปรับจำนวนที่แสดงด้วย `.count`
- การเปลี่ยน Bulge / Baffle / TopType จะ trigger `rebuild()` (สร้าง geometry ใหม่ทั้งชุด) — ค่อนข้างหนัก ส่วน Opacity / สี / Inner Void เปลี่ยนเฉพาะ material (เบา)

