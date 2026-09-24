/**
 * Procedural Pixel Art Sprite Generator
 * Renders custom 16x16 / 32x32 / 48x48 pixel art assets to offscreen canvases
 */

type PixelGrid = string[];

export class SpriteAtlas {
  private cache: Map<string, HTMLCanvasElement> = new Map();

  constructor() {
    this.generateAllSprites();
  }

  public getSprite(name: string): HTMLCanvasElement | undefined {
    return this.cache.get(name);
  }

  private createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return [canvas, ctx];
  }

  private drawPixelMap(
    ctx: CanvasRenderingContext2D,
    grid: PixelGrid,
    palette: Record<string, string>,
    pixelSize = 2,
    offsetX = 0,
    offsetY = 0
  ) {
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        if (char !== ' ' && char !== '.' && palette[char]) {
          ctx.fillStyle = palette[char];
          ctx.fillRect(offsetX + c * pixelSize, offsetY + r * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }

  private generateAllSprites() {
    this.createPlayerSprites();
    this.createNpcSprites();
    this.createEnemySprites();
    this.createEnvironmentSprites();
  }

  private createPlayerSprites() {
    // Detective Palette (with distinctive red coat / crimson trenchcoat)
    const p = {
      H: '#18181b', // Fedora hat / Dark band
      h: '#27272a', // Hat brim
      S: '#f2ded0', // Skin
      C: '#dc2626', // Red trenchcoat main (crimson red)
      D: '#991b1b', // Deep crimson coat shading / lapels
      c: '#18181b', // Dark collar / Scarf
      T: '#18181b', // Dark trousers
      B: '#09090b', // Leather boots
      Y: '#facc15', // Flashlight brass / gold buttons
      W: '#ffffff', // Eye / white
      R: '#ef4444', // Bright red highlight
      G: '#a8a29e', // Camera body
      O: '#d97706', // Wood bat
    };

    // Idle frame (16 x 24 pixels -> scaled 2x to 32 x 48)
    const playerIdleGrid = [
      '    hhhhhh      ',
      '   hHHHHHHh     ',
      '   hHHHHHHh     ',
      '  hhhhhhhhhh    ',
      '    SSSSSS      ',
      '    SWSSWS      ',
      '    SSSSSS      ',
      '    cccccc      ',
      '   CHCCCCCH     ',
      '   CDDDDDDC     ',
      '   CDDYYDDC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   C C  C C     ',
      '   T T  T T     ',
      '   T T  T T     ',
      '   T T  T T     ',
      '   B B  B B     ',
      '   BBB  BBB     ',
    ];

    // Walk 1
    const playerWalk1Grid = [
      '    hhhhhh      ',
      '   hHHHHHHh     ',
      '   hHHHHHHh     ',
      '  hhhhhhhhhh    ',
      '    SSSSSS      ',
      '    SWSSWS      ',
      '    SSSSSS      ',
      '    cccccc      ',
      '   CHCCCCCH     ',
      '   CDDDDDDC     ',
      '   CDDYYDDC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   C C  C C     ',
      '  TT T  T T     ',
      '  T  T   TT     ',
      '  T       T     ',
      ' BB       BB    ',
      'BBB      BBB    ',
    ];

    // Walk 2
    const playerWalk2Grid = [
      '    hhhhhh      ',
      '   hHHHHHHh     ',
      '   hHHHHHHh     ',
      '  hhhhhhhhhh    ',
      '    SSSSSS      ',
      '    SWSSWS      ',
      '    SSSSSS      ',
      '    cccccc      ',
      '   CHCCCCCH     ',
      '   CDDDDDDC     ',
      '   CDDYYDDC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   C C  C C     ',
      '   T T  TT      ',
      '   T  T  T      ',
      '   T  T  T      ',
      '   BB B  B      ',
      '  BBB BB B      ',
    ];

    // Jump
    const playerJumpGrid = [
      '    hhhhhh      ',
      '   hHHHHHHh     ',
      '   hHHHHHHh     ',
      '  hhhhhhhhhh    ',
      '    SSSSSS      ',
      '    SWSSWS      ',
      '    SSSSSS      ',
      '   CccccccC     ',
      '  CCHCCCCHCC    ',
      '  CDDDDDDDH     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   C C  C C     ',
      '   T T  T T     ',
      '  TT      TT    ',
      '  B        B    ',
      '  BB      BB    ',
      '                ',
      '                ',
      '                ',
    ];

    // Swing bat
    const playerSwingGrid = [
      '    hhhhhh      ',
      '   hHHHHHHh     ',
      '   hHHHHHHh     ',
      '  hhhhhhhhhh    ',
      '    SSSSSS   OOO',
      '    SWSSWS  OOOO',
      '    SSSSSS OOOOO',
      '    cccccc  OO  ',
      '   CHCCCCCH O   ',
      '   CDDDDDDC S   ',
      '   CDDYYDDC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   C C  C C     ',
      '   T T  T T     ',
      '   T T  T T     ',
      '   T T  T T     ',
      '   B B  B B     ',
      '   BBB  BBB     ',
    ];

    // Swing sword (silver steel blade)
    const playerSwordGrid = [
      '    hhhhhh      ',
      '   hHHHHHHh   WW',
      '   hHHHHHHh  WWW',
      '  hhhhhhhhhh WWW',
      '    SSSSSS  WWW ',
      '    SWSSWS WWWW ',
      '    SSSSSS  HH  ',
      '    cccccc  SS  ',
      '   CHCCCCCH     ',
      '   CDDDDDDC     ',
      '   CDDYYDDC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   CCCCCCCC     ',
      '   C C  C C     ',
      '   T T  T T     ',
      '   T T  T T     ',
      '   T T  T T     ',
      '   B B  B B     ',
      '   BBB  BBB     ',
    ];

    const [cIdle, ctxIdle] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxIdle, playerIdleGrid, p, 2);
    this.cache.set('player_idle', cIdle);

    const [cWalk1, ctxWalk1] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxWalk1, playerWalk1Grid, p, 2);
    this.cache.set('player_walk1', cWalk1);

    const [cWalk2, ctxWalk2] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxWalk2, playerWalk2Grid, p, 2);
    this.cache.set('player_walk2', cWalk2);

    const [cJump, ctxJump] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxJump, playerJumpGrid, p, 2);
    this.cache.set('player_jump', cJump);

    const [cSwing, ctxSwing] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxSwing, playerSwingGrid, p, 2);
    this.cache.set('player_swing', cSwing);

    const [cSwordSwing, ctxSwordSwing] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxSwordSwing, playerSwordGrid, p, 2);
    this.cache.set('player_sword_swing', cSwordSwing);
  }

  private createNpcSprites() {
    // Martha (Elderly Shopkeeper)
    const mP = {
      G: '#94a3b8', // Gray bun
      S: '#fed7aa', // Skin
      D: '#475569', // Apron Dress
      A: '#f8fafc', // White collar
      B: '#1e293b', // Shoes
      E: '#0f172a', // Eyes
    };
    const marthaGrid = [
      '    GGGG        ',
      '   GGGGGG       ',
      '    SSSS        ',
      '    SESE        ',
      '    SSSS        ',
      '   AAAAAA       ',
      '  DDDDDDDD      ',
      '  DDDDDDDD      ',
      '  DDDDDDDD      ',
      '  DDDDDDDD      ',
      '  DDDDDDDD      ',
      '  DDDDDDDD      ',
      '  DDDDDDDD      ',
      '  DDDDDDDD      ',
      '  DDDDDDDD      ',
      '   BB  BB       ',
    ];
    const [cM, ctxM] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxM, marthaGrid, mP, 2);
    this.cache.set('npc_martha', cM);

    // Eli (Trapper Hunter)
    const eP = {
      H: '#78350f', // Fur Hat
      F: '#b45309', // Fur rim
      B: '#451a03', // Beard
      S: '#fbcfe8', // Weathered face
      J: '#365314', // Hunter Jacket
      T: '#1c1917', // Leather Pants
      L: '#0c0a09', // Boots
      G: '#a8a29e', // Rifle strap
    };
    const eliGrid = [
      '   FFFFFF       ',
      '  FHHHHHHF      ',
      '  FFFFFFFF      ',
      '   SS  SS       ',
      '   SSSSSS       ',
      '   BBBBBB       ',
      '  JJJJJJJJ      ',
      '  JJGJJGJJ      ',
      '  JJJJJJJJ      ',
      '  JJJJJJJJ      ',
      '  JJJJJJJJ      ',
      '  JJJJJJJJ      ',
      '   TT  TT       ',
      '   TT  TT       ',
      '   TT  TT       ',
      '   LL  LL       ',
    ];
    const [cE, ctxE] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxE, eliGrid, eP, 2);
    this.cache.set('npc_eli', cE);

    // Daniel (Former Officer)
    const dP = {
      H: '#1e3a8a', // Police Cap
      S: '#fed7aa', // Skin
      B: '#ef4444', // Blood bandage
      U: '#1d4ed8', // Uniform Navy
      P: '#facc15', // Gold Badge
      T: '#0f172a', // Pants
      L: '#020617', // Shoes
    };
    const danielGrid = [
      '   HHHHHH       ',
      '  HHHHHHHH      ',
      '   BBBBBB       ',
      '   SSSSSS       ',
      '   SSSSSS       ',
      '  UUUUUUUU      ',
      '  UUUPUUUU      ',
      '  UUUUUUUU      ',
      '  UUUUUUUU      ',
      '  UUUUUUUU      ',
      '   TT  TT       ',
      '   TT  TT       ',
      '   TT  TT       ',
      '   LL  LL       ',
    ];
    const [cD, ctxD] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxD, danielGrid, dP, 2.2);
    this.cache.set('npc_daniel', cD);

    // The Stranger (Silhouette)
    const sP = {
      B: '#050508', // Dark void
      E: '#ef4444', // Crimson eyes
      M: '#18181b', // Shaded cloak
    };
    const strangerGrid = [
      '    BBBB        ',
      '   BBBBBB       ',
      '   BBEEBB       ',
      '   BBBBBB       ',
      '  MMBBBBMM      ',
      '  MMMMMMMM      ',
      '  MMMMMMMM      ',
      '  BBBBBBBB      ',
      '  BBBBBBBB      ',
      '  BBBBBBBB      ',
      '  BBBBBBBB      ',
      '  BBBBBBBB      ',
      '  BBBBBBBB      ',
      '   BB  BB       ',
    ];
    const [cS, ctxS] = this.createCanvas(32, 48);
    this.drawPixelMap(ctxS, strangerGrid, sP, 2.2);
    this.cache.set('npc_stranger', cS);
  }

  private createEnemySprites() {
    // Shadow Stalker (Crawler)
    const sP = {
      B: '#09090b',
      R: '#dc2626',
      P: '#27272a',
    };
    const stalkerGrid = [
      '                ',
      '     BBBB       ',
      '    BBRRBB      ',
      '    BBBBBB      ',
      '   BBBBBBBB     ',
      '  BBBBBBBBBB    ',
      '  PBBBBBBBBP    ',
      ' B BBBBBBBB B   ',
      'B   BB  BB   B  ',
      'B   BB  BB   B  ',
      '    B    B      ',
    ];
    const [cStalker, ctxStalker] = this.createCanvas(32, 32);
    this.drawPixelMap(ctxStalker, stalkerGrid, sP, 2);
    this.cache.set('enemy_shadow', cStalker);

    // Whispering Figure (Tall Specter)
    const wP = {
      B: '#030712',
      W: '#f8fafc',
      G: '#1f2937',
    };
    const whisperGrid = [
      '    BBBB        ',
      '   BBWWBB       ',
      '   BBWWBB       ',
      '    BBBB        ',
      '   GBBBBG       ',
      '  GGBBBBGG      ',
      '  GGBBBBGG      ',
      '   GBBBBG       ',
      '    BBBB        ',
      '    GBBG        ',
      '    GBBG        ',
      '    GBBG        ',
      '   G    G       ',
      '  G      G      ',
    ];
    const [cWhisper, ctxWhisper] = this.createCanvas(32, 56);
    this.drawPixelMap(ctxWhisper, whisperGrid, wP, 2.2);
    this.cache.set('enemy_whisper', cWhisper);

    // Cave Stalker
    const cP = {
      R: '#44403c',
      D: '#1c1917',
      E: '#a855f7', // Purple crystal eyes
      C: '#78716c',
    };
    const caveGrid = [
      '   DRRRRD       ',
      '  DRREERD       ',
      '  DRRRRRD       ',
      ' DDRRRRRRDD     ',
      ' DDRRCDRRDD     ',
      ' DDRRRRRRDD     ',
      '  DRRRRRRD      ',
      '  DRD  DRD      ',
      '  DD    DD      ',
    ];
    const [cCave, ctxCave] = this.createCanvas(32, 32);
    this.drawPixelMap(ctxCave, caveGrid, cP, 2);
    this.cache.set('enemy_crawler', cCave);
  }

  private createEnvironmentSprites() {
    // Streetlamp
    const [cLamp, ctxLamp] = this.createCanvas(24, 72);
    ctxLamp.fillStyle = '#1c1917';
    ctxLamp.fillRect(10, 16, 4, 56); // pole
    ctxLamp.fillRect(6, 6, 12, 10); // lamp housing
    ctxLamp.fillStyle = '#fef08a'; // glass bulb
    ctxLamp.fillRect(8, 8, 8, 7);
    ctxLamp.fillStyle = '#09090b'; // cap
    ctxLamp.fillRect(4, 4, 16, 3);
    this.cache.set('prop_streetlamp', cLamp);

    // Pine Tree
    const [cTree, ctxTree] = this.createCanvas(64, 128);
    // Trunk
    ctxTree.fillStyle = '#292524';
    ctxTree.fillRect(28, 80, 8, 48);
    // Needles (dark horror green)
    ctxTree.fillStyle = '#064e3b';
    ctxTree.beginPath();
    ctxTree.moveTo(32, 10);
    ctxTree.lineTo(56, 48);
    ctxTree.lineTo(8, 48);
    ctxTree.fill();

    ctxTree.fillStyle = '#022c22';
    ctxTree.beginPath();
    ctxTree.moveTo(32, 36);
    ctxTree.lineTo(60, 74);
    ctxTree.lineTo(4, 74);
    ctxTree.fill();

    ctxTree.fillStyle = '#064e3b';
    ctxTree.beginPath();
    ctxTree.moveTo(32, 60);
    ctxTree.lineTo(62, 98);
    ctxTree.lineTo(2, 98);
    ctxTree.fill();
    this.cache.set('prop_pine_tree', cTree);

    // Occult Altar
    const [cAltar, ctxAltar] = this.createCanvas(48, 36);
    ctxAltar.fillStyle = '#334155';
    ctxAltar.fillRect(4, 14, 40, 22);
    ctxAltar.fillStyle = '#1e293b';
    ctxAltar.fillRect(0, 8, 48, 8);
    // Glowing red rune
    ctxAltar.fillStyle = '#ef4444';
    ctxAltar.beginPath();
    ctxAltar.arc(24, 22, 6, 0, Math.PI * 2);
    ctxAltar.fill();
    this.cache.set('prop_altar', cAltar);

    // Chest / Safe
    const [cChest, ctxChest] = this.createCanvas(32, 28);
    ctxChest.fillStyle = '#573315';
    ctxChest.fillRect(2, 6, 28, 20);
    ctxChest.fillStyle = '#854d0e';
    ctxChest.fillRect(0, 4, 32, 6);
    ctxChest.fillStyle = '#facc15';
    ctxChest.fillRect(14, 12, 4, 6);
    this.cache.set('prop_chest', cChest);

    // Rubble barrier (Mine destructible)
    const [cRubble, ctxRubble] = this.createCanvas(40, 56);
    ctxRubble.fillStyle = '#44403c';
    ctxRubble.fillRect(4, 4, 32, 48);
    ctxRubble.fillStyle = '#292524';
    ctxRubble.fillRect(10, 12, 20, 32);
    ctxRubble.fillStyle = '#78716c';
    ctxRubble.fillRect(6, 8, 12, 10);
    ctxRubble.fillRect(20, 26, 12, 14);
    this.cache.set('prop_rubble', cRubble);

    // Clue sparkle note
    const [cNote, ctxNote] = this.createCanvas(20, 20);
    ctxNote.fillStyle = '#fef08a';
    ctxNote.fillRect(4, 4, 12, 14);
    ctxNote.fillStyle = '#1e293b';
    ctxNote.fillRect(6, 6, 8, 2);
    ctxNote.fillRect(6, 10, 8, 2);
    ctxNote.fillRect(6, 14, 6, 2);
    this.cache.set('prop_note', cNote);

    // Door
    const [cDoor, ctxDoor] = this.createCanvas(32, 54);
    ctxDoor.fillStyle = '#451a03';
    ctxDoor.fillRect(2, 2, 28, 50);
    ctxDoor.fillStyle = '#78350f';
    ctxDoor.fillRect(6, 6, 20, 20);
    ctxDoor.fillRect(6, 28, 20, 20);
    ctxDoor.fillStyle = '#facc15';
    ctxDoor.fillRect(22, 26, 4, 4); // Knob
    this.cache.set('prop_door', cDoor);

    // Locker Closed (Metal school/police locker with air vents and latch)
    const [cLockerC, ctxLockerC] = this.createCanvas(28, 56);
    ctxLockerC.fillStyle = '#334155';
    ctxLockerC.fillRect(2, 2, 24, 52);
    ctxLockerC.fillStyle = '#475569';
    ctxLockerC.fillRect(4, 4, 20, 48);
    // Vents
    ctxLockerC.fillStyle = '#1e293b';
    ctxLockerC.fillRect(8, 8, 12, 2);
    ctxLockerC.fillRect(8, 12, 12, 2);
    ctxLockerC.fillRect(8, 16, 12, 2);
    // Handle & lock
    ctxLockerC.fillStyle = '#cbd5e1';
    ctxLockerC.fillRect(20, 26, 3, 8);
    ctxLockerC.fillStyle = '#f59e0b';
    ctxLockerC.fillRect(18, 30, 2, 3);
    this.cache.set('prop_locker_closed', cLockerC);

    // Locker Opened (Reveals interior shelf and shadow)
    const [cLockerO, ctxLockerO] = this.createCanvas(36, 56);
    ctxLockerO.fillStyle = '#1e293b';
    ctxLockerO.fillRect(2, 2, 22, 52);
    ctxLockerO.fillStyle = '#0f172a';
    ctxLockerO.fillRect(4, 4, 18, 48);
    // Interior shelf
    ctxLockerO.fillStyle = '#334155';
    ctxLockerO.fillRect(4, 24, 18, 2);
    // Open door swung open to right
    ctxLockerO.fillStyle = '#475569';
    ctxLockerO.fillRect(22, 2, 12, 52);
    ctxLockerO.fillStyle = '#64748b';
    ctxLockerO.fillRect(24, 4, 8, 48);
    this.cache.set('prop_locker_opened', cLockerO);

    // Desk
    const [cDesk, ctxDesk] = this.createCanvas(44, 32);
    ctxDesk.fillStyle = '#78350f';
    ctxDesk.fillRect(2, 6, 40, 6);
    ctxDesk.fillStyle = '#451a03';
    ctxDesk.fillRect(4, 12, 8, 20);
    ctxDesk.fillRect(32, 12, 8, 20);
    // Drawer handles
    ctxDesk.fillStyle = '#fbbf24';
    ctxDesk.fillRect(35, 16, 2, 2);
    ctxDesk.fillRect(35, 22, 2, 2);
    this.cache.set('prop_desk', cDesk);

    // Wardrobe
    const [cWardrobe, ctxWardrobe] = this.createCanvas(36, 56);
    ctxWardrobe.fillStyle = '#451a03';
    ctxWardrobe.fillRect(2, 2, 32, 52);
    ctxWardrobe.fillStyle = '#78350f';
    ctxWardrobe.fillRect(4, 4, 13, 46);
    ctxWardrobe.fillRect(19, 4, 13, 46);
    ctxWardrobe.fillStyle = '#f59e0b';
    ctxWardrobe.fillRect(15, 26, 2, 4);
    ctxWardrobe.fillRect(19, 26, 2, 4);
    this.cache.set('prop_wardrobe', cWardrobe);

    // Grandfather Clock
    const [cClock, ctxClock] = this.createCanvas(24, 60);
    ctxClock.fillStyle = '#451a03';
    ctxClock.fillRect(4, 2, 16, 56);
    ctxClock.fillStyle = '#fef08a';
    ctxClock.beginPath();
    ctxClock.arc(12, 14, 5, 0, Math.PI * 2);
    ctxClock.fill();
    ctxClock.fillStyle = '#000000';
    ctxClock.fillRect(11, 11, 2, 3); // hands
    // Pendulum chamber
    ctxClock.fillStyle = '#1e1b18';
    ctxClock.fillRect(6, 24, 12, 26);
    ctxClock.fillStyle = '#f59e0b';
    ctxClock.beginPath();
    ctxClock.arc(12, 38, 3, 0, Math.PI * 2);
    ctxClock.fill();
    this.cache.set('prop_clock', cClock);

    // Bookshelf
    const [cBookshelf, ctxBookshelf] = this.createCanvas(36, 54);
    ctxBookshelf.fillStyle = '#451a03';
    ctxBookshelf.fillRect(2, 2, 32, 50);
    ctxBookshelf.fillStyle = '#1e1b18';
    ctxBookshelf.fillRect(4, 4, 28, 46);
    // Shelves
    ctxBookshelf.fillStyle = '#78350f';
    ctxBookshelf.fillRect(4, 18, 28, 2);
    ctxBookshelf.fillRect(4, 32, 28, 2);
    // Colorful books
    ctxBookshelf.fillStyle = '#dc2626';
    ctxBookshelf.fillRect(6, 6, 4, 12);
    ctxBookshelf.fillStyle = '#2563eb';
    ctxBookshelf.fillRect(11, 8, 4, 10);
    ctxBookshelf.fillStyle = '#16a34a';
    ctxBookshelf.fillRect(16, 6, 5, 12);
    ctxBookshelf.fillStyle = '#d97706';
    ctxBookshelf.fillRect(6, 20, 6, 12);
    ctxBookshelf.fillStyle = '#7c3aed';
    ctxBookshelf.fillRect(13, 22, 5, 10);
    ctxBookshelf.fillStyle = '#0891b2';
    ctxBookshelf.fillRect(20, 20, 4, 12);
    this.cache.set('prop_bookshelf', cBookshelf);
  }
}

export const spriteAtlas = new SpriteAtlas();
