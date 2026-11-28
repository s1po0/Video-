import * as THREE from 'three';
import { addBox, type BoxCollider, type BuiltZone3D, type World3DSensor } from './world3dHotelBuilder';

export function buildOpenCityZone3D(textures: {
  marble: THREE.Texture;
  wood: THREE.Texture;
}): BuiltZone3D & { supercarGroup: THREE.Group } {
  const group = new THREE.Group();
  const colliders: BoxCollider[] = [];
  const sensors: World3DSensor[] = [];

  // Huge Open-World City Plaza & Asphalt Boulevard (68 x 54 units!)
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ map: textures.marble, roughness: 0.42 });
  const roadLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

  // Sidewalk base
  const ground = new THREE.Mesh(new THREE.BoxGeometry(68, 0.5, 54), sidewalkMat);
  ground.position.set(0, -0.25, 0);
  ground.receiveShadow = true;
  group.add(ground);

  // Main East-West & North-South Asphalt Avenues
  const roadEW = new THREE.Mesh(new THREE.BoxGeometry(66, 0.06, 11), asphaltMat);
  roadEW.position.set(0, 0.03, 0);
  roadEW.receiveShadow = true;
  group.add(roadEW);

  const roadNS = new THREE.Mesh(new THREE.BoxGeometry(11, 0.06, 52), asphaltMat);
  roadNS.position.set(0, 0.035, 0);
  roadNS.receiveShadow = true;
  group.add(roadNS);

  // Golden dashed center road lines & crosswalk stripes
  for (let x = -28; x <= 28; x += 4.5) {
    if (Math.abs(x) < 6) continue;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.25), roadLineMat);
    dash.position.set(x, 0.05, 0);
    group.add(dash);
  }
  for (let i = -3.5; i <= 3.5; i += 1.4) {
    const cw = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 2.8), crosswalkMat);
    cw.position.set(i, 0.055, -7);
    group.add(cw);
  }

  // Warm Streetlamps along the avenues
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.3 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  [
    [-16, -6.5],
    [16, -6.5],
    [-16, 6.5],
    [16, 6.5],
    [-6.5, -15],
    [6.5, 15],
  ].forEach(([lx, lz]) => {
    addBox(group, null, 0.22, 4.2, 0.22, lx, 2.1, lz, poleMat, false);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), bulbMat);
    bulb.position.set(lx, 4.3, lz);
    group.add(bulb);
  });

  // ════════════════════════════════════════════════════════════════════════
  // 1) 🏨 GRAND VELVET HOTEL FACADE (North Center: x=0, z=-21)
  // ════════════════════════════════════════════════════════════════════════
  const hotelMat = new THREE.MeshStandardMaterial({
    color: 0x31102f,
    emissive: 0xd946ef,
    emissiveIntensity: 0.22,
    roughness: 0.35,
  });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf5c451, metalness: 0.75, roughness: 0.2 });
  addBox(group, colliders, 15, 14, 7, 0, 7, -21.5, hotelMat);
  addBox(group, null, 7.5, 0.5, 3.2, 0, 3.4, -16.8, goldMat);
  sensors.push({
    id: 'enter_hotel_from_city',
    x: 0,
    y: 2.2,
    z: -15.8,
    radius: 3.4,
    icon: '🏨',
    labelKu: 'چوونە ژوورەوەی هۆتێلی مەخمەلی (17F)',
    labelEn: 'Enter Grand Velvet Hotel (17F)',
    kind: 'portal_17f',
  });

  // ════════════════════════════════════════════════════════════════════════
  // 2) 🏥 VELVET CITY NIGHT HOSPITAL — DR. NARA (North-West: x=-21, z=-15)
  // ════════════════════════════════════════════════════════════════════════
  const hospMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.14,
    roughness: 0.3,
  });
  const crossMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.85,
  });
  addBox(group, colliders, 13, 9.5, 8.5, -21, 4.75, -16.5, hospMat);
  // Glowing Red Medical Cross on facade!
  addBox(group, null, 2.6, 0.8, 0.4, -21, 7.2, -12.1, crossMat, false);
  addBox(group, null, 0.8, 2.6, 0.4, -21, 7.2, -12.1, crossMat, false);
  sensors.push({
    id: 'city_hospital_door',
    x: -21,
    y: 2.2,
    z: -10.5,
    radius: 3.5,
    icon: '🏥',
    labelKu: 'نەخۆشخانەی شار (دکتۆر نارا و وزە)',
    labelEn: 'City Hospital (Dr. Nara & Heal)',
    kind: 'hospital',
  });

  // ════════════════════════════════════════════════════════════════════════
  // 3) 🛍️ STARLIGHT MEGA SHOPPING MALL (North-East: x=+21, z=-15)
  // ════════════════════════════════════════════════════════════════════════
  const mallMat = new THREE.MeshStandardMaterial({
    color: 0x4c1d95,
    emissive: 0xf472b6,
    emissiveIntensity: 0.32,
    roughness: 0.25,
  });
  addBox(group, colliders, 14, 8.5, 8.5, 21, 4.25, -16.5, mallMat);
  addBox(group, null, 9, 0.5, 2.8, 21, 3.2, -11.2, goldMat);
  sensors.push({
    id: 'city_mall_door',
    x: 21,
    y: 2.2,
    z: -10.3,
    radius: 3.6,
    icon: '🛍️',
    labelKu: 'مۆڵی گەورەی ئەستێرە (شۆپینگ)',
    labelEn: 'Starlight Mega Shopping Mall',
    kind: 'shop',
  });

  // ════════════════════════════════════════════════════════════════════════
  // 4) 💼 CAREER EXECUTIVE TOWER — WORK & MONEY (South-East: x=+21, z=+16)
  // ════════════════════════════════════════════════════════════════════════
  const careerMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.35,
    metalness: 0.5,
    roughness: 0.2,
  });
  addBox(group, colliders, 13, 16, 9, 21, 8, 17, careerMat);
  addBox(group, null, 7, 0.5, 2.6, 21, 3.2, 11.6, goldMat);
  sensors.push({
    id: 'city_career_door',
    x: 21,
    y: 2.2,
    z: 10.6,
    radius: 3.6,
    icon: '💼',
    labelKu: 'تاوەری کارکردن (+$140 داهات!)',
    labelEn: 'Career Executive Tower (Work!)',
    kind: 'career',
  });

  // ════════════════════════════════════════════════════════════════════════
  // 5) 🕵️ SHADOW RAIN ALLEY — SECRET CHARACTERS (South-West: x=-21, z=+16)
  // ════════════════════════════════════════════════════════════════════════
  const alleyMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b,
    emissive: 0x818cf8,
    emissiveIntensity: 0.35,
    roughness: 0.5,
  });
  addBox(group, colliders, 12, 7.5, 8.5, -21, 3.75, 17, alleyMat);
  sensors.push({
    id: 'city_alley_door',
    x: -21,
    y: 2.2,
    z: 10.8,
    radius: 3.6,
    icon: '🕵️',
    labelKu: 'کۆڵانی نهێنی (کاوەی سێبەر)',
    labelEn: 'Shadow Alley (Secret Broker Kawa)',
    kind: 'alley',
  });

  // ════════════════════════════════════════════════════════════════════════
  // 6) 🏎️ DRIVABLE 3D MIDNIGHT SUPERCAR!
  // ════════════════════════════════════════════════════════════════════════
  const supercarGroup = new THREE.Group();
  const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.72, 4.4),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.75, roughness: 0.2 })
  );
  carBody.position.y = 0.55;
  carBody.castShadow = true;
  supercarGroup.add(carBody);

  const carCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.55, 2.1),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.12 })
  );
  carCabin.position.set(0, 1.1, -0.2);
  supercarGroup.add(carCabin);

  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
  [-0.75, 0.75].forEach((hx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.15), headlightMat);
    hl.position.set(hx, 0.6, 2.22);
    supercarGroup.add(hl);
  });
  supercarGroup.position.set(6.8, 0, -10.5);
  group.add(supercarGroup);

  sensors.push({
    id: 'supercar_drive',
    x: 6.8,
    y: 1.9,
    z: -10.5,
    radius: 3.4,
    icon: '🏎️',
    labelKu: 'سواری سەیارە وەرزشییەکەی سیپان بە!',
    labelEn: 'Drive Sipan’s Midnight Supercar!',
    kind: 'supercar',
  });

  return {
    group,
    supercarGroup,
    colliders,
    sensors,
    spawn: { x: 0, z: -12.5 },
    bounds: { minX: -31, maxX: 31, minZ: -24, maxZ: 24 },
    npcs: [
      {
        id: 'nara',
        spriteUrl: '/assets/sprite_nara.png',
        nameKu: 'دکتۆر نارا',
        nameEn: 'Dr. Nara',
        x: -17.5,
        z: -9.8,
        patrolX: -15.5,
        patrolZ: -8.5,
        cityBuilding: 'hospital',
      },
      {
        id: 'shadow',
        spriteUrl: '/assets/sprite_shadow.png',
        nameKu: 'کاوەی سێبەر',
        nameEn: 'Kawa Shadow',
        x: -17.5,
        z: 10.2,
        patrolX: -15.0,
        patrolZ: 8.8,
        cityBuilding: 'alley',
      },
      {
        id: 'layla',
        spriteUrl: '/assets/sprite_layla.png',
        nameKu: 'لەیلا',
        nameEn: 'Layla',
        x: 16.5,
        z: -9.5,
        patrolX: 14.0,
        patrolZ: -8.0,
        locId: 'boutique',
      },
      {
        id: 'celine',
        spriteUrl: '/assets/sprite_celine.png',
        nameKu: 'سێلین',
        nameEn: 'Celine',
        x: 16.5,
        z: 9.8,
        patrolX: 13.5,
        patrolZ: 8.2,
        locId: 'lounge',
      },
    ],
  };
}
