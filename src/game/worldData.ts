import { LocationId, InteractiveObject, NPC, Enemy } from '../types/game';

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'ladder' | 'passable';
  color?: string;
}

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  color: string;
  flicker?: boolean;
}

export interface LocationData {
  id: LocationId;
  name: string;
  width: number;
  height: number;
  groundY: number;
  skyGradient: {
    day: [string, string];
    sunset: [string, string];
    night: [string, string];
  };
  ambientDarkness: {
    day: number;
    sunset: number;
    night: number;
  };
  platforms: Platform[];
  objects: InteractiveObject[];
  lights: LightSource[];
  npcs: NPC[];
  enemies: Enemy[];
  wallMessages?: { x: number; y: number; text: string; revealCondition: 'uv_or_night' | 'polaroid' }[];
}

export const WORLD_LOCATIONS: Record<LocationId, LocationData> = {
  town: {
    id: 'town',
    name: 'Заброшенный город (Главная улица)',
    width: 2000,
    height: 520,
    groundY: 440,
    skyGradient: {
      day: ['#60a5fa', '#bfdbfe'],
      sunset: ['#ea580c', '#fde047'],
      night: ['#030712', '#0f172a']
    },
    ambientDarkness: {
      day: 0.05,
      sunset: 0.35,
      night: 0.88
    },
    platforms: [
      { x: 0, y: 440, width: 2000, height: 80, type: 'solid', color: '#1c1917' }, // Main road
      // Shop awning & roof
      { x: 320, y: 350, width: 140, height: 12, type: 'solid', color: '#334155' },
      { x: 300, y: 280, width: 180, height: 16, type: 'solid', color: '#1e293b' },
      // Police station roof
      { x: 1250, y: 320, width: 220, height: 16, type: 'solid', color: '#1e293b' },
      // Abandoned house porch
      { x: 780, y: 380, width: 160, height: 14, type: 'solid', color: '#451a03' },
    ],
    lights: [
      { x: 200, y: 380, radius: 140, color: 'rgba(254, 240, 138, 0.45)', flicker: true }, // Streetlamp 1
      { x: 600, y: 380, radius: 140, color: 'rgba(254, 240, 138, 0.45)', flicker: true }, // Streetlamp 2
      { x: 1100, y: 380, radius: 140, color: 'rgba(254, 240, 138, 0.45)', flicker: true }, // Streetlamp 3
      { x: 1650, y: 380, radius: 140, color: 'rgba(254, 240, 138, 0.45)', flicker: true }, // Streetlamp 4
    ],
    objects: [
      {
        id: 'door_to_house',
        type: 'door',
        x: 840,
        y: 385,
        width: 34,
        height: 55,
        label: 'Войти в заброшенный дом',
        location: 'town',
        targetLocation: 'house',
        targetX: 60,
        targetY: 380,
      },
      {
        id: 'door_to_police',
        type: 'door',
        doorType: 'key',
        requiresKey: 'item_precinct_key',
        requiredKeyName: 'Ключ от участка',
        x: 1320,
        y: 385,
        width: 34,
        height: 55,
        label: 'Войти в полицейский участок',
        location: 'town',
        targetLocation: 'town',
      },
      {
        id: 'door_police_archive',
        type: 'door',
        doorType: 'password',
        password: '1987',
        passwordTitle: 'ДВЕРЬ ПОЛИЦЕЙСКОГО АРХИВА',
        x: 1520,
        y: 385,
        width: 34,
        height: 55,
        label: 'Дверь архива (Требуется пароль)',
        location: 'town',
        targetLocation: 'town',
      },
      {
        id: 'town_locker_1',
        type: 'locker',
        x: 480,
        y: 384,
        width: 28,
        height: 56,
        label: 'Шкафчик №01 (Аптека)',
        location: 'town',
        fixedLoot: {
          type: 'key',
          itemId: 'item_precinct_key',
          keyName: 'Ключ от участка',
          noteTitle: 'Ключ, спрятанный под аптекарским полотенцем'
        }
      },
      {
        id: 'town_locker_police',
        type: 'locker',
        x: 1440,
        y: 384,
        width: 28,
        height: 56,
        label: 'Оружейный шкаф (Участок)',
        location: 'town',
        fixedLoot: {
          type: 'sword',
          itemId: 'item_sword',
          noteTitle: 'Старинный меч (Табельное оружие)'
        }
      },
      {
        id: 'town_police_desk',
        type: 'desk',
        x: 1370,
        y: 408,
        width: 44,
        height: 32,
        label: 'Обыскать ящики стола шефа',
        location: 'town',
        fixedLoot: {
          type: 'note',
          noteTitle: 'Отчёт об инциденте 204',
          noteText: 'СЕКРЕТНО: «Код архива комнаты 204 сброшен на год инцидента: 1987».'
        }
      },
      {
        id: 'town_newspaper_kiosk',
        type: 'clue',
        x: 240,
        y: 400,
        width: 32,
        height: 40,
        label: 'Осмотреть газетный киоск',
        location: 'town',
        clueId: 'clue_newspaper',
      },
      {
        id: 'house_porch_necklace',
        type: 'clue',
        x: 885,
        y: 415,
        width: 24,
        height: 25,
        label: 'Осмотреть блестящий металлический предмет',
        location: 'town',
        clueId: 'clue_necklace',
      },
      {
        id: 'to_forest_left',
        type: 'door',
        x: 10,
        y: 370,
        width: 40,
        height: 70,
        label: 'Перейти в Тёмный лес',
        location: 'town',
        targetLocation: 'forest',
        targetX: 1900,
        targetY: 380,
      },
      {
        id: 'to_church_right',
        type: 'door',
        x: 1940,
        y: 370,
        width: 40,
        height: 70,
        label: 'Перейти к Старой церкви',
        location: 'town',
        targetLocation: 'church',
        targetX: 60,
        targetY: 380,
      },
    ],
    npcs: [
      {
        id: 'martha',
        name: 'Марта',
        role: 'Аптекарша',
        location: 'town',
        x: 370,
        y: 395,
        width: 32,
        height: 46,
        dialogueState: 0,
        portrait: 'npc_martha',
        isAvailableAtNight: false,
      },
      {
        id: 'daniel',
        name: 'Дэниел',
        role: 'Бывший офицер полиции',
        location: 'town',
        x: 1390,
        y: 395,
        width: 32,
        height: 46,
        dialogueState: 0,
        portrait: 'npc_daniel',
        isAvailableAtNight: true,
      },
      {
        id: 'stranger',
        name: 'Незнакомец',
        role: 'Таинственная фигура',
        location: 'town',
        x: 1750,
        y: 395,
        width: 32,
        height: 46,
        dialogueState: 0,
        portrait: 'npc_stranger',
        isAvailableAtNight: true,
      }
    ],
    enemies: [
      {
        id: 'shadow_town_1',
        type: 'shadow',
        x: 1050,
        y: 410,
        vx: 0,
        vy: 0,
        width: 28,
        height: 28,
        health: 45,
        maxHealth: 45,
        speed: 1.4,
        detectionRange: 220,
        attackRange: 35,
        damage: 15,
        state: 'patrol',
        facing: 'left',
        location: 'town'
      }
    ],
    wallMessages: [
      { x: 800, y: 340, text: 'ОНИ НАБЛЮДАЮТ СНИЗУ', revealCondition: 'uv_or_night' },
      { x: 1350, y: 300, text: 'ШЕФ ДЭНИЕЛ ОПУСТИЛ ЗАСЛОНКУ', revealCondition: 'polaroid' }
    ]
  },

  forest: {
    id: 'forest',
    name: 'Тёмный лес',
    width: 2100,
    height: 520,
    groundY: 440,
    skyGradient: {
      day: ['#1e3a5f', '#3b82f6'],
      sunset: ['#7c2d12', '#d97706'],
      night: ['#020617', '#09090b']
    },
    ambientDarkness: {
      day: 0.25,
      sunset: 0.55,
      night: 0.94
    },
    platforms: [
      { x: 0, y: 440, width: 2100, height: 80, type: 'solid', color: '#0f172a' },
      { x: 450, y: 370, width: 180, height: 16, type: 'solid', color: '#14532d' },
      { x: 820, y: 320, width: 140, height: 16, type: 'solid', color: '#14532d' },
      { x: 1350, y: 380, width: 220, height: 16, type: 'solid', color: '#14532d' },
    ],
    lights: [
      { x: 680, y: 410, radius: 110, color: 'rgba(234, 88, 12, 0.5)', flicker: true },
    ],
    objects: [
      {
        id: 'forest_to_town',
        type: 'door',
        x: 1950,
        y: 370,
        width: 40,
        height: 70,
        label: 'Вернуться в город',
        location: 'forest',
        targetLocation: 'town',
        targetX: 60,
        targetY: 380,
      },
      {
        id: 'forest_to_mine',
        type: 'door',
        x: 40,
        y: 370,
        width: 50,
        height: 70,
        label: 'Спуститься в старую шахту',
        location: 'forest',
        targetLocation: 'mine',
        targetX: 1800,
        targetY: 380,
      },
      {
        id: 'forest_crushed_torch',
        type: 'clue',
        x: 900,
        y: 415,
        width: 24,
        height: 24,
        label: 'Осмотреть разбитый металлический предмет',
        location: 'forest',
        clueId: 'clue_broken_flashlight',
      },
      {
        id: 'forest_occult_altar',
        type: 'clue',
        x: 1440,
        y: 350,
        width: 48,
        height: 36,
        label: 'Осмотреть резной каменный алтарь',
        location: 'forest',
        clueId: 'clue_strange_symbol',
      },
      {
        id: 'forest_cemetery_cache',
        type: 'clue',
        x: 1680,
        y: 415,
        width: 26,
        height: 26,
        label: 'Осмотреть замшелый железный ящик',
        location: 'forest',
        clueId: 'clue_rusty_key',
      }
    ],
    npcs: [
      {
        id: 'eli',
        name: 'Элай',
        role: 'Лесной охотник',
        location: 'forest',
        x: 720,
        y: 395,
        width: 32,
        height: 46,
        dialogueState: 0,
        portrait: 'npc_eli',
        isAvailableAtNight: true,
      }
    ],
    enemies: [
      {
        id: 'shadow_forest_1',
        type: 'shadow',
        x: 320,
        y: 410,
        vx: 0,
        vy: 0,
        width: 28,
        height: 28,
        health: 50,
        maxHealth: 50,
        speed: 1.5,
        detectionRange: 240,
        attackRange: 35,
        damage: 18,
        state: 'patrol',
        facing: 'right',
        location: 'forest'
      },
      {
        id: 'whisper_forest_2',
        type: 'whisper',
        x: 1200,
        y: 390,
        vx: 0,
        vy: 0,
        width: 24,
        height: 50,
        health: 60,
        maxHealth: 60,
        speed: 1.1,
        detectionRange: 300,
        attackRange: 45,
        damage: 22,
        state: 'patrol',
        facing: 'left',
        location: 'forest'
      }
    ],
    wallMessages: [
      { x: 1420, y: 310, text: 'РЕЗОНАНС ПРОРОС В КОРНИ ДЕРЕВЬЕВ', revealCondition: 'uv_or_night' }
    ]
  },

  mine: {
    id: 'mine',
    name: 'Старая шахта (Штольни Сектора 4)',
    width: 2000,
    height: 520,
    groundY: 440,
    skyGradient: {
      day: ['#050505', '#1c1917'],
      sunset: ['#050505', '#1c1917'],
      night: ['#000000', '#0a0a0a']
    },
    ambientDarkness: {
      day: 0.92,
      sunset: 0.94,
      night: 0.98
    },
    platforms: [
      { x: 0, y: 440, width: 2000, height: 80, type: 'solid', color: '#292524' },
      { x: 400, y: 360, width: 260, height: 16, type: 'solid', color: '#451a03' },
      { x: 800, y: 280, width: 200, height: 16, type: 'solid', color: '#451a03' },
      { x: 1250, y: 340, width: 180, height: 16, type: 'solid', color: '#451a03' },
    ],
    lights: [
      { x: 1820, y: 380, radius: 120, color: 'rgba(254, 215, 170, 0.4)', flicker: true },
      { x: 1300, y: 310, radius: 90, color: 'rgba(168, 85, 247, 0.35)', flicker: false },
      { x: 280, y: 370, radius: 140, color: 'rgba(239, 68, 68, 0.4)', flicker: true },
    ],
    objects: [
      {
        id: 'mine_to_forest',
        type: 'door',
        x: 1880,
        y: 370,
        width: 40,
        height: 70,
        label: 'Подняться по лестнице в лес',
        location: 'mine',
        targetLocation: 'forest',
        targetX: 80,
        targetY: 380,
      },
      {
        id: 'mine_rubble_barrier',
        type: 'rubble',
        x: 750,
        y: 384,
        width: 40,
        height: 56,
        label: 'Каменный завал (Нужна кирка)',
        location: 'mine',
      },
      {
        id: 'mine_survey_map',
        type: 'clue',
        x: 920,
        y: 255,
        width: 26,
        height: 25,
        label: 'Изучить чертёж на столе маркшейдера',
        location: 'mine',
        clueId: 'clue_mine_map',
      },
      {
        id: 'mine_locker_1',
        type: 'locker',
        x: 560,
        y: 384,
        width: 28,
        height: 56,
        label: 'Обыскать шахтёрский шкаф снаряжения',
        location: 'mine',
        fixedLoot: {
          type: 'battery',
          itemId: 'item_battery',
          noteTitle: 'Записка бригадира',
          noteText: '«В случае сбоя питания резервный код 4729 снимет блокировку шлюза подуровня».'
        }
      },
      {
        id: 'mine_locker_2',
        type: 'locker',
        x: 1040,
        y: 384,
        width: 28,
        height: 56,
        label: 'Обыскать шкафчик шахтёра №07',
        location: 'mine',
      },
      {
        id: 'mine_tape_recorder',
        type: 'clue',
        x: 480,
        y: 335,
        width: 24,
        height: 24,
        label: 'Осмотреть кассетный диктофон',
        location: 'mine',
        clueId: 'clue_audio_tape',
      },
      {
        id: 'mine_airlock_keypad',
        type: 'puzzle',
        puzzleType: 'keypad',
        x: 240,
        y: 370,
        width: 50,
        height: 70,
        label: 'Кодовая панель шлюза безопасности',
        location: 'mine',
      }
    ],
    npcs: [],
    enemies: [
      {
        id: 'crawler_mine_1',
        type: 'crawler',
        x: 620,
        y: 410,
        vx: 0,
        vy: 0,
        width: 32,
        height: 32,
        health: 70,
        maxHealth: 70,
        speed: 1.6,
        detectionRange: 260,
        attackRange: 40,
        damage: 20,
        state: 'patrol',
        facing: 'left',
        location: 'mine'
      },
      {
        id: 'crawler_mine_2',
        type: 'crawler',
        x: 1100,
        y: 410,
        vx: 0,
        vy: 0,
        width: 32,
        height: 32,
        health: 70,
        maxHealth: 70,
        speed: 1.6,
        detectionRange: 260,
        attackRange: 40,
        damage: 20,
        state: 'patrol',
        facing: 'right',
        location: 'mine'
      }
    ],
    wallMessages: [
      { x: 320, y: 330, text: 'АВАРИЙНЫЙ КОД ШЛЮЗА: 4-7-2-9', revealCondition: 'uv_or_night' },
      { x: 680, y: 340, text: 'ОНО ИМИТИРУЕТ ЧЕЛОВЕЧЕСКИЙ КРИК', revealCondition: 'polaroid' }
    ]
  },

  house: {
    id: 'house',
    name: 'Заброшенный дом (Поместье Вэнсов)',
    width: 1400,
    height: 520,
    groundY: 440,
    skyGradient: {
      day: ['#0f172a', '#1e293b'],
      sunset: ['#0f172a', '#1e293b'],
      night: ['#030712', '#000000']
    },
    ambientDarkness: {
      day: 0.65,
      sunset: 0.85,
      night: 0.96
    },
    platforms: [
      { x: 0, y: 440, width: 1400, height: 80, type: 'solid', color: '#3f2e1e' },
      { x: 180, y: 310, width: 850, height: 16, type: 'solid', color: '#451a03' },
      { x: 420, y: 190, width: 500, height: 16, type: 'solid', color: '#451a03' },
      { x: 260, y: 310, width: 20, height: 130, type: 'ladder', color: '#78350f' },
      { x: 500, y: 190, width: 20, height: 120, type: 'ladder', color: '#78350f' },
    ],
    lights: [
      { x: 380, y: 260, radius: 100, color: 'rgba(254, 240, 138, 0.3)', flicker: true },
      { x: 700, y: 390, radius: 120, color: 'rgba(234, 88, 12, 0.4)', flicker: true },
    ],
    objects: [
      {
        id: 'house_to_town',
        type: 'door',
        x: 40,
        y: 375,
        width: 36,
        height: 65,
        label: 'Выйти на городскую улицу',
        location: 'house',
        targetLocation: 'town',
        targetX: 840,
        targetY: 380,
      },
      {
        id: 'house_cellar_door',
        type: 'door',
        doorType: 'key',
        requiresKey: 'item_cellar_key',
        requiredKeyName: 'Ключ от погреба Вэнсов',
        x: 180,
        y: 375,
        width: 36,
        height: 65,
        label: 'Дверь в погреб',
        location: 'house',
      },
      {
        id: 'house_study_door',
        type: 'door',
        doorType: 'password',
        password: '1978',
        passwordTitle: 'КОД КАБИНЕТА ВЭНСА',
        x: 920,
        y: 245,
        width: 36,
        height: 65,
        label: 'Дверь кабинета (Требуется пароль)',
        location: 'house',
      },
      {
        id: 'house_bedroom_locker',
        type: 'locker',
        x: 340,
        y: 254,
        width: 28,
        height: 56,
        label: 'Обыскать шкаф в спальне',
        location: 'house',
        fixedLoot: {
          type: 'note',
          noteTitle: 'Старая школьная записка',
          noteText: 'Набросано на обрывке тетради: «Не забудь год открытия школы: 1978».',
          itemId: 'item_cellar_key',
          keyName: 'Ключ от погреба Вэнсов'
        }
      },
      {
        id: 'house_hallway_locker',
        type: 'locker',
        x: 520,
        y: 384,
        width: 28,
        height: 56,
        label: 'Обыскать шкаф в прихожей',
        location: 'house',
      },
      {
        id: 'house_grandfather_clock',
        type: 'clock',
        x: 620,
        y: 380,
        width: 24,
        height: 60,
        label: 'Осмотреть напольные часы (12:00)',
        location: 'house',
        fixedLoot: {
          type: 'note',
          noteTitle: 'Записка в маятниковом отсеке',
          noteText: '«Стрелки напольных часов замерли ровно в 03:14 ночи, когда взвыли сирены».'
        }
      },
      {
        id: 'house_wardrobe',
        type: 'wardrobe',
        x: 440,
        y: 254,
        width: 36,
        height: 56,
        label: 'Осмотреть дубовый платяной шкаф',
        location: 'house',
      },
      {
        id: 'house_bookshelf',
        type: 'bookshelf',
        x: 740,
        y: 386,
        width: 36,
        height: 54,
        label: 'Осмотреть книжную полку',
        location: 'house',
        fixedLoot: {
          type: 'note',
          noteTitle: 'Пометка на полях учебника',
          noteText: '«Мамин день рождения: 0412. Береги это от шёпота».'
        }
      },
      {
        id: 'house_torn_diary',
        type: 'clue',
        x: 820,
        y: 285,
        width: 24,
        height: 24,
        label: 'Осмотреть половицы под кроватью',
        location: 'house',
        clueId: 'clue_torn_diary',
      },
      {
        id: 'house_partner_badge',
        type: 'clue',
        x: 640,
        y: 165,
        width: 24,
        height: 24,
        label: 'Осмотреть сундук на чердаке',
        location: 'house',
        clueId: 'clue_daniel_badge',
      },
      {
        id: 'house_camera_spot',
        type: 'camera_spot',
        x: 750,
        y: 155,
        width: 40,
        height: 35,
        label: 'Странное выцветание обоев (Сделайте снимок [C])',
        location: 'house',
      }
    ],
    npcs: [],
    enemies: [
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
        speed: 1.0,
        detectionRange: 220,
        attackRange: 40,
        damage: 18,
        state: 'patrol',
        facing: 'left',
        location: 'house'
      }
    ],
    wallMessages: [
      { x: 420, y: 260, text: 'ТЫ УЖЕ БЫЛ ЗДЕСЬ РАНЬШЕ', revealCondition: 'uv_or_night' },
      { x: 740, y: 140, text: 'ЗА РАМОЙ НА ЧЕРДАКЕ СКРЫТО СЕМЯ', revealCondition: 'polaroid' }
    ]
  },

  church: {
    id: 'church',
    name: 'Старая церковь (Крипта св. Иуды)',
    width: 1600,
    height: 520,
    groundY: 440,
    skyGradient: {
      day: ['#475569', '#94a3b8'],
      sunset: ['#831843', '#f43f5e'],
      night: ['#020617', '#09090b']
    },
    ambientDarkness: {
      day: 0.35,
      sunset: 0.65,
      night: 0.95
    },
    platforms: [
      { x: 0, y: 440, width: 1600, height: 80, type: 'solid', color: '#1e293b' },
      { x: 120, y: 330, width: 280, height: 16, type: 'solid', color: '#334155' },
      { x: 220, y: 190, width: 20, height: 140, type: 'ladder', color: '#475569' },
      { x: 180, y: 190, width: 140, height: 16, type: 'solid', color: '#334155' },
    ],
    lights: [
      { x: 780, y: 360, radius: 150, color: 'rgba(244, 63, 94, 0.45)', flicker: true },
      { x: 1250, y: 390, radius: 110, color: 'rgba(254, 240, 138, 0.4)', flicker: true },
    ],
    objects: [
      {
        id: 'church_to_town',
        type: 'door',
        x: 40,
        y: 375,
        width: 36,
        height: 65,
        label: 'Вернуться в город',
        location: 'church',
        targetLocation: 'town',
        targetX: 1880,
        targetY: 380,
      },
      {
        id: 'church_burial_ledger',
        type: 'clue',
        x: 420,
        y: 410,
        width: 26,
        height: 25,
        label: 'Осмотреть церковный гроссбух на кафедре',
        location: 'church',
        clueId: 'clue_church_record',
      },
      {
        id: 'church_council_photo',
        type: 'clue',
        x: 230,
        y: 160,
        width: 24,
        height: 25,
        label: 'Осмотреть фотографию в раме на колокольне',
        location: 'church',
        clueId: 'clue_old_photo',
      },
      {
        id: 'church_vestry_locker',
        type: 'locker',
        x: 940,
        y: 384,
        width: 28,
        height: 56,
        label: 'Обыскать шкаф в ризнице',
        location: 'church',
      },
      {
        id: 'church_rune_altar',
        type: 'puzzle',
        puzzleType: 'symbols',
        x: 1240,
        y: 380,
        width: 60,
        height: 60,
        label: 'Древний рунический каменный алтарь',
        location: 'church',
      },
      {
        id: 'church_to_lab',
        type: 'door',
        x: 1480,
        y: 375,
        width: 40,
        height: 65,
        label: 'Железная дверь крипты (Нужен ключ №13)',
        location: 'church',
        requiresKey: 'item_rusty_key',
        targetLocation: 'lab',
        targetX: 60,
        targetY: 380,
      }
    ],
    npcs: [],
    enemies: [
      {
        id: 'shadow_church_1',
        type: 'shadow',
        x: 640,
        y: 410,
        vx: 0,
        vy: 0,
        width: 28,
        height: 28,
        health: 55,
        maxHealth: 55,
        speed: 1.4,
        detectionRange: 220,
        attackRange: 35,
        damage: 16,
        state: 'patrol',
        facing: 'right',
        location: 'church'
      }
    ],
    wallMessages: [
      { x: 820, y: 320, text: 'ПОРЯДОК КАМНЕЙ: СОЛНЦЕ - ЛУНА - ЧЕРЕП - ЗМЕЯ', revealCondition: 'uv_or_night' }
    ]
  },

  lab: {
    id: 'lab',
    name: 'Подземная лаборатория (Подуровень 3)',
    width: 2000,
    height: 520,
    groundY: 440,
    skyGradient: {
      day: ['#020617', '#0f172a'],
      sunset: ['#020617', '#0f172a'],
      night: ['#000000', '#020617']
    },
    ambientDarkness: {
      day: 0.90,
      sunset: 0.90,
      night: 0.95
    },
    platforms: [
      { x: 0, y: 440, width: 2000, height: 80, type: 'solid', color: '#1e293b' },
      { x: 260, y: 320, width: 440, height: 16, type: 'solid', color: '#334155' },
      { x: 920, y: 320, width: 500, height: 16, type: 'solid', color: '#334155' },
      { x: 300, y: 320, width: 20, height: 120, type: 'ladder', color: '#64748b' },
      { x: 960, y: 320, width: 20, height: 120, type: 'ladder', color: '#64748b' },
    ],
    lights: [
      { x: 450, y: 280, radius: 130, color: 'rgba(56, 189, 248, 0.45)', flicker: true },
      { x: 1150, y: 280, radius: 140, color: 'rgba(239, 68, 68, 0.4)', flicker: true },
      { x: 1750, y: 380, radius: 160, color: 'rgba(74, 222, 128, 0.45)', flicker: false },
    ],
    objects: [
      {
        id: 'lab_to_crypt',
        type: 'door',
        x: 40,
        y: 375,
        width: 36,
        height: 65,
        label: 'Подняться в крипту церкви',
        location: 'lab',
        targetLocation: 'church',
        targetX: 1460,
        targetY: 380,
      },
      {
        id: 'lab_research_memo',
        type: 'clue',
        x: 480,
        y: 295,
        width: 24,
        height: 24,
        label: 'Прочесть отчёт доктора Стерлинга',
        location: 'lab',
        clueId: 'clue_lab_note',
      },
      {
        id: 'lab_biohazard_locker_1',
        type: 'locker',
        x: 620,
        y: 384,
        width: 28,
        height: 56,
        label: 'Обыскать защитный бокс №A',
        location: 'lab',
        fixedLoot: {
          type: 'health',
          itemId: 'item_bandage',
          noteTitle: 'Полевая аптечка'
        }
      },
      {
        id: 'lab_biohazard_locker_2',
        type: 'locker',
        x: 1420,
        y: 384,
        width: 28,
        height: 56,
        label: 'Обыскать защитный бокс №B',
        location: 'lab',
      },
      {
        id: 'lab_blackbox_cctv',
        type: 'clue',
        x: 1100,
        y: 295,
        width: 26,
        height: 26,
        label: 'Извлечь бобину видеозаписи изолятора',
        location: 'lab',
        clueId: 'clue_security_recording',
      },
      {
        id: 'lab_generator_puzzle',
        type: 'puzzle',
        puzzleType: 'generator',
        x: 780,
        y: 370,
        width: 50,
        height: 70,
        label: 'Щит аварийных реле питания',
        location: 'lab',
      },
      {
        id: 'lab_final_terminal',
        type: 'puzzle',
        puzzleType: 'camera',
        x: 1720,
        y: 370,
        width: 60,
        height: 70,
        label: 'Главный терминал ядра (Глава 6: Финал)',
        location: 'lab',
      }
    ],
    npcs: [],
    enemies: [
      {
        id: 'whisper_lab_1',
        type: 'whisper',
        x: 1300,
        y: 390,
        vx: 0,
        vy: 0,
        width: 24,
        height: 50,
        health: 75,
        maxHealth: 75,
        speed: 1.3,
        detectionRange: 280,
        attackRange: 45,
        damage: 24,
        state: 'patrol',
        facing: 'left',
        location: 'lab'
      }
    ],
    wallMessages: [
      { x: 620, y: 380, text: 'ОБЪЕКТ 09 ТРАНСМУТИРУЕТ ПЛОТЬ ЗВУКОВОЙ ЧАСТОТОЙ', revealCondition: 'uv_or_night' },
      { x: 1650, y: 320, text: 'ЭТОТ ВЫБОР НИКОГДА НЕ ПРИНАДЛЕЖАЛ НАМ', revealCondition: 'polaroid' }
    ]
  }
};
