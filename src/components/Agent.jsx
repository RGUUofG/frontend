"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef, useMemo, useState, useCallback, useEffect } from "react";

/* ============================================================
   🎛️  CONFIG
   ============================================================ */
const CONFIG = {
  particleCount: 8000,
  particleSize: 0.011,
  particleOpacity: 0.92,
  sphereRadius: 1,

  // 低频整体起伏 —— 压到极小，不要球体整体鼓
  lowAmp: 0.04,
  lowSpeed: 1.2,

  // 中频纬度涟漪 —— 幅度小但圈数密，保持刺形
  midAmp: 0.08,
  midSpeed: 4.0,
  midRipples: 22,

  // 高频毛刺 —— 幅度极小，高频抖动，像噪波
  highAmp: 0.06,
  highSpeed: 11.0,

  // 经度尖刺 —— 刺形保留，但高度压小
  spikeAmp: 0.07,
  spikeCount: 18,
  spikeSpeed: 5.0,
  spikePow: 3,

  // 呼吸
  breatheAmp: 0.01,
  breatheSpeed: 0.7,

  rotateBase: 0.001,
  rotateTypingBoost: 0.008,

  // 能量平滑：attack 快、decay 慢 —— 每次按键快速响应，停后缓慢归零
  attackRate: 0.55,   // 按键瞬间爬升速度（越大越快响应）
  decayRate: 0.82,   // 停止后衰减速度（越小收得越快）

  ringCount: 4,
  ringBaseSize: 320,
  ringSpacing: 80,
};


/* =======================
   粒子球
======================= */
function TextSphere({ energy }) {
  const ref = useRef();
  const { particleCount: count } = CONFIG;
  const smoothEnergy = useRef(0);
  const prevEnergy = useRef(0);

  const { alignedBase, angles, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ang = new Float32Array(count * 2);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = Math.cos(phi);
      ang[i * 2] = theta;
      ang[i * 2 + 1] = phi;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { alignedBase: pos, angles: ang, phases: ph };
  }, [count]);

  const colorArray = useMemo(() => {
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { c[i * 3] = 1; c[i * 3 + 1] = 1; c[i * 3 + 2] = 1; }
    return c;
  }, [count]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (!ref.current) return;

    // attack/decay 分离：energy.current > 0 时快速爬升，否则慢速衰减
    const target = energy.current;
    if (target > smoothEnergy.current) {
      smoothEnergy.current += (target - smoothEnergy.current) * CONFIG.attackRate;
    } else {
      smoothEnergy.current *= CONFIG.decayRate;
    }
    const e = Math.min(1, smoothEnergy.current);
    prevEnergy.current = e;

    const positions = ref.current.geometry.attributes.position.array;
    const R = CONFIG.sphereRadius;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const bx = alignedBase[i3];
      const by = alignedBase[i3 + 1];
      const bz = alignedBase[i3 + 2];
      const phase = phases[i];
      const theta = angles[i * 2];
      const phi = angles[i * 2 + 1];
      const nElev = phi / Math.PI;

      // 各层波动全部乘以 e，静默时几乎不动
      const lowWave = e * CONFIG.lowAmp * Math.sin(time * CONFIG.lowSpeed + phase * 0.5);
      const latWave = e * CONFIG.midAmp * Math.sin(nElev * Math.PI * CONFIG.midRipples - time * CONFIG.midSpeed + phase * 0.15);
      const highWave = e * CONFIG.highAmp * Math.sin(phase * 14 + time * CONFIG.highSpeed);
      const rawSpike = Math.sin(theta * CONFIG.spikeCount * 0.5 + time * CONFIG.spikeSpeed + phase * 0.4);
      const spikeWave = e * CONFIG.spikeAmp * Math.pow(Math.max(0, rawSpike), CONFIG.spikePow);
      const breathe = CONFIG.breatheAmp * Math.sin(time * CONFIG.breatheSpeed + phase);

      const disp = 1 + lowWave + latWave + highWave + spikeWave + breathe;
      const r = R * Math.max(0.9, disp); // max 抬高到 0.9，球不会内缩太多

      positions[i3] = bx * r;
      positions[i3 + 1] = by * r;
      positions[i3 + 2] = bz * r;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y += CONFIG.rotateBase + e * CONFIG.rotateTypingBoost;
    ref.current.rotation.x = Math.sin(time * 0.3) * 0.03;
  });

  useFrame(() => {
    if (!ref.current) return;
    const e = smoothEnergy.current;
    const colors = ref.current.geometry.attributes.color?.array;
    if (!colors) return;
    const r = Math.min(1, 0.55 + e * 0.45);
    const g = Math.min(1, 0.75 + e * 0.25);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = 1.0;
    }
    ref.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={alignedBase.slice()}>
      <bufferAttribute attach="geometry-attributes-color" args={[colorArray, 3]} />
      <PointMaterial
        transparent vertexColors
        size={CONFIG.particleSize}
        sizeAttenuation depthWrite={false}
        opacity={CONFIG.particleOpacity}
      />
    </Points>
  );
}


/* =======================
   外圈涟漪环
======================= */
function RippleRings({ active }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {Array.from({ length: CONFIG.ringCount }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${CONFIG.ringBaseSize + i * CONFIG.ringSpacing}px`,
          height: `${CONFIG.ringBaseSize + i * CONFIG.ringSpacing}px`,
          borderRadius: "50%",
          border: `1px solid rgba(180,220,255,${Math.max(0.02, 0.15 - i * 0.03)})`,
          animation: active
            ? `ripplePulse ${2 + i * 0.6}s ease-in-out infinite`
            : `gentlePulse ${4 + i}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }} />
      ))}
    </div>
  );
}


/* =======================
   首页
======================= */
export default function Agent() {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const energyRef = useRef(0);
  const typingTimer = useRef(null);
  const pulseTimer = useRef(null);

  const handleInput = useCallback((e) => {
    setText(e.target.value);
    energyRef.current = 1.0;
    setIsTyping(true);

    clearTimeout(pulseTimer.current);
    // 脉冲持续 80ms 就归零，让 decay 接管 —— 短促干脆
    pulseTimer.current = setTimeout(() => { energyRef.current = 0; }, 80);

    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { setIsTyping(false); }, 1000);
  }, []);

  useEffect(() => () => {
    clearTimeout(typingTimer.current);
    clearTimeout(pulseTimer.current);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden"  >
      <style>{`
        @keyframes ripplePulse { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.08);opacity:.3} }
        @keyframes gentlePulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.03);opacity:.2} }
        .mirror-input::placeholder { color: rgba(180,210,255,0.35); }
        .mirror-input:focus { outline: none; }
      `}</style>

      <div className="absolute inset-0 " />
      <RippleRings active={isTyping} />

      <Canvas camera={{ position: [0, 0, 4] }} style={{ position: "absolute", inset: 0 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 3]} intensity={1} color="#88ccff" />
        <TextSphere energy={energyRef} />
      </Canvas>


      <div style={{position:"absolute",bottom:'20px',left:"50%",transform:"translateX(-50%)", pointerEvents: "auto", width: "min(560px, 88vw)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{
          minHeight: "22px", color: "rgba(160,210,255,0.7)", fontSize: "13px",
          letterSpacing: "0.12em", textAlign: "right", fontFamily: "monospace",
          transition: "opacity 0.4s", opacity: text ? 1 : 0,
        }}>
          {text.length} chars
        </div>

        <textarea
          className="mirror-input"
          value={text}
          onChange={handleInput}
          placeholder="input there, feeling bolling ..."
          rows={3}
          style={{
            width: "100%",
            background: isTyping ? "rgba(100,180,255,0.07)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isTyping ? "rgba(140,200,255,0.45)" : "rgba(180,210,255,0.18)"}`,
            borderRadius: "14px", padding: "16px 20px",
            color: "rgba(230,245,255,0.9)", fontSize: "15px",
            lineHeight: "1.7", letterSpacing: "0.04em",
            resize: "none", backdropFilter: "blur(12px)",
            fontFamily: "'Gill Sans', 'Optima', sans-serif",
            boxShadow: isTyping
              ? "0 0 28px rgba(100,180,255,0.22), inset 0 0 14px rgba(100,180,255,0.07)"
              : "none",
            transition: "all 0.35s ease",
          }}
        />

      </div>
    </div>
  );
}