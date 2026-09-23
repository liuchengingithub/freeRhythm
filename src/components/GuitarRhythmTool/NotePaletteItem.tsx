import { useDraggable } from '@dnd-kit/core';
import type { PaletteNoteType } from '../../types/rhythm';
import { getNoteDuration } from '../../core/notation/NoteDuration';

interface NotePaletteItemProps {
  note: PaletteNoteType;
  onSelect: (note: PaletteNoteType) => void;
}

export function NotePaletteItem({ note, onSelect }: NotePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-note-${note.id}`,
    data: { type: 'palette-note', note },
  });

  const duration = getNoteDuration(note.value, note.dots, note.tuplet);
  const durationText = duration === Math.floor(duration) 
    ? `${duration}拍` 
    : `${duration.toFixed(2)}拍`;

  return (
    <button
      onClick={() => onSelect(note)}
      className="flex flex-col items-center justify-center p-3 border-2 border-gray-300 rounded bg-white hover:bg-blue-50 hover:border-blue-400 active:bg-blue-100 transition-all"
      title={note.label}
    >
      <div className="text-2xl font-bold">{note.displayValue}</div>
      <div className="text-xs text-gray-600 mt-1">{durationText}</div>
      {note.tuplet && <div className="text-xs text-red-500">连音</div>}
      {note.dots > 0 && <div className="text-xs text-orange-500">附点</div>}
    </button>
  );
}