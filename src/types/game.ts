export type LocationId = 
  | 'town' 
  | 'forest' 
  | 'mine' 
  | 'house' 
  | 'church' 
  | 'lab';

export type TimeOfDay = 'day' | 'sunset' | 'night' | 'midnight';
export type DayNightPhase = 'DAY' | 'NIGHT';

export interface PlayerStats {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  sanity: number; // 0-100, drops in darkness or near entities
  isSprinting: boolean;
  isSwinging: boolean;
  swingCooldown: number;
  flashlightOn: boolean;
  flashlightBattery: number; // 0-100
  selectedSlot: number;
  equippedWeapon: 'bat' | 'sword';
  currentLocation: LocationId;
}

export type ItemType = 'tool' | 'weapon' | 'key' | 'clue' | 'consumable';

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  icon: string;
  quantity?: number;
  canEquip?: boolean;
}

export interface Clue {
  id: string;
  title: string;
  category: 'document' | 'photograph' | 'artifact' | 'recording' | 'biological';
  description: string;
  locationFound: LocationId;
  details: string;
  contradictionWith?: string;
  isSuspicious?: boolean;
  discovered: boolean;
  icon: string;
  connections: string[]; // ids of connected clues
}

export interface CaseDeduction {
  id: string;
  prompt: string;
  requiredClues: string[];
  solved: boolean;
  conclusion: string;
  unlockedChapter?: number;
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  location: LocationId;
  x: number;
  y: number;
  width: number;
  height: number;
  dialogueState: number;
  portrait: string;
  isAvailableAtNight: boolean;
}

export interface Enemy {
  id: string;
  type: 'shadow' | 'whisper' | 'crawler';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  detectionRange: number;
  attackRange: number;
  damage: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee';
  facing: 'left' | 'right';
  location: LocationId;
}

export interface InteractiveObject {
  id: string;
  type: 'door' | 'clue' | 'chest' | 'puzzle' | 'bed' | 'note' | 'switch' | 'rubble' | 'camera_spot' | 'locker' | 'desk' | 'wardrobe' | 'bookshelf' | 'clock';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  location: LocationId;
  targetLocation?: LocationId;
  targetX?: number;
  targetY?: number;
  doorType?: 'normal' | 'key' | 'password';
  requiresKey?: string;
  requiredKeyName?: string;
  password?: string;
  passwordTitle?: string;
  isLocked?: boolean;
  isUnlocked?: boolean;
  clueId?: string;
  puzzleType?: 'keypad' | 'generator' | 'symbols' | 'camera';
  isSearched?: boolean;
  fixedLoot?: {
    type: 'sword' | 'key' | 'clue' | 'health' | 'battery' | 'note' | 'empty';
    itemId?: string;
    clueId?: string;
    noteTitle?: string;
    noteText?: string;
    keyName?: string;
  };
  data?: Record<string, any>;
}

export interface HorrorEvent {
  id: string;
  triggerLocation: LocationId;
  triggerCondition: 'night' | 'entry' | 'clue_pickup' | 'stamina_low';
  description: string;
  message?: string;
  executed: boolean;
}

export interface GameSaveData {
  version: number;
  timestamp: number;
  player: {
    x: number;
    y: number;
    health: number;
    stamina: number;
    flashlightOn: boolean;
    flashlightBattery: number;
    currentLocation: LocationId;
    selectedSlot: number;
    equippedWeapon?: 'bat' | 'sword';
  };
  inventory: InventoryItem[];
  clues: Record<string, boolean>;
  solvedDeductions: Record<string, boolean>;
  puzzlesSolved: Record<string, boolean>;
  timeOfDay: TimeOfDay;
  timeClock: number; // 0 to 1440
  phase: DayNightPhase;
  phaseRemainingSeconds: number;
  chapter: number;
  npcDialogueStates: Record<string, number>;
  unlockedDoors: Record<string, boolean>;
  searchedLockers: Record<string, boolean>;
  brokenWalls: Record<string, boolean>;
  polaroidsTaken: string[];
}

