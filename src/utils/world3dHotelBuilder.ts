import * as THREE from 'three';
import type { HeroineId, LocationId } from '../types/game';

export type WorldZoneId = '17f' | '18f' | 'city';

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface World3DSensor {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  icon: string;
  labelKu: string;
  labelEn: string;
  kind:
    | 'bed'
    | 'spa'
    | 'secret'
    | 'bar'
    | 'shop'
    | 'pool'
    | 'portal_17f'
    | 'portal_18f'
    | 'portal_city'
    | 'hospital'
    | 'career'
    | 'alley'
    | 'supercar'
    | 'saga';
  hotspotId?: string;
}

export interface NpcSpawn3D {
  id: HeroineId | 'nara' | 'shadow';
  spriteUrl: string;
  nameKu: string;
  nameEn: string;
  x: number;
  z: number;
  patrolX: number;
  patrolZ: number;
  locId?: LocationId;
  cityBuilding?: 'hospital' | 'alley';
}

export interface BuiltZone3D {
  group: THREE.Group;
  colliders: BoxCollider[];
  sensors: World3DSensor[];
  npcs: NpcSpawn3D[];
  spawn: { x: number; z: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  animate?: (t: number) => void;
}

export function addBox(
  parent: THREE.Group,
  colliders: BoxCollider[] | null,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  castShadow = true
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (colliders) {
    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
  }
  return mesh;
}

export function buildHotelZone3D(
  zone: '17f' | '18f',
  textures: { marble: THREE.Texture; wood: THREE.Texture }
): BuiltZone3D {
  const group = new THREE.Group();
  const colliders: BoxCollider[] = [];
  const sensors: World3DSensor[] = [];

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5c451, metalness: 0.65, roughness: 0.25 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfbf3e4, roughness: 0.45 });
  const velvetRed = new THREE.MeshStandardMaterial({ color: 0xb91c47, roughness: 0.55 });
  const velvetNavy = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.38,
    roughness: 0.1,
  });

  // Bright starry sky backdrop skyscrapers around hotel
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.28,
  });
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * Math.PI * 2;
    const dist = 36 + (i % 3) * 6;
    const th = 14 + (i % 5) * 5;
    const m = new THREE.Mesh(new THREE.BoxGeometry(5, th, 5), towerMat);
    m.position.set(Math.cos(ang) * dist, th / 2 - 8, Math.sin(ang) * dist);
    group.add(m);
  }

  if (zone === '17f') {
    const floorMat = new THREE.MeshStandardMaterial({ map: textures.marble, roughness: 0.28 });
    const suiteMat = new THREE.MeshStandardMaterial({ map: textures.wood, roughness: 0.38 });

    // Grand Marble Base (36 x 26)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(36, 0.5, 26), floorMat);
    floor.position.set(0, -0.25, 0);
    floor.receiveShadow = true;
    group.add(floor);

    // Suite Hardwood Rugs
    [-11, 11].forEach((sx) => {
      [-7.5, 7.5].forEach((sz) => {
        const rug = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.06, 8.5), suiteMat);
        rug.position.set(sx, 0.03, sz);
        rug.receiveShadow = true;
        group.add(rug);
      });
    });

    // Outer Glass & Cream Walls
    addBox(group, colliders, 36, 3.2, 0.5, 0, 1.6, -13, glassMat, false);
    addBox(group, colliders, 36, 3.2, 0.5, 0, 1.6, 13, wallMat);
    addBox(group, colliders, 0.5, 3.2, 26, -18, 1.6, 0, wallMat);
    addBox(group, colliders, 0.5, 3.2, 26, 18, 1.6, 0, wallMat);

    // Partition Walls with wide open doorways
    addBox(group, colliders, 8, 2.8, 0.4, -14, 1.4, -3, wallMat);
    addBox(group, colliders, 8, 2.8, 0.4, 14, 1.4, -3, wallMat);
    addBox(group, colliders, 8, 2.8, 0.4, -14, 1.4, 3, wallMat);
    addBox(group, colliders, 8, 2.8, 0.4, 14, 1.4, 3, wallMat);

    // 1) Sipan Master Suite (NW: -12, -8) — Navy King Bed
    addBox(group, colliders, 4.2, 0.85, 3.4, -12.5, 0.42, -8.8, velvetNavy);
    addBox(group, null, 4.3, 1.7, 0.35, -12.5, 0.85, -10.5, goldMat);
    sensors.push({
      id: 'bed_17f',
      x: -12.5,
      y: 1.9,
      z: -7.2,
      radius: 2.8,
      icon: '🛏️',
      labelKu: 'تەختی خەوی سیپان (پشوودان)',
      labelEn: 'Sipan’s Master Bed (Rest)',
      kind: 'bed',
    });

    // 2) Layla Crimson Suite & Golden Rose Bathtub (NE: +12, -8)
    addBox(group, colliders, 4.0, 0.85, 3.2, 13, 0.42, -9, velvetRed);
    const tub = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.3, 0.9, 24), goldMat);
    tub.position.set(8.2, 0.45, -9.2);
    group.add(tub);
    const roseWater = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.35, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0xfb7185, emissive: 0xf43f5e, emissiveIntensity: 0.45 })
    );
    roseWater.position.set(8.2, 0.88, -9.2);
    group.add(roseWater);
    sensors.push({
      id: 'rose_bath',
      x: 8.2,
      y: 1.9,
      z: -7.5,
      radius: 2.6,
      icon: '🛁',
      labelKu: 'حەمامی گوڵاوی گەرم',
      labelEn: 'Golden Rose Bath Spa',
      kind: 'spa',
      hotspotId: 'spot_bath_spa',
    });

    // 3) Celine Detective Study & Fireplace (SW: -12, +8)
    addBox(group, colliders, 3.6, 1.0, 1.6, -12.5, 0.5, 8.8, goldMat);
    const fire = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xff6b00, emissiveIntensity: 0.9 })
    );
    fire.position.set(-16.8, 0.75, 8.5);
    group.add(fire);
    sensors.push({
      id: 'detective_desk',
      x: -12.5,
      y: 1.9,
      z: 7.0,
      radius: 2.7,
      icon: '🔍',
      labelKu: 'مێزی بەڵگە و داستانی ١٢ بەش',
      labelEn: 'Case Desk & 12-Chapter Saga',
      kind: 'saga',
    });

    // 4) Velvet Jazz Lounge & Bar (SE: +11, +8) + Boutique Corner
    addBox(group, colliders, 5.2, 1.15, 1.5, 11.5, 0.58, 8.8, velvetRed);
    sensors.push({
      id: 'jazz_bar',
      x: 11.5,
      y: 1.9,
      z: 6.8,
      radius: 2.7,
      icon: '🍸',
      labelKu: 'باڕی مەخمەلی (ئامادەکردنی خواردنەوە)',
      labelEn: 'Velvet Cocktail Bar',
      kind: 'bar',
    });
    sensors.push({
      id: 'hotel_shop',
      x: 15.8,
      y: 1.9,
      z: 5.5,
      radius: 2.4,
      icon: '🛍️',
      labelKu: 'بووتیکی دیاریی هۆتێل',
      labelEn: 'VIP Gift Boutique',
      kind: 'shop',
    });

    // Central Crystal Elevators: UP to 18F Rooftop & DOWN to Open City!
    const elev18 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.8, 16), glassMat);
    elev18.position.set(-2.6, 1.4, -10.8);
    group.add(elev18);
    sensors.push({
      id: 'go_18f',
      x: -2.6,
      y: 2.4,
      z: -9.2,
      radius: 2.5,
      icon: '🌊',
      labelKu: 'مەسعەد بۆ مەلەوانگەی سەربان (18F)',
      labelEn: 'Elevator to 18F Infinity Pool',
      kind: 'portal_18f',
    });

    const elevCity = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.8, 16), goldMat);
    elevCity.position.set(2.6, 1.4, -10.8);
    group.add(elevCity);
    sensors.push({
      id: 'go_city',
      x: 2.6,
      y: 2.4,
      z: -9.2,
      radius: 2.7,
      icon: '🏙️',
      labelKu: 'دەرچوون لە هۆتێل بۆ شاری گەورە!',
      labelEn: 'Exit Hotel to Open Velvet City!',
      kind: 'portal_city',
    });

    return {
      group,
      colliders,
      sensors,
      spawn: { x: 0, z: 0 },
      bounds: { minX: -17, maxX: 17, minZ: -12, maxZ: 12 },
      npcs: [
        { id: 'layla', spriteUrl: '/assets/sprite_layla.png', nameKu: 'لەیلا', nameEn: 'Layla', x: 10.5, z: -5.5, patrolX: 6.5, patrolZ: -3.5, locId: 'suite' },
        { id: 'celine', spriteUrl: '/assets/sprite_celine.png', nameKu: 'سێلین', nameEn: 'Celine', x: -9.5, z: 5.5, patrolX: -5.5, patrolZ: 2.5, locId: 'fireplace' },
        { id: 'aria', spriteUrl: '/assets/sprite_aria.png', nameKu: 'ئاریا', nameEn: 'Aria', x: 8.5, z: 5.5, patrolX: 4.5, patrolZ: 2.0, locId: 'lounge' },
      ],
    };
  }

  // ZONE 2: 18F OPEN-AIR ROOFTOP INFINITY POOL
  const deckMat = new THREE.MeshStandardMaterial({ map: textures.wood, roughness: 0.35 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(36, 0.5, 26), deckMat);
  deck.position.set(0, -0.25, 0);
  deck.receiveShadow = true;
  group.add(deck);

  // Glass Safety Railings
  addBox(group, colliders, 36, 1.3, 0.3, 0, 0.65, -13, glassMat, false);
  addBox(group, colliders, 36, 1.3, 0.3, 0, 0.65, 13, glassMat, false);
  addBox(group, colliders, 0.3, 1.3, 26, -18, 0.65, 0, glassMat, false);
  addBox(group, colliders, 0.3, 1.3, 26, 18, 0.65, 0, glassMat, false);

  // Giant Animated 3D Turquoise Infinity Pool (walkable/swimmable!)
  const waterGeo = new THREE.PlaneGeometry(18, 9.5, 24, 14);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x06b6d4,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(0, 0.14, -4.5);
  group.add(waterMesh);

  const poolLight = new THREE.PointLight(0x22d3ee, 2.2, 18);
  poolLight.position.set(0, 2.2, -4.5);
  group.add(poolLight);

  sensors.push({
    id: 'infinity_pool_swim',
    x: 0,
    y: 1.6,
    z: -4.5,
    radius: 4.5,
    icon: '🏊',
    labelKu: 'مەلەوانگەی بێکۆتایی (مەلەکردنی ڕۆمانسی)',
    labelEn: 'Infinity Pool (Romantic Swim)',
    kind: 'spa',
    hotspotId: 'spot_jacuzzi_18f',
  });

  // Twin Steaming Jacuzzis & Silk Cabanas
  [-12.5, 12.5].forEach((jx, idx) => {
    const jac = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.9, 0.85, 24), goldMat);
    jac.position.set(jx, 0.42, -5.5);
    group.add(jac);
    const jWater = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 1.9, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.65 })
    );
    jWater.position.set(jx, 0.85, -5.5);
    group.add(jWater);
    if (idx === 0) {
      sensors.push({
        id: 'jacuzzi_spa',
        x: jx,
        y: 1.9,
        z: -3.2,
        radius: 2.6,
        icon: '♨️',
        labelKu: 'جاکوزیی گەرمی سەربان',
        labelEn: 'Steaming Sky Jacuzzi',
        kind: 'spa',
        hotspotId: 'spot_jacuzzi_18f',
      });
    }
  });

  // Silk Cabana (SW) & Champagne Bar (SE)
  addBox(group, colliders, 4.5, 2.6, 3.5, -11.5, 1.3, 6.8, velvetRed);
  sensors.push({
    id: 'cabana_secret',
    x: -11.5,
    y: 2.2,
    z: 4.4,
    radius: 2.6,
    icon: '🌺',
    labelKu: 'کەپری ئاوریشمی تایبەت (بەشی ٦ی چیرۆک)',
    labelEn: 'Silk Cabana (Saga Ch 6)',
    kind: 'saga',
  });

  addBox(group, colliders, 5.0, 1.15, 1.6, 11.5, 0.58, 7.2, goldMat);
  sensors.push({
    id: 'sky_bar',
    x: 11.5,
    y: 1.9,
    z: 5.2,
    radius: 2.6,
    icon: '🥂',
    labelKu: 'باڕی شامپانیای ئاسمانی',
    labelEn: 'Sky Champagne Bar',
    kind: 'bar',
  });

  // Return Elevator to 17F OR Direct Elevator to City!
  const down17 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.8, 16), glassMat);
  down17.position.set(-2.4, 1.4, 10.2);
  group.add(down17);
  sensors.push({
    id: 'back_17f',
    x: -2.4,
    y: 2.3,
    z: 8.5,
    radius: 2.5,
    icon: '🛗',
    labelKu: 'گەڕانەوە بۆ سویتەکان (17F)',
    labelEn: 'Elevator to 17F Suites',
    kind: 'portal_17f',
  });

  const downCity = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.8, 16), goldMat);
  downCity.position.set(2.4, 1.4, 10.2);
  group.add(downCity);
  sensors.push({
    id: 'roof_to_city',
    x: 2.4,
    y: 2.3,
    z: 8.5,
    radius: 2.5,
    icon: '🏙️',
    labelKu: 'دابەزین بۆ شاری مەخمەلی!',
    labelEn: 'Elevator Down to Velvet City!',
    kind: 'portal_city',
  });

  const basePos = waterGeo.attributes.position.array.slice() as Float32Array;
  return {
    group,
    colliders,
    sensors,
    spawn: { x: 0, z: 5.5 },
    bounds: { minX: -17, maxX: 17, minZ: -12, maxZ: 12 },
    npcs: [
      { id: 'aria', spriteUrl: '/assets/sprite_aria.png', nameKu: 'ئاریا', nameEn: 'Aria', x: 6.5, z: 4.5, patrolX: 3.5, patrolZ: 2.5, locId: 'pool' },
      { id: 'layla', spriteUrl: '/assets/sprite_layla.png', nameKu: 'لەیلا', nameEn: 'Layla', x: -7.5, z: 2.5, patrolX: -4.5, patrolZ: 1.5, locId: 'balcony' },
    ],
    animate: (t: number) => {
      const pos = waterGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const bx = basePos[i * 3];
        const bz = basePos[i * 3 + 2];
        pos.setY(i, Math.sin(bx * 0.7 + t * 2.6) * 0.08 + Math.cos(bz * 0.9 + t * 2.1) * 0.06);
      }
      pos.needsUpdate = true;
    },
  };
}
