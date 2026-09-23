import * as Tone from 'tone';
import type { RhythmTab, RhythmNote } from '../types/rhythm';
import { getNoteDuration } from '../core/notation/NoteDuration';

export class RhythmPlayer {
  private synth: Tone.MembraneSynth | null = null;
  private isPlaying = false;
  private currentNoteIndex = 0;
  private onMeasureChange: ((measureIndex: number) => void) | null = null;
  private onComplete: (() => void) | null = null;

  async initialize() {
    if (this.synth) return;

    await Tone.start();

    this.synth = new Tone.MembraneSynth({
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

    this.synth.volume.value = -6;
  }

  async play(
    tab: RhythmTab,
    startMeasure: number = 0,
    endMeasure?: number,
    onMeasureChange?: (measureIndex: number) => void,
    onComplete?: () => void
  ) {
    await this.initialize();

    this.isPlaying = true;
    this.onMeasureChange = onMeasureChange || null;
    this.onComplete = onComplete || null;

    const bpm = tab.tempo;
    const beatDuration = (60 / bpm) * 1000; // 毫秒
    const end = endMeasure ?? tab.measures.length - 1;

    let absoluteTime = 0;

    for (let measureIndex = startMeasure; measureIndex <= end; measureIndex++) {
      if (!this.isPlaying) return;

      const measure = tab.measures[measureIndex];
      if (!measure) break;

      for (let noteIndex = 0; noteIndex < measure.notes.length; noteIndex++) {
        if (!this.isPlaying) return;

        const note = measure.notes[noteIndex];
        const noteDuration = getNoteDuration(note.value, note.dots, note.tuplet);
        const noteTimeMs = noteDuration * beatDuration;

        const scheduleTime = Tone.now() + absoluteTime / 1000;

        if (!note.isRest && this.synth) {
          this.synth.triggerAttackRelease(
            'C4',
            noteDuration + 's',
            scheduleTime
          );
        }

        absoluteTime += noteTimeMs;

        if (noteIndex === 0 && this.onMeasureChange) {
          setTimeout(() => {
            this.onMeasureChange?.(measureIndex);
          }, absoluteTime);
        }
      }
    }

    // 播放完成
    setTimeout(() => {
      this.isPlaying = false;
      this.onComplete?.();
    }, absoluteTime);
  }

  stop() {
    this.isPlaying = false;
    if (this.synth) {
      this.synth.triggerRelease();
    }
  }

  pause() {
    this.isPlaying = false;
  }

  async resume(
    tab: RhythmTab,
    fromMeasure: number = 0,
    onMeasureChange?: (measureIndex: number) => void,
    onComplete?: () => void
  ) {
    this.play(tab, fromMeasure, undefined, onMeasureChange, onComplete);
  }

  dispose() {
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }
}