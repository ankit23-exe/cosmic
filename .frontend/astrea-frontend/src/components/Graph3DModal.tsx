import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type GraphNode = {
  id: string;
  label?: string;
  type?: string;
  score?: number;
};

type GraphEdge = {
  source: string;
  target: string;
  label?: string;
  evidence?: string[];
};

interface Graph3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: { nodes: GraphNode[]; edges: GraphEdge[] } | null;
}

const typeColor = (type?: string) => {
  switch ((type || '').toLowerCase()) {
    case 'mission':
      return 0x60a5fa; // blue-400
    case 'experiment':
      return 0x34d399; // emerald-400
    case 'topic':
      return 0xf472b6; // pink-400
    default:
      return 0xa78bfa; // purple-400
  }
};

const Graph3DModal: React.FC<Graph3DModalProps> = ({ isOpen, onClose, graph }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(10, 10, 10);
    scene.add(dir);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Build graph
    const nodeMap = new Map<string, THREE.Vector3>();
    const group = new THREE.Group();
    scene.add(group);

    const nodes = graph?.nodes || [];
    const edges = graph?.edges || [];

    // Position nodes on a sphere for a quick, clear layout
    const R = 12;
  nodes.forEach((n, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / Math.max(nodes.length, 1));
      const theta = Math.PI * (1 + Math.sqrt(5)) * i; // golden angle
      const x = R * Math.cos(theta) * Math.sin(phi);
      const y = R * Math.sin(theta) * Math.sin(phi);
      const z = R * Math.cos(phi);
      const pos = new THREE.Vector3(x, y, z);
      nodeMap.set(n.id, pos);

      const geom = new THREE.SphereGeometry(0.5 + (n.score ? Math.min(0.8, n.score * 0.8) : 0), 24, 24);
      const mat = new THREE.MeshStandardMaterial({ color: typeColor(n.type), emissive: 0x111111, roughness: 0.4, metalness: 0.1 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      group.add(mesh);

      // Optional: label as small sprite-like plane (simple, no font loaders)
      const labelCanvas = document.createElement('canvas');
      const ctx = labelCanvas.getContext('2d');
      if (ctx) {
        const raw = n.label || n.id;
        const text = raw.length > 28 ? raw.slice(0, 28) + '…' : raw;
        const fontSize = 24;
        ctx.font = `${fontSize}px sans-serif`;
        const textWidth = Math.min(ctx.measureText(text).width + 20, 300);
        labelCanvas.width = Math.ceil(textWidth);
        labelCanvas.height = Math.ceil(fontSize * 2);
        const ctx2 = labelCanvas.getContext('2d')!;
        ctx2.font = `${fontSize}px sans-serif`;
        ctx2.fillStyle = 'rgba(0,0,0,0.7)';
        ctx2.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
        // Text outline for readability
        ctx2.lineWidth = 4;
        ctx2.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx2.strokeText(text, 10, fontSize + 4);
        ctx2.fillStyle = '#ffffff';
        ctx2.fillText(text, 10, fontSize + 4);
        const texture = new THREE.CanvasTexture(labelCanvas);
        texture.minFilter = THREE.LinearFilter;
        const labelMat = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
        const sprite = new THREE.Sprite(labelMat);
        const sx = Math.max(3, Math.min(8, labelCanvas.width / 60));
        const sy = Math.max(1, Math.min(3, labelCanvas.height / 60));
        sprite.scale.set(sx, sy, 1);
        sprite.position.copy(pos.clone().add(new THREE.Vector3(0, 1.2, 0)));
        sprite.renderOrder = 999;
        group.add(sprite);
      }
    });

    // Edges as lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.7 });
    const edgeGroup = new THREE.Group();
    edges.forEach(e => {
      const a = nodeMap.get(e.source);
      const b = nodeMap.get(e.target);
      if (!a || !b) return;
      const geom = new THREE.BufferGeometry().setFromPoints([a, b]);
      const line = new THREE.Line(geom, lineMat);
      edgeGroup.add(line);
    });
    scene.add(edgeGroup);

    // Animate
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();
      if (rendererRef.current?.domElement && rendererRef.current.domElement.parentElement) {
        rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
      }
      scene.clear();
      sceneRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
    };
  }, [isOpen, graph]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-[90vw] max-w-6xl h-[75vh] bg-black/70 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Title bar for clear heading */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <div className="flex items-center gap-3">
            <h3 className="text-white/95 font-semibold tracking-wide">3D Graph</h3>
            <span className="text-white/60 text-xs">{graph?.nodes?.length ?? 0} nodes • {graph?.edges?.length ?? 0} edges</span>
          </div>
        </div>
        {/* Close button stays clickable */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm hover:from-purple-600 hover:to-blue-600"
          >
            Close
          </button>
        </div>
        <div ref={mountRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default Graph3DModal;
