import React, { useEffect, useRef, useState } from 'react';
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
  title?: string;
  onNodeClick?: (node: GraphNode) => void;
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

const Graph3DModal: React.FC<Graph3DModalProps> = ({ isOpen, onClose, graph, title, onNodeClick }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const labelSpritesRef = useRef<THREE.Sprite[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const clickableMeshesRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

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
  labelSpritesRef.current = [];
  clickableMeshesRef.current = [];

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
  // attach node data for interactions
  (mesh as any).userData = { node: n };
      group.add(mesh);
  clickableMeshesRef.current.push(mesh);

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
        labelSpritesRef.current.push(sprite);
      }
    });

    // Edges as cylinders with arrowheads and relation labels
    const edgeGroup = new THREE.Group();
    edges.forEach(e => {
      const a = nodeMap.get(e.source);
      const b = nodeMap.get(e.target);
      if (!a || !b) return;

      const dir = new THREE.Vector3().subVectors(b, a);
      const dist = dir.length();
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

      // Cylinder for edge body
      const cylGeo = new THREE.CylinderGeometry(0.06, 0.06, Math.max(0.1, dist), 8, 1, false);
      const cylMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.8, roughness: 0.5, metalness: 0.1 });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      cyl.position.copy(mid);
      cyl.quaternion.copy(q);
      edgeGroup.add(cyl);

      // Arrowhead toward target
      const coneGeo = new THREE.ConeGeometry(0.14, 0.36, 8);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.9, roughness: 0.45, metalness: 0.1 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.copy(b.clone().add(dir.clone().normalize().multiplyScalar(-0.25)));
      cone.quaternion.copy(q);
      edgeGroup.add(cone);

      // Relation label at midpoint slightly offset from the edge
      const textRaw = e.label || (e.evidence && e.evidence.length ? e.evidence[0] : '');
      if (textRaw) {
        const text = textRaw.length > 28 ? textRaw.slice(0, 28) + '…' : textRaw;
        const labelCanvas = document.createElement('canvas');
        const ctx = labelCanvas.getContext('2d');
        if (ctx) {
          const fontSize = 22;
          ctx.font = `${fontSize}px sans-serif`;
          const textWidth = Math.min(ctx.measureText(text).width + 20, 280);
          labelCanvas.width = Math.ceil(textWidth);
          labelCanvas.height = Math.ceil(fontSize * 2);
          const ctx2 = labelCanvas.getContext('2d')!;
          ctx2.font = `${fontSize}px sans-serif`;
          ctx2.fillStyle = 'rgba(0,0,0,0.75)';
          ctx2.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
          ctx2.lineWidth = 4;
          ctx2.strokeStyle = 'rgba(0,0,0,0.85)';
          ctx2.strokeText(text, 10, fontSize + 3);
          ctx2.fillStyle = '#ffffff';
          ctx2.fillText(text, 10, fontSize + 3);
          const texture = new THREE.CanvasTexture(labelCanvas);
          texture.minFilter = THREE.LinearFilter;
          const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
          const sprite = new THREE.Sprite(mat);
          const sx = Math.max(2.6, Math.min(6.5, labelCanvas.width / 70));
          const sy = Math.max(1.0, Math.min(2.4, labelCanvas.height / 70));
          sprite.scale.set(sx, sy, 1);

          // Offset label perpendicular to edge to avoid overlap with the cylinder
          const up = new THREE.Vector3(0, 0, 1);
          let n = dir.clone().normalize().cross(up);
          if (n.length() < 0.001) {
            n = dir.clone().normalize().cross(new THREE.Vector3(0, 1, 0));
          }
          n.normalize().multiplyScalar(0.6);
          const labelPos = mid.clone().add(n);
          sprite.position.copy(labelPos);
          sprite.renderOrder = 1000;
          edgeGroup.add(sprite);
          labelSpritesRef.current.push(sprite);
        }
      }
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

    // Hover + click interactions
    const handlePointerMove = (ev: MouseEvent) => {
      if (!rendererRef.current) return;
      const canvas = rendererRef.current.domElement;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(clickableMeshesRef.current, false);
      canvas.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };
    const handleClick = (ev: MouseEvent) => {
      if (!rendererRef.current || !onNodeClick) return;
      const canvas = rendererRef.current.domElement;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(clickableMeshesRef.current, false);
      if (hits.length > 0) {
        const obj = hits[0].object as any;
        const node: GraphNode | undefined = obj?.userData?.node;
        if (node) onNodeClick(node);
      }
    };
    const canvas = renderer.domElement;
    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();
      if (rendererRef.current?.domElement && rendererRef.current.domElement.parentElement) {
        rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
      }
      try {
        canvas.removeEventListener('mousemove', handlePointerMove);
        canvas.removeEventListener('click', handleClick);
      } catch {}
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
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <h3 className="text-white/95 font-semibold tracking-wide truncate max-w-[60vw]" title={title || '3D Graph'}>{title || '3D Graph'}</h3>
            <span className="text-white/70 text-xs whitespace-nowrap">{graph?.nodes?.length ?? 0} nodes • {graph?.edges?.length ?? 0} edges</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !showLabels;
                setShowLabels(next);
                labelSpritesRef.current.forEach(s => (s.visible = next));
              }}
              className="px-3 py-1 rounded-md bg-white/10 text-white text-xs hover:bg-white/20 border border-white/10"
            >
              {showLabels ? 'Hide labels' : 'Show labels'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm hover:from-purple-600 hover:to-blue-600"
            >
              Close
            </button>
          </div>
        </div>
        <div ref={mountRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default Graph3DModal;
