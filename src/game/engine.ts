import { 
  LocationId, 
  TimeOfDay, 
  DayNightPhase,
  PlayerStats, 
  InventoryItem, 
  Clue, 
  NPC, 
  Enemy, 
  InteractiveObject,
  GameSaveData 
} from '../types/game';
import { WORLD_LOCATIONS, LocationData, Platform } from './worldData';
import { INITIAL_CLUES, INITIAL_DEDUCTIONS } from './cluesData';
import { INITIAL_INVENTORY, SPECIAL_ITEMS } from './itemsData';
import { spriteAtlas } from './sprites';
import { sound } from './audio';

export interface CameraState {
  x: number;
  y: number;
  shakeTime: number;
  shakeIntensity: number;
}

export interface HorrorState {
  silhouetteVisible: boolean;
  silhouetteX: number;
  silhouetteY: number;
  silhouetteAlpha: number;
  flickerBlackout: boolean;
  blackoutTimer: number;
  activeHorrorMessage: string | null;
  messageTimer: number;
  screenGlitch: number; // 0 to 1
  recentPolaroidText: string | null;
  polaroidDisplayTimer: number;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;

  // Game state
  public isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // Player
  public player: PlayerStats;
  public inventory: InventoryItem[] = [];
  public clues: Map<string, Clue> = new Map();
  public deductions = INITIAL_DEDUCTIONS;
  public solvedPuzzles: Set<string> = new Set();
  public brokenWalls: Set<string> = new Set();
  public unlockedDoors: Set<string> = new Set();
  public chapter: number = 1;

  // Time & Environment
  public phase: DayNightPhase = 'DAY';
  public phaseRemainingSeconds: number = 300; // 5 minutes DAY, 3 minutes NIGHT
  public nightWarningPlayed: boolean = false;
  public timeMinutes: number = 720; // 12:00 PM start
  public timeSpeed: number = 1.0;
  public timeOfDay: TimeOfDay = 'day';

  // Lockers & Containers
  public searchedLockers: Set<string> = new Set();

  // Camera & Viewport
  public camera: CameraState = { x: 0, y: 0, shakeTime: 0, shakeIntensity: 0 };
  public currentWorld: LocationData;

  // Dynamic entities per location
  public locationEnemies: Map<LocationId, Enemy[]> = new Map();
  public locationNpcs: Map<LocationId, NPC[]> = new Map();

  // Horror System
  public horror: HorrorState = {
    silhouetteVisible: false,
    silhouetteX: 0,
    silhouetteY: 0,
    silhouetteAlpha: 0,
    flickerBlackout: false,
    blackoutTimer: 0,
    activeHorrorMessage: null,
    messageTimer: 0,
    screenGlitch: 0,
    recentPolaroidText: null,
    polaroidDisplayTimer: 0,
  };
  private horrorEventCooldown: number = 25; // seconds

  // Controls input state
  public keys: Record<string, boolean> = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    sprint: false,
    interact: false,
    swing: false,
  };

  // UI Event hooks
  public onInteractPromptChange?: (prompt: string | null, targetObj?: InteractiveObject, targetNpc?: NPC) => void;
  public onClueFound?: (clue: Clue) => void;
  public onDialogueTrigger?: (npc: NPC) => void;
  public onPuzzleTrigger?: (puzzleType: string, obj: InteractiveObject) => void;
  public onEndingTrigger?: (endingId: number) => void;
  public onStatsChange?: (stats: PlayerStats, timeString: string, timeOfDay: TimeOfDay) => void;
  public onNotification?: (msg: string) => void;

  // Camera flash effect
  public flashIntensity: number = 0;

  // Nearby target cache
  public nearbyObject: InteractiveObject | null = null;
  public nearbyNpc: NPC | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d')!;

    // Initial player stats
    this.player = {
      x: 350,
      y: 380,
      vx: 0,
      vy: 0,
      width: 24,
      height: 44,
      isGrounded: true,
      facing: 'right',
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      sanity: 100,
      isSprinting: false,
      isSwinging: false,
      swingCooldown: 0,
      flashlightOn: false,
      flashlightBattery: 100,
      selectedSlot: 0,
      equippedWeapon: 'bat',
      currentLocation: 'town',
    };

    this.currentWorld = WORLD_LOCATIONS['town'];
    this.initInventoryAndClues();
    this.initWorldEntities();
    this.loadGame();
  }

  private initInventoryAndClues() {
    this.inventory = [...INITIAL_INVENTORY];
    INITIAL_CLUES.forEach(clue => {
      this.clues.set(clue.id, { ...clue });
    });
  }

  private initWorldEntities() {
    for (const locKey of Object.keys(WORLD_LOCATIONS) as LocationId[]) {
      const loc = WORLD_LOCATIONS[locKey];
      this.locationEnemies.set(locKey, loc.enemies.map(e => ({ ...e })));
      this.locationNpcs.set(locKey, loc.npcs.map(n => ({ ...n })));
    }
  }

  public setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
  }

  // --- GAME LIFECYCLE ---

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    sound.startAmbiance(this.player.currentLocation, this.timeOfDay === 'night' || this.timeOfDay === 'midnight');
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sound.stopAmbiance();
  }

  private loop = () => {
    if (!this.isRunning) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // --- UPDATE LOGIC ---

  public update(dt: number) {
    this.updateTimeOfDay(dt);
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateCamera(dt);
    this.updateHorror(dt);
    this.checkInteractions();

    if (this.flashIntensity > 0) {
      this.flashIntensity = Math.max(0, this.flashIntensity - dt * 2.5);
    }

    // Notify React layer with updated stats periodically
    if (this.onStatsChange) {
      const timeStr = this.getPhaseTimeString();
      this.onStatsChange({ ...this.player }, timeStr, this.timeOfDay);
    }
  }

  public getPhaseTimeString(): string {
    const mins = Math.floor(this.phaseRemainingSeconds / 60);
    const secs = Math.floor(this.phaseRemainingSeconds % 60);
    return `${this.phase} ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private updateTimeOfDay(dt: number) {
    this.phaseRemainingSeconds -= dt;

    if (this.phase === 'DAY') {
      this.timeOfDay = this.phaseRemainingSeconds <= 30 ? 'sunset' : 'day';

      // 30 seconds warning before night
      if (this.phaseRemainingSeconds <= 30 && !this.nightWarningPlayed) {
        this.nightWarningPlayed = true;
        sound.playNightWarning();
        this.onNotification?.('DUSK WARNING: 30 seconds until NIGHT begins... Prepare weapon or hide!');
      }

      if (this.phaseRemainingSeconds <= 0) {
        this.startNightPhase();
      }
    } else {
      // NIGHT
      this.timeOfDay = this.phaseRemainingSeconds <= 60 ? 'midnight' : 'night';

      if (this.phaseRemainingSeconds <= 0) {
        this.startDayPhase();
      }
    }
  }

  public startNightPhase() {
    this.phase = 'NIGHT';
    this.phaseRemainingSeconds = 180; // exactly 3 minutes
    this.timeOfDay = 'night';
    this.nightWarningPlayed = false;

    // Spawn night monsters across the world
    this.spawnNightMonsters();

    sound.setNightMode(true);
    sound.playHorrorSting();
    sound.startAmbiance(this.player.currentLocation, true);
    this.camera.shakeIntensity = 8;
    this.camera.shakeTime = 0.5;
    this.onNotification?.('NIGHT HAS FALLEN — PROWLING MONSTERS HAVE AWAKENED');
  }

  public startDayPhase() {
    this.phase = 'DAY';
    this.phaseRemainingSeconds = 300; // exactly 5 minutes
    this.timeOfDay = 'day';
    this.nightWarningPlayed = false;

    // Despawn / clear monsters from open areas
    this.despawnNightMonsters();

    sound.setNightMode(false);
    sound.playPuzzleSuccess();
    sound.startAmbiance(this.player.currentLocation, false);
    this.onNotification?.('DAWN BREAKS — MONSTERS RETREAT UNDERGROUND');
  }

  private spawnNightMonsters() {
    // 1. Town: 2 shadow stalkers
    this.locationEnemies.set('town', [
      {
        id: 'shadow_town_1',
        type: 'shadow',
        x: 650,
        y: 410,
        vx: 0,
        vy: 0,
        width: 28,
        height: 28,
        health: 50,
        maxHealth: 50,
        speed: 1.3,
        detectionRange: 260,
        attackRange: 35,
        damage: 15,
        state: 'patrol',
        facing: 'left',
        location: 'town'
      },
      {
        id: 'shadow_town_2',
        type: 'shadow',
        x: 1550,
        y: 410,
        vx: 0,
        vy: 0,
        width: 28,
        height: 28,
        health: 50,
        maxHealth: 50,
        speed: 1.4,
        detectionRange: 270,
        attackRange: 35,
        damage: 15,
        state: 'patrol',
        facing: 'right',
        location: 'town'
      }
    ]);

    // 2. Forest: 2 shadows + 1 whisper
    this.locationEnemies.set('forest', [
      {
        id: 'shadow_forest_1',
        type: 'shadow',
        x: 950,
        y: 410,
        vx: 0,
        vy: 0,
        width: 28,
        height: 28,
        health: 55,
        maxHealth: 55,
        speed: 1.5,
        detectionRange: 280,
        attackRange: 35,
        damage: 18,
        state: 'patrol',
        facing: 'left',
        location: 'forest'
      },
      {
        id: 'whisper_forest_1',
        type: 'whisper',
        x: 1600,
        y: 390,
        vx: 0,
        vy: 0,
        width: 24,
        height: 50,
        health: 65,
        maxHealth: 65,
        speed: 1.2,
        detectionRange: 320,
        attackRange: 45,
        damage: 22,
        state: 'patrol',
        facing: 'left',
        location: 'forest'
      }
    ]);

    // 3. House: 1 whisper
    this.locationEnemies.set('house', [
      {
        id: 'whisper_house_1',
        type: 'whisper',
        x: 950,
        y: 390,
        vx: 0,
        vy: 0,
        width: 24,
        height: 50,
        health: 50,
        maxHealth: 50,
        speed: 1.1,
        detectionRange: 250,
        attackRange: 40,
        damage: 18,
        state: 'patrol',
        facing: 'left',
        location: 'house'
      }
    ]);
  }

  private despawnNightMonsters() {
    // Monsters dissolve into shadow mist in open areas
    this.locationEnemies.set('town', []);
    this.locationEnemies.set('forest', []);
    this.locationEnemies.set('house', []);
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    // Stamina recovery / drain
    const isMoving = this.keys.left || this.keys.right;
    if (this.keys.sprint && isMoving && p.stamina > 5) {
      p.isSprinting = true;
      p.stamina = Math.max(0, p.stamina - dt * 22);
    } else {
      p.isSprinting = false;
      p.stamina = Math.min(p.maxStamina, p.stamina + dt * 14);
    }

    // Flashlight battery drain
    if (p.flashlightOn) {
      p.flashlightBattery = Math.max(0, p.flashlightBattery - dt * 0.8);
      if (p.flashlightBattery <= 0) {
        p.flashlightOn = false;
        sound.playFlashlight();
        this.onNotification?.('Flashlight battery depleted!');
      }
    }

    // Swing cooldown
    if (p.swingCooldown > 0) {
      p.swingCooldown -= dt;
      if (p.swingCooldown <= 0) {
        p.isSwinging = false;
      }
    }

    // Ladder climbing
    let onLadder = false;
    for (const plat of this.currentWorld.platforms) {
      if (plat.type === 'ladder') {
        if (
          p.x + p.width > plat.x &&
          p.x < plat.x + plat.width &&
          p.y + p.height > plat.y &&
          p.y < plat.y + plat.height
        ) {
          onLadder = true;
          break;
        }
      }
    }

    if (onLadder && (this.keys.up || this.keys.down)) {
      p.vy = this.keys.up ? -120 : 120;
      p.isGrounded = false;
    } else if (!onLadder) {
      // Gravity
      p.vy = Math.min(p.vy + 540 * dt, 500);
    }

    // Horizontal speed
    const baseSpeed = p.isSprinting ? 210 : 130;
    if (this.keys.left) {
      p.vx = -baseSpeed;
      p.facing = 'left';
    } else if (this.keys.right) {
      p.vx = baseSpeed;
      p.facing = 'right';
    } else {
      p.vx *= 0.7;
      if (Math.abs(p.vx) < 5) p.vx = 0;
    }

    // Footstep audio
    if (p.isGrounded && Math.abs(p.vx) > 20 && Math.random() < dt * (p.isSprinting ? 4.5 : 2.8)) {
      const surface = (this.player.currentLocation === 'forest' ? 'grass' : (this.player.currentLocation === 'house' ? 'wood' : 'stone'));
      sound.playFootstep(surface);
    }

    // Jump
    if ((this.keys.jump || this.keys.up) && p.isGrounded && !onLadder) {
      p.vy = -270;
      p.isGrounded = false;
      sound.playFootstep('stone');
    }

    // Apply movement & collisions
    p.x += p.vx * dt;
    // World boundary
    p.x = Math.max(10, Math.min(this.currentWorld.width - p.width - 10, p.x));

    p.y += p.vy * dt;
    p.isGrounded = false;

    // Solid platform collisions
    for (const plat of this.currentWorld.platforms) {
      if (plat.type === 'solid') {
        // Falling down onto solid platform
        if (
          p.x + p.width - 4 > plat.x &&
          p.x + 4 < plat.x + plat.width &&
          p.y + p.height >= plat.y &&
          p.y + p.height - p.vy * dt <= plat.y + 12
        ) {
          p.y = plat.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
        }
      }
    }

    // Ground clamp
    if (p.y + p.height >= this.currentWorld.groundY) {
      p.y = this.currentWorld.groundY - p.height;
      p.vy = 0;
      p.isGrounded = true;
    }
  }

  private updateEnemies(dt: number) {
    const enemies = this.locationEnemies.get(this.player.currentLocation) || [];
    const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'midnight';
    const isCaveOrLab = this.player.currentLocation === 'mine' || this.player.currentLocation === 'lab';
    let maxProximity = 0;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.health <= 0) {
        enemies.splice(i, 1);
        continue;
      }

      // Check distance to player
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 400) {
        maxProximity = Math.max(maxProximity, 1 - dist / 400);
      }

      // If day and outside, enemies fade or are dormant
      if (!isNight && !isCaveOrLab) {
        e.state = 'idle';
        continue;
      }

      // Flashlight repulsion/stun
      const facingPlayer = (this.player.facing === 'right' && dx < 0) || (this.player.facing === 'left' && dx > 0);
      const inFlashlight = this.player.flashlightOn && !facingPlayer && dist < 170;

      if (inFlashlight) {
        // Flee or slow down
        e.state = 'flee';
        e.vx = (dx > 0 ? -1 : 1) * (e.speed * 40);
        e.facing = dx > 0 ? 'left' : 'right';
      } else if (dist < e.detectionRange) {
        // Chase player
        if (e.state !== 'chase') {
          sound.triggerMonsterTension();
        }
        e.state = 'chase';
        e.facing = dx > 0 ? 'right' : 'left';
        e.vx = (dx > 0 ? 1 : -1) * (e.speed * 60);

        // Attack if in range
        if (dist < e.attackRange) {
          e.state = 'attack';
          this.damagePlayer(e.damage * dt);
          if (Math.random() < dt * 1.5) {
            sound.playMonsterGroan();
            this.camera.shakeIntensity = 6;
            this.camera.shakeTime = 0.3;
          }
        }
      } else {
        // Patrol
        e.state = 'patrol';
        if (Math.random() < dt * 0.5) {
          e.facing = e.facing === 'left' ? 'right' : 'left';
        }
        e.vx = (e.facing === 'right' ? 1 : -1) * (e.speed * 25);
      }

      // Move enemy
      e.x += e.vx * dt;
      e.x = Math.max(20, Math.min(this.currentWorld.width - e.width - 20, e.x));
      e.y = this.currentWorld.groundY - e.height;
    }

    sound.updateFear(maxProximity);
  }

  public damagePlayer(amt: number) {
    this.player.health = Math.max(0, this.player.health - amt);
    if (this.player.health <= 0) {
      this.onNotification?.('You succumbed to the shadows... (Revived in Town)');
      sound.playHorrorSting();
      this.respawnPlayer();
    }
  }

  public respawnPlayer() {
    this.player.health = 100;
    this.player.stamina = 100;
    this.player.currentLocation = 'town';
    this.currentWorld = WORLD_LOCATIONS['town'];
    this.player.x = 350;
    this.player.y = 380;
    sound.startAmbiance('town', false);
  }

  private updateCamera(dt: number) {
    const targetX = this.player.x - this.canvas.width / 2;
    const targetY = this.player.y - this.canvas.height / 2;

    this.camera.x += (targetX - this.camera.x) * 6 * dt;
    this.camera.y += (targetY - this.camera.y) * 6 * dt;

    // Clamp camera within world bounds
    const maxCamX = Math.max(0, this.currentWorld.width - this.canvas.width);
    const maxCamY = Math.max(0, this.currentWorld.height - this.canvas.height);

    this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxCamY, this.camera.y));

    if (this.camera.shakeTime > 0) {
      this.camera.shakeTime -= dt;
      const shakeAmt = this.camera.shakeIntensity;
      this.camera.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.y += (Math.random() - 0.5) * shakeAmt;
    }
  }

  private updateHorror(dt: number) {
    const h = this.horror;
    const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'midnight';

    // Blackout timer
    if (h.blackoutTimer > 0) {
      h.blackoutTimer -= dt;
      if (h.blackoutTimer <= 0) {
        h.flickerBlackout = false;
      }
    }

    // Message timer
    if (h.messageTimer > 0) {
      h.messageTimer -= dt;
      if (h.messageTimer <= 0) {
        h.activeHorrorMessage = null;
      }
    }

    // Polaroid anomaly timer
    if (h.polaroidDisplayTimer > 0) {
      h.polaroidDisplayTimer -= dt;
      if (h.polaroidDisplayTimer <= 0) {
        h.recentPolaroidText = null;
      }
    }

    // Decrement cooldown
    this.horrorEventCooldown -= dt;

    // Unpredictable dynamic psychological horror events
    if (this.horrorEventCooldown <= 0 && isNight && Math.random() < 0.08) {
      this.triggerRandomHorrorEvent();
      this.horrorEventCooldown = 25 + Math.random() * 35; // 25 to 60 seconds
    }

    // Silhouette fade
    if (h.silhouetteVisible) {
      const dist = Math.abs(this.player.x - h.silhouetteX);
      if (dist < 180) {
        // Player got close -> vanish into mist!
        h.silhouetteAlpha = Math.max(0, h.silhouetteAlpha - dt * 3);
        if (h.silhouetteAlpha <= 0) {
          h.silhouetteVisible = false;
        }
      } else {
        h.silhouetteAlpha = Math.min(0.85, h.silhouetteAlpha + dt * 1.5);
      }
    }
  }

  private triggerRandomHorrorEvent() {
    const eventRoll = Math.floor(Math.random() * 4);

    if (eventRoll === 0) {
      // 1. Sudden Light Flicker Blackout
      this.horror.flickerBlackout = true;
      this.horror.blackoutTimer = 2.0;
      sound.playHorrorSting();
      this.horror.screenGlitch = 0.8;
      setTimeout(() => {
        this.horror.screenGlitch = 0;
      }, 500);
      this.horror.activeHorrorMessage = 'ТЫ УЖЕ БЫЛ ЗДЕСЬ РАНЬШЕ.';
      this.horror.messageTimer = 3.5;
    } else if (eventRoll === 1) {
      // 2. Distant Silhouette at edge of screen
      this.horror.silhouetteVisible = true;
      const offset = (this.player.facing === 'right' ? 320 : -320);
      this.horror.silhouetteX = Math.max(50, Math.min(this.currentWorld.width - 50, this.player.x + offset));
      this.horror.silhouetteY = this.currentWorld.groundY - 50;
      this.horror.silhouetteAlpha = 0.1;
      sound.playMonsterGroan();
    } else if (eventRoll === 2) {
      // 3. Phantom Footsteps behind player
      setTimeout(() => sound.playFootstep('wood'), 200);
      setTimeout(() => sound.playFootstep('wood'), 500);
      setTimeout(() => sound.playFootstep('wood'), 850);
      this.horror.activeHorrorMessage = '...за спиной эхом раздаются тяжёлые шаги.';
      this.horror.messageTimer = 2.5;
    } else if (eventRoll === 3) {
      // 4. Door Slam
      sound.playDoor(true);
      this.camera.shakeIntensity = 8;
      this.camera.shakeTime = 0.4;
      this.horror.activeHorrorMessage = 'Вдали с грохотом захлопнулась тяжёлая дверь!';
      this.horror.messageTimer = 3.0;
    }
  }

  private checkInteractions() {
    this.nearbyObject = null;
    this.nearbyNpc = null;

    const p = this.player;
    const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'midnight';

    // Check NPCs
    const npcs = this.locationNpcs.get(p.currentLocation) || [];
    for (const npc of npcs) {
      // Martha disappears at night, Stranger appears only at night
      if (npc.id === 'martha' && isNight) continue;
      if (npc.id === 'stranger' && !isNight) continue;

      const dx = Math.abs((p.x + p.width / 2) - (npc.x + npc.width / 2));
      const dy = Math.abs((p.y + p.height / 2) - (npc.y + npc.height / 2));
      if (dx < 45 && dy < 50) {
        this.nearbyNpc = npc;
        this.onInteractPromptChange?.(`Поговорить с ${npc.name} [E]`, undefined, npc);
        return;
      }
    }

    // Check Interactive Objects
    for (const obj of this.currentWorld.objects) {
      // Check if rubble is broken
      if (obj.type === 'rubble' && this.brokenWalls.has(obj.id)) continue;

      const dx = Math.abs((p.x + p.width / 2) - (obj.x + obj.width / 2));
      const dy = Math.abs((p.y + p.height / 2) - (obj.y + obj.height / 2));
      const hitDist = obj.width / 2 + 30;

      if (dx < hitDist && dy < 60) {
        this.nearbyObject = obj;
        let label = obj.label;

        if (obj.type === 'locker') {
          if (this.searchedLockers.has(obj.id)) {
            label = `${obj.label} [Осмотрено]`;
          } else {
            label = 'Обыскать шкафчик [E]';
          }
        } else if (obj.type === 'desk' || obj.type === 'wardrobe' || obj.type === 'bookshelf' || obj.type === 'clock') {
          if (this.searchedLockers.has(obj.id)) {
            label = `${obj.label} [Осмотрено]`;
          } else {
            label = 'Осмотреть [E]';
          }
        } else if (obj.type === 'door') {
          if (obj.doorType === 'password' && !this.unlockedDoors.has(obj.id)) {
            label = 'Ввести пароль [Q / E]';
          } else if (obj.doorType === 'key' && !this.unlockedDoors.has(obj.id)) {
            const hasKey = this.inventory.some(i => i.id === obj.requiresKey);
            if (hasKey) {
              label = 'Открыть ключом [Q / E]';
            } else {
              label = `Дверь заперта (Нужен ${obj.requiredKeyName || 'ключ'})`;
            }
          } else if (obj.requiresKey && !this.unlockedDoors.has(obj.id)) {
            const hasKey = this.inventory.some(i => i.id === obj.requiresKey);
            if (hasKey) {
              label = 'Открыть ключом [Q / E]';
            } else {
              label = `Дверь заперта (Нужен ${obj.requiredKeyName || 'Ключ #13'})`;
            }
          } else {
            label = `${obj.label} [Q / E]`;
          }
        }

        this.onInteractPromptChange?.(`${label}`, obj, undefined);
        return;
      }
    }

    this.onInteractPromptChange?.(null);
  }

  // --- ACTIONS ---

  /**
   * Enter door / room action (mapped to [Q] and [E])
   */
  public handleEnterRoom(): boolean {
    // If nearby object is a door, interact with it to enter the room
    if (this.nearbyObject && this.nearbyObject.type === 'door') {
      this.handleDoorInteraction(this.nearbyObject);
      return true;
    }

    // Also check if any door in current world is within reasonable reach
    const p = this.player;
    for (const obj of this.currentWorld.objects) {
      if (obj.type === 'door') {
        const dx = Math.abs((p.x + p.width / 2) - (obj.x + obj.width / 2));
        const dy = Math.abs((p.y + p.height / 2) - (obj.y + obj.height / 2));
        const hitDist = obj.width / 2 + 45;
        if (dx < hitDist && dy < 75) {
          this.handleDoorInteraction(obj);
          return true;
        }
      }
    }

    return false;
  }

  public handleDoorInteraction(obj: InteractiveObject) {
    if (obj.doorType === 'password' && !this.unlockedDoors.has(obj.id)) {
      this.onPuzzleTrigger?.('password', obj);
      return;
    }

    if ((obj.doorType === 'key' || obj.requiresKey) && !this.unlockedDoors.has(obj.id)) {
      const keyId = obj.requiresKey || 'item_rusty_key';
      const hasKey = this.inventory.some(i => i.id === keyId);
      if (hasKey) {
        this.unlockedDoors.add(obj.id);
        sound.playPuzzleSuccess();
        this.onNotification?.(`Дверь открыта ключом: ${obj.requiredKeyName || 'ключ'}!`);
      } else {
        sound.playDoor(true);
        this.onNotification?.(`Дверь заперта. Нужен ${obj.requiredKeyName || 'ключ'}.`);
        return;
      }
    }

    if (obj.targetLocation) {
      this.transitionToLocation(obj.targetLocation, obj.targetX || 100, obj.targetY || 380);
    }
  }

  public handleInteract() {
    if (this.nearbyNpc) {
      this.onDialogueTrigger?.(this.nearbyNpc);
      return;
    }

    if (this.nearbyObject) {
      const obj = this.nearbyObject;

      // 1. Lockers & Interactive Furniture
      if (obj.type === 'locker' || obj.type === 'desk' || obj.type === 'wardrobe' || obj.type === 'bookshelf' || obj.type === 'clock') {
        if (this.searchedLockers.has(obj.id)) {
          this.onNotification?.('Уже осмотрено.');
          return;
        }

        this.searchedLockers.add(obj.id);
        obj.isSearched = true;
        sound.playLockerOpen();

        // Process fixed or randomized loot
        this.processLockerLoot(obj);
        return;
      }

      // 2. Doors (Key, Password, Normal)
      if (obj.type === 'door') {
        this.handleDoorInteraction(obj);
        return;
      }

      // 3. Clues
      if (obj.type === 'clue' && obj.clueId) {
        const clue = this.clues.get(obj.clueId);
        if (clue) {
          if (!clue.discovered) {
            clue.discovered = true;
            sound.playClueFound();
            this.onNotification?.(`Найдена улика: ${clue.title}`);
            this.onClueFound?.(clue);
            this.advanceChapterCheck();
          } else {
            this.onClueFound?.(clue);
          }
        }
        return;
      }

      // 4. Rubble
      if (obj.type === 'rubble') {
        const hasPickaxe = this.inventory.some(i => i.id === 'item_pickaxe');
        if (hasPickaxe) {
          this.brokenWalls.add(obj.id);
          sound.playHit();
          sound.playPuzzleSuccess();
          this.camera.shakeIntensity = 10;
          this.camera.shakeTime = 0.5;
          this.onNotification?.('Завал в шахте разбит киркой!');
        } else {
          this.onNotification?.('Каменный завал штольни. Нужна кирка.');
        }
        return;
      }

      // 5. Puzzles
      if (obj.type === 'puzzle' && obj.puzzleType) {
        this.onPuzzleTrigger?.(obj.puzzleType, obj);
        return;
      }

      // 6. Camera Spots
      if (obj.type === 'camera_spot') {
        this.onNotification?.('Используйте фотокамеру Polaroid [C], чтобы запечатлеть аномалию.');
        return;
      }
    }
  }

  private processLockerLoot(obj: InteractiveObject) {
    if (obj.fixedLoot) {
      const loot = obj.fixedLoot;
      if (loot.type === 'sword') {
        if (!this.inventory.some(i => i.id === 'item_sword')) {
          this.inventory.push({ ...SPECIAL_ITEMS.item_sword });
        }
        this.player.equippedWeapon = 'sword';
        this.onNotification?.('Найден старинный меч! [ЛКМ для атаки]');
        sound.playSwordSwing();
        return;
      }

      if (loot.type === 'key') {
        const keyId = loot.itemId || 'item_precinct_key';
        const keyItem = (SPECIAL_ITEMS as Record<string, InventoryItem>)[keyId];
        if (keyItem && !this.inventory.some(i => i.id === keyId)) {
          this.inventory.push({ ...keyItem });
        }
        this.onNotification?.(`Найден предмет: ${loot.keyName || 'ключ'}.`);
        sound.playClueFound();
        return;
      }

      if (loot.type === 'battery') {
        this.inventory.push({ ...SPECIAL_ITEMS.item_battery });
        this.player.flashlightBattery = Math.min(100, this.player.flashlightBattery + 40);
        this.onNotification?.(`Найдена батарейка для фонарика. ${loot.noteText || ''}`);
        sound.playFlashlight();
        return;
      }

      if (loot.type === 'health') {
        this.inventory.push({ ...SPECIAL_ITEMS.item_bandage });
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
        this.onNotification?.('Найдены стерильные бинты (+30 HP).');
        sound.playClueFound();
        return;
      }

      if (loot.type === 'note') {
        if (loot.itemId && (SPECIAL_ITEMS as Record<string, InventoryItem>)[loot.itemId]) {
          if (!this.inventory.some(i => i.id === loot.itemId)) {
            this.inventory.push({ ...(SPECIAL_ITEMS as Record<string, InventoryItem>)[loot.itemId] });
          }
        }
        this.onNotification?.(`Найдена записка: "${loot.noteTitle || 'Записка'}" — ${loot.noteText || ''}`);
        sound.playClueFound();
        return;
      }
    }

    // Randomized loot: 25% empty, 20% clue/note, 15% key, 10% sword, 15% health, 15% battery
    const roll = Math.random() * 100;

    if (roll < 25) {
      this.onNotification?.('Шкафчик пуст.');
    } else if (roll < 45) {
      this.onNotification?.('Найдена порванная записка: "Когда сгущаются тени, держи фонарь наготове и слушай колокол."');
      sound.playClueFound();
    } else if (roll < 60) {
      // Key
      if (!this.inventory.some(i => i.id === 'item_precinct_key')) {
        this.inventory.push({ ...SPECIAL_ITEMS.item_precinct_key });
        this.onNotification?.('Найден ржавый ключ от участка.');
        sound.playClueFound();
      } else if (!this.inventory.some(i => i.id === 'item_cellar_key')) {
        this.inventory.push({ ...SPECIAL_ITEMS.item_cellar_key });
        this.onNotification?.('Найден ключ от подвала.');
        sound.playClueFound();
      } else {
        this.inventory.push({ ...SPECIAL_ITEMS.item_battery });
        this.onNotification?.('Найдена батарейка для фонарика.');
        sound.playFlashlight();
      }
    } else if (roll < 70) {
      // Sword
      if (!this.inventory.some(i => i.id === 'item_sword')) {
        this.inventory.push({ ...SPECIAL_ITEMS.item_sword });
        this.player.equippedWeapon = 'sword';
        this.onNotification?.('Найден старинный меч!');
        sound.playSwordSwing();
      } else {
        this.inventory.push({ ...SPECIAL_ITEMS.item_bandage });
        this.onNotification?.('Найдены медицинские бинты.');
        sound.playClueFound();
      }
    } else if (roll < 85) {
      // Health
      this.inventory.push({ ...SPECIAL_ITEMS.item_bandage });
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 25);
      this.onNotification?.('Найдены медицинские бинты (+25 HP).');
      sound.playClueFound();
    } else {
      // Battery
      this.inventory.push({ ...SPECIAL_ITEMS.item_battery });
      this.player.flashlightBattery = Math.min(100, this.player.flashlightBattery + 40);
      this.onNotification?.('Найдена батарейка для фонарика.');
      sound.playFlashlight();
    }
  }

  public transitionToLocation(newLoc: LocationId, spawnX: number, spawnY: number) {
    sound.playDoor(false);
    this.player.currentLocation = newLoc;
    this.currentWorld = WORLD_LOCATIONS[newLoc];
    this.player.x = spawnX;
    this.player.y = spawnY;
    this.player.vx = 0;
    this.player.vy = 0;

    const isNight = this.phase === 'NIGHT' || this.timeOfDay === 'night' || this.timeOfDay === 'midnight';
    sound.setLocation(newLoc);

    // Minor horror trigger on entering abandoned house or lab
    if (newLoc === 'house' && isNight) {
      setTimeout(() => {
        sound.playDoor(true);
        this.horror.activeHorrorMessage = 'Входная дверь с грохотом захлопнулась за вами.';
        this.horror.messageTimer = 3.0;
      }, 800);
    }
  }

  public toggleFlashlight() {
    if (this.player.flashlightBattery <= 0) {
      this.onNotification?.('Батарейка фонарика разряжена! Используйте запасные батарейки.');
      return;
    }
    this.player.flashlightOn = !this.player.flashlightOn;
    sound.playFlashlight();
  }

  public swingWeapon() {
    if (this.player.swingCooldown > 0) return;
    this.player.isSwinging = true;

    const isSword = this.player.equippedWeapon === 'sword';
    this.player.swingCooldown = isSword ? 0.32 : 0.45;
    const damage = isSword ? 38 : 22;

    if (isSword) {
      sound.playSwordSwing();
    } else {
      sound.playSwing();
    }

    // Damage nearby enemies
    const p = this.player;
    const enemies = this.locationEnemies.get(p.currentLocation) || [];
    const swingRange = isSword ? 60 : 50;

    let hitAny = false;
    for (const e of enemies) {
      const dx = (p.facing === 'right') ? (e.x - p.x) : (p.x - e.x);
      const dy = Math.abs(p.y - e.y);

      if (dx > -10 && dx < swingRange && dy < 45) {
        e.health -= damage;
        e.vx = (p.facing === 'right' ? 140 : -140);
        sound.playHit();
        this.camera.shakeIntensity = isSword ? 6 : 4;
        this.camera.shakeTime = 0.2;
        hitAny = true;
        if (e.health <= 0) {
          this.onNotification?.('Теневое существо повержено!');
        }
      }
    }

    // Clean up defeated enemies
    this.locationEnemies.set(p.currentLocation, enemies.filter(e => e.health > 0));
  }

  public useCamera() {
    this.flashIntensity = 1.0;
    sound.playCamera();
    this.camera.shakeIntensity = 3;
    this.camera.shakeTime = 0.2;

    // Check if in front of an anomaly or camera spot
    const p = this.player;
    const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'midnight';

    // Stun / banish any nearby whisper figures
    const enemies = this.locationEnemies.get(p.currentLocation) || [];
    enemies.forEach(e => {
      const dist = Math.abs(p.x - e.x);
      if (dist < 260) {
        e.health -= 40;
        e.state = 'flee';
      }
    });

    // Check photographic secret reveal
    if (p.currentLocation === 'house' && p.x > 680 && p.x < 850) {
      this.horror.recentPolaroidText = 'СНИМОК POLAROID: Призрачная рука указывает за стену: "4-7-2-9"';
      this.horror.polaroidDisplayTimer = 6.0;
      sound.playClueFound();
      const anomalyClue = this.clues.get('clue_polaroid_anomaly');
      if (anomalyClue && !anomalyClue.discovered) {
        anomalyClue.discovered = true;
        this.onClueFound?.(anomalyClue);
        this.onNotification?.('Особая улика обнаружена: Призрачный снимок Polaroid!');
      }
    } else if (p.currentLocation === 'church') {
      this.horror.recentPolaroidText = 'СНИМОК POLAROID: Тень колокольни открывает рунический узор алтаря: СОЛНЦЕ, ЛУНА, ЧЕРЕП, ЗМЕЯ';
      this.horror.polaroidDisplayTimer = 6.0;
      sound.playClueFound();
    } else if (isNight) {
      this.horror.recentPolaroidText = 'СНИМОК POLAROID: На проявленном фото прямо за вашей спиной стоит высокий силуэт.';
      this.horror.polaroidDisplayTimer = 5.0;
      sound.playHorrorSting();
    } else {
      this.horror.recentPolaroidText = 'POLAROID: Вспышка сработала. На плёнке заброшенный город выглядит пугающе тихим.';
      this.horror.polaroidDisplayTimer = 3.5;
    }
  }

  public useItem(itemId: string) {
    if (itemId === 'item_bandage') {
      const item = this.inventory.find(i => i.id === itemId);
      if (item && (item.quantity ?? 1) > 0) {
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
        item.quantity = (item.quantity ?? 1) - 1;
        if (item.quantity <= 0) {
          this.inventory = this.inventory.filter(i => i.id !== itemId);
        }
        sound.playPuzzleSuccess();
        this.onNotification?.('Использованы бинты. Восстановлено 40 HP.');
      }
    } else if (itemId === 'item_battery') {
      const item = this.inventory.find(i => i.id === itemId);
      if (item && (item.quantity ?? 1) > 0) {
        this.player.flashlightBattery = 100;
        item.quantity = (item.quantity ?? 1) - 1;
        if (item.quantity <= 0) {
          this.inventory = this.inventory.filter(i => i.id !== itemId);
        }
        sound.playFlashlight();
        this.onNotification?.('Батарейка заменена. Заряд фонаря 100%.');
      }
    }
  }

  public advanceChapterCheck() {
    let count = 0;
    this.clues.forEach(c => {
      if (c.discovered) count++;
    });

    if (count >= 1 && this.chapter < 2) {
      this.chapter = 2;
      this.onNotification?.('ОТКРЫТА ГЛАВА 2: ТЁМНЫЙ ЛЕС');
    }
    if (count >= 4 && this.chapter < 3) {
      this.chapter = 3;
      this.onNotification?.('ОТКРЫТА ГЛАВА 3: ЗАБРОШЕННАЯ ШАХТА');
    }
    if (count >= 7 && this.chapter < 4) {
      this.chapter = 4;
      this.onNotification?.('ОТКРЫТА ГЛАВА 4: ТАЙНЫ ЦЕРКВИ');
    }
    if (count >= 10 && this.chapter < 5) {
      this.chapter = 5;
      this.onNotification?.('ОТКРЫТА ГЛАВА 5: ПОДЗЕМНЫЙ БУНКЕР');
    }
    if (count >= 12 && this.chapter < 6) {
      this.chapter = 6;
      this.onNotification?.('ОТКРЫТА ГЛАВА 6: ИСТИНА НА ДНЕ');
    }
  }

  // --- RENDERING ---

  public render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cam = this.camera;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Sky Background with day/night gradient
    this.renderSky(ctx, w, h);

    // 2. Parallax background elements (distant mountains, misty pines)
    this.renderParallax(ctx, cam);

    // 3. World tiles & platforms
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    this.renderPlatforms(ctx);
    this.renderEnvironmentProps(ctx);
    this.renderWallMessages(ctx);
    this.renderObjects(ctx);
    this.renderNpcs(ctx);
    this.renderEnemies(ctx);
    this.renderHorrorSilhouette(ctx);
    this.renderPlayer(ctx);

    ctx.restore();

    // 4. Dynamic 2D Lighting Mask
    this.renderLighting(ctx, w, h, cam);

    // 5. Camera Flash & Horror Glitch Overlays
    this.renderHorrorOverlays(ctx, w, h);
  }

  private renderSky(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const world = this.currentWorld;
    let colors = world.skyGradient.day;
    if (this.timeOfDay === 'sunset') colors = world.skyGradient.sunset;
    else if (this.timeOfDay === 'night' || this.timeOfDay === 'midnight') colors = world.skyGradient.night;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Moon / Sun
    if (this.player.currentLocation === 'town' || this.player.currentLocation === 'forest') {
      const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'midnight';
      ctx.fillStyle = isNight ? '#e2e8f0' : '#fef08a';
      ctx.beginPath();
      const celestialX = w * 0.75 - (this.camera.x * 0.05);
      const celestialY = 70;
      ctx.arc(celestialX, celestialY, isNight ? 18 : 26, 0, Math.PI * 2);
      ctx.fill();

      if (isNight) {
        // Red tinted blood moon at midnight
        if (this.timeOfDay === 'midnight') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(celestialX, celestialY, 20, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private renderParallax(ctx: CanvasRenderingContext2D, cam: CameraState) {
    if (this.player.currentLocation === 'town' || this.player.currentLocation === 'forest') {
      // Distant hill ridges
      ctx.fillStyle = this.timeOfDay === 'day' ? '#1e293b' : '#030712';
      ctx.beginPath();
      ctx.moveTo(0, this.canvas.height - 60);
      for (let x = 0; x <= this.canvas.width; x += 100) {
        const offset = (x + cam.x * 0.15) % 400;
        const y = this.canvas.height - 130 + Math.sin(offset * 0.03) * 35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(this.canvas.width, this.canvas.height);
      ctx.lineTo(0, this.canvas.height);
      ctx.fill();
    }
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D) {
    for (const plat of this.currentWorld.platforms) {
      if (plat.type === 'solid') {
        ctx.fillStyle = plat.color || '#1e293b';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Top rim texture
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(plat.x, plat.y, plat.width, 3);
      } else if (plat.type === 'ladder') {
        // Wooden / iron ladder rungs
        ctx.fillStyle = plat.color || '#78350f';
        ctx.fillRect(plat.x + 2, plat.y, 3, plat.height);
        ctx.fillRect(plat.x + plat.width - 5, plat.y, 3, plat.height);
        for (let ly = plat.y + 8; ly < plat.y + plat.height; ly += 14) {
          ctx.fillRect(plat.x + 2, ly, plat.width - 4, 3);
        }
      }
    }
  }

  private renderEnvironmentProps(ctx: CanvasRenderingContext2D) {
    // Streetlamps in Town
    if (this.player.currentLocation === 'town') {
      const lampSprite = spriteAtlas.getSprite('prop_streetlamp');
      if (lampSprite) {
        [200, 600, 1100, 1650].forEach(lx => {
          ctx.drawImage(lampSprite, lx - 12, this.currentWorld.groundY - 72);
        });
      }
    }

    // Pine trees in Forest
    if (this.player.currentLocation === 'forest') {
      const treeSprite = spriteAtlas.getSprite('prop_pine_tree');
      if (treeSprite) {
        [150, 520, 880, 1200, 1750].forEach(tx => {
          ctx.drawImage(treeSprite, tx, this.currentWorld.groundY - 128);
        });
      }
    }

    // Stained glass in Church
    if (this.player.currentLocation === 'church') {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.fillRect(720, 260, 120, 100);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(720, 260, 120, 100);
    }
  }

  private renderWallMessages(ctx: CanvasRenderingContext2D) {
    if (!this.currentWorld.wallMessages) return;
    const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'midnight';
    const isLabOrMine = this.player.currentLocation === 'mine' || this.player.currentLocation === 'lab';

    for (const msg of this.currentWorld.wallMessages) {
      let isVisible = false;
      if (msg.revealCondition === 'uv_or_night') {
        if (this.player.flashlightOn || isNight || isLabOrMine) {
          // Check proximity to flashlight cone or player
          const dist = Math.abs(this.player.x - msg.x);
          if (dist < 220) isVisible = true;
        }
      } else if (msg.revealCondition === 'polaroid') {
        if (this.horror.polaroidDisplayTimer > 0) isVisible = true;
      }

      if (isVisible) {
        ctx.font = 'bold 15px "VT323", monospace';
        ctx.fillStyle = '#dc2626';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fillText(msg.text, msg.x, msg.y);
        ctx.shadowBlur = 0;
      }
    }
  }

  private renderObjects(ctx: CanvasRenderingContext2D) {
    for (const obj of this.currentWorld.objects) {
      if (obj.type === 'rubble' && this.brokenWalls.has(obj.id)) continue;

      if (obj.type === 'door') {
        const doorSprite = spriteAtlas.getSprite('prop_door');
        if (doorSprite) {
          ctx.drawImage(doorSprite, obj.x, obj.y, obj.width, obj.height);
        } else {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
      } else if (obj.type === 'locker') {
        const isOpened = this.searchedLockers.has(obj.id) || obj.isSearched;
        const sprite = spriteAtlas.getSprite(isOpened ? 'prop_locker_opened' : 'prop_locker_closed');
        if (sprite) {
          ctx.drawImage(sprite, obj.x, obj.y, obj.width, obj.height);
        } else {
          ctx.fillStyle = isOpened ? '#475569' : '#334155';
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
      } else if (obj.type === 'desk') {
        const sprite = spriteAtlas.getSprite('prop_desk');
        if (sprite) ctx.drawImage(sprite, obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === 'wardrobe') {
        const sprite = spriteAtlas.getSprite('prop_wardrobe');
        if (sprite) ctx.drawImage(sprite, obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === 'clock') {
        const sprite = spriteAtlas.getSprite('prop_clock');
        if (sprite) ctx.drawImage(sprite, obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === 'bookshelf') {
        const sprite = spriteAtlas.getSprite('prop_bookshelf');
        if (sprite) ctx.drawImage(sprite, obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === 'clue') {
        const noteSprite = spriteAtlas.getSprite('prop_note');
        if (noteSprite) {
          ctx.drawImage(noteSprite, obj.x, obj.y, obj.width, obj.height);
        }
        // Subtle glimmer circle
        const bob = Math.sin(performance.now() * 0.005) * 3;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.beginPath();
        ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2 + bob, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'rubble') {
        const rubbleSprite = spriteAtlas.getSprite('prop_rubble');
        if (rubbleSprite) {
          ctx.drawImage(rubbleSprite, obj.x, obj.y, obj.width, obj.height);
        }
      } else if (obj.type === 'puzzle') {
        // Altar or terminal
        if (obj.puzzleType === 'symbols') {
          const altarSprite = spriteAtlas.getSprite('prop_altar');
          if (altarSprite) {
            ctx.drawImage(altarSprite, obj.x, obj.y, obj.width, obj.height);
          }
        } else {
          // Terminal console
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(obj.x + 6, obj.y + 8, obj.width - 12, 22);
        }
      }
    }
  }

  private renderNpcs(ctx: CanvasRenderingContext2D) {
    const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'midnight';
    const npcs = this.locationNpcs.get(this.player.currentLocation) || [];

    for (const npc of npcs) {
      if (npc.id === 'martha' && isNight) continue;
      if (npc.id === 'stranger' && !isNight) continue;

      const sprite = spriteAtlas.getSprite(npc.portrait);
      if (sprite) {
        ctx.drawImage(sprite, npc.x, npc.y, npc.width, npc.height);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
      }

      // Name tag
      ctx.font = '14px "VT323", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, npc.x + npc.width / 2, npc.y - 6);
      ctx.textAlign = 'left';
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'midnight';
    const isCaveOrLab = this.player.currentLocation === 'mine' || this.player.currentLocation === 'lab';
    if (!isNight && !isCaveOrLab) return;

    const enemies = this.locationEnemies.get(this.player.currentLocation) || [];
    for (const e of enemies) {
      ctx.save();
      const spriteName = e.type === 'shadow' ? 'enemy_shadow' : (e.type === 'whisper' ? 'enemy_whisper' : 'enemy_crawler');
      const sprite = spriteAtlas.getSprite(spriteName);

      if (e.facing === 'left') {
        ctx.translate(e.x + e.width, e.y);
        ctx.scale(-1, 1);
        if (sprite) ctx.drawImage(sprite, 0, 0, e.width, e.height);
        else {
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(0, 0, e.width, e.height);
        }
      } else {
        if (sprite) ctx.drawImage(sprite, e.x, e.y, e.width, e.height);
        else {
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(e.x, e.y, e.width, e.height);
        }
      }

      // Health bar above enemy if damaged
      if (e.health < e.maxHealth) {
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(e.x, e.y - 8, e.width, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(e.x, e.y - 8, (e.health / e.maxHealth) * e.width, 4);
      }
      ctx.restore();
    }
  }

  private renderHorrorSilhouette(ctx: CanvasRenderingContext2D) {
    const h = this.horror;
    if (h.silhouetteVisible && h.silhouetteAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = h.silhouetteAlpha;
      const sprite = spriteAtlas.getSprite('npc_stranger');
      if (sprite) {
        ctx.drawImage(sprite, h.silhouetteX, h.silhouetteY, 32, 48);
      }
      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    ctx.save();

    let spriteName = 'player_idle';
    if (!p.isGrounded) {
      spriteName = 'player_jump';
    } else if (p.isSwinging) {
      spriteName = p.equippedWeapon === 'sword' ? 'player_sword_swing' : 'player_swing';
    } else if (Math.abs(p.vx) > 10) {
      const step = Math.floor(performance.now() * 0.008) % 2;
      spriteName = step === 0 ? 'player_walk1' : 'player_walk2';
    }

    const sprite = spriteAtlas.getSprite(spriteName);

    if (p.facing === 'left') {
      ctx.translate(p.x + p.width, p.y);
      ctx.scale(-1, 1);
      if (sprite) ctx.drawImage(sprite, 0, 0, p.width, p.height);
      else {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, p.width, p.height);
      }
    } else {
      if (sprite) ctx.drawImage(sprite, p.x, p.y, p.width, p.height);
      else {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(p.x, p.y, p.width, p.height);
      }
    }

    ctx.restore();
  }

  private renderLighting(ctx: CanvasRenderingContext2D, w: number, h: number, cam: CameraState) {
    const lightCtx = this.lightCtx;
    lightCtx.clearRect(0, 0, w, h);

    // Determine ambient darkness
    const world = this.currentWorld;
    let baseDarkness = world.ambientDarkness.day;
    if (this.timeOfDay === 'sunset') baseDarkness = world.ambientDarkness.sunset;
    else if (this.timeOfDay === 'night' || this.timeOfDay === 'midnight') baseDarkness = world.ambientDarkness.night;

    // Smooth darkening during last 30s before night
    if (this.phase === 'DAY' && this.phaseRemainingSeconds <= 30) {
      const progress = (30 - this.phaseRemainingSeconds) / 30; // 0 to 1
      baseDarkness = world.ambientDarkness.day * (1 - progress) + world.ambientDarkness.night * progress;
    }

    if (this.horror.flickerBlackout) {
      baseDarkness = 0.99;
    }

    // Fill darkness layer
    lightCtx.fillStyle = `rgba(3, 7, 18, ${baseDarkness})`;
    lightCtx.fillRect(0, 0, w, h);

    // Cut out lights with destination-out
    lightCtx.globalCompositeOperation = 'destination-out';

    // 1. World light sources (streetlamps, altar glow, campfires)
    for (const light of world.lights) {
      const screenX = light.x - cam.x;
      const screenY = light.y - cam.y;
      if (screenX > -light.radius && screenX < w + light.radius) {
        const flicker = light.flicker ? (Math.sin(performance.now() * 0.015 + light.x) * 6) : 0;
        const rad = Math.max(10, light.radius + flicker);
        const grad = lightCtx.createRadialGradient(screenX, screenY, 5, screenX, screenY, rad);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
        lightCtx.fillStyle = grad;
        lightCtx.beginPath();
        lightCtx.arc(screenX, screenY, rad, 0, Math.PI * 2);
        lightCtx.fill();
      }
    }

    // 2. Player Flashlight Cone & Ambient glow
    const p = this.player;
    const pScreenX = (p.x + p.width / 2) - cam.x;
    const pScreenY = (p.y + p.height / 2) - cam.y;

    // Small aura around player so you never lose your character entirely
    const auraGrad = lightCtx.createRadialGradient(pScreenX, pScreenY, 2, pScreenX, pScreenY, 40);
    auraGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    lightCtx.fillStyle = auraGrad;
    lightCtx.beginPath();
    lightCtx.arc(pScreenX, pScreenY, 40, 0, Math.PI * 2);
    lightCtx.fill();

    // Directional Flashlight Cone
    if (p.flashlightOn) {
      const beamDist = 240;
      const beamAngle = p.facing === 'right' ? 0 : Math.PI;
      const spread = 0.42; // radians

      lightCtx.save();
      lightCtx.translate(pScreenX + (p.facing === 'right' ? 10 : -10), pScreenY - 6);
      lightCtx.beginPath();
      lightCtx.moveTo(0, 0);
      lightCtx.arc(0, 0, beamDist, beamAngle - spread, beamAngle + spread);
      lightCtx.closePath();

      const beamGrad = lightCtx.createRadialGradient(0, 0, 20, 0, 0, beamDist);
      beamGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      beamGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.85)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      lightCtx.fillStyle = beamGrad;
      lightCtx.fill();
      lightCtx.restore();
    }

    // Reset composite operation
    lightCtx.globalCompositeOperation = 'source-over';

    // Blit lighting canvas onto main canvas
    ctx.drawImage(this.lightCanvas, 0, 0);
  }

  private renderHorrorOverlays(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Camera Flash
    if (this.flashIntensity > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashIntensity})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Screen Glitch / chromatic aberration
    if (this.horror.screenGlitch > 0) {
      ctx.fillStyle = `rgba(220, 38, 38, ${this.horror.screenGlitch * 0.25})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Active Horror message in top center
    if (this.horror.activeHorrorMessage) {
      ctx.font = 'bold 24px "VT323", monospace';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.fillText(this.horror.activeHorrorMessage, w / 2, 90);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }

    // Polaroid reveal text banner
    if (this.horror.recentPolaroidText) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(w / 2 - 280, h - 140, 560, 48);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - 280, h - 140, 560, 48);

      ctx.font = '20px "VT323", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(this.horror.recentPolaroidText, w / 2, h - 110);
      ctx.textAlign = 'left';
    }
  }

  // --- SAVE & LOAD SYSTEM ---

  public saveGame() {
    try {
      const clueRecord: Record<string, boolean> = {};
      this.clues.forEach((c, k) => {
        clueRecord[k] = c.discovered;
      });

      const solvedDeductions: Record<string, boolean> = {};
      this.deductions.forEach(d => {
        solvedDeductions[d.id] = d.solved;
      });

      const puzzleRecord: Record<string, boolean> = {};
      this.solvedPuzzles.forEach(p => {
        puzzleRecord[p] = true;
      });

      const unlockedDoors: Record<string, boolean> = {};
      this.unlockedDoors.forEach(d => {
        unlockedDoors[d] = true;
      });

      const brokenWalls: Record<string, boolean> = {};
      this.brokenWalls.forEach(b => {
        brokenWalls[b] = true;
      });

      const searchedLockersRecord: Record<string, boolean> = {};
      this.searchedLockers.forEach(id => {
        searchedLockersRecord[id] = true;
      });

      const saveData: GameSaveData = {
        version: 1,
        timestamp: Date.now(),
        player: {
          x: this.player.x,
          y: this.player.y,
          health: this.player.health,
          stamina: this.player.stamina,
          flashlightOn: this.player.flashlightOn,
          flashlightBattery: this.player.flashlightBattery,
          currentLocation: this.player.currentLocation,
          selectedSlot: this.player.selectedSlot,
          equippedWeapon: this.player.equippedWeapon || 'bat',
        },
        inventory: this.inventory,
        clues: clueRecord,
        solvedDeductions,
        puzzlesSolved: puzzleRecord,
        timeOfDay: this.timeOfDay,
        timeClock: this.timeMinutes,
        phase: this.phase,
        phaseRemainingSeconds: this.phaseRemainingSeconds,
        chapter: this.chapter,
        npcDialogueStates: {},
        unlockedDoors,
        searchedLockers: searchedLockersRecord,
        brokenWalls,
        polaroidsTaken: [],
      };

      localStorage.setItem('shadows_beneath_save', JSON.stringify(saveData));
      sound.playPuzzleSuccess();
      this.onNotification?.('GAME SAVED SUCCESSFULLY');
    } catch {
      this.onNotification?.('Failed to save game');
    }
  }

  public loadGame(): boolean {
    try {
      const raw = localStorage.getItem('shadows_beneath_save');
      if (!raw) return false;
      const data: GameSaveData = JSON.parse(raw);

      this.player.x = data.player.x;
      this.player.y = data.player.y;
      this.player.health = data.player.health;
      this.player.stamina = data.player.stamina;
      this.player.flashlightOn = data.player.flashlightOn;
      this.player.flashlightBattery = data.player.flashlightBattery;
      this.player.currentLocation = data.player.currentLocation;
      this.player.selectedSlot = data.player.selectedSlot;
      this.player.equippedWeapon = data.player.equippedWeapon || 'bat';

      this.currentWorld = WORLD_LOCATIONS[this.player.currentLocation] || WORLD_LOCATIONS['town'];
      this.inventory = data.inventory || [...INITIAL_INVENTORY];

      if (data.clues) {
        Object.entries(data.clues).forEach(([cid, discovered]) => {
          const clue = this.clues.get(cid);
          if (clue) clue.discovered = discovered;
        });
      }

      if (data.solvedDeductions) {
        this.deductions.forEach(d => {
          if (data.solvedDeductions[d.id]) d.solved = true;
        });
      }

      if (data.puzzlesSolved) {
        this.solvedPuzzles = new Set(Object.keys(data.puzzlesSolved));
      }

      if (data.unlockedDoors) {
        this.unlockedDoors = new Set(Object.keys(data.unlockedDoors));
      }

      if (data.searchedLockers) {
        this.searchedLockers = new Set(Object.keys(data.searchedLockers));
      }

      if (data.brokenWalls) {
        this.brokenWalls = new Set(Object.keys(data.brokenWalls));
      }

      this.timeOfDay = data.timeOfDay || 'day';
      this.timeMinutes = data.timeClock ?? 720;
      this.phase = data.phase || 'DAY';
      this.phaseRemainingSeconds = data.phaseRemainingSeconds ?? (this.phase === 'DAY' ? 300 : 180);
      this.chapter = data.chapter || 1;

      return true;
    } catch {
      return false;
    }
  }

  public newGame() {
    localStorage.removeItem('shadows_beneath_save');
    this.player.health = 100;
    this.player.stamina = 100;
    this.player.flashlightBattery = 100;
    this.player.flashlightOn = false;
    this.player.equippedWeapon = 'bat';
    this.player.currentLocation = 'town';
    this.currentWorld = WORLD_LOCATIONS['town'];
    this.player.x = 350;
    this.player.y = 380;
    this.timeMinutes = 720;
    this.phase = 'DAY';
    this.phaseRemainingSeconds = 300;
    this.nightWarningPlayed = false;
    this.chapter = 1;
    this.initInventoryAndClues();
    this.initWorldEntities();
    this.solvedPuzzles.clear();
    this.unlockedDoors.clear();
    this.searchedLockers.clear();
    this.brokenWalls.clear();
    this.deductions.forEach(d => (d.solved = false));
    this.onNotification?.('NEW GAME STARTED');
    sound.startAmbiance('town', false);
  }
}
