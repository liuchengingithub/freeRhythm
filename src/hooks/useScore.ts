import { useScoreStore } from '../store/scoreStore';
import type { Note, TimeSignature, NoteValue, TupletRatio } from '../types/notation';
import { v4 as uuidv4 } from 'uuid';
import { canFitInMeasure } from '../core/notation/Duration';

export function useScore() {
  const {
    score,
    isPlaying,
    currentMeasureIndex,
    currentBeat,
    updateTempo,
    updateTimeSignature,
    updateSubdivision,
    addMeasure,
    removeMeasure,
    addNote,
    removeNote,
    updateNote,
    toggleTie,
    setPlaying,
    setPlayhead,
    setClickPreview,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useScoreStore();

  const insertNote = (
    measureIndex: number,
    value: NoteValue,
    beatPosition: number,
    options: {
      dots?: number;
      tuplet?: TupletRatio;
      isRest?: boolean;
      accent?: 'normal' | 'accent' | 'strong-accent';
      notehead?: 'normal' | 'x' | 'diamond' | 'triangle';
    } = {}
  ) => {
    const measure = score.measures[measureIndex];
    if (!measure) return false;

    const newNote: Note = {
      id: uuidv4(),
      value,
      dots: options.dots || 0,
      tuplet: options.tuplet,
      isRest: options.isRest || false,
      accent: options.accent || 'normal',
      notehead: options.notehead || 'normal',
      measureIndex,
      beatPosition,
      tieToNext: undefined,
    };

    if (!canFitInMeasure(measure.notes, newNote, measure.timeSignature)) {
      const nextIndex = measureIndex + 1;
      if (nextIndex < score.measures.length) {
        insertNote(nextIndex, value, 0, options);
      } else {
        addMeasure(measure.timeSignature);
        insertNote(nextIndex, value, 0, options);
      }
      return;
    }

    addNote(measureIndex, newNote);
  };

  const deleteNote = (measureIndex: number, noteId: string) => {
    removeNote(measureIndex, noteId);
  };

  const updateNoteProps = (measureIndex: number, noteId: string, updates: Partial<Note>) => {
    updateNote(measureIndex, noteId, updates);
  };

  const toggleTieBetween = (measureIndex: number, noteId: string, targetNoteId: string) => {
    toggleTie(measureIndex, noteId, targetNoteId);
  };

  const setMeasureTimeSignature = (measureIndex: number, timeSig: TimeSignature) => {
    updateTimeSignature(timeSig, measureIndex);
  };

  const setSubdivision = (subdivision: 'eighth' | 'sixteenth') => {
    updateSubdivision(subdivision);
  };

  const addNewMeasure = (timeSig?: TimeSignature) => {
    addMeasure(timeSig);
  };

  const removeMeasureAt = (index: number) => {
    removeMeasure(index);
  };

  const setTempo = (tempo: number) => {
    updateTempo(tempo);
  };

  return {
    score,
    isPlaying,
    currentMeasureIndex,
    currentBeat,
    insertNote,
    deleteNote,
    updateNote: updateNoteProps,
    toggleTie: toggleTieBetween,
    setMeasureTimeSignature,
    setSubdivision,
    addMeasure: addNewMeasure,
    removeMeasure: removeMeasureAt,
    setTempo,
    setPlaying,
    setPlayhead,
    setClickPreview,
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}
