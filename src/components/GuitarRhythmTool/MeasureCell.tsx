import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useRhythmStore } from '../../store/rhythmStore';
import type { Measure } from '../../types/rhythm';
import { getMeasureRemaining, isMeasureComplete, isMeasureOverflow } from '../../core/notation/NoteDuration';

interface MeasureCellProps {
  measure: Measure;
  measureIndex: number;
  isPlaying: boolean;
  isSelected: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (toIndex: number) => void;
}

export function MeasureCell({ 
  measure, 
  measureIndex, 
  isPlaying, 
  isSelected,
  onDragStart,
  onDragOver,
  onDrop,
}: MeasureCellProps) {
  const { removeNoteFromMeasure, setSelectedMeasure, copyMeasure } = useRhythmStore();
  const [isDragging, setIsDragging] = useState(false);

  const maxDuration = measure.timeSignature.numerator;
  const remaining = getMeasureRemaining(measure.totalDuration, maxDuration);
  const isCompleteValue = isMeasureComplete(measure.totalDuration, maxDuration);
  const isOverflowValue = isMeasureOverflow(measure.totalDuration, maxDuration);

  const backgroundColor = isCompleteValue
    ? 'bg-green-50 border-green-300'
    : isOverflowValue
    ? 'bg-red-50 border-red-300'
    : 'bg-yellow-50 border-yellow-300';

  const borderColor = isSelected
    ? 'border-blue-500 ring-2 ring-blue-400'
    : isCompleteValue
    ? 'border-green-400'
    : isOverflowValue
    ? 'border-red-400'
    : 'border-gray-300';

  const handleClick = (e: React.MouseEvent) => {
    const isMultiSelect = e.ctrlKey || e.metaKey;
    setSelectedMeasure(measureIndex, isMultiSelect);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    onDragStart(measureIndex);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={onDragOver}
      onDrop={() => onDrop(measureIndex)}
      onClick={handleClick}
      className={`${backgroundColor} border-2 ${borderColor} rounded p-3 min-h-24 transition-all cursor-move select-none ${
        isDragging ? 'opacity-50 border-dashed' : ''
      } ${isPlaying ? 'ring-2 ring-blue-500' : ''}`}
      title="点击选择 | Ctrl+点击多选 | 拖动调整顺序"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-semibold text-gray-700">
          {isSelected && '✓ '} 第 {measureIndex + 1} 小节
        </div>
        <div className="flex gap-2">
          <div className="text-sm text-gray-600">
            {measure.totalDuration.toFixed(2)}/{maxDuration}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyMeasure(measureIndex);
            }}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="复制小节"
          >
            📋
          </button>
        </div>
      </div>

      {isCompleteValue && <div className="text-xs text-green-600 font-semibold mb-2">✓ 已满</div>}
      {isOverflowValue && (
        <div className="text-xs text-red-600 font-semibold mb-2">
          ✗ 超过 {(measure.totalDuration - maxDuration).toFixed(2)} 拍
        </div>
      )}
      {!isCompleteValue && !isOverflowValue && (
        <div className="text-xs text-yellow-600 mb-2">还差 {remaining.toFixed(2)} 拍</div>
      )}

      <div className="flex flex-wrap gap-2 min-h-12">
        {measure.notes.length === 0 && (
          <div className="text-gray-400 text-sm italic">点击左侧音符添加...</div>
        )}
        {measure.notes.map((note) => (
          <div
            key={note.id}
            className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm pointer-events-auto"
          >
            <span>{note.isRest ? '休' : '♪'}</span>
            <span>{note.value}</span>
            {note.dots > 0 && <span className="text-orange-500">·</span>}
            {note.tuplet && <span className="text-red-500 text-xs">{note.tuplet}</span>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNoteFromMeasure(measureIndex, note.id);
              }}
              className="ml-1 text-red-500 hover:text-red-700 font-bold"
              title="删除音符"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}