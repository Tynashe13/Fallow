"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  TerrainData, buildTopGeometry, buildWallGeometry, buildSoilTexture,
  horizonColors, worldScale, elevToY, sampleElev, lonLatToWorld, BLOCK_DEPTH_Y,
} from "@/lib/terrainGeo";
import { sunPosition } from "@/lib/sun";

export interface WeatherLite {
  kind: string;
  isDay: boolean;
  windMs: number;
  cloudCoverPct: number;
}

interface Props {
  terrain: TerrainData;
  horizons:
    | { depth: string; clayPct: number | null; sandPct: number | null; ph: number | null }[]
    | null;
  weather: WeatherLite | null;
  fields: { ring: [number, number][] }[];
  soilLight: string;
  soilDark: string;
  lat: number;
  lon: number;
  onAzimuth?: (deg: number) => void;
}

const INK = "#3d2733";
const SUN = "#f0a830";

/* ───────────────────────── terrain top shader ───────────────────── */

const topVertex = /* glsl */ `
  attribute float elev;
  varying float vElev;
  varying vec3 vNormal;
  void main() {
    vElev = elev;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const topFragment = /* glsl */ `
  uniform vec3 uSunDir;
  uniform float uLight;    // 0 stormy … 1 clear
  uniform float uMinElev;
  uniform float uMaxElev;
  varying float vElev;
  varying vec3 vNormal;

  vec3 ramp(float h) {
    vec3 lo  = vec3(0.369, 0.447, 0.243); // valley green
    vec3 mid = vec3(0.545, 0.608, 0.369);
    vec3 hi  = vec3(0.780, 0.753, 0.596); // pale crest
    return h < 0.55 ? mix(lo, mid, h / 0.55) : mix(mid, hi, (h - 0.55) / 0.45);
  }

  void main() {
    float h = clamp((vElev - uMinElev) / max(uMaxElev - uMinElev, 1.0), 0.0, 1.0);
    vec3 col = ramp(h);

    // 20 m contour lines
    float c = fract(vElev / 20.0);
    float fw = fwidth(vElev / 20.0) * 1.2 + 1e-4;
    float line = 1.0 - smoothstep(fw, fw * 2.0, min(c, 1.0 - c));
    col = mix(col, vec3(0.24, 0.15, 0.20), line * 0.13);

    // sun + ambient
    float diff = max(dot(normalize(vNormal), normalize(uSunDir)), 0.0);
    float lit = 0.66 + 0.34 * diff;
    col *= lit * (0.72 + 0.28 * uLight);

    // desaturate a touch in bad weather
    float grey = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(grey), col, 0.65 + 0.35 * uLight);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ───────────────────────── block ─────────────────────────────────── */

function TerrainBlock({ terrain, horizons, soilLight, soilDark, sunDir, light }: {
  terrain: TerrainData;
  horizons: Props["horizons"];
  soilLight: string;
  soilDark: string;
  sunDir: THREE.Vector3;
  light: number;
}) {
  const topGeo = useMemo(() => buildTopGeometry(terrain), [terrain]);
  const walls = useMemo(
    () => ([0, 1, 2, 3] as const).map((s) => buildWallGeometry(terrain, s)),
    [terrain]
  );
  const soilTex = useMemo(
    () => buildSoilTexture(horizonColors(soilLight, soilDark, horizons)),
    [horizons, soilLight, soilDark]
  );
  const uniforms = useMemo(
    () => ({
      uSunDir: { value: sunDir.clone() },
      uLight: { value: light },
      uMinElev: { value: terrain.minElev },
      uMaxElev: { value: terrain.maxElev },
    }),
    [terrain] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useFrame(() => {
    uniforms.uSunDir.value.copy(sunDir);
    uniforms.uLight.value += (light - uniforms.uLight.value) * 0.05;
  });

  const { w, d } = worldScale(terrain);

  return (
    <group>
      <mesh geometry={topGeo}>
        <shaderMaterial
          vertexShader={topVertex}
          fragmentShader={topFragment}
          uniforms={uniforms}
        />
      </mesh>
      {walls.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshLambertMaterial map={soilTex} />
        </mesh>
      ))}
      {/* bottom cap */}
      <mesh
        position={[0, -BLOCK_DEPTH_Y, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[w, d]} />
        <meshLambertMaterial color={soilDark} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── field outlines ────────────────────────── */

function FieldOutlines({ terrain, fields }: { terrain: TerrainData; fields: Props["fields"] }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const g = terrain.grid;
    for (const f of fields) {
      for (let i = 0; i < f.ring.length - 1; i++) {
        for (const p of [f.ring[i], f.ring[i + 1]]) {
          const { x, z, u, v } = lonLatToWorld(terrain, p[0], p[1]);
          if (u < 0 || u > 1 || v < 0 || v > 1) { pts.pop(); break; }
          const y = elevToY(terrain, sampleElev(terrain, u * (g - 1), v * (g - 1)));
          pts.push(x, y + 0.035, z);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geometry;
  }, [terrain, fields]);

  if (!fields.length) return null;
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={INK} transparent opacity={0.5} />
    </lineSegments>
  );
}

/* ───────────────────────── sun, arc, moon ────────────────────────── */

function SunAndArc({ lat, lon, light }: { lat: number; lon: number; light: number }) {
  const R = 8.2;

  const { arcPts, sunPos, sunUp, altNow } = useMemo(() => {
    const now = new Date();
    const pts: THREE.Vector3[] = [];
    // today's sun path, hourly samples
    for (let m = 0; m <= 24 * 60; m += 20) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, m));
      const { altitudeDeg, azimuthDeg } = sunPosition(d, lat, lon);
      if (altitudeDeg < -2) continue;
      const alt = (altitudeDeg * Math.PI) / 180;
      const az = (azimuthDeg * Math.PI) / 180;
      pts.push(new THREE.Vector3(
        R * Math.cos(alt) * Math.sin(az),
        R * Math.sin(alt),
        -R * Math.cos(alt) * Math.cos(az)
      ));
    }
    const cur = sunPosition(now, lat, lon);
    const alt = (Math.max(cur.altitudeDeg, -8) * Math.PI) / 180;
    const az = (cur.azimuthDeg * Math.PI) / 180;
    const p = new THREE.Vector3(
      R * Math.cos(alt) * Math.sin(az),
      R * Math.sin(alt),
      -R * Math.cos(alt) * Math.cos(az)
    );
    return { arcPts: pts, sunPos: p, sunUp: cur.altitudeDeg > 0, altNow: cur.altitudeDeg };
  }, [lat, lon]);

  const glow = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const ctx = cv.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
    g.addColorStop(0, "rgba(240,168,48,0.9)");
    g.addColorStop(0.4, "rgba(240,168,48,0.25)");
    g.addColorStop(1, "rgba(240,168,48,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }, []);

  return (
    <group>
      {arcPts.length > 1 && (
        <Line
          points={arcPts}
          color={SUN}
          lineWidth={1.1}
          dashed
          dashSize={0.22}
          gapSize={0.16}
          transparent
          opacity={0.85}
        />
      )}
      {sunUp ? (
        <group position={sunPos}>
          <sprite scale={[3.2, 3.2, 1]}>
            <spriteMaterial map={glow} transparent depthWrite={false} opacity={0.4 + 0.6 * light} />
          </sprite>
          <Billboard>
            <mesh>
              <circleGeometry args={[0.55, 40]} />
              <meshBasicMaterial color={SUN} />
            </mesh>
            <Text
              position={[0, -1.15, 0]}
              fontSize={0.42}
              color={INK}
              anchorX="center"
              anchorY="top"
            >
              {`${altNow.toFixed(1)}°`}
            </Text>
          </Billboard>
        </group>
      ) : (
        <Billboard position={[4.6, 6.2, -2.5]}>
          <mesh>
            <circleGeometry args={[0.42, 40]} />
            <meshBasicMaterial color="#ddd6c6" />
          </mesh>
          <mesh position={[0.14, 0.1, 0.01]}>
            <circleGeometry args={[0.34, 40]} />
            <meshBasicMaterial color="#faf6ec" />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

/* ───────────────────────── precipitation ─────────────────────────── */

function Precipitation({ kind, windMs }: { kind: string; windMs: number }) {
  const count = kind === "storm" ? 1100 : kind === "rain" ? 650 : kind === "snow" ? 400 : 260;
  const speed = kind === "storm" ? 16 : kind === "rain" ? 11 : kind === "drizzle" ? 7 : 1.6;
  const isSnow = kind === "snow";
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 16;
      a[i * 3 + 1] = Math.random() * 11;
      a[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    return a;
  }, [count]);

  useFrame((_, dt) => {
    const p = ref.current;
    if (!p) return;
    const arr = (p.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const drift = Math.min(windMs, 12) * 0.08;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speed * dt * (0.8 + ((i * 37) % 10) / 22);
      arr[i * 3] += drift * dt * (isSnow ? Math.sin(arr[i * 3 + 1] * 2 + i) : 1);
      if (arr[i * 3 + 1] < -0.5) {
        arr[i * 3 + 1] = 10.5;
        arr[i * 3] = (Math.random() - 0.5) * 16;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 16;
      }
    }
    (p.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  if (!["drizzle", "rain", "storm", "snow"].includes(kind)) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={isSnow ? "#ffffff" : "#7f93a8"}
        size={isSnow ? 0.09 : 0.05}
        transparent
        opacity={isSnow ? 0.95 : 0.65}
        sizeAttenuation
      />
    </points>
  );
}

function Lightning({ active }: { active: boolean }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    if (active && Math.random() < 0.012) l.intensity = 60 + Math.random() * 90;
    l.intensity *= 0.82;
  });
  if (!active) return null;
  return <pointLight ref={light} position={[2, 9, -2]} color="#e8ecff" intensity={0} distance={40} />;
}

/** Soft round puff texture generated in-browser — no external assets. */
function usePuffTexture() {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const ctx = cv.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.55, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function WeatherClouds({ kind, cover, windMs }: { kind: string; cover: number; windMs: number }) {
  const group = useRef<THREE.Group>(null);
  const puff = usePuffTexture();
  const n =
    kind === "storm" ? 5 : kind === "rain" || kind === "cloudy" ? 4 :
    kind === "drizzle" || kind === "snow" ? 3 : kind === "partly" ? 2 :
    kind === "fog" ? 0 : cover > 55 ? 2 : cover > 25 ? 1 : 0;
  const dark = kind === "storm";
  const color = dark ? "#847b91" : kind === "rain" ? "#b8b2b9" : "#efe7d2";
  const opacity = dark ? 0.85 : 0.55;

  // each cloud = a cluster of puff sprites
  const clouds = useMemo(() => {
    const rnd = (s: number) => {
      // deterministic pseudo-random per seed
      const x = Math.sin(s * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: n }, (_, i) => {
      const cx = -6 + rnd(i + 1) * 12;
      const cy = 4.6 + rnd(i + 5) * 1.9;
      const cz = -4 + rnd(i + 9) * 7;
      const scale = 0.85 + rnd(i + 13) * 0.6;
      const puffs = Array.from({ length: 7 }, (_, j) => ({
        x: (rnd(i * 17 + j) - 0.5) * 3.4 * scale,
        y: (rnd(i * 23 + j) - 0.5) * 0.9 * scale,
        z: (rnd(i * 31 + j) - 0.5) * 1.4 * scale,
        s: (1.1 + rnd(i * 41 + j) * 1.5) * scale,
      }));
      return { cx, cy, cz, puffs };
    });
  }, [n]);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.children.forEach((c, i) => {
      c.position.x += dt * (0.12 + Math.min(windMs, 14) * 0.03) * (1 + (i % 3) * 0.25);
      if (c.position.x > 10) c.position.x = -10;
    });
  });

  if (!n) return null;
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.cx, c.cy, c.cz]}>
          {c.puffs.map((p, j) => (
            <sprite key={j} position={[p.x, p.y, p.z]} scale={[p.s * 2.2, p.s * 1.4, 1]}>
              <spriteMaterial
                map={puff}
                color={color}
                transparent
                opacity={opacity}
                depthWrite={false}
              />
            </sprite>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ───────────────────────── scene root ────────────────────────────── */

function SceneInner(props: Props) {
  const { terrain, weather, lat, lon } = props;
  const kind = weather?.kind ?? "clear";
  const isDay = weather?.isDay ?? true;
  const light =
    kind === "storm" ? 0.18 : kind === "rain" ? 0.34 : kind === "drizzle" ? 0.45 :
    kind === "cloudy" ? 0.5 : kind === "fog" ? 0.45 : kind === "snow" ? 0.55 :
    kind === "partly" ? 0.82 : 1;
  const dayLight = isDay ? light : Math.min(light, 0.55);

  const sunDir = useMemo(() => {
    const s = sunPosition(new Date(), lat, lon);
    const alt = (Math.max(s.altitudeDeg, 10) * Math.PI) / 180;
    const az = (s.azimuthDeg * Math.PI) / 180;
    return new THREE.Vector3(
      Math.cos(alt) * Math.sin(az),
      Math.sin(alt),
      -Math.cos(alt) * Math.cos(az)
    ).normalize();
  }, [lat, lon]);

  const controls = useRef<OrbitControlsImpl>(null);
  const lastAz = useRef(0);
  const { scene } = useThree();

  useEffect(() => {
    if (kind === "fog") {
      scene.fog = new THREE.Fog(new THREE.Color("#e9e2d2"), 8, 26);
    } else {
      scene.fog = null;
    }
    return () => { scene.fog = null; };
  }, [kind, scene]);

  return (
    <>
      <ambientLight intensity={1.15 + 0.3 * (1 - dayLight)} color="#fff6e6" />
      <hemisphereLight args={["#fff6e6", "#caab98", 0.55]} />
      <directionalLight
        position={sunDir.clone().multiplyScalar(18).toArray()}
        intensity={1.5 * dayLight + 0.3}
        color="#ffedc8"
      />
      <TerrainBlock
        terrain={terrain}
        horizons={props.horizons}
        soilLight={props.soilLight}
        soilDark={props.soilDark}
        sunDir={sunDir}
        light={dayLight}
      />
      <FieldOutlines terrain={terrain} fields={props.fields} />
      <SunAndArc lat={lat} lon={lon} light={isDay ? light : 0} />
      <WeatherClouds kind={kind} cover={weather?.cloudCoverPct ?? 0} windMs={weather?.windMs ?? 2} />
      <Precipitation kind={kind} windMs={weather?.windMs ?? 2} />
      <Lightning active={kind === "storm"} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={10}
        maxDistance={36}
        maxPolarAngle={Math.PI * 0.52}
        target={[0, -0.6, 0]}
        autoRotate
        autoRotateSpeed={0.5}
        onStart={() => {
          if (controls.current) controls.current.autoRotate = false;
        }}
        onChange={() => {
          const now = performance.now();
          if (now - lastAz.current < 80) return;
          lastAz.current = now;
          const cb = props.onAzimuth;
          const ctrl = controls.current;
          if (ctrl && cb) {
            const deg = (ctrl.getAzimuthalAngle() * 180) / Math.PI;
            // defer: onChange can fire during render on mount
            setTimeout(() => cb(deg), 0);
          }
        }}
      />
    </>
  );
}

export default function FieldScene(props: Props) {
  const [lost, setLost] = useState(false);
  return (
    <Canvas
      camera={{ position: [15.5, 8.5, 16.5], fov: 28 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", () => setLost(true));
      }}
    >
      {!lost && <SceneInner {...props} />}
    </Canvas>
  );
}
