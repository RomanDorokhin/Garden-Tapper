import { useEffect, useCallback, useState } from 'react';

// Telegram WebApp types
interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  enableClosingConfirmation: () => void;
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
  platform: string;
  version: string;
  isExpanded: boolean;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [user, setUser] = useState<{ id: number; first_name: string; last_name?: string; username?: string } | null>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
    }
  }, []);

  const haptic = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
      } catch {
        // ignore
      }
    },
    []
  );

  const hapticSuccess = useCallback(() => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch {
      // ignore
    }
  }, []);

  const hapticError = useCallback(() => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } catch {
      // ignore
    }
  }, []);

  return { user, haptic, hapticSuccess, hapticError };
}

// Web Audio API synth for game sounds
class SoundSynth {
  ctx: AudioContext | null = null;
  enabled = true;

  ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  tap() {
    this.playTone(800, 0.08, 'sine', 0.08);
  }

  water() {
    this.playTone(600, 0.12, 'sine', 0.1);
    setTimeout(() => this.playTone(800, 0.1, 'sine', 0.08), 60);
  }

  superWater() {
    this.playTone(500, 0.15, 'sine', 0.12);
    setTimeout(() => this.playTone(700, 0.15, 'sine', 0.1), 80);
    setTimeout(() => this.playTone(1000, 0.2, 'sine', 0.15), 160);
  }

  harvest() {
    this.playTone(523, 0.15, 'triangle', 0.12);
    setTimeout(() => this.playTone(659, 0.15, 'triangle', 0.1), 100);
    setTimeout(() => this.playTone(784, 0.2, 'triangle', 0.12), 200);
    setTimeout(() => this.playTone(1047, 0.3, 'triangle', 0.15), 300);
  }

  doubleHarvest() {
    this.playTone(523, 0.1, 'triangle', 0.12);
    setTimeout(() => this.playTone(659, 0.1, 'triangle', 0.1), 80);
    setTimeout(() => this.playTone(784, 0.1, 'triangle', 0.12), 160);
    setTimeout(() => this.playTone(1047, 0.15, 'triangle', 0.15), 240);
    setTimeout(() => this.playTone(1319, 0.3, 'triangle', 0.2), 350);
  }

  levelUp() {
    this.playTone(440, 0.1, 'square', 0.08);
    setTimeout(() => this.playTone(554, 0.1, 'square', 0.08), 100);
    setTimeout(() => this.playTone(659, 0.1, 'square', 0.08), 200);
    setTimeout(() => this.playTone(880, 0.4, 'square', 0.12), 300);
  }

  buy() {
    this.playTone(440, 0.1, 'sine', 0.1);
    setTimeout(() => this.playTone(660, 0.15, 'sine', 0.1), 80);
  }

  error() {
    this.playTone(200, 0.2, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.1), 150);
  }

  combo() {
    this.playTone(400 + Math.random() * 400, 0.1, 'sine', 0.08);
  }

  setEnabled(v: boolean) {
    this.enabled = v;
  }
}

const synth = new SoundSynth();

export function useSound() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem('sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    synth.setEnabled(enabled);
    try {
      localStorage.setItem('sound_enabled', enabled.toString());
    } catch {
      // ignore
    }
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((p) => !p), []);

  return {
    enabled,
    toggle,
    tap: () => synth.tap(),
    water: () => synth.water(),
    superWater: () => synth.superWater(),
    harvest: () => synth.harvest(),
    doubleHarvest: () => synth.doubleHarvest(),
    levelUp: () => synth.levelUp(),
    buy: () => synth.buy(),
    error: () => synth.error(),
    combo: () => synth.combo(),
  };
}
