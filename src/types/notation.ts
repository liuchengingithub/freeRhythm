export type NoteValue = 
  | 'whole'
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth'
  | 'thirty-second';

export type TupletRatio = '3:2' | '3:4' | '5:4' | '6:4' | '7:4';

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface Note {
  id: string;
  value: NoteValue;
  dots: number;
  tuplet?: TupletRatio;
  isRest: boolean;
  tieToNext?: string;
  accent?: 'normal' | 'accent' | 'strong-accent';
  articulation?: 'normal' | 'staccato' | 'tenuto' | 'fermata';
  notehead?: 'normal' | 'x' | 'diamond' | 'triangle';
  x?: number;
  measureIndex: number;
  beatPosition: number;
}

export interface Measure {
  index: number;
  timeSignature: TimeSignature;
  notes: Note[];
  totalBeats: number;
  isComplete: boolean;
}

export interface Score {
  id: string;
  title: string;
  tempo: number;
  timeSignature: TimeSignature;
  measures: Measure[];
  subdivision: 'eighth' | 'sixteenth';
}

export interface PaletteNote {
  value: NoteValue;
  dots: number;
  tuplet?: TupletRatio;
  isRest: boolean;
  accent: 'normal' | 'accent' | 'strong-accent';
  notehead: 'normal' | 'x' | 'diamond' | 'triangle';
  label: string;
}

export const BASE_DURATION_MAP: Record<NoteValue, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
};

export const NOTE_VALUE_ORDER: NoteValue[] = [
  'whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty-second'
];

export const REST_SYMBOLS: Record<NoteValue, string> = {
  whole: '𝄻',
  half: '𝄼',
  quarter: '𝄽',
  eighth: '𝄾',
  sixteenth: '𝄿',
  'thirty-second': '𝅀',
};

export const DEFAULT_ACCENT_PATTERNS: Record<string, boolean[]> = {
  '2/4': [true, false],
  '3/4': [true, false, false],
  '4/4': [true, false, true, false],
  '6/8': [true, false, false, true, false, false],
  '7/8': [true, false, false, true, false, false, false],
  '5/4': [true, false, true, false, false],
  '9/8': [true, false, false, true, false, false, true, false, false],
  '12/8': [true, false, false, true, false, false, true, false, false, true, false, false],
};
