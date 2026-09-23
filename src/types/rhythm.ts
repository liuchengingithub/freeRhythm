export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
export type TupletRatio = '3:2' | '3:4';

export interface RhythmNote {
  id: string;
  value: NoteValue;
  isRest: boolean;
  dots: number;
  tuplet?: TupletRatio;
}

export interface Measure {
  id: string;
  notes: RhythmNote[];
  timeSignature: { numerator: number; denominator: number };
  totalDuration: number;
  isComplete: boolean;
}

export interface RhythmTab {
  id: string;
  title: string;
  tempo: number;
  timeSignature: { numerator: number; denominator: number };
  measures: Measure[];
}

// 新增：歌曲类型
export interface Song {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  tab: RhythmTab;
}

export interface PaletteNoteType {
  id: string;
  value: NoteValue;
  isRest: boolean;
  dots: number;
  tuplet?: TupletRatio;
  label: string;
  displayValue: string;
}