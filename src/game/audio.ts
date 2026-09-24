/**
 * Audio System with HTML5 Background Music ("Being Watched by Aioka")
 * and Procedural Horror Sound Synthesizer via Web Audio API.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  
  // Audio state & persistence
  private musicMuted: boolean = false;
  private musicVolume: number = 0.25; // Default 0.25 as specified
  private sfxMuted: boolean = false;
  private sfxVolume: number = 0.70;
  private get isMuted(): boolean {
    return this.sfxMuted;
  }

  // HTML5 Background Music ("Being Watched by Aioka")
  public readonly trackTitle: string = "Being Watched by Aioka";
  private bgMusic: HTMLAudioElement | null = null;
  private audioSources: string[] = [
    "audio/background-music.mp3",
    "/audio/background-music.mp3",
    "audio/being-watched-by-aioka.mp3",
    "/audio/being-watched-by-aioka.mp3",
  ];
  private currentAudioSourceIndex: number = 0;
  private bgMusicLoaded: boolean = false;
  private gameStarted: boolean = false;

  // Dynamic ambiance & environmental audio
  private isNight: boolean = false;
  private isHorrorLocation: boolean = false;
  private currentLocation: string = 'town';
  private isMonsterTensionActive: boolean = false;
  private monsterTensionTimer: number | null = null;
  private environmentalSoundInterval: number | null = null;

  // Web Audio Procedural Nodes
  private masterSfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientNoise: AudioBufferSourceNode | null = null;
  private proceduralMusicGain: GainNode | null = null;
  private proceduralMusicInterval: number | null = null;
  private proceduralMusicActive: boolean = false;
  private heartbeatInterval: number | null = null;
  private fearLevel: number = 0; // 0 to 1

  constructor() {
    // Load preferences from localStorage
    const savedMusicMuted = localStorage.getItem('shadows_beneath_music_muted');
    const savedMusicVol = localStorage.getItem('shadows_beneath_music_volume');
    const savedSfxMuted = localStorage.getItem('shadows_beneath_sfx_muted');
    const savedSfxVol = localStorage.getItem('shadows_beneath_sfx_volume');
    const savedLegacyMute = localStorage.getItem('shadows_beneath_muted');

    if (savedMusicMuted !== null) {
      this.musicMuted = savedMusicMuted === 'true';
    } else if (savedLegacyMute !== null) {
      this.musicMuted = savedLegacyMute === 'true';
    }

    if (savedMusicVol !== null) {
      const parsed = parseFloat(savedMusicVol);
      if (!isNaN(parsed)) this.musicVolume = Math.max(0, Math.min(1, parsed));
    }

    if (savedSfxMuted !== null) {
      this.sfxMuted = savedSfxMuted === 'true';
    } else if (savedLegacyMute !== null) {
      this.sfxMuted = savedLegacyMute === 'true';
    }

    if (savedSfxVol !== null) {
      const parsed = parseFloat(savedSfxVol);
      if (!isNaN(parsed)) this.sfxVolume = Math.max(0, Math.min(1, parsed));
    }

    this.initBackgroundMusic();
  }

  // --- HTML5 AUDIO BACKGROUND MUSIC INITIALIZATION ---

  private initBackgroundMusic() {
    if (typeof window === 'undefined') return;

    try {
      const audioUrl = this.audioSources[this.currentAudioSourceIndex];
      this.bgMusic = new Audio(audioUrl);
      this.bgMusic.loop = true;
      this.updateEffectiveMusicVolume();

      this.bgMusic.addEventListener('canplaythrough', () => {
        this.bgMusicLoaded = true;
        if (this.gameStarted && !this.musicMuted) {
          this.playBgMusic();
        }
      });

      this.bgMusic.addEventListener('error', () => {
        // Try fallback candidate source if available
        if (this.currentAudioSourceIndex < this.audioSources.length - 1) {
          this.currentAudioSourceIndex++;
          this.initBackgroundMusic();
        } else {
          // Display warning in developer console instead of crashing
          console.warn(
            `[Background Music] Background track "${this.trackTitle}" (audio/background-music.mp3) not found. Starting procedural horror melody synthesizer in its place.`
          );
          this.bgMusicLoaded = false;
          // Start procedural melodic accompaniment if game is already active
          if (this.gameStarted && !this.musicMuted) {
            this.startProceduralMusic();
          }
        }
      });
    } catch (err) {
      console.warn('[Background Music] HTML5 Audio initialization notice:', err);
    }
  }

  public isUsingProceduralMusic(): boolean {
    return !this.bgMusicLoaded;
  }

  // --- PROCEDURAL HORROR MUSIC SYNTHESIZER ---
  // When an audio file is not present, this plays an eerie, cinematic horror music progression
  // ("Being Watched" theme: eerie piano-like minor chords, bell harmonics, creeping pads)

  private startProceduralMusic() {
    if (this.proceduralMusicActive || this.musicMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.proceduralMusicActive = true;
    const ctx = this.ctx;

    if (!this.proceduralMusicGain) {
      this.proceduralMusicGain = ctx.createGain();
      this.proceduralMusicGain.connect(ctx.destination);
    }
    this.updateEffectiveMusicVolume();

    // Minor progression: Dm -> Bb -> Gm -> A (Dissonant / suspenseful)
    const melodyScale = [
      [293.66, 349.23, 440.00], // D4, F4, A4 (Dm)
      [233.08, 293.66, 349.23], // Bb3, D4, F4 (Bb)
      [196.00, 233.08, 293.66], // G3, Bb3, D4 (Gm)
      [220.00, 277.18, 329.63], // A3, C#4, E4 (A)
    ];

    let chordIdx = 0;
    const playChord = () => {
      if (!this.proceduralMusicActive || !this.ctx || this.musicMuted) return;
      const now = this.ctx.currentTime;
      const notes = melodyScale[chordIdx % melodyScale.length];
      chordIdx++;

      // Play soft arpeggiated piano/bell notes
      notes.forEach((freq, i) => {
        if (!this.ctx || !this.proceduralMusicGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.45);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now + i * 0.45);

        const targetVol = (this.isNight ? 0.08 : 0.05) * this.musicVolume;
        noteGain.gain.setValueAtTime(0.001, now + i * 0.45);
        noteGain.gain.exponentialRampToValueAtTime(targetVol, now + i * 0.45 + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.45 + 2.4);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.proceduralMusicGain);

        osc.start(now + i * 0.45);
        osc.stop(now + i * 0.45 + 2.5);
      });
    };

    // Play immediate first chord
    playChord();

    // Loop eerie chords every 2.8 seconds
    if (this.proceduralMusicInterval) {
      clearInterval(this.proceduralMusicInterval);
    }
    this.proceduralMusicInterval = window.setInterval(playChord, 2800);
  }

  private stopProceduralMusic() {
    this.proceduralMusicActive = false;
    if (this.proceduralMusicInterval) {
      clearInterval(this.proceduralMusicInterval);
      this.proceduralMusicInterval = null;
    }
    if (this.proceduralMusicGain && this.ctx) {
      this.proceduralMusicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  private playBgMusic() {
    if (this.musicMuted || !this.gameStarted) return;
    this.updateEffectiveMusicVolume();

    if (this.bgMusic && this.bgMusicLoaded) {
      const playPromise = this.bgMusic.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[Background Music] Playback waiting for user gesture or source ready:', err.message);
          this.startProceduralMusic();
        });
      }
    } else {
      // Fallback to procedural music
      this.startProceduralMusic();
    }
  }

  private pauseBgMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
    this.stopProceduralMusic();
  }

  public updateEffectiveMusicVolume() {
    // Base volume set by user
    let vol = this.musicVolume;

    // During DAY: play quietly in background (volume kept low)
    if (!this.isNight) {
      vol = vol * 0.90;
    }

    // When entering a special horror location: lower background music slightly
    if (this.isHorrorLocation) {
      vol = vol * 0.65;
    }

    // When monster appears: do not stop music, duck volume slightly during tension
    if (this.isMonsterTensionActive) {
      vol = vol * 0.55;
    }

    if (this.musicMuted) {
      vol = 0;
    }

    // Update HTML5 audio element
    if (this.bgMusic) {
      this.bgMusic.volume = Math.max(0, Math.min(1, vol));
    }

    // Update procedural music gain
    if (this.proceduralMusicGain && this.ctx) {
      this.proceduralMusicGain.gain.setValueAtTime(vol * 0.6, this.ctx.currentTime);
    }
  }

  // --- GAME START & USER GESTURE AUTOPLAY UNLOCK ---

  public startGameAudio() {
    this.gameStarted = true;
    this.initCtx();

    // Start background music or procedural horror music synthesizer
    if (!this.musicMuted) {
      this.playBgMusic();
    }

    // Start environmental ambiance
    this.startAmbiance(this.currentLocation, this.isNight);
  }

  // --- AUDIO CONTROLS & LOCALSTORAGE PERSISTENCE ---

  public toggleMusicMute(): boolean {
    this.musicMuted = !this.musicMuted;
    localStorage.setItem('shadows_beneath_music_muted', String(this.musicMuted));
    localStorage.setItem('shadows_beneath_muted', String(this.musicMuted && this.sfxMuted));

    if (this.musicMuted) {
      this.pauseBgMusic();
    } else {
      this.playBgMusic();
    }

    this.updateEffectiveMusicVolume();
    return this.musicMuted;
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    localStorage.setItem('shadows_beneath_music_muted', String(muted));
    if (this.musicMuted) {
      this.pauseBgMusic();
    } else {
      this.playBgMusic();
    }
    this.updateEffectiveMusicVolume();
  }

  public getMusicMuted(): boolean {
    return this.musicMuted;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('shadows_beneath_music_volume', this.musicVolume.toFixed(2));
    this.updateEffectiveMusicVolume();
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public toggleSfxMute(): boolean {
    this.sfxMuted = !this.sfxMuted;
    localStorage.setItem('shadows_beneath_sfx_muted', String(this.sfxMuted));
    localStorage.setItem('shadows_beneath_muted', String(this.musicMuted && this.sfxMuted));

    if (this.ambientGain) {
      const baseGain = this.isNight ? 0.14 : 0.08;
      this.ambientGain.gain.value = this.sfxMuted ? 0 : baseGain * this.sfxVolume;
    }
    return this.sfxMuted;
  }

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
    localStorage.setItem('shadows_beneath_sfx_muted', String(muted));
    if (this.ambientGain) {
      const baseGain = this.isNight ? 0.14 : 0.08;
      this.ambientGain.gain.value = this.sfxMuted ? 0 : baseGain * this.sfxVolume;
    }
  }

  public getSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('shadows_beneath_sfx_volume', this.sfxVolume.toFixed(2));
    if (this.ambientGain) {
      const baseGain = this.isNight ? 0.14 : 0.08;
      this.ambientGain.gain.value = this.sfxMuted ? 0 : baseGain * this.sfxVolume;
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  // Combined legacy toggle (used for quick mute all)
  public toggleMute(): boolean {
    const nextState = !(this.musicMuted && this.sfxMuted);
    this.setMusicMuted(nextState);
    this.setSfxMuted(nextState);
    return nextState;
  }

  public getMuted(): boolean {
    return this.musicMuted && this.sfxMuted;
  }

  // --- DAY / NIGHT & SPECIAL HORROR LOCATIONS ---

  public setNightMode(isNight: boolean) {
    this.isNight = isNight;
    this.updateEffectiveMusicVolume();

    // In NIGHT: slightly increase volume of ambient horror sounds and environmental effects
    if (this.ambientGain) {
      const baseGain = isNight ? 0.14 : 0.08;
      this.ambientGain.gain.value = this.sfxMuted ? 0 : baseGain * this.sfxVolume;
    }
  }

  public setLocation(location: string) {
    this.currentLocation = location;
    // Special horror locations: house, mine, lab
    const specialHorrorLocations = ['house', 'mine', 'lab'];
    const nowHorror = specialHorrorLocations.includes(location);

    if (nowHorror !== this.isHorrorLocation) {
      this.isHorrorLocation = nowHorror;
      this.updateEffectiveMusicVolume();
    }

    this.startAmbiance(location, this.isNight);
    this.manageEnvironmentalSounds(nowHorror);
  }

  // Subtle environmental sounds in horror locations (creaks, distant pipe groans)
  private manageEnvironmentalSounds(enable: boolean) {
    if (this.environmentalSoundInterval) {
      clearInterval(this.environmentalSoundInterval);
      this.environmentalSoundInterval = null;
    }

    if (enable) {
      this.environmentalSoundInterval = window.setInterval(() => {
        if (!this.sfxMuted && this.gameStarted) {
          this.playSubtleEnvironmentalSound(this.currentLocation);
        }
      }, 18000 + Math.random() * 12000);
    }
  }

  public playSubtleEnvironmentalSound(location: string) {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    if (location === 'house') {
      // Wood floor creak
      this.playDoor(false);
    } else if (location === 'mine') {
      // Distant cavern drip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } else if (location === 'lab') {
      // Low electrical hum resonance
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.03 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.25);
    }
  }

  // --- MONSTER TENSION EFFECT ---

  public triggerMonsterTension() {
    if (this.isMonsterTensionActive) return;

    this.isMonsterTensionActive = true;
    this.updateEffectiveMusicVolume();

    // Short tension sound effect
    this.playTensionSting();

    if (this.monsterTensionTimer) {
      clearTimeout(this.monsterTensionTimer);
    }

    // Return to normal background music volume after short tension
    this.monsterTensionTimer = window.setTimeout(() => {
      this.isMonsterTensionActive = false;
      this.updateEffectiveMusicVolume();
      this.monsterTensionTimer = null;
    }, 2800);
  }

  public playTensionSting() {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // High suspense dissonant screech chord
    const freqs = [587.33, 622.25, 880]; // D5, D#5 (dissonant semitone), A5
    freqs.forEach((f) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(f * 1.05, this.ctx.currentTime + 1.4);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.45);
    });
  }

  // --- WEB AUDIO CONTEXT INITIALIZATION ---

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- AMBIENT SOUNDS ---

  public startAmbiance(location: string, isNight: boolean) {
    if (this.sfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopAmbiance();

    const masterAmbGain = this.ctx.createGain();
    const baseGain = isNight ? 0.14 : 0.08;
    masterAmbGain.gain.setValueAtTime(this.sfxMuted ? 0 : baseGain * this.sfxVolume, this.ctx.currentTime);
    masterAmbGain.connect(this.ctx.destination);
    this.ambientGain = masterAmbGain;

    // Low drone
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isNight ? 120 : 180, this.ctx.currentTime);

    osc.type = isNight ? 'sawtooth' : 'sine';
    const baseFreq = location === 'mine' || location === 'lab' ? 45 : (isNight ? 55 : 75);
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(masterAmbGain);
    osc.start();
    this.ambientOsc = osc;

    // Wind / breath noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isNight ? 320 : 500, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04 * this.sfxVolume, this.ctx.currentTime);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterAmbGain);
    whiteNoise.start();
    this.ambientNoise = whiteNoise;
  }

  public stopAmbiance() {
    try {
      if (this.ambientOsc) {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
        this.ambientOsc = null;
      }
      if (this.ambientNoise) {
        this.ambientNoise.stop();
        this.ambientNoise.disconnect();
        this.ambientNoise = null;
      }
      if (this.ambientGain) {
        this.ambientGain.disconnect();
        this.ambientGain = null;
      }
    } catch {
      // ignore cleanup errors
    }
  }

  // --- SOUND EFFECTS ---

  public playFootstep(surface: 'wood' | 'grass' | 'stone' | 'metal' = 'stone') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    let freq = 80;
    let type: OscillatorType = 'triangle';
    if (surface === 'grass') {
      freq = 60 + Math.random() * 20;
      filter.type = 'lowpass';
    } else if (surface === 'wood') {
      freq = 110 + Math.random() * 30;
      filter.type = 'bandpass';
    } else if (surface === 'metal') {
      freq = 240 + Math.random() * 60;
      type = 'sawtooth';
    }

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  public playFlashlight() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playCamera() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Shutter snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);

    // Flash recharge whine
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const whine = this.ctx.createOscillator();
      const whineGain = this.ctx.createGain();
      whine.type = 'sine';
      whine.frequency.setValueAtTime(2000, this.ctx.currentTime);
      whine.frequency.linearRampToValueAtTime(5000, this.ctx.currentTime + 0.6);

      whineGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      whineGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      whine.connect(whineGain);
      whineGain.connect(this.ctx.destination);
      whine.start();
      whine.stop(this.ctx.currentTime + 0.62);
    }, 120);
  }

  public playSwing() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  public playDoor(isClosing = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    if (isClosing) {
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    } else {
      // Creak open
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(280, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    }

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  public playClueFound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Eerie minor bell triad
    const notes = [440, 523.25, 622.25, 880]; // A4, C5, Eb5, A5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.85);
      }, idx * 130);
    });
  }

  public playHorrorSting() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Harsh dissonant tritone cluster
    const cluster = [110, 155.56, 220, 311.13];
    cluster.forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq - 15, this.ctx.currentTime + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.25);
    });
  }

  public playMonsterGroan() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(85, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(55, this.ctx.currentTime + 0.7);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.72);
  }

  public playPuzzleSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [330, 440, 554.37, 659.25];
    chords.forEach((f, i) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.52);
      }, i * 100);
    });
  }

  public playLockerOpen() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Metallic latch clink
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.15);
    gain1.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start();
    osc1.stop(this.ctx.currentTime + 0.16);

    // Heavy locker door creak / resonance
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.28);
      gain2.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start();
      osc2.stop(this.ctx.currentTime + 0.3);
    }, 80);
  }

  public playSwordSwing() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Sharp metallic blade whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.18);
    filter.Q.value = 4.0;

    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playNightWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Distant warning bell / eerie low gong
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 2.5);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 2.6);
  }

  public updateFear(level: number) {
    this.fearLevel = Math.max(0, Math.min(1, level));
    if (this.fearLevel > 0.4 && !this.heartbeatInterval && !this.isMuted) {
      this.startHeartbeat();
    } else if (this.fearLevel <= 0.4 && this.heartbeatInterval) {
      this.stopHeartbeat();
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;
    const intervalMs = Math.max(450, 950 - this.fearLevel * 450);
    this.heartbeatInterval = window.setInterval(() => {
      this.playThump();
      setTimeout(() => this.playThump(0.7), 160);
    }, intervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private playThump(volumeMult = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25 * volumeMult * (0.5 + this.fearLevel * 0.5), this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }
}

export const sound = new SoundSystem();
