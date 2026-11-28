# 🏛️ MIDNIGHT VELVET v3.0 — MASTER EXECUTION PLAN
**Real 3D Studio Engine (`Three.js` PBR) + Open-World Velvet City + `danjdewhurst/story-skills` Deep 12-Chapter Mystery & Romance Saga**

---

## 🎯 Step-by-Step Execution Roadmap (`پلانی ورد بەش بەش`)

### ✅ Phase 1 — AI-Assisted 3D Assets & HD Alpha Character Sprites (DONE)
- Generated & chroma-extracted 6 full-body standing RPG character sprites (`public/assets/sprite_{sipan,layla,celine,aria,nara,shadow}.png`) inspected via `create-game-assets` QA.
- Generated seamless PBR architectural textures (`tex_marble.jpg`, `tex_wood.jpg`) + Hospital/City artwork (`nara_portrait.jpg`, `bg_city_hospital.jpg`).

### 📖 Phase 2 — Deep Long-Form Story Architecture (`danjdewhurst/story-skills`)
Using `plot-structure`, `genre-craft` (`mystery-fair-play.md` + `romance-beats.md`), `interactive-fiction` (`choice-graph.md`), and `scene-craft` (`scene-sequel.md`):
1. **Story Bible & CLI Validation (`story-bible/`)**:
   - 3 Interlocking Plot Arcs (`The Blood-Ruby Conspiracy`, `Velvet Hearts Dual-Change Romance`, `Sipan's Redemption in the City`).
   - **6 Fair-Play Clues + 1 Resolved Red Herring** in `continuity/clues/` covering Motive, Means, and Opportunity (Culprit **Dara Miran** introduced in Chapter 2 per Fair-Play Rule #2; **Kawa Shadow** planted in Chapter 3 as a plausible Red Herring and cleared in Chapter 8).
   - **12 Branch-and-Bottleneck + Hub Interactive Chapters** (`chapters/chapter-01.md` .. `chapter-12.md`) with `beat`, `hook`, `choices`, and `Scene + Sequel` (`Reaction → Dilemma → Decision`) outcomes (`yes-but`, `no-and`), verified with `story check .`, `story clues .`, `story links .`, and `story grid .`.
2. **Playable In-Game Saga & Clue Board (`src/data/storySaga.ts` + `src/components/StorySagaModal.tsx`)**:
   - Rich, long-form Sorani Kurdish & English literary prose (`چیرۆکێکی ورد و قووڵ و درێژ`) directly tied to visiting the **3D Hotel**, **City Hospital (`نەخۆشخانە`)**, **Shopping Mall (`شۆپینگ`)**, **Career Tower (`کارکردن`)**, and **Shadow Alley (`کەسانی نهێنی`)**, complete with a live **Fair-Play Detective Clue Ledger** and branching choices that permanently impact Affection, Trust, Passion, Money, and Endings!

### 🏙️ Phase 3 — True 3D Scene-Tree Engine (`Three.js` WebGL PBR — Zero Misalignment)
Built with `threejs-scene-setup`, `threejs-materials-lighting`, `estella-3d-gameplay`, and `godot-3d-essentials`:
- Every wall, open doorway, bed, bath, pool, road, supercar, hospital clinic, shopping mall atrium, executive office, and secret alley is a real `THREE.Group` mesh at exact `(x, y, z)` coordinates with bound `Box3` colliders and 3D world-projected interaction markers — **100% aligned forever**.
- **3 Seamless Connected 3D Worlds**:
  1. **`17F` Luxury Penthouse Suites & Jazz Bar** (Sipan's Suite, Layla's Rose Bath, Celine's Detective Study, Crystal Elevator to `18F` & **`1F / City Exit`**).
  2. **`18F` Open-Air Rooftop Infinity Pool & Sky Deck** (animated 3D turquoise waves, underwater lights, twin steaming jacuzzis, silk cabanas, 3D city skyline).
  3. **`🏙️ شاری مەخمەلی (Open-World Velvet City District)`** right outside the Hotel doors:
     - **🏨 Velvet Grand Hotel Facade & Drivable 3D Midnight Supercar (`🏎️ سەیارە`)**
     - **🏥 نەخۆشخانەی شار (`Velvet City Night Hospital` — Dr. Nara `دکتۆر نارا`)**
     - **🛍️ مۆڵی گەورەی ئەستێرە (`Starlight Mega Shopping Mall` — `شۆپینگ`)**
     - **💼 تاوەری کارکردن (`Career Executive Tower` — 3 interactive high-paying jobs `کارکردن`)**
     - **🕵️ کۆڵانی نهێنی (`Shadow Rain Alley` — Secret Broker Kawa `کاوەی سێبەر` & Director Dara Miran)**

### 🏃 Phase 4 — Animations, Freedom, Companion AI & City Gameplay
- Smooth 60fps walk, sprint/dash, swim-in-pool, and **drive-supercar-on-city-avenue** animations!
- 360° touch-drag orbit camera + zoom + Companion Hand-Holding Follow across both the Hotel AND the Exterior City!

### 📦 Phase 5 — Build Verification & Permanently Signed Android APK (`v3.0`, `versionCode 10`)
- Validate story (`story check`), TypeScript/Vite build, sign with `MIDNIGHT_VELVET_*` keystore via CI, verify APK size & signature, and publish live preview + direct download link.
