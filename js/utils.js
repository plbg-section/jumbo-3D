/**
 * ==========================================
 * UTILS — ฟังก์ชันคณิตศาสตร์ล้วน (pure math)
 * ==========================================
 * ทุกฟังก์ชันรับ `bag` (object ที่มี width/length/height/cornerInset/bulgeFactor)
 * เพื่อคำนวณตำแหน่งผนังถุงที่พองตัว (bulge distortion)
 */

const BagMath = {
  /** โปรไฟล์ผนังตรงกลาง (0..1) — นูนกลางผนัง */
  wallMidProfile(t) {
    return 1.5 * Math.cos((t * Math.PI) / 2) - 0.5;
  },

  /** โปรไฟล์มุม (0..1) — นูนที่มุม */
  cornerProfile(tau) {
    return -0.5 + 1.8 * Math.sin((tau * Math.PI) / 2);
  },

  /** แปลงพิกัดตามแนวขอบให้เป็น tau (0..1) สำหรับ corner profile */
  cornerTau(absCoord, halfDim, seamPos, R) {
    const flatEnd = halfDim - R;
    const flatLen = Math.max(1e-4, flatEnd - seamPos);
    const arcLen = Math.max(1e-4, (R * Math.PI) / 4);
    const total = flatLen + arcLen;
    if (absCoord <= flatEnd) return Math.max(0, (absCoord - seamPos) / total);
    const t = Math.min(1, (absCoord - flatEnd) / R);
    return Math.min(1, (flatLen + t * arcLen) / total);
  },

  /**
   * คำนวณตำแหน่งจริงของจุดบนผิวถุงที่พองตัวแล้ว
   * @param {object} bag - context (width/length/height/cornerInset/bulgeFactor)
   */
  getDistortedPosition(bag, x, y, z) {
    const halfW = bag.bagWidth / 2;
    const halfL = bag.bagLength / 2;
    const h = bag.bagHeight;
    const seamX = halfW - bag.cornerInset;
    const seamZ = halfL - bag.cornerInset;

    const yNorm = Math.max(0, Math.min(1, y / h));
    const verticalProfile = Math.pow(
      Math.max(0, Math.sin(yNorm * Math.PI)),
      0.7,
    );
    const maxEmbossDepth = 0.042 * bag.bulgeFactor * verticalProfile;

    const R =
      Math.min(0.22, bag.cornerInset * 0.75) *
      (0.4 + 0.6 * bag.bulgeFactor) *
      (0.55 + 0.45 * verticalProfile);

    const absX = Math.abs(x),
      absZ = Math.abs(z);
    const sx = x < 0 ? -1 : 1,
      sz = z < 0 ? -1 : 1;

    const onXFace = absX > halfW - 1e-3;
    const onZFace = absZ > halfL - 1e-3;

    let outX = x,
      outZ = z,
      dispX = 0,
      dispZ = 0;

    if (absX > halfW - R && absZ > halfL - R) {
      const localX = absX - (halfW - R);
      const localZ = absZ - (halfL - R);
      const phi = Math.atan2(localZ, localX);

      outX = sx * (halfW - R + R * Math.cos(phi));
      outZ = sz * (halfL - R + R * Math.sin(phi));

      const avgCoord = absX > absZ ? absZ : absX;
      const avgHalf = absX > absZ ? halfL : halfW;
      const avgSeam = absX > absZ ? seamZ : seamX;

      const amp =
        BagMath.cornerProfile(
          BagMath.cornerTau(avgCoord, avgHalf, avgSeam, R),
        ) * maxEmbossDepth;
      dispX = sx * Math.cos(phi) * amp;
      dispZ = sz * Math.sin(phi) * amp;
    } else if (onXFace) {
      dispX =
        sx *
        (absZ <= seamZ
          ? BagMath.wallMidProfile(absZ / seamZ)
          : BagMath.cornerProfile(BagMath.cornerTau(absZ, halfL, seamZ, R))) *
        maxEmbossDepth;
    } else if (onZFace) {
      dispZ =
        sz *
        (absX <= seamX
          ? BagMath.wallMidProfile(absX / seamX)
          : BagMath.cornerProfile(BagMath.cornerTau(absX, halfW, seamX, R))) *
        maxEmbossDepth;
    }

    const wrinkleFrequency = y * Math.PI * 45;
    const wrinkleAmplitude =
      0.0016 * Math.sin(wrinkleFrequency) * verticalProfile;

    return {
      x:
        outX +
        dispX +
        (onXFace || absX > halfW - R ? sx * wrinkleAmplitude : 0),
      y: y,
      z:
        outZ +
        dispZ +
        (onZFace || absZ > halfL - R ? sz * wrinkleAmplitude : 0),
    };
  },
};
