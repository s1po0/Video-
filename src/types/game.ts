export type Locale = 'ckb' | 'en';

export interface LocalizedText {
  ckb: string;
  en: string;
}

export type HeroineId = 'layla' | 'celine' | 'aria';

export type MoodType = 'flirty' | 'heated' | 'vulnerable' | 'jealous' | 'radiant';

export type ReplyStyle = 'bold' | 'tender' | 'playful';

export type TimePhase = 0 | 1 | 2 | 3; // 0: Evening, 1: Late Night, 2: Midnight, 3: After-Hours

export type LocationId =
  | 'lounge'
  | 'pool'
  | 'fireplace'
  | 'balcony'
  | 'boutique'
  | 'suite';

export type GiftTag =
  | 'luxury'
  | 'music'
  | 'sweet'
  | 'mystery'
  | 'scent'
  | 'intimate'
  | 'paris'
  | 'mixology';

export interface GiftItem {
  id: string;
  icon: string;
  name: LocalizedText;
  desc: LocalizedText;
  price: number;
  tags: GiftTag[];
}

export interface HeroineState {
  id: HeroineId;
  affection: number; // 0..220+
  desire: number; // 0..100 (Passion / Heat meter)
  trust: number; // 0..100
  rank: number; // 1..5
  mood: MoodType;
  unlockedChapter: number; // 0..5 completed story chapters
  giftsGiven: number;
  memories: LocalizedText[];
}

export interface PhoneMessage {
  sender: 'her' | 'you';
  text: LocalizedText;
  image?: string;
}

export interface PhoneThread {
  id: string;
  heroine: HeroineId;
  minNight: number;
  minAffection: number;
  opening: PhoneMessage[];
  options: {
    style: ReplyStyle;
    label: LocalizedText;
    herReply: PhoneMessage[];
    affectionDelta: number;
    desireDelta: number;
    newMood?: MoodType;
    memory?: LocalizedText;
  }[];
}

export interface SceneBeat {
  speaker: 'narrator' | 'you' | HeroineId | 'all';
  image: string;
  camera?: 'normal' | 'close' | 'intimate_zoom' | 'pan_left' | 'pan_right';
  text: LocalizedText;
  effect?: 'none' | 'heartbeat' | 'lightning' | 'warm_glow' | 'shake';
  unlockCg?: string;
}

export interface EncounterChoice {
  id: string;
  style: ReplyStyle;
  text: LocalizedText;
  affectionDelta: number;
  desireDelta: number;
  trustDelta: number;
  charmGain?: number;
  triggerHeartbeat?: boolean; // Launches Heartbeat Sync minigame!
  followUpBeats: SceneBeat[];
  passionBonusBeats?: SceneBeat[]; // Unlocked if Heartbeat Sync >= 70% or high desire!
  memory?: LocalizedText;
}

export interface StoryChapter {
  id: string;
  heroine: HeroineId;
  chapterNum: number; // 1..5
  requiredAffection: number;
  location: LocationId;
  title: LocalizedText;
  introBeats: SceneBeat[];
  choices: EncounterChoice[];
}

export interface FinaleEnding {
  id: string;
  number: number;
  heroine: HeroineId | 'trio' | 'solo';
  image: string;
  unlockCg: string;
  badge: LocalizedText;
  title: LocalizedText;
  beats: SceneBeat[];
  summary: LocalizedText;
}

export interface GameState {
  version: number;
  night: number; // 1..7
  phase: TimePhase; // 0..3
  energy: number; // max 3 per night
  cash: number;
  charm: number;
  wit: number;
  boldness: number;
  rubyClues: number; // 0..3 mystery clues found
  inventory: Record<string, number>; // giftId -> count
  heroines: Record<HeroineId, HeroineState>;
  completedThreads: string[];
  activeReplies: Record<string, PhoneMessage[]>;
  seenIntro: boolean;
}

export interface PersistentMeta {
  unlockedCgs: string[];
  unlockedEndings: string[];
}
