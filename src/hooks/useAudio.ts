import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

interface ClickSounds {
  down: Tone.Synth;
  up: Tone.Synth;
  sub: Tone.Synth;
}

export function useAudio() {
  const soundsRef = useRef<ClickSounds | null>(null);
  const isInitializedRef = useRef(false);

  const initializeAudio = useCallback(async () => {
    if (isInitializedRef.current) return;
    
    await Tone.start();
    
    const down = new Tone.MembraneSynth({
      pitchDecay: 0.001,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0,
        release: 0.08,
      },
    }).toDestination();

    const up = new Tone.MembraneSynth({
      pitchDecay: 0.001,
      octaves: 1.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.05,
      },
    }).toDestination();

    const sub = new Tone.MembraneSynth({
      pitchDecay: 0.001,
      octaves: 1,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.03,
        sustain: 0,
        release: 0.03,
      },
    }).toDestination();

    down.volume.value = -6;
    up.volume.value = -10;
    sub.volume.value = -14;

    soundsRef.current = { down, up, sub };
    isInitializedRef.current = true;
  }, []);

  const playClick = useCallback((type: 'down' | 'up' | 'sub', time?: number) => {
    if (!soundsRef.current) return;
    const synth = soundsRef.current[type];
    synth.triggerAttackRelease('C4', '32n', time);
  }, []);

  const playMutedClick = useCallback((time?: number) => {
    if (!soundsRef.current) return;
    const synth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.02 },
    }).toDestination();
    synth.volume.value = -12;
    synth.triggerAttackRelease('32n', time);
    setTimeout(() => synth.dispose(), 100);
  }, []);

  useEffect(() => {
    return () => {
      if (soundsRef.current) {
        soundsRef.current.down.dispose();
        soundsRef.current.up.dispose();
        soundsRef.current.sub.dispose();
      }
    };
  }, []);

  return { initializeAudio, playClick, playMutedClick };
}
