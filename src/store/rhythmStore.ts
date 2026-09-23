import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { RhythmTab, Measure, RhythmNote, Song } from '../types/rhythm';
import { v4 as uuidv4 } from 'uuid';
import { getMeasureTotalDuration, isMeasureComplete } from '../core/notation/NoteDuration';

interface RhythmStoreState {
  // 歌曲管理
  songs: Song[];
  activeSongId: string;

  isPlaying: boolean;
  currentMeasureIndex: number;
  currentNoteIndex: number;
  selectedMeasureIndexes: number[];

  // 获取当前活跃的歌曲
  getActiveSong: () => Song | null;
  getActiveTab: () => RhythmTab | null;

  // 歌曲操作
  createSong: (title?: string) => void;
  deleteSong: (songId: string) => void;
  switchSong: (songId: string) => void;
  updateSongTitle: (songId: string, title: string) => void;

  // Tab 操作
  updateTempo: (tempo: number) => void;
  updateTimeSignature: (ts: { numerator: number; denominator: number }) => void;
  addMeasure: () => void;
  removeMeasure: (index: number) => void;
  addNoteToMeasure: (measureIndex: number, note: RhythmNote) => void;
  removeNoteFromMeasure: (measureIndex: number, noteId: string) => void;
  
  // 播放控制
  setPlaying: (playing: boolean) => void;
  setPlayhead: (measureIndex: number, noteIndex: number) => void;
  clearMeasure: (measureIndex: number) => void;

  // 多选操作
  setSelectedMeasure: (index: number, multi: boolean) => void;
  toggleSelectedMeasure: (index: number) => void;
  clearSelectedMeasures: () => void;
  deleteSelectedMeasures: () => void;
  moveMeasure: (fromIndex: number, toIndex: number) => void;
  copyMeasure: (index: number) => void;
}

const createEmptyTab = (): RhythmTab => ({
  id: uuidv4(),
  title: '新节奏',
  tempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  measures: [
    {
      id: uuidv4(),
      notes: [],
      timeSignature: { numerator: 4, denominator: 4 },
      totalDuration: 0,
      isComplete: false,
    },
  ],
});

const createEmptySong = (title: string = '新歌曲'): Song => {
  const now = Date.now();
  return {
    id: uuidv4(),
    title,
    createdAt: now,
    updatedAt: now,
    tab: createEmptyTab(),
  };
};

const defaultSong = createEmptySong('默认歌曲');

export const useRhythmStore = create<RhythmStoreState>()(
  persist(
    immer((set, get) => ({
      songs: [defaultSong],
      activeSongId: defaultSong.id,  // ← 直接设置第一个歌曲的 ID

      isPlaying: false,
      currentMeasureIndex: 0,
      currentNoteIndex: 0,
      selectedMeasureIndexes: [],

      getActiveSong: () => {
        const state = get();
        return state.songs.find((s) => s.id === state.activeSongId) || state.songs[0] || null;

      },

      getActiveTab: () => {
        const song = get().getActiveSong();
        return song ? song.tab : null;
      },

      createSong: (title = '新歌曲') => set((state) => {
        const newSong = createEmptySong(title);
        state.songs.push(newSong);
        state.activeSongId = newSong.id;
      }),

      deleteSong: (songId) => set((state) => {
        if (state.songs.length <= 1) return;

        state.songs = state.songs.filter((s) => s.id !== songId);
        
        if (state.activeSongId === songId) {
          state.activeSongId = state.songs[0]?.id || '';
        }
      }),

      switchSong: (songId) => set((state) => {
        if (state.songs.find((s) => s.id === songId)) {
          state.activeSongId = songId;
          state.selectedMeasureIndexes = [];
          state.isPlaying = false;
        }
      }),

      updateSongTitle: (songId, title) => set((state) => {
        const song = state.songs.find((s) => s.id === songId);
        if (song) {
          song.title = title;
          song.updatedAt = Date.now();
        }
      }),

      updateTempo: (tempo) => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (song) {
          song.tab.tempo = tempo;
          song.updatedAt = Date.now();
        }
      }),

      updateTimeSignature: (ts) => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (song) {
          song.tab.timeSignature = ts;
          song.tab.measures.forEach((measure) => {
            measure.timeSignature = ts;
          });
          song.updatedAt = Date.now();
        }
      }),

      addMeasure: () => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (!song) return;

        const newMeasure: Measure = {
          id: uuidv4(),
          notes: [],
          timeSignature: song.tab.timeSignature,
          totalDuration: 0,
          isComplete: false,
        };
        song.tab.measures.push(newMeasure);
        song.updatedAt = Date.now();
      }),

      removeMeasure: (index) => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (!song || song.tab.measures.length <= 1) return;

        song.tab.measures.splice(index, 1);
        song.updatedAt = Date.now();
      }),

      addNoteToMeasure: (measureIndex, note) => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (!song) return;

        const measure = song.tab.measures[measureIndex];
        if (!measure) return;

        measure.notes.push(note);
        measure.totalDuration = getMeasureTotalDuration(measure.notes);
        measure.isComplete = isMeasureComplete(
          measure.totalDuration,
          measure.timeSignature.numerator
        );
        song.updatedAt = Date.now();
      }),

      removeNoteFromMeasure: (measureIndex, noteId) => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (!song) return;

        const measure = song.tab.measures[measureIndex];
        if (!measure) return;

        measure.notes = measure.notes.filter((n) => n.id !== noteId);
        measure.totalDuration = getMeasureTotalDuration(measure.notes);
        measure.isComplete = isMeasureComplete(
          measure.totalDuration,
          measure.timeSignature.numerator
        );
        song.updatedAt = Date.now();
      }),

      setPlaying: (playing) => set({ isPlaying: playing }),

      setPlayhead: (measureIndex, noteIndex) => set({
        currentMeasureIndex: measureIndex,
        currentNoteIndex: noteIndex,
      }),

      clearMeasure: (index) => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (!song) return;

        const measure = song.tab.measures[index];
        if (measure) {
          measure.notes = [];
          measure.totalDuration = 0;
          measure.isComplete = false;
          song.updatedAt = Date.now();
        }
      }),

      setSelectedMeasure: (index, multi) => set((state) => {
        if (multi) {
          if (state.selectedMeasureIndexes.includes(index)) {
            state.selectedMeasureIndexes = state.selectedMeasureIndexes.filter(i => i !== index);
          } else {
            state.selectedMeasureIndexes.push(index);
          }
        } else {
          if (state.selectedMeasureIndexes.length === 1 && state.selectedMeasureIndexes[0] === index) {
            state.selectedMeasureIndexes = [];
          } else {
            state.selectedMeasureIndexes = [index];
          }
        }
      }),

      toggleSelectedMeasure: (index) => set((state) => {
        if (state.selectedMeasureIndexes.includes(index)) {
          state.selectedMeasureIndexes = state.selectedMeasureIndexes.filter(i => i !== index);
        } else {
          state.selectedMeasureIndexes.push(index);
        }
      }),

      clearSelectedMeasures: () => set({ selectedMeasureIndexes: [] }),

      deleteSelectedMeasures: () => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (!song || state.selectedMeasureIndexes.length === 0 || song.tab.measures.length <= 1) return;

        const indexesToDelete = [...state.selectedMeasureIndexes].sort((a, b) => b - a);
        indexesToDelete.forEach(index => {
          if (song.tab.measures.length > 1) {
            song.tab.measures.splice(index, 1);
          }
        });

        state.selectedMeasureIndexes = [];
        song.updatedAt = Date.now();
      }),

      moveMeasure: (fromIndex, toIndex) => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (!song) return;

        if (fromIndex < 0 || fromIndex >= song.tab.measures.length ||
            toIndex < 0 || toIndex >= song.tab.measures.length) {
          return;
        }

        const [measure] = song.tab.measures.splice(fromIndex, 1);
        song.tab.measures.splice(toIndex, 0, measure);
        song.updatedAt = Date.now();
      }),

      copyMeasure: (index) => set((state) => {
        const song = state.songs.find((s) => s.id === state.activeSongId) || state.songs[0];
        if (!song) return;

        const measure = song.tab.measures[index];
        if (!measure) return;

        const newMeasure: Measure = {
          id: uuidv4(),
          notes: measure.notes.map(note => ({
            ...note,
            id: uuidv4(),
          })),
          timeSignature: { ...measure.timeSignature },
          totalDuration: measure.totalDuration,
          isComplete: measure.isComplete,
        };

        song.tab.measures.splice(index + 1, 0, newMeasure);
        song.updatedAt = Date.now();
      }),
    })),
    {
      name: 'guitar-rhythm-tool',
      version: 1,
    }
  )
);
