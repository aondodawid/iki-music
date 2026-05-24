import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import type { UiText } from "@/features/studio/types";
import type { GenerationResult } from "@/lib/types";

interface AudioVisualizerPanelProps {
  ui: UiText;
  timeline: GenerationResult[];
}

type VisualizerMode = "2d" | "3d";

export function AudioVisualizerPanel({
  ui,
  timeline,
}: AudioVisualizerPanelProps): React.JSX.Element {
  const audioEntries = useMemo(
    () => timeline.filter((entry) => Boolean(entry.audio?.url)),
    [timeline],
  );
  const [mode, setMode] = useState<VisualizerMode>("2d");
  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    audioEntries[0]?.id ?? "",
  );

  const selectedEntry =
    audioEntries.find((entry) => entry.id === selectedEntryId) ??
    audioEntries[0] ??
    null;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvas2dRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3dHostRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!selectedEntry) {
      return;
    }

    setSelectedEntryId((current) =>
      current.length > 0 && audioEntries.some((entry) => entry.id === current)
        ? current
        : selectedEntry.id,
    );
  }, [audioEntries, selectedEntry]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    const ensureAudioGraph = async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 1024;
        analyserRef.current.smoothingTimeConstant = 0.82;
      }

      if (!sourceNodeRef.current) {
        sourceNodeRef.current =
          audioContextRef.current.createMediaElementSource(audioElement);
        sourceNodeRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }
    };

    const handlePlay = async () => {
      await ensureAudioGraph();
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
    };

    audioElement.addEventListener("play", handlePlay);

    return () => {
      audioElement.removeEventListener("play", handlePlay);
    };
  }, [selectedEntry?.id]);

  useEffect(() => {
    const analyser = analyserRef.current;
    const canvas = canvas2dRef.current;
    const host = canvas3dHostRef.current;

    if (!analyser || (!canvas && !host)) {
      return;
    }

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.frequencyBinCount);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let orb: THREE.Mesh | null = null;
    let ring: THREE.Mesh | null = null;
    let points: THREE.Points | null = null;

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

      orb = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.05, 5),
        new THREE.MeshStandardMaterial({
          color: "#4fd1ff",
          emissive: "#112640",
          metalness: 0.25,
          roughness: 0.2,
          wireframe: true,
        }),
      );
      scene.add(orb);

      ring = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1.45, 0.09, 260, 22),
        new THREE.MeshStandardMaterial({
          color: "#f45bf5",
          emissive: "#35113f",
          metalness: 0.2,
          roughness: 0.35,
        }),
      );
      scene.add(ring);

      const pointCount = 1000;
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
          color: "#a8ecff",
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
        frequencyData.slice(0, 28).reduce((sum, value) => sum + value, 0) /
        (28 * 255);
      const mids =
        frequencyData.slice(40, 140).reduce((sum, value) => sum + value, 0) /
        (100 * 255);
      const treble =
        frequencyData.slice(180, 320).reduce((sum, value) => sum + value, 0) /
        (140 * 255);

      if (mode === "2d" && canvas) {
        const context = canvas.getContext("2d");
        if (context) {
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          context.fillStyle = "rgba(2, 3, 10, 0.22)";
          context.fillRect(0, 0, width, height);

          const barCount = 72;
          const gap = 3;
          const barWidth = (width - gap * (barCount - 1)) / barCount;
          for (let i = 0; i < barCount; i += 1) {
            const bucket = Math.floor((i / barCount) * frequencyData.length);
            const value = frequencyData[bucket] / 255;
            const barHeight = Math.max(4, value * height * 0.9);
            const x = i * (barWidth + gap);
            const y = height - barHeight;

            const hue = 190 + value * 120;
            context.fillStyle = `hsla(${hue}, 92%, 62%, 0.92)`;
            context.fillRect(x, y, barWidth, barHeight);
          }

          context.lineWidth = 2;
          context.strokeStyle = "rgba(236, 254, 255, 0.9)";
          context.beginPath();
          const stride = Math.max(1, Math.floor(timeData.length / width));
          for (let i = 0; i < width; i += 1) {
            const index = Math.min(timeData.length - 1, i * stride);
            const normalized = (timeData[index] - 128) / 128;
            const y = height * 0.55 + normalized * (height * 0.25);
            if (i === 0) {
              context.moveTo(i, y);
            } else {
              context.lineTo(i, y);
            }
          }
          context.stroke();
        }
      }

      if (
        mode === "3d" &&
        renderer &&
        scene &&
        camera &&
        orb &&
        ring &&
        points
      ) {
        const pulse = 1 + bass * 0.75;
        orb.scale.setScalar(pulse);
        orb.rotation.x += 0.006 + mids * 0.02;
        orb.rotation.y += 0.009 + treble * 0.03;

        ring.rotation.x -= 0.004 + treble * 0.02;
        ring.rotation.z += 0.007 + bass * 0.02;
        ring.scale.setScalar(1 + mids * 0.3);

        points.rotation.y += 0.002 + treble * 0.009;
        points.rotation.x -= 0.001 + bass * 0.006;
        const pointsMaterial = points.material as THREE.PointsMaterial;
        pointsMaterial.size = 0.02 + mids * 0.045;
        pointsMaterial.opacity = 0.55 + bass * 0.4;

        camera.position.z = 4.4 - bass * 0.8;
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
      if (orb) {
        orb.geometry.dispose();
        (orb.material as THREE.Material).dispose();
      }
      if (ring) {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      }
      if (points) {
        points.geometry.dispose();
        (points.material as THREE.Material).dispose();
      }
    };
  }, [mode, selectedEntry?.id]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

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

      {audioEntries.length === 0 ? (
        <p className="rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
          {ui.visualizerNoAudio}
        </p>
      ) : (
        <>
          <label htmlFor="visualizer-track" className="text-sm font-medium">
            {ui.visualizerTrack}
          </label>
          <select
            id="visualizer-track"
            value={selectedEntry?.id ?? ""}
            onChange={(event) => setSelectedEntryId(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {audioEntries.map((entry, index) => (
              <option key={entry.id} value={entry.id}>
                {index + 1}. {entry.content.slice(0, 72)}
              </option>
            ))}
          </select>

          <audio
            ref={audioRef}
            controls
            className="w-full"
            src={selectedEntry?.audio?.url}
          >
            {ui.browserNoAudio}
          </audio>

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
