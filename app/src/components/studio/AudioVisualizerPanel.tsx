import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import type { UiText } from "@/features/studio/types";

interface AudioVisualizerPanelProps {
  ui: UiText;
}

type VisualizerMode = "2d" | "3d";
type InputSource = {
  id: string;
  deviceId: string;
  label: string;
};
type Visual2DStyle = "bars" | "mirror" | "radial";
type VisualPalette = "neon" | "sunset" | "ocean" | "mono";
type Visual3DShape =
  | "icosahedron"
  | "torus-knot"
  | "octahedron"
  | "dodecahedron"
  | "fractal-bloom"
  | "psychedelic-orbit";
type Visual3DMaterial = "wireframe" | "solid" | "glass";

const PALETTES: Record<
  VisualPalette,
  { background: string; primaryHue: number; accent: string; line: string }
> = {
  neon: {
    background: "rgba(2, 3, 10, 0.25)",
    primaryHue: 192,
    accent: "#7df9ff",
    line: "rgba(236, 254, 255, 0.95)",
  },
  sunset: {
    background: "rgba(20, 6, 8, 0.28)",
    primaryHue: 8,
    accent: "#ffb37a",
    line: "rgba(255, 226, 190, 0.95)",
  },
  ocean: {
    background: "rgba(0, 14, 20, 0.25)",
    primaryHue: 184,
    accent: "#6af5e6",
    line: "rgba(192, 252, 246, 0.95)",
  },
  mono: {
    background: "rgba(16, 16, 16, 0.26)",
    primaryHue: 0,
    accent: "#f3f4f6",
    line: "rgba(249, 250, 251, 0.95)",
  },
};

export function AudioVisualizerPanel({
  ui,
}: AudioVisualizerPanelProps): React.JSX.Element {
  const [mode, setMode] = useState<VisualizerMode>("2d");
  const [style2d, setStyle2d] = useState<Visual2DStyle>("bars");
  const [palette, setPalette] = useState<VisualPalette>("neon");
  const [sensitivity, setSensitivity] = useState(1.25);
  const [smoothing, setSmoothing] = useState(0.82);
  const [fftSize, setFftSize] = useState<512 | 1024 | 2048>(1024);
  const [pointDensity, setPointDensity] = useState(1200);
  const [motionSpeed, setMotionSpeed] = useState(1);
  const [showWaveform, setShowWaveform] = useState(true);
  const [shape3d, setShape3d] = useState<Visual3DShape>("icosahedron");
  const [material3d, setMaterial3d] = useState<Visual3DMaterial>("wireframe");
  const [fractalDepth, setFractalDepth] = useState(4);
  const [hueShiftSpeed, setHueShiftSpeed] = useState(1.2);
  const [psychedelicWarp, setPsychedelicWarp] = useState(0.8);
  const [devices, setDevices] = useState<InputSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const canvas2dRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3dHostRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const refreshAudioInputs = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDevices([]);
      return;
    }

    const availableInputs = (await navigator.mediaDevices.enumerateDevices())
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => ({
        id: `${device.deviceId || "default-device"}-${index}`,
        deviceId: device.deviceId,
        label: device.label || `Audio input ${index + 1}`,
      }));

    setDevices(availableInputs);
    setSelectedSourceId((current) => {
      if (current && availableInputs.some((device) => device.id === current)) {
        return current;
      }
      return availableInputs[0]?.id ?? "";
    });
  }, []);

  const stopCapture = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const startCapture = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCaptureError(ui.visualizerInputUnavailable);
      return;
    }

    try {
      setCaptureError(null);
      stopCapture();

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
      }

      if (analyserRef.current.fftSize !== fftSize) {
        analyserRef.current.fftSize = fftSize;
      }
      analyserRef.current.smoothingTimeConstant = smoothing;

      const selectedSource = devices.find(
        (source) => source.id === selectedSourceId,
      );
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedSource?.deviceId
          ? { deviceId: { exact: selectedSource.deviceId } }
          : true,
        video: false,
      });

      streamRef.current = stream;
      sourceNodeRef.current =
        audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current.connect(analyserRef.current);

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      setIsCapturing(true);
      await refreshAudioInputs();
    } catch {
      setCaptureError(ui.visualizerCaptureError);
      stopCapture();
    }
  }, [
    devices,
    fftSize,
    refreshAudioInputs,
    selectedSourceId,
    smoothing,
    stopCapture,
    ui.visualizerCaptureError,
    ui.visualizerInputUnavailable,
  ]);

  useEffect(() => {
    void refreshAudioInputs();

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener(
        "devicechange",
        refreshAudioInputs,
      );
    }

    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener(
          "devicechange",
          refreshAudioInputs,
        );
      }
    };
  }, [refreshAudioInputs]);

  useEffect(() => {
    const analyser = analyserRef.current;
    const canvas = canvas2dRef.current;
    const host = canvas3dHostRef.current;

    if (!analyser || !isCapturing || (!canvas && !host)) {
      return;
    }

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.frequencyBinCount);

    const paletteConfig = PALETTES[palette];

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let primaryObject: THREE.Object3D | null = null;
    let secondaryObject: THREE.Object3D | null = null;
    let points: THREE.Points | null = null;
    const reactiveMaterials: THREE.MeshStandardMaterial[] = [];
    const disposableObjects: THREE.Object3D[] = [];

    const createMaterial = (
      color: string,
      emissive: string,
    ): THREE.MeshStandardMaterial => {
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive,
        metalness: material3d === "solid" ? 0.35 : 0.15,
        roughness: material3d === "glass" ? 0.08 : 0.28,
        wireframe: material3d === "wireframe",
        transparent: material3d === "glass",
        opacity: material3d === "glass" ? 0.72 : 1,
      });
      reactiveMaterials.push(material);
      return material;
    };

    const createFractalBloom = (
      depth: number,
      colorA: string,
      colorB: string,
    ): THREE.Group => {
      const group = new THREE.Group();
      const seeds: Array<{
        position: THREE.Vector3;
        scale: number;
        level: number;
      }> = [{ position: new THREE.Vector3(0, 0, 0), scale: 0.56, level: 0 }];
      const baseDirections = [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(-1, -1, 1),
        new THREE.Vector3(-1, 1, -1),
        new THREE.Vector3(1, -1, -1),
      ].map((vector) => vector.normalize());

      for (let level = 0; level < depth; level += 1) {
        const snapshot = [...seeds.filter((seed) => seed.level === level)];
        for (const seed of snapshot) {
          const mesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry(seed.scale, 2),
            createMaterial(level % 2 === 0 ? colorA : colorB, "#1b1734"),
          );
          mesh.position.copy(seed.position);
          mesh.userData = { level };
          group.add(mesh);
          disposableObjects.push(mesh);

          if (level === depth - 1) {
            continue;
          }

          const offsetBase = 0.8 * seed.scale;
          for (const direction of baseDirections) {
            seeds.push({
              position: seed.position
                .clone()
                .add(direction.clone().multiplyScalar(offsetBase)),
              scale: seed.scale * 0.58,
              level: level + 1,
            });
          }
        }
      }

      return group;
    };

    if (host) {
      scene = new THREE.Scene();
      scene.background = new THREE.Color("#02030a");

      camera = new THREE.PerspectiveCamera(
        62,
        host.clientWidth / Math.max(1, host.clientHeight),
        0.1,
        100,
      );
      camera.position.set(0, 0.1, 4.4);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.setSize(host.clientWidth, host.clientHeight, false);
      host.replaceChildren(renderer.domElement);

      const keyLight = new THREE.PointLight("#79d4ff", 1.8, 20);
      keyLight.position.set(2.5, 2, 3);
      scene.add(keyLight);

      const fillLight = new THREE.PointLight("#ff6bd6", 1.4, 20);
      fillLight.position.set(-2, -1.5, 2.6);
      scene.add(fillLight);

      if (shape3d === "fractal-bloom") {
        primaryObject = createFractalBloom(
          fractalDepth,
          paletteConfig.accent,
          palette === "mono" ? "#d1d5db" : "#f45bf5",
        );
      } else if (shape3d === "psychedelic-orbit") {
        const psychedelicGroup = new THREE.Group();
        const torusA = new THREE.Mesh(
          new THREE.TorusKnotGeometry(1.06, 0.14, 340, 28),
          createMaterial(paletteConfig.accent, "#23153f"),
        );
        const torusB = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.78, 0.1, 260, 20),
          createMaterial("#ff7be5", "#2f1238"),
        );
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(0.42, 48, 48),
          createMaterial("#fff1f5", "#4a2947"),
        );
        torusA.rotation.x = 0.5;
        torusB.rotation.y = 0.9;
        psychedelicGroup.add(torusA, torusB, core);
        primaryObject = psychedelicGroup;
        disposableObjects.push(torusA, torusB, core);
      } else {
        const geometry: THREE.BufferGeometry =
          shape3d === "torus-knot"
            ? new THREE.TorusKnotGeometry(1.1, 0.26, 280, 30)
            : shape3d === "octahedron"
              ? new THREE.OctahedronGeometry(1.2, 4)
              : shape3d === "dodecahedron"
                ? new THREE.DodecahedronGeometry(1.1, 2)
                : new THREE.IcosahedronGeometry(1.05, 5);

        primaryObject = new THREE.Mesh(
          geometry,
          createMaterial(paletteConfig.accent, "#112640"),
        );
        disposableObjects.push(primaryObject);
      }

      if (shape3d !== "psychedelic-orbit") {
        secondaryObject = new THREE.Mesh(
          new THREE.TorusKnotGeometry(1.45, 0.09, 260, 22),
          createMaterial(palette === "mono" ? "#d1d5db" : "#f45bf5", "#35113f"),
        );
        disposableObjects.push(secondaryObject);
      }

      if (primaryObject) {
        scene.add(primaryObject);
      }
      if (secondaryObject) {
        scene.add(secondaryObject);
      }

      const pointCount = pointDensity;
      const positions = new Float32Array(pointCount * 3);
      for (let i = 0; i < pointCount; i += 1) {
        const r = 2.4 + Math.random() * 0.8;
        const a = Math.random() * Math.PI * 2;
        const b = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(b) * Math.cos(a);
        positions[i * 3 + 1] = r * Math.cos(b);
        positions[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
      }

      const pointsGeometry = new THREE.BufferGeometry();
      pointsGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );

      points = new THREE.Points(
        pointsGeometry,
        new THREE.PointsMaterial({
          size: 0.02,
          color: paletteConfig.accent,
          transparent: true,
          opacity: 0.9,
        }),
      );
      scene.add(points);
    }

    const drawFrame = () => {
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(timeData);

      const bass =
        (frequencyData.slice(0, 28).reduce((sum, value) => sum + value, 0) /
          (28 * 255)) *
        sensitivity;
      const mids =
        (frequencyData.slice(40, 140).reduce((sum, value) => sum + value, 0) /
          (100 * 255)) *
        sensitivity;
      const treble =
        (frequencyData.slice(180, 320).reduce((sum, value) => sum + value, 0) /
          (140 * 255)) *
        sensitivity;

      const clampedBass = Math.min(2.4, Math.max(0, bass));
      const clampedMids = Math.min(2.4, Math.max(0, mids));
      const clampedTreble = Math.min(2.4, Math.max(0, treble));

      if (mode === "2d" && canvas) {
        const context = canvas.getContext("2d");
        if (context) {
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          context.fillStyle = paletteConfig.background;
          context.fillRect(0, 0, width, height);

          const barCount = style2d === "radial" ? 96 : 72;
          const gap = 3;
          const barWidth = Math.max(
            1,
            (width - gap * (barCount - 1)) / barCount,
          );

          if (style2d === "radial") {
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) * 0.16;

            for (let i = 0; i < barCount; i += 1) {
              const bucket = Math.floor((i / barCount) * frequencyData.length);
              const value = (frequencyData[bucket] / 255) * sensitivity;
              const angle = (i / barCount) * Math.PI * 2;
              const lineLength =
                radius + value * Math.min(width, height) * 0.35;
              const hue = paletteConfig.primaryHue + value * 120;

              context.strokeStyle =
                palette === "mono"
                  ? `rgba(245, 245, 245, ${0.3 + value * 0.6})`
                  : `hsla(${hue}, 96%, 62%, ${0.35 + value * 0.6})`;
              context.lineWidth = 2;
              context.beginPath();
              context.moveTo(
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius,
              );
              context.lineTo(
                centerX + Math.cos(angle) * lineLength,
                centerY + Math.sin(angle) * lineLength,
              );
              context.stroke();
            }
          } else {
            for (let i = 0; i < barCount; i += 1) {
              const bucket = Math.floor((i / barCount) * frequencyData.length);
              const value = (frequencyData[bucket] / 255) * sensitivity;
              const barHeight = Math.max(4, value * height * 0.9);
              const x = i * (barWidth + gap);
              const y =
                style2d === "mirror"
                  ? height / 2 - barHeight / 2
                  : height - barHeight;
              const hue = paletteConfig.primaryHue + value * 120;

              context.fillStyle =
                palette === "mono"
                  ? `rgba(245, 245, 245, ${0.3 + value * 0.6})`
                  : `hsla(${hue}, 92%, 62%, ${0.3 + value * 0.62})`;
              context.fillRect(x, y, barWidth, barHeight);

              if (style2d === "mirror") {
                context.fillRect(x, height / 2, barWidth, barHeight / 2);
              }
            }
          }

          if (showWaveform) {
            context.lineWidth = 2;
            context.strokeStyle = paletteConfig.line;
            context.beginPath();
            const stride = Math.max(1, Math.floor(timeData.length / width));
            for (let i = 0; i < width; i += 1) {
              const index = Math.min(timeData.length - 1, i * stride);
              const normalized = (timeData[index] - 128) / 128;
              const y =
                style2d === "mirror"
                  ? height / 2 + normalized * (height * 0.22)
                  : height * 0.55 + normalized * (height * 0.25);
              if (i === 0) {
                context.moveTo(i, y);
              } else {
                context.lineTo(i, y);
              }
            }
            context.stroke();
          }
        }
      }

      if (
        mode === "3d" &&
        renderer &&
        scene &&
        camera &&
        primaryObject &&
        points
      ) {
        const speed = motionSpeed;
        const now = performance.now() * 0.001;
        const pulse = 1 + clampedBass * 0.75;

        primaryObject.scale.setScalar(pulse);
        primaryObject.rotation.x += (0.006 + clampedMids * 0.02) * speed;
        primaryObject.rotation.y += (0.009 + clampedTreble * 0.03) * speed;

        if (shape3d === "fractal-bloom") {
          primaryObject.children.forEach((child, index) => {
            const level = Number(child.userData?.level ?? 0);
            const levelPulse =
              1 + Math.sin(now * (1.6 + level * 0.3) + index * 0.1) * 0.08;
            child.scale.setScalar(levelPulse);
            child.rotation.x += (0.002 + level * 0.0007) * speed;
            child.rotation.y -= (0.003 + level * 0.0009) * speed;
          });
        }

        if (shape3d === "psychedelic-orbit") {
          primaryObject.rotation.z += (0.004 + psychedelicWarp * 0.01) * speed;
          const orbitalWarp =
            1 + Math.sin(now * (2 + psychedelicWarp * 3.4)) * 0.18;
          primaryObject.scale.setScalar(pulse * orbitalWarp);
        }

        if (secondaryObject) {
          secondaryObject.rotation.x -= (0.004 + clampedTreble * 0.02) * speed;
          secondaryObject.rotation.z += (0.007 + clampedBass * 0.02) * speed;
          secondaryObject.scale.setScalar(1 + clampedMids * 0.3);
        }

        reactiveMaterials.forEach((material, index) => {
          const hueSeed = (paletteConfig.primaryHue % 360) / 360;
          const hue =
            (hueSeed +
              now * 0.06 * hueShiftSpeed +
              index * 0.08 +
              clampedTreble * 0.07) %
            1;
          if (palette === "mono") {
            material.color.setHSL(0, 0, 0.72 + clampedBass * 0.08);
            material.emissive.setHSL(0, 0, 0.14 + clampedMids * 0.08);
          } else {
            material.color.setHSL(hue, 0.88, 0.56 + clampedBass * 0.04);
            material.emissive.setHSL(hue, 0.75, 0.18 + clampedMids * 0.11);
          }
        });

        points.rotation.y += (0.002 + clampedTreble * 0.009) * speed;
        points.rotation.x -= (0.001 + clampedBass * 0.006) * speed;
        const pointsMaterial = points.material as THREE.PointsMaterial;
        pointsMaterial.size = 0.02 + clampedMids * 0.045;
        pointsMaterial.opacity = 0.55 + clampedBass * 0.4;

        camera.position.z = 4.4 - clampedBass * 0.8;
        renderer.render(scene, camera);
      }

      animationRef.current = requestAnimationFrame(drawFrame);
    };

    animationRef.current = requestAnimationFrame(drawFrame);

    const handleResize = () => {
      if (mode === "2d" && canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      if (renderer && camera && host) {
        const width = host.clientWidth;
        const height = Math.max(1, host.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleResize);

      if (renderer) {
        renderer.dispose();
      }
      for (const object of disposableObjects) {
        const maybeMesh = object as THREE.Mesh;
        if (maybeMesh.geometry) {
          maybeMesh.geometry.dispose();
        }
        const material = maybeMesh.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else if (material) {
          material.dispose();
        }
      }
      if (points) {
        points.geometry.dispose();
        (points.material as THREE.Material).dispose();
      }
    };
  }, [
    fftSize,
    fractalDepth,
    hueShiftSpeed,
    isCapturing,
    material3d,
    mode,
    motionSpeed,
    palette,
    psychedelicWarp,
    pointDensity,
    shape3d,
    sensitivity,
    showWaveform,
    style2d,
  ]);

  useEffect(() => {
    return () => {
      stopCapture();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [stopCapture]);

  const hasMediaDevicesSupport =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-md dark:border-slate-700/70 dark:bg-slate-900/85">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium">{ui.audioVisualizer}</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "2d" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("2d")}
          >
            {ui.visualizer2d}
          </Button>
          <Button
            variant={mode === "3d" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("3d")}
          >
            {ui.visualizer3d}
          </Button>
        </div>
      </div>

      {!hasMediaDevicesSupport ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          {ui.visualizerInputUnavailable}
        </p>
      ) : (
        <>
          <label
            htmlFor="visualizer-source-select"
            className="text-sm font-medium"
          >
            {ui.visualizerTrack}
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              id="visualizer-source-select"
              value={selectedSourceId}
              onChange={(event) => setSelectedSourceId(event.target.value)}
              className="min-w-55 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshAudioInputs()}
            >
              {ui.visualizerRefreshSources}
            </Button>
            {isCapturing ? (
              <Button size="sm" variant="secondary" onClick={stopCapture}>
                {ui.visualizerStop}
              </Button>
            ) : (
              <Button size="sm" onClick={() => void startCapture()}>
                {ui.visualizerStart}
              </Button>
            )}
          </div>

          <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-700/70 dark:bg-slate-900/60">
            <p className="col-span-full text-sm font-medium">
              {ui.visualizerOptions}
            </p>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>{ui.visualizer2dStyle}</span>
              <select
                value={style2d}
                onChange={(event) =>
                  setStyle2d(event.target.value as Visual2DStyle)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="bars">Bars</option>
                <option value="mirror">Mirror</option>
                <option value="radial">Radial</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>{ui.visualizerPalette}</span>
              <select
                value={palette}
                onChange={(event) =>
                  setPalette(event.target.value as VisualPalette)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="neon">Neon</option>
                <option value="sunset">Sunset</option>
                <option value="ocean">Ocean</option>
                <option value="mono">Monochrome</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>{ui.visualizer3dShape}</span>
              <select
                value={shape3d}
                onChange={(event) =>
                  setShape3d(event.target.value as Visual3DShape)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="icosahedron">Icosahedron</option>
                <option value="torus-knot">Torus Knot</option>
                <option value="octahedron">Octahedron</option>
                <option value="dodecahedron">Dodecahedron</option>
                <option value="fractal-bloom">Fractal Bloom</option>
                <option value="psychedelic-orbit">Psychedelic Orbit</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>{ui.visualizer3dMaterial}</span>
              <select
                value={material3d}
                onChange={(event) =>
                  setMaterial3d(event.target.value as Visual3DMaterial)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="wireframe">Wireframe</option>
                <option value="solid">Solid</option>
                <option value="glass">Glass</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>{ui.visualizerFftSize}</span>
              <select
                value={fftSize}
                onChange={(event) =>
                  setFftSize(Number(event.target.value) as 512 | 1024 | 2048)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value={512}>512</option>
                <option value={1024}>1024</option>
                <option value={2048}>2048</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>
                {ui.visualizerSensitivity}: {sensitivity.toFixed(2)}
              </span>
              <input
                type="range"
                min={0.6}
                max={2.6}
                step={0.05}
                value={sensitivity}
                onChange={(event) => setSensitivity(Number(event.target.value))}
                className="w-full"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>
                {ui.visualizerSmoothing}: {smoothing.toFixed(2)}
              </span>
              <input
                type="range"
                min={0.45}
                max={0.95}
                step={0.01}
                value={smoothing}
                onChange={(event) => setSmoothing(Number(event.target.value))}
                className="w-full"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>
                {ui.visualizerPointDensity}: {pointDensity}
              </span>
              <input
                type="range"
                min={600}
                max={2200}
                step={100}
                value={pointDensity}
                onChange={(event) =>
                  setPointDensity(Number(event.target.value))
                }
                className="w-full"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>
                {ui.visualizerMotionSpeed}: {motionSpeed.toFixed(2)}
              </span>
              <input
                type="range"
                min={0.4}
                max={2.5}
                step={0.05}
                value={motionSpeed}
                onChange={(event) => setMotionSpeed(Number(event.target.value))}
                className="w-full"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>
                {ui.visualizerFractalDepth}: {fractalDepth}
              </span>
              <input
                type="range"
                min={2}
                max={5}
                step={1}
                value={fractalDepth}
                onChange={(event) =>
                  setFractalDepth(Number(event.target.value))
                }
                className="w-full"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>
                {ui.visualizerHueShiftSpeed}: {hueShiftSpeed.toFixed(2)}
              </span>
              <input
                type="range"
                min={0}
                max={3}
                step={0.05}
                value={hueShiftSpeed}
                onChange={(event) =>
                  setHueShiftSpeed(Number(event.target.value))
                }
                className="w-full"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <span>
                {ui.visualizerPsychedelicWarp}: {psychedelicWarp.toFixed(2)}
              </span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={psychedelicWarp}
                onChange={(event) =>
                  setPsychedelicWarp(Number(event.target.value))
                }
                className="w-full"
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showWaveform}
                onChange={(event) => setShowWaveform(event.target.checked)}
                className="h-4 w-4"
              />
              <span>{ui.visualizerShowWaveform}</span>
            </label>
          </section>

          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {isCapturing
              ? ui.visualizerStateListening
              : ui.visualizerStateStopped}
          </p>
        </>
      )}

      {captureError ? (
        <p className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          {captureError}
        </p>
      ) : null}

      {!isCapturing ? (
        <p className="rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {ui.visualizerNoAudio}
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {ui.visualizerHint}
          </p>

          <div className="h-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-950/95 dark:border-slate-700">
            <canvas
              ref={canvas2dRef}
              className={mode === "2d" ? "h-full w-full" : "hidden"}
            />
            <div
              ref={canvas3dHostRef}
              className={mode === "3d" ? "h-full w-full" : "hidden"}
            />
          </div>
        </>
      )}
    </section>
  );
}
