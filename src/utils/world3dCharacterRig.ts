import * as THREE from 'three';

export interface CharacterRig3D {
  id: string;
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  facing: number;
  walkPhase: number;
}

export function createCharacterRig3D(
  id: string,
  spriteUrl: string,
  auraColor: number,
  loader: THREE.TextureLoader,
  height = 2.45
): CharacterRig3D {
  const root = new THREE.Group();

  // Soft ground contact shadow + glowing RPG aura ring
  const shadowGeo = new THREE.CircleGeometry(0.68, 24);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x020617,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = 0.05;
  root.add(shadow);

  const ringGeo = new THREE.RingGeometry(0.62, 0.78, 28);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: auraColor,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.06;
  root.add(ringMesh);

  // Crisp alpha-cutout full-body manhwa sprite plane
  const tex = loader.load(spriteUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const width = height * 0.42;
  const planeGeo = new THREE.PlaneGeometry(width, height);
  const planeMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.12,
    side: THREE.DoubleSide,
  });
  const bodyMesh = new THREE.Mesh(planeGeo, planeMat);
  bodyMesh.position.y = height * 0.5;
  root.add(bodyMesh);

  return {
    id,
    root,
    bodyMesh,
    ringMesh,
    facing: 1,
    walkPhase: Math.random() * Math.PI * 2,
  };
}

export function updateCharacterRigAnimation(
  rig: CharacterRig3D,
  camera: THREE.Camera,
  dt: number,
  speed: number,
  time: number,
  inWater = false,
  baseHeight = 2.45
) {
  // Billboard toward camera horizontally while staying upright in 3D space
  const camPos = new THREE.Vector3();
  camera.getWorldPosition(camPos);
  rig.bodyMesh.lookAt(camPos.x, rig.root.position.y + baseHeight * 0.5, camPos.z);

  if (speed > 0.08) {
    rig.walkPhase += dt * (speed > 6.5 ? 15 : 10);
    const bounce = Math.abs(Math.sin(rig.walkPhase)) * 0.16;
    const sway = Math.sin(rig.walkPhase) * 0.07;
    rig.bodyMesh.position.y = (inWater ? baseHeight * 0.28 : baseHeight * 0.5) + bounce;
    rig.bodyMesh.rotation.z += sway;
    rig.bodyMesh.scale.set(rig.facing, 1 + bounce * 0.08, 1);
  } else {
    const breath = Math.sin(time * 2.6 + rig.walkPhase) * 0.025;
    rig.bodyMesh.position.y = inWater ? baseHeight * 0.28 + breath * 2 : baseHeight * 0.5 + breath;
    rig.bodyMesh.scale.set(rig.facing, 1 + breath, 1);
  }

  const pulse = 0.94 + Math.sin(time * 3.5) * 0.08;
  rig.ringMesh.scale.set(pulse, pulse, 1);
}
