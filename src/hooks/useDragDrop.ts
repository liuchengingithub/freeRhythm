import { useCallback, useState } from 'react';
import { useScore } from './useScore';
import { useScoreStore } from '../store/scoreStore';
import type { Measure, TimeSignature, NoteValue, TupletRatio, Note, PaletteNote } from '../types/notation';
import { quantizeMousePosition, findInsertionIndex } from '../core/notation/Quantize';
import { getActualDuration } from '../core/notation/Duration';

interface ClickPreview {
  measureIndex: number;
  beatPosition: number;
  isValid: boolean;
  targetMeasure: Measure | null;
}

export function useClickInteraction(
  measures: Measure[],
  pxPerBeat: number,
  subdivision: 'eighth' | 'sixteenth',
  defaultTimeSig: TimeSignature
) {
  const { insertNote, deleteNote, setClickPreview } = useScore();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedMeasureIndex, setSelectedMeasureIndex] = useState<number | null>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    const result = quantizeMousePosition(
      mouseX,
      measures,
      pxPerBeat,
      subdivision,
      defaultTimeSig
    );

    if (result.isValid && result.targetMeasure) {
      setClickPreview({
        measureIndex: result.measureIndex,
        beatPosition: result.beatPosition,
        isValid: true,
      });
    } else {
      setClickPreview(null);
    }
  }, [measures, pxPerBeat, subdivision, defaultTimeSig, setClickPreview]);

  const handleNoteClick = useCallback((noteId: string, measureIndex: number) => {
    if (selectedNoteId === noteId && selectedMeasureIndex === measureIndex) {
      setSelectedNoteId(null);
      setSelectedMeasureIndex(null);
    } else {
      setSelectedNoteId(noteId);
      setSelectedMeasureIndex(measureIndex);
    }
  }, [selectedNoteId, selectedMeasureIndex]);

  const addNoteAtPreview = useCallback((paletteNote: PaletteNote) => {
    useScoreStore.getState().addNoteAtPreview(paletteNote);
  }, []);

  const deleteSelectedNote = useCallback(() => {
    if (selectedNoteId !== null && selectedMeasureIndex !== null) {
      deleteNote(selectedMeasureIndex, selectedNoteId);
      setSelectedNoteId(null);
      setSelectedMeasureIndex(null);
    }
  }, [selectedNoteId, selectedMeasureIndex, deleteNote]);

  return {
    selectedNoteId,
    selectedMeasureIndex,
    handleClick,
    handleNoteClick,
    addNoteAtPreview,
    deleteSelectedNote,
  };
}
