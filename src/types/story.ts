export type Locale = 'ckb' | 'en';

export interface LocalizedText {
  ckb: string;
  en: string;
}

export interface StoryVars {
  layla_affection: number;
  celine_affection: number;
  chemistry: number;
  trust: number;
  boldness: number;
  gave_jacket: boolean;
  won_dare: boolean;
  paris_truth: boolean;
  found_locket: boolean;
  danced_with_layla: boolean;
  held_celine_hand: boolean;
  kept_secret: boolean;
}

export type NumericVarKey =
  | 'layla_affection'
  | 'celine_affection'
  | 'chemistry'
  | 'trust'
  | 'boldness';

export type BooleanFlagKey =
  | 'gave_jacket'
  | 'won_dare'
  | 'paris_truth'
  | 'found_locket'
  | 'danced_with_layla'
  | 'held_celine_hand'
  | 'kept_secret';

export interface ConditionClause {
  var: keyof StoryVars;
  op: '>=' | '<=' | '==';
  value: number | boolean;
}

export type SceneEffect =
  | 'none'
  | 'heartbeat'
  | 'lightning'
  | 'warm_glow'
  | 'shake'
  | 'fade_black';

export type AtmosphereMode =
  | 'rain_storm'
  | 'candle_embers'
  | 'balcony_mist'
  | 'dawn_gold';

export type MusicMood =
  | 'midnight_jazz'
  | 'tension_pulse'
  | 'tender_piano'
  | 'passionate_strings'
  | 'dawn_warmth';

export type CameraFraming =
  | 'normal'
  | 'close'
  | 'intimate_zoom'
  | 'pan_left'
  | 'pan_right';

export type SpeakerId = 'narrator' | 'you' | 'layla' | 'celine' | 'both';

export interface ChoiceOption {
  id: string;
  text: LocalizedText;
  toneTag?: LocalizedText;
  to: string;
  conditions?: ConditionClause[];
  lockedHint?: LocalizedText;
  effects?: Partial<Record<NumericVarKey, number>>;
  flags?: Partial<Record<BooleanFlagKey, boolean>>;
}

export interface ReactiveAddon {
  flag: BooleanFlagKey;
  text: LocalizedText;
}

export interface EndingInfo {
  id: string;
  number: number;
  heroine: 'layla' | 'celine' | 'both';
  badge: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
}

export interface DynamicRedirect {
  conditions: ConditionClause[];
  to: string;
}

export interface StoryNode {
  id: string;
  chapter: number;
  chapterTitle: LocalizedText;
  speaker: SpeakerId;
  image: string;
  camera?: CameraFraming;
  atmosphere: AtmosphereMode;
  music: MusicMood;
  effect?: SceneEffect;
  unlockCg?: string;
  text: LocalizedText;
  reactiveAddons?: ReactiveAddon[];
  next?: string;
  redirects?: DynamicRedirect[];
  choices?: ChoiceOption[];
  ending?: EndingInfo;
}

export interface SaveSlotData {
  slotId: string;
  savedAt: string;
  nodeId: string;
  chapter: number;
  chapterTitle: LocalizedText;
  previewText: LocalizedText;
  image: string;
  vars: StoryVars;
  history: BacklogEntry[];
}

export interface BacklogEntry {
  nodeId: string;
  speaker: SpeakerId;
  text: LocalizedText;
}

export interface PersistentData {
  seenNodes: string[];
  unlockedCgs: string[];
  unlockedEndings: string[];
  customNodes?: Record<string, StoryNode>;
}
