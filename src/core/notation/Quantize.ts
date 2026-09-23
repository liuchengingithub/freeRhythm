import type { Measure, TimeSignature, Note } from '../../types/notation';
import { getActualDuration, quantizeBeatPosition } from './Duration';

export interface QuantizeResult {
  measureIndex: number;
  beatPosition: number;
  isValid: boolean;
  targetMeasure: Measure | null;
}

export function quantizeMousePosition(
  mouseX: number,
  measures: Measure[],
  pxPerBeat: number,
  subdivision: 'eighth' | 'sixteenth',
  _defaultTimeSig: TimeSignature
): QuantizeResult {
  let accumulatedWidth = 0;
  
  for (const measure of measures) {
    const measureWidth = measure.timeSignature.numerator * pxPerBeat;
    
    if (mouseX >= accumulatedWidth && mouseX < accumulatedWidth + measureWidth) {
      const relativeX = mouseX - accumulatedWidth;
      const rawBeatPos = relativeX / pxPerBeat;
      const quantizedBeatPos = quantizeBeatPosition(rawBeatPos, subdivision);
      
      return {
        measureIndex: measure.index,
        beatPosition: quantizedBeatPos,
        isValid: quantizedBeatPos < measure.timeSignature.numerator,
        targetMeasure: measure,
      };
    }
    
    accumulatedWidth += measureWidth;
  }
  
  const lastMeasure = measures[measures.length - 1];
  return {
    measureIndex: lastMeasure.index,
    beatPosition: 0,
    isValid: false,
    targetMeasure: lastMeasure,
  };
}

export function findInsertionIndex(
  notes: Note[],
  beatPosition: number,
  timeSig: TimeSignature,
  getDuration: (note: Note) => number
): number {
  let currentBeat = 0;
  
  for (let i = 0; i < notes.length; i++) {
    if (currentBeat >= beatPosition - 0.0001) {
      return i;
    }
    currentBeat += getDuration(notes[i]);
  }
  
  return notes.length;
}

export function getMeasureAtBeatPosition(
  measures: Measure[],
  absoluteBeat: number
): { measure: Measure; localBeat: number } | null {
  let accumulatedBeats = 0;
  
  for (const measure of measures) {
    const measureBeats = measure.timeSignature.numerator;
    if (absoluteBeat < accumulatedBeats + measureBeats) {
      return {
        measure,
        localBeat: absoluteBeat - accumulatedBeats,
      };
    }
    accumulatedBeats += measureBeats;
  }
  
  return null;
}
