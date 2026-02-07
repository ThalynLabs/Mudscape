import type { SoundpackFile } from '@shared/schema';

export interface ActiveSound {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  pannerNode?: PannerNode;
  loop: boolean;
}

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSounds: Map<string, ActiveSound> = new Map();
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  private soundpackFiles: Map<string, SoundpackFile> = new Map();
  private masterVolume: number = 1.0;

  async init(): Promise<void> {
    if (this.audioContext) return;
    
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = this.masterVolume;
    
    console.log('Sound manager initialized');
  }

  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  setSoundpack(files: SoundpackFile[]): void {
    this.soundpackFiles.clear();
    for (const file of files) {
      this.soundpackFiles.set(file.name, file);
      this.soundpackFiles.set(file.name.toLowerCase(), file);
      const withExt = file.filename.split('_').slice(2).join('_');
      if (withExt && withExt !== file.name) {
        this.soundpackFiles.set(withExt, file);
        this.soundpackFiles.set(withExt.toLowerCase(), file);
      }
    }
  }

  private resolveSound(name: string): AudioBuffer | undefined {
    let buffer = this.soundBuffers.get(name);
    if (buffer) return buffer;

    const noExt = name.replace(/\.[^.]+$/, '');
    if (noExt !== name) {
      buffer = this.soundBuffers.get(noExt);
      if (buffer) return buffer;
    }

    const basename = name.split('/').pop() || name;
    if (basename !== name) {
      buffer = this.soundBuffers.get(basename);
      if (buffer) return buffer;
      const bnNoExt = basename.replace(/\.[^.]+$/, '');
      if (bnNoExt !== basename) {
        buffer = this.soundBuffers.get(bnNoExt);
        if (buffer) return buffer;
      }
    }

    const lower = noExt.toLowerCase();
    const entries = Array.from(this.soundBuffers.entries());
    for (let i = 0; i < entries.length; i++) {
      if (entries[i][0].toLowerCase() === lower) return entries[i][1];
    }

    return undefined;
  }

  async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) await this.init();
    if (!this.audioContext) return;
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundBuffers.set(name, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound "${name}":`, error);
    }
  }

  async preloadSoundpack(files: SoundpackFile[]): Promise<void> {
    this.setSoundpack(files);
    
    for (const file of files) {
      if (!this.soundBuffers.has(file.name)) {
        await this.loadSound(file.name, `/api/sounds/${file.filename}`);
      }
      const withExt = file.filename.split('_').slice(2).join('_');
      if (withExt && withExt !== file.name) {
        const buffer = this.soundBuffers.get(file.name);
        if (buffer) {
          this.soundBuffers.set(withExt, buffer);
          this.soundBuffers.set(withExt.replace(/\.[^.]+$/, ''), buffer);
        }
      }
    }
  }

  play(
    name: string,
    volume: number = 1.0,
    loop: boolean = false
  ): void {
    if (!this.audioContext || !this.masterGain) {
      console.warn('Sound manager not initialized');
      return;
    }

    let buffer = this.resolveSound(name);
    if (!buffer) {
      const spFile = this.resolveSoundpackFile(name);
      if (spFile) {
        buffer = this.soundBuffers.get(spFile.name);
      }
    }
    if (!buffer) {
      console.warn(`Sound "${name}" not loaded`);
      return;
    }

    this.stop(name);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(0);

    this.activeSounds.set(name, {
      source,
      gainNode,
      loop,
    });

    if (!loop) {
      source.onended = () => {
        this.activeSounds.delete(name);
      };
    }
  }

  loop(name: string, volume: number = 1.0): void {
    this.play(name, volume, true);
  }

  stop(name: string): void {
    const sound = this.activeSounds.get(name);
    if (sound) {
      try {
        sound.source.stop();
      } catch {
      }
      this.activeSounds.delete(name);
    }
  }

  stopAll(): void {
    Array.from(this.activeSounds.keys()).forEach(name => {
      this.stop(name);
    });
  }

  setVolume(name: string, volume: number): void {
    const sound = this.activeSounds.get(name);
    if (sound) {
      sound.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setPosition(name: string, x: number, y: number, z: number = 0): void {
    if (!this.audioContext || !this.masterGain) return;

    const sound = this.activeSounds.get(name);
    if (!sound) return;

    if (!sound.pannerNode) {
      const panner = this.audioContext.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;

      sound.gainNode.disconnect();
      sound.gainNode.connect(panner);
      panner.connect(this.masterGain);
      sound.pannerNode = panner;
    }

    sound.pannerNode.positionX.setValueAtTime(x, this.audioContext.currentTime);
    sound.pannerNode.positionY.setValueAtTime(y, this.audioContext.currentTime);
    sound.pannerNode.positionZ.setValueAtTime(z, this.audioContext.currentTime);
  }

  private resolveSoundpackFile(name: string): SoundpackFile | undefined {
    let file = this.soundpackFiles.get(name);
    if (file) return file;
    file = this.soundpackFiles.get(name.toLowerCase());
    if (file) return file;
    const noExt = name.replace(/\.[^.]+$/, '');
    if (noExt !== name) {
      file = this.soundpackFiles.get(noExt);
      if (file) return file;
      file = this.soundpackFiles.get(noExt.toLowerCase());
      if (file) return file;
    }
    const basename = name.split('/').pop() || name;
    if (basename !== name) {
      file = this.soundpackFiles.get(basename);
      if (file) return file;
      file = this.soundpackFiles.get(basename.toLowerCase());
      if (file) return file;
      const bnNoExt = basename.replace(/\.[^.]+$/, '');
      if (bnNoExt !== basename) {
        file = this.soundpackFiles.get(bnNoExt);
        if (file) return file;
        file = this.soundpackFiles.get(bnNoExt.toLowerCase());
        if (file) return file;
      }
    }
    return undefined;
  }

  playFromSoundpack(
    mspName: string,
    volumeOverride?: number,
    loopOverride?: boolean
  ): void {
    const file = this.resolveSoundpackFile(mspName);
    if (!file) {
      console.warn(`MSP sound "${mspName}" not in soundpack`);
      return;
    }

    const volume = volumeOverride ?? file.volume;
    const loop = loopOverride ?? file.loop;
    
    this.play(file.name, volume, loop);
  }

  isPlaying(name: string): boolean {
    return this.activeSounds.has(name);
  }

  getActiveSounds(): string[] {
    return Array.from(this.activeSounds.keys());
  }
}

export const soundManager = new SoundManager();
