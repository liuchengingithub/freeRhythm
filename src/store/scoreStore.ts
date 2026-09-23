import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Score, Measure, Note, TimeSignature, PaletteNote } from '../types/notation';
import { v4 as uuidv4 } from 'uuid';
import { getActualDuration } from '../core/notation/Duration';

interface ScoreState {
  score: Score;
  history: Score[];
  historyIndex: number;
  isPlaying: boolean;
  currentBeat: number;
  currentMeasureIndex: number;
  clickPreview: {
    measureIndex: number;
    beatPosition: number;
    isValid: boolean;
  } | null;
  
  // Actions
  setScore: (score: Score) => void;
  updateTempo: (tempo: number) => void;
  updateTimeSignature: (timeSig: TimeSignature, measureIndex?: number) => void;
  updateSubdivision: (subdivision: 'eighth' | 'sixteenth') => void;
  addMeasure: (timeSig?: TimeSignature) => void;
  removeMeasure: (index: number) => void;
  addNote: (measureIndex: number, note: Omit<Note, 'id'>) => void;
  removeNote: (measureIndex: number, noteId: string) => void;
  updateNote: (measureIndex: number, noteId: string, updates: Partial<Note>) => void;
  moveNote: (fromMeasure: number, noteId: string, toMeasure: number, beatPosition: number) => void;
  toggleTie: (measureIndex: number, noteId: string, targetNoteId: string) => void;
  setPlaying: (playing: boolean) => void;
  setPlayhead: (measureIndex: number, beat: number) => void;
  setClickPreview: (preview: { measureIndex: number; beatPosition: number; isValid: boolean } | null) => void;
  addNoteAtPreview: (paletteNote: PaletteNote) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  resetHistory: () => void;
}

const createEmptyScore = (): Score => ({
  id: uuidv4(),
  title: 'Untitled',
  tempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  measures: [{
    index: 0,
    timeSignature: { numerator: 4, denominator: 4 },
    notes: [],
    totalBeats: 0,
    isComplete: false,
  }],
  subdivision: 'sixteenth',
});

export const useScoreStore = create<ScoreState>()(
  immer((set, get) => ({
    score: createEmptyScore(),
    history: [],
    historyIndex: -1,
    isPlaying: false,
    currentBeat: 0,
    currentMeasureIndex: 0,
    clickPreview: null,

    setScore: (score) => set({ score }),

    updateTempo: (tempo) => set((state) => {
      state.score.tempo = tempo;
    }),

    updateTimeSignature: (timeSig, measureIndex) => set((state) => {
      if (measureIndex !== undefined) {
        const measure = state.score.measures[measureIndex];
        if (measure) {
          measure.timeSignature = timeSig;
        }
      } else {
        state.score.timeSignature = timeSig;
        if (state.score.measures.length > 0) {
          state.score.measures[0].timeSignature = timeSig;
        }
      }
    }),

    updateSubdivision: (subdivision) => set((state) => {
      state.score.subdivision = subdivision;
    }),

    addMeasure: (timeSig) => set((state) => {
      const newIndex = state.score.measures.length;
      const ts = timeSig || state.score.timeSignature;
      state.score.measures.push({
        index: newIndex,
        timeSignature: ts,
        notes: [],
        totalBeats: 0,
        isComplete: false,
      });
    }),

    removeMeasure: (index) => set((state) => {
      if (state.score.measures.length <= 1) return;
      state.score.measures.splice(index, 1);
      state.score.measures.forEach((m: Measure, i: number) => { m.index = i; });
    }),

    addNote: (measureIndex, note) => set((state) => {
      const measure = state.score.measures[measureIndex];
      if (!measure) return;
      
      const newNote: Note = {
        ...note,
        id: uuidv4(),
        measureIndex,
      };
      
      measure.notes.push(newNote);
      measure.notes.sort((a: Note, b: Note) => a.beatPosition - b.beatPosition);
      measure.totalBeats = measure.notes.reduce((sum: number, n: Note) => sum + getActualDuration(n, measure.timeSignature), 0);
      measure.isComplete = measure.totalBeats >= measure.timeSignature.numerator - 0.0001;
    }),

    removeNote: (measureIndex, noteId) => set((state) => {
      const measure = state.score.measures[measureIndex];
      if (!measure) return;
      
      measure.notes = measure.notes.filter((n: Note) => n.id !== noteId);
      measure.totalBeats = measure.notes.reduce((sum: number, n: Note) => sum + getActualDuration(n, measure.timeSignature), 0);
      measure.isComplete = measure.totalBeats >= measure.timeSignature.numerator - 0.0001;
    }),

    updateNote: (measureIndex, noteId, updates) => set((state) => {
      const measure = state.score.measures[measureIndex];
      if (!measure) return;
      
      const note = measure.notes.find((n: Note) => n.id === noteId);
      if (!note) return;
      
      Object.assign(note, updates);
      measure.notes.sort((a: Note, b: Note) => a.beatPosition - b.beatPosition);
    }),

    moveNote: (fromMeasure, noteId, toMeasure, beatPosition) => set((state) => {
      const sourceMeasure = state.score.measures[fromMeasure];
      const targetMeasure = state.score.measures[toMeasure];
      if (!sourceMeasure || !targetMeasure) return;
      
      const noteIndex = sourceMeasure.notes.findIndex((n: Note) => n.id === noteId);
      if (noteIndex === -1) return;
      
      const [note] = sourceMeasure.notes.splice(noteIndex, 1);
      note.measureIndex = toMeasure;
      note.beatPosition = beatPosition;
      
      targetMeasure.notes.push(note);
      targetMeasure.notes.sort((a: Note, b: Note) => a.beatPosition - b.beatPosition);
    }),

    toggleTie: (measureIndex, noteId, targetNoteId) => set((state) => {
      const measure = state.score.measures[measureIndex];
      if (!measure) return;
      
      const note = measure.notes.find((n: Note) => n.id === noteId);
      if (!note) return;
      
      if (note.tieToNext === targetNoteId) {
        note.tieToNext = undefined;
      } else {
        note.tieToNext = targetNoteId;
      }
    }),

    setPlaying: (playing) => set({ isPlaying: playing }),

    setPlayhead: (measureIndex, beat) => set({ 
      currentMeasureIndex: measureIndex, 
      currentBeat: beat 
    }),

    setClickPreview: (preview) => set({ clickPreview: preview }),

    addNoteAtPreview: (paletteNote: PaletteNote) => {
      const { clickPreview, score } = get();
      if (!clickPreview?.isValid) return;

      const { measureIndex, beatPosition } = clickPreview;
      const measure = score.measures[measureIndex];
      if (!measure) return;

      // 找到插入位置
      let insertIndex = 0;
      let currentBeat = 0;
      for (let i = 0; i < measure.notes.length; i++) {
        if (currentBeat >= beatPosition - 0.0001) {
          insertIndex = i;
          break;
        }
        currentBeat += getActualDuration(measure.notes[i], measure.timeSignature);
        insertIndex = i + 1;
      }

      const newNote: Note = {
        id: uuidv4(),
        value: paletteNote.value,
        dots: paletteNote.dots,
        tuplet: paletteNote.tuplet,
        isRest: paletteNote.isRest,
        accent: paletteNote.accent,
        notehead: paletteNote.notehead,
        measureIndex,
        beatPosition,
        tieToNext: undefined,
      };

      set((state) => {
        const m = state.score.measures[measureIndex];
        if (!m) return;
        m.notes.splice(insertIndex, 0, newNote);
        m.notes.sort((a: Note, b: Note) => a.beatPosition - b.beatPosition);
        m.totalBeats = m.notes.reduce((sum: number, n: Note) => sum + getActualDuration(n, m.timeSignature), 0);
        m.isComplete = m.totalBeats >= m.timeSignature.numerator - 0.0001;
        state.clickPreview = null;
      });
    },

    undo: () => set((state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        state.score = state.history[state.historyIndex];
      }
    }),

    redo: () => set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        state.score = state.history[state.historyIndex];
      }
    }),

    canUndo: () => get().historyIndex > 0,

    canRedo: () => get().historyIndex < get().history.length - 1,

    resetHistory: () => set((state) => {
      state.history = [state.score];
      state.historyIndex = 0;
    }),
  }))
);
