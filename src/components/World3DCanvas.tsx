import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { HeroineId } from '../types/game';
import { createCharacterRig3D, updateCharacterRigAnimation, type CharacterRig3D } from '../utils/world3dCharacterRig';
import { buildOpenCityZone3D } from '../utils/world3dCityBuilder';
import {
  buildHotelZone3D,
  type BoxCollider,
  type NpcSpawn3D,
  type World3DSensor,
  type WorldZoneId,
} from '../utils/world3dHotelBuilder';

export interface ProjectedMarker {
  id: string;
  x: number;
  y: number;
  icon: string;
  labelKu: string;
  labelEn: string;
  isNpc?: boolean;
}

interface World3DCanvasProps {
  zone: WorldZoneId;
  zoomFar: boolean;
  sprinting: boolean;
  drivingCar: boolean;
  companionId: HeroineId | null;
  joyVecRef: React.MutableRefObject<{ x: number; y: number }>;
  onNearSensor: (sensor: World3DSensor | null) => void;
  onNearNpc: (npc: NpcSpawn3D | null) => void;
  onMarkersUpdate: (markers: ProjectedMarker[]) => void;
}

function hitsBox(x: number, z: number, r: number, boxes: BoxCollider[]) {
  for (const b of boxes) {
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
    if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
  }
  return false;
}

export const World3DCanvas: React.FC<World3DCanvasProps> = ({
  zone,
  zoomFar,
  sprinting,
  drivingCar,
  companionId,
  joyVecRef,
  onNearSensor,
  onNearNpc,
  onMarkersUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef({ zoomFar, sprinting, drivingCar, companionId });
  propsRef.current = { zoomFar, sprinting, drivingCar, companionId };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(zone === 'city' ? 0x0b132b : 0x131c38);
    scene.fog = new THREE.FogExp2(zone === 'city' ? 0x0b132b : 0x131c38, 0.011);

    const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / Math.max(1, mount.clientHeight), 0.2, 160);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // Bright Physically-Balanced Studio Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.05));
    scene.add(new THREE.HemisphereLight(0xfff7ed, 0x38bdf8, 1.85));
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.35);
    sun.position.set(16, 28, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    const loader = new THREE.TextureLoader();
    const prepTex = (url: string, rep: number) => {
      const t = loader.load(url);
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rep, rep);
      return t;
    };
    const textures = {
      marble: prepTex('/assets/tex_marble.jpg', zone === 'city' ? 10 : 5),
      wood: prepTex('/assets/tex_wood.jpg', 4),
    };

    const built =
      zone === 'city' ? buildOpenCityZone3D(textures) : buildHotelZone3D(zone, textures);
    scene.add(built.group);

    // Player (Sipan) + NPCs + Optional Companion Rig
    const sipanRig = createCharacterRig3D('sipan', '/assets/sprite_sipan.png', 0x38bdf8, loader, 2.55);
    sipanRig.root.position.set(built.spawn.x, 0, built.spawn.z);
    scene.add(sipanRig.root);

    const auraMap: Record<string, number> = {
      layla: 0xfb7185,
      celine: 0xc084fc,
      aria: 0xfbbf24,
      nara: 0x34d399,
      shadow: 0x818cf8,
    };
    const npcEntries = built.npcs.map((n) => {
      const rig = createCharacterRig3D(n.id, n.spriteUrl, auraMap[n.id] || 0xfbbf24, loader, 2.45);
      rig.root.position.set(n.x, 0, n.z);
      scene.add(rig.root);
      return { data: n, rig, tOffset: Math.random() * 10 };
    });

    // Controls: Keyboard + 360° Touch/Mouse Camera Orbit + Ground Raycast Tap-to-Walk
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let camYaw = 0;
    let walkTarget: { x: number; z: number } | null = null;
    let dragStart: { x: number; y: number; yaw: number; moved: boolean } | null = null;
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();

    const dom = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      dragStart = { x: e.clientX, y: e.clientY, yaw: camYaw, moved: false };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragStart) return;
      const dx = e.clientX - dragStart.x;
      if (Math.abs(dx) > 7 || Math.abs(e.clientY - dragStart.y) > 7) {
        dragStart.moved = true;
        camYaw = dragStart.yaw - dx * 0.0075;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (dragStart && !dragStart.moved) {
        const rect = dom.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(ndc, camera);
        const hit = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, hit)) {
          walkTarget = {
            x: Math.max(built.bounds.minX, Math.min(built.bounds.maxX, hit.x)),
            z: Math.max(built.bounds.minZ, Math.min(built.bounds.maxZ, hit.z)),
          };
        }
      }
      dragStart = null;
    };
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / Math.max(1, mount.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let prev = performance.now();
    let markerTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const t = now * 0.001;
      const { zoomFar: zf, sprinting: sp, drivingCar: dc, companionId: comp } = propsRef.current;

      // Movement vector rotated by camYaw so Joystick/WASD always match camera view!
      let ix = joyVecRef.current.x;
      let iz = joyVecRef.current.y;
      if (keys['w'] || keys['arrowup']) iz -= 1;
      if (keys['s'] || keys['arrowdown']) iz += 1;
      if (keys['a'] || keys['arrowleft']) ix -= 1;
      if (keys['d'] || keys['arrowright']) ix += 1;

      if (Math.hypot(ix, iz) > 0.08) {
        walkTarget = null;
      } else if (walkTarget) {
        const dx = walkTarget.x - sipanRig.root.position.x;
        const dz = walkTarget.z - sipanRig.root.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.45) {
          walkTarget = null;
        } else {
          // Convert world delta back to unrotated input
          const cos = Math.cos(-camYaw);
          const sin = Math.sin(-camYaw);
          ix = (dx / dist) * cos - (dz / dist) * sin;
          iz = (dx / dist) * sin + (dz / dist) * cos;
        }
      }

      const len = Math.hypot(ix, iz);
      const speedMul = dc && zone === 'city' ? 14.5 : sp ? 9.8 : 6.0;
      let actualSpeed = 0;
      if (len > 0.05) {
        const nx = ix / Math.max(1, len);
        const nz = iz / Math.max(1, len);
        const wx = nx * Math.cos(camYaw) + nz * Math.sin(camYaw);
        const wz = -nx * Math.sin(camYaw) + nz * Math.cos(camYaw);
        if (Math.abs(nx) > 0.08) sipanRig.facing = nx >= 0 ? 1 : -1;

        const curX = sipanRig.root.position.x;
        const curZ = sipanRig.root.position.z;
        const tryX = Math.max(built.bounds.minX, Math.min(built.bounds.maxX, curX + wx * speedMul * dt));
        const tryZ = Math.max(built.bounds.minZ, Math.min(built.bounds.maxZ, curZ + wz * speedMul * dt));
        if (!hitsBox(tryX, curZ, 0.65, built.colliders)) sipanRig.root.position.x = tryX;
        if (!hitsBox(sipanRig.root.position.x, tryZ, 0.65, built.colliders)) sipanRig.root.position.z = tryZ;
        actualSpeed = speedMul;

        if (dc && 'supercarGroup' in built) {
          const car = (built as ReturnType<typeof buildOpenCityZone3D>).supercarGroup;
          car.position.set(sipanRig.root.position.x, 0, sipanRig.root.position.z);
          car.rotation.y = Math.atan2(wx, wz);
        }
      } else if (dc && 'supercarGroup' in built) {
        const car = (built as ReturnType<typeof buildOpenCityZone3D>).supercarGroup;
        car.position.set(sipanRig.root.position.x, 0, sipanRig.root.position.z);
      }

      sipanRig.bodyMesh.visible = !(dc && zone === 'city');
      const inPool =
        zone === '18f' &&
        Math.abs(sipanRig.root.position.x) < 8.6 &&
        sipanRig.root.position.z > -9.0 &&
        sipanRig.root.position.z < 0.1;
      updateCharacterRigAnimation(sipanRig, camera, dt, actualSpeed, t, inPool, 2.55);

      // Update NPCs (Utility-AI Patrol OR Hand-Holding Companion Follow!)
      let closestNpc: NpcSpawn3D | null = null;
      let bestNpcDist = 3.2;
      for (const item of npcEntries) {
        const isComp = comp && item.data.id === comp;
        let tx = item.data.x;
        let tz = item.data.z;
        if (isComp) {
          tx = sipanRig.root.position.x - 1.35;
          tz = sipanRig.root.position.z + 0.65;
        } else {
          const w = (Math.sin(t * 0.45 + item.tOffset) + 1) * 0.5;
          tx = item.data.x + (item.data.patrolX - item.data.x) * w;
          tz = item.data.z + (item.data.patrolZ - item.data.z) * w;
        }
        const dx = tx - item.rig.root.position.x;
        const dz = tz - item.rig.root.position.z;
        const d = Math.hypot(dx, dz);
        let nSpeed = 0;
        if (d > 0.15) {
          const step = Math.min(d, (isComp ? 7.5 : 2.1) * dt);
          item.rig.root.position.x += (dx / d) * step;
          item.rig.root.position.z += (dz / d) * step;
          item.rig.facing = dx >= 0 ? 1 : -1;
          nSpeed = isComp ? 6.5 : 2.1;
        }
        item.rig.bodyMesh.visible = !(isComp && dc && zone === 'city');
        const npcSwim =
          zone === '18f' &&
          Math.abs(item.rig.root.position.x) < 8.6 &&
          item.rig.root.position.z > -9.0 &&
          item.rig.root.position.z < 0.1;
        updateCharacterRigAnimation(item.rig, camera, dt, nSpeed, t, npcSwim, 2.45);

        const distToPlayer = Math.hypot(
          item.rig.root.position.x - sipanRig.root.position.x,
          item.rig.root.position.z - sipanRig.root.position.z
        );
        if (distToPlayer < bestNpcDist) {
          bestNpcDist = distToPlayer;
          closestNpc = item.data;
        }
      }

      // Check Sensors
      let closestSensor: World3DSensor | null = null;
      let bestSenDist = Infinity;
      for (const s of built.sensors) {
        const d = Math.hypot(s.x - sipanRig.root.position.x, s.z - sipanRig.root.position.z);
        if (d < s.radius && d < bestSenDist) {
          bestSenDist = d;
          closestSensor = s;
        }
      }

      if (built.animate) built.animate(t);

      // Smooth Orbit 3D Camera
      const distCam = zf ? (zone === 'city' ? 25 : 19) : zone === 'city' ? 16 : 12.5;
      const heightCam = zf ? (zone === 'city' ? 18 : 14.5) : zone === 'city' ? 10.5 : 8.4;
      const desiredCam = new THREE.Vector3(
        sipanRig.root.position.x + Math.sin(camYaw) * distCam,
        heightCam,
        sipanRig.root.position.z + Math.cos(camYaw) * distCam
      );
      camera.position.lerp(desiredCam, 0.12);
      camera.lookAt(sipanRig.root.position.x, 1.3, sipanRig.root.position.z);

      renderer.render(scene, camera);

      // Project 3D Markers accurately every ~60ms (100% bound to real 3D coordinates!)
      markerTimer += dt;
      if (markerTimer > 0.06) {
        markerTimer = 0;
        onNearNpc(closestNpc);
        onNearSensor(closestSensor);
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        const projected: ProjectedMarker[] = [];
        const proj = (id: string, wx: number, wy: number, wz: number, icon: string, labelKu: string, labelEn: string, isNpc = false) => {
          const v = new THREE.Vector3(wx, wy, wz).project(camera);
          if (v.z < 1 && v.x > -0.95 && v.x < 0.95 && v.y > -0.92 && v.y < 0.92) {
            projected.push({
              id,
              x: (v.x * 0.5 + 0.5) * w,
              y: (-v.y * 0.5 + 0.5) * h,
              icon,
              labelKu,
              labelEn,
              isNpc,
            });
          }
        };
        for (const s of built.sensors) {
          if (s.id === 'supercar_drive' && dc) continue;
          proj(s.id, s.x, s.y + 0.6, s.z, s.icon, s.labelKu, s.labelEn);
        }
        for (const item of npcEntries) {
          if (dc && comp === item.data.id) continue;
          proj(
            `npc_${item.data.id}`,
            item.rig.root.position.x,
            2.85,
            item.rig.root.position.z,
            '💬',
            item.data.nameKu,
            item.data.nameEn,
            true
          );
        }
        onMarkersUpdate(projected);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [zone]);

  return <div ref={mountRef} className="w-full h-full touch-none select-none" />;
};
