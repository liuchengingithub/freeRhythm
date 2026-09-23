import { useRef, useEffect, useCallback } from 'react';
import { VexFlowRenderer } from '../../core/render/VexFlowRenderer';
import { useScoreStore } from '../../store/scoreStore';
import { useClickInteraction } from '../../hooks/useDragDrop';
import type { Note } from '../../types/notation';

interface StaffCanvasProps {
  pxPerBeat?: number;
}

export function StaffCanvas({ pxPerBeat = 80 }: StaffCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VexFlowRenderer | null>(null);
  
  const { 
    score, 
    isPlaying, 
    currentMeasureIndex, 
    currentBeat,
    clickPreview,
  } = useScoreStore();
  const subdivision = score.subdivision;

  const {
    selectedNoteId,
    selectedMeasureIndex,
    handleClick,
    handleNoteClick,
    deleteSelectedNote,
  } = useClickInteraction(
    score.measures,
    pxPerBeat,
    subdivision,
    score.timeSignature
  );

  useEffect(() => {
    if (containerRef.current) {
      rendererRef.current = new VexFlowRenderer(containerRef.current);
    }
    return () => {
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current && containerRef.current) {
      rendererRef.current.render(score, {
        pxPerBeat,
        highlightMeasure: isPlaying ? currentMeasureIndex : undefined,
        highlightBeat: isPlaying ? currentBeat : undefined,
        showGrid: true,
      });
    }
  }, [score, isPlaying, currentMeasureIndex, currentBeat, pxPerBeat, subdivision]);

  // 计算每个小节的 X 位置
  const getMeasureX = useCallback((measureIndex: number) => {
    let x = 40; // marginLeft
    for (let i = 0; i < measureIndex; i++) {
      x += score.measures[i].timeSignature.numerator * pxPerBeat + 20;
    }
    return x;
  }, [score.measures, pxPerBeat]);

  return (
    <div
      ref={containerRef}
      id="staff-canvas"
      className="bg-white min-h-[300px] overflow-x-auto relative"
      onClick={handleClick}
      style={{ width: '100%' }}
    >
      {/* 蓝色预览线 - 只在五线谱区域显示 */}
      {clickPreview && clickPreview.isValid && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: getMeasureX(clickPreview.measureIndex) + clickPreview.beatPosition * pxPerBeat,
            top: 20,
            width: '2px',
            height: '120px',
            background: 'rgba(33, 150, 243, 0.8)',
            boxShadow: '0 0 8px rgba(33, 150, 243, 0.5)',
          }}
        />
      )}
      
      {/* VexFlow 渲染的 SVG */}
      <svg width="100%" height="300" style={{ display: 'block', pointerEvents: 'none' }} />
      
      {/* 音符点击区域覆盖层 - 只在五线谱区域 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-auto" style={{ zIndex: 10 }}>
        {score.measures.map((measure, measureIndex) => {
          const measureWidth = measure.timeSignature.numerator * pxPerBeat;
          const measureX = getMeasureX(measureIndex);
          
          return (
            <div
              key={measureIndex}
              className="absolute"
              style={{
                left: measureX,
                top: 20,
                width: measureWidth,
                height: 120,
              }}
            >
              {measure.notes.map((note) => {
                const noteX = note.beatPosition * pxPerBeat;
                const isSelected = selectedNoteId === note.id && selectedMeasureIndex === measureIndex;
                
                return (
                  <div
                    key={note.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNoteClick(note.id, measureIndex);
                    }}
                    className="absolute top-0 w-8 h-24 cursor-pointer transition-all"
                    style={{
                      left: noteX - 4,
                      backgroundColor: isSelected ? 'rgba(229, 57, 53, 0.2)' : 'transparent',
                      border: isSelected ? '2px solid #e53935' : 'none',
                      borderRadius: '2px',
                      zIndex: isSelected ? 20 : 10,
                    }}
                    title={`${note.isRest ? '休止符' : '音符'} ${note.value}${note.dots > 0 ? '.'.repeat(note.dots) : ''}${note.tuplet ? ` 三连音${note.tuplet}` : ''}${note.notehead === 'x' ? ' 闷音' : ''}${note.accent !== 'normal' ? ` 重音${note.accent}` : ''}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      
      {/* 删除按钮 - 固定在右下角 */}
      {selectedNoteId && selectedMeasureIndex !== null && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={deleteSelectedNote}
            className="px-4 py-2 bg-red-500 text-white rounded shadow-lg hover:bg-red-600 transition-colors"
          >
            🗑 删除选中音符
          </button>
        </div>
      )}
    </div>
  );
}
