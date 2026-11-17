/**
 * ==========================================
 * MAIN — UI Controller & App Initialization
 * ==========================================
 */
window.addEventListener("DOMContentLoaded", () => {
  const app = new SceneManager("canvas-container");

  const def = BAG_CONFIG.defaults;

  let bulgeVal = def.bulge;
  let opacityVal = def.opacity;
  let baffleThickVal = def.baffleThickness;
  let pelletCountVal = def.pelletCount;
  let currentTopType = def.topType;

  let currentBagColor = def.bagColor;
  let currentLoopColor = def.loopColor;
  let currentPelletColor = def.pelletColor;
  let showInnerVoid =
    def.showInnerVoid !== undefined ? def.showInnerVoid : true;

  // ---- สร้างโมเดล ----
  const bag = new JumboBag({
    bulge: bulgeVal,
    baffleThickness: baffleThickVal,
    pelletCount: pelletCountVal,
    opacity: opacityVal,
    topType: currentTopType,
    bagColor: currentBagColor,
    loopColor: currentLoopColor,
    pelletColor: currentPelletColor,
    showInnerVoid: showInnerVoid,
  });

  bag.position.y = 0.015;
  app.scene.add(bag);
  app.bag = bag; // ให้ SceneManager ใช้จัดเฟรม

  // ---- กลุ่ม Jumbo Component (ถุง + พาเลท) ----
  // จัดกลุ่มเพื่อให้ย้าย/ยกทั้งชุดได้ง่าย (เช่น ยกขึ้นวางบนพาเลท)
  const jumboGroup = new THREE.Group();
  app.scene.add(jumboGroup);
  app.jumboGroup = jumboGroup;

  // ถอด bag ออกจาก scene แล้วย้ายเข้า group
  app.scene.remove(bag);

  // ---- พาเลท (วางใต้ถุง) ----
  const palletCfg = BAG_CONFIG.pallet;
  let palletTopY = 0; // ระดับผิวบนพาเลท (ใช้ยกถุงขึ้นไปวาง)
  if (palletCfg && palletCfg.enabled) {
    const pallet = new PlasticPallet({
      width: palletCfg.width,
      depth: palletCfg.depth,
      height: palletCfg.height,
      color: palletCfg.color,
    });
    // วางฐานพาเลทให้ล่างสุดอยู่ที่ y=0
    pallet.position.set(0, 0, 0);
    jumboGroup.add(pallet);
    app.pallet = pallet;
    palletTopY = palletCfg.height; // ยกถุงขึ้นไปวางบนผิวพาเลท
  }

  // ยกถุงขึ้นไปวางบนพาเลท (bag เดิมมี position.y = 0.015)
  bag.position.y = 0.015 + palletTopY;
  jumboGroup.add(bag);

  // ให้ SceneManager จัดเฟรมทั้งกลุ่ม (ถุง + พาเลท) ไม่ใช่แค่ถุง
  app.fitTarget = jumboGroup;

  // หน้าจอเล็ก: zoom + โฟกัสให้เห็นถุงทั้งหมดตั้งแต่เริ่มต้น
  // และซ่อนเมนูทั้งหมดหลังโหลดเสร็จ (มือถือ/จอเล็ก)
  const isSmallScreen = () =>
    window.innerWidth < BAG_CONFIG.camera.smallScreenBreakpoint;
  requestAnimationFrame(() => {
    if (isSmallScreen()) {
      app.fitCameraToBag();
    }
  });

  // ---- DOM refs ----
  const inputBulge = document.getElementById("input-bulge");
  const inputOpacity = document.getElementById("input-opacity");
  const inputBaffleThick = document.getElementById("input-baffle-thick");
  const inputPelletCount = document.getElementById("input-pellet-count");
  const valBulge = document.getElementById("val-bulge");
  const valOpacity = document.getElementById("val-opacity");
  const valBaffleThick = document.getElementById("val-baffle-thick");
  const valPelletCount = document.getElementById("val-pellet-count");

  // ---- Sliders ----
  inputBulge.addEventListener("input", (e) => {
    bulgeVal = parseInt(e.target.value);
    valBulge.innerText = `${bulgeVal}%`;
    bag.setBulge(bulgeVal);
  });

  inputOpacity.addEventListener("input", (e) => {
    opacityVal = parseInt(e.target.value);
    valOpacity.innerText = `${opacityVal}%`;
    bag.setOpacity(opacityVal);
  });

  inputBaffleThick.addEventListener("input", (e) => {
    baffleThickVal = parseFloat(e.target.value);
    valBaffleThick.innerText = `${baffleThickVal} mm`;
    bag.setBaffleThickness(baffleThickVal);
  });

  inputPelletCount.addEventListener("input", (e) => {
    pelletCountVal = parseInt(e.target.value);
    valPelletCount.innerText = pelletCountVal.toLocaleString();
    bag.setPelletCount(pelletCountVal);
  });

  // ---- Color helpers ----
  function clearActiveRing(selectorId) {
    const btns = document.querySelectorAll(`#${selectorId} button`);
    btns.forEach((b) =>
      b.classList.remove(
        "ring-2",
        "ring-emerald-400",
        "ring-offset-2",
        "ring-offset-slate-900",
      ),
    );
  }

  function setActiveColorButton(selectorId, colorHexStr) {
    clearActiveRing(selectorId);
    const btn = document.querySelector(
      `#${selectorId} button[data-color="${colorHexStr}"]`,
    );
    if (btn) {
      btn.classList.add(
        "ring-2",
        "ring-emerald-400",
        "ring-offset-2",
        "ring-offset-slate-900",
      );
    }
  }

  // ---- Pellet color ----
  const pelletColorBtns = document.querySelectorAll(
    "#pellet-color-selector button",
  );
  pelletColorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const colorStr = btn.getAttribute("data-color");
      currentPelletColor = Number(colorStr);
      bag.setPelletColor(currentPelletColor);
      setActiveColorButton("pellet-color-selector", colorStr);
    });
  });

  // ---- Bag color ----
  const bagColorBtns = document.querySelectorAll("#bag-color-selector button");
  bagColorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedColorStr = btn.getAttribute("data-color");
      let selectedBagColor = Number(selectedColorStr);

      // กันสีถุงชนกับสีหูหิ้ว
      if (selectedBagColor === currentLoopColor) {
        const alternativeLoopBtn = document.querySelector(
          `#loop-color-selector button:not([data-color="${selectedColorStr}"])`,
        );
        if (alternativeLoopBtn) {
          const altStr = alternativeLoopBtn.getAttribute("data-color");
          currentLoopColor = Number(altStr);
          bag.setLoopColor(currentLoopColor);
          setActiveColorButton("loop-color-selector", altStr);
        }
      }

      currentBagColor = selectedBagColor;
      bag.setBagColor(currentBagColor);
      setActiveColorButton("bag-color-selector", selectedColorStr);
    });
  });

  // ---- Loop color ----
  const loopColorBtns = document.querySelectorAll(
    "#loop-color-selector button",
  );
  loopColorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selectedColorStr = btn.getAttribute("data-color");
      let selectedLoopColor = Number(selectedColorStr);

      // กันสีหูหิ้วชนกับสีถุง
      if (selectedLoopColor === currentBagColor) {
        const alternativeBagBtn = document.querySelector(
          `#bag-color-selector button:not([data-color="${selectedColorStr}"])`,
        );
        if (alternativeBagBtn) {
          const altStr = alternativeBagBtn.getAttribute("data-color");
          currentBagColor = Number(altStr);
          bag.setBagColor(currentBagColor);
          setActiveColorButton("bag-color-selector", altStr);
        }
      }

      currentLoopColor = selectedLoopColor;
      bag.setLoopColor(currentLoopColor);
      setActiveColorButton("loop-color-selector", selectedColorStr);
    });
  });

  // ---- Top type buttons ----
  const topBtns = document.querySelectorAll(".top-btn");
  topBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      topBtns.forEach((b) => {
        b.classList.remove(
          "border-emerald-500",
          "bg-emerald-500/20",
          "text-emerald-300",
        );
        b.classList.add("border-slate-700", "bg-slate-800", "text-slate-300");
      });
      btn.classList.remove(
        "border-slate-700",
        "bg-slate-800",
        "text-slate-300",
      );
      btn.classList.add(
        "border-emerald-500",
        "bg-emerald-500/20",
        "text-emerald-300",
      );

      currentTopType = btn.getAttribute("data-type");
      bag.setTopType(currentTopType);
    });
  });

  // ---- Inner void toggle (แสดง/ซ่อนแผ่นสีดำที่ปากถุง) ----
  const inputInnerVoid = document.getElementById("input-inner-void");
  if (inputInnerVoid) {
    inputInnerVoid.checked = showInnerVoid;
    inputInnerVoid.addEventListener("change", (e) => {
      showInnerVoid = e.target.checked;
      bag.setShowInnerVoid(showInnerVoid);
    });
  }

  // ---- Reset view ----
  document.getElementById("btn-reset").addEventListener("click", () => {
    app.resetCamera();
  });

  // ---- Auto-rotate toggle (ปุ่มหยุด/หมุน) ----
  const btnAutoRotate = document.getElementById("btn-autorotate");
  const autoRotateIcon = document.getElementById("autorotate-icon");
  const autoRotateLabel = btnAutoRotate
    ? btnAutoRotate.querySelector("span")
    : null;

  const updateAutoRotateUI = (isRotating) => {
    if (!btnAutoRotate) return;
    if (isRotating) {
      if (autoRotateIcon) autoRotateIcon.className = "fa-solid fa-pause";
      if (autoRotateLabel) autoRotateLabel.textContent = "หยุดหมุน";
      btnAutoRotate.classList.add("text-emerald-400");
      btnAutoRotate.classList.remove("text-slate-400");
    } else {
      if (autoRotateIcon) autoRotateIcon.className = "fa-solid fa-play";
      if (autoRotateLabel) autoRotateLabel.textContent = "หมุนกล้อง";
      btnAutoRotate.classList.add("text-slate-400");
      btnAutoRotate.classList.remove("text-emerald-400");
    }
  };

  // ผูก callback: ให้ปุ่มอัปเดตเมื่อ auto-rotate หยุดเอง (เช่น user แตะ canvas)
  app.onAutoRotateChange = updateAutoRotateUI;
  updateAutoRotateUI(app.autoRotate);

  if (btnAutoRotate) {
    btnAutoRotate.addEventListener("click", () => {
      app.toggleAutoRotate();
    });
  }

  // ---- Desktop panel collapse ----
  const toggleBtn = document.getElementById("btn-toggle-panel");
  const mobileToggleBtn = document.getElementById("btn-mobile-toggle");
  const configPanel = document.getElementById("config-panel");
  const panelContent = document.getElementById("panel-content");
  const toggleIcon = document.getElementById("toggle-icon");
  let isCollapsed = false;

  const handleToggle = () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      panelContent.classList.add("hidden");
      toggleIcon.classList.remove("fa-chevron-up");
      toggleIcon.classList.add("fa-chevron-down");
    } else {
      panelContent.classList.remove("hidden");
      toggleIcon.classList.remove("fa-chevron-down");
      toggleIcon.classList.add("fa-chevron-up");
    }
  };
  toggleBtn.addEventListener("click", handleToggle);

  // ---- Mobile panel toggle ----
  let isMobileHidden = true;
  mobileToggleBtn.addEventListener("click", () => {
    isMobileHidden = !isMobileHidden;
    if (isMobileHidden) {
      configPanel.classList.add("hidden");
      mobileToggleBtn.classList.remove("text-emerald-400", "bg-slate-800/90");
      mobileToggleBtn.classList.add("text-slate-400", "bg-slate-900/90");
    } else {
      configPanel.classList.remove("hidden");
      mobileToggleBtn.classList.remove("text-slate-400", "bg-slate-900/90");
      mobileToggleBtn.classList.add("text-emerald-400", "bg-slate-800/90");
    }
  });

  // ---- จอเล็ก: ซ่อนเมนูทั้งหมดเมื่อ load เสร็จ ----
  // (config-panel ถูกซ่อนด้วย class hidden md:block อยู่แล้ว,
  //  ทำเพิ่ม: ซ่อนปุ่ม mobile toggle ให้จอโล่ง เหลือแค่ canvas + auto-rotate)
  if (isSmallScreen()) {
    configPanel.classList.add("hidden");
    isMobileHidden = true;
    mobileToggleBtn.classList.add("hidden");
  }
});
