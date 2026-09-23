import { useState, useEffect } from 'react';
import { useRhythmStore } from '../../store/rhythmStore';
import { RhythmPlayer } from '../../services/rhythmPlayer';
import { getNoteDuration, isMeasureComplete } from '../../core/notation/NoteDuration';
import { NotePaletteItem } from './NotePaletteItem';
import { MeasureCell } from './MeasureCell';
import { SongSelector } from './SongSelector';
import type { PaletteNoteType, RhythmNote } from '../../types/rhythm';
import { v4 as uuidv4 } from 'uuid';

const PALETTE_NOTES: PaletteNoteType[] = [
  // 基础音符
  { id: uuidv4(), value: 'whole', isRest: false, dots: 0, label: '全音符', displayValue: '𝅝' },
  { id: uuidv4(), value: 'half', isRest: false, dots: 0, label: '二分音符', displayValue: '𝅗𝅥' },
  { id: uuidv4(), value: 'quarter', isRest: false, dots: 0, label: '四分音符', displayValue: '𝅘𝅥' },
  { id: uuidv4(), value: 'eighth', isRest: false, dots: 0, label: '八分音符', displayValue: '𝅘𝅥𝅮' },
  { id: uuidv4(), value: 'sixteenth', isRest: false, dots: 0, label: '十六分音符', displayValue: '𝅘𝅥𝅯' },

  // 基础休止符
  { id: uuidv4(), value: 'whole', isRest: true, dots: 0, label: '全休止符', displayValue: '𝄻' },
  { id: uuidv4(), value: 'half', isRest: true, dots: 0, label: '二分休止符', displayValue: '𝄼' },
  { id: uuidv4(), value: 'quarter', isRest: true, dots: 0, label: '四分休止符', displayValue: '𝄽' },
  { id: uuidv4(), value: 'eighth', isRest: true, dots: 0, label: '八分休止符', displayValue: '𝄾' },
  { id: uuidv4(), value: 'sixteenth', isRest: true, dots: 0, label: '十六分休止符', displayValue: '𝄿' },

  // 附点音符
  { id: uuidv4(), value: 'half', isRest: false, dots: 1, label: '附点二分', displayValue: '𝅗𝅥·' },
  { id: uuidv4(), value: 'quarter', isRest: false, dots: 1, label: '附点四分', displayValue: '𝅘𝅥·' },
  { id: uuidv4(), value: 'eighth', isRest: false, dots: 1, label: '附点八分', displayValue: '𝅘𝅥𝅮·' },
  { id: uuidv4(), value: 'quarter', isRest: true, dots: 1, label: '附点四分休止', displayValue: '𝄽·' },

  // 连音
  { id: uuidv4(), value: 'eighth', isRest: false, dots: 0, tuplet: '3:2', label: '三连八分', displayValue: '𝅘𝅥𝅮₃' },
  { id: uuidv4(), value: 'sixteenth', isRest: false, dots: 0, tuplet: '3:2', label: '三连十六', displayValue: '𝅘𝅥𝅯₃' },
];

export function GuitarRhythmTool() {
  const { 
    getActiveSong,
    getActiveTab,
    isPlaying, 
    currentMeasureIndex, 
    selectedMeasureIndexes,
    addNoteToMeasure, 
    setPlaying, 
    setPlayhead, 
    addMeasure, 
    deleteSelectedMeasures,
    moveMeasure,
  } = useRhythmStore();
  const [player, setPlayer] = useState<RhythmPlayer | null>(null);
  const [tempo, setTempo] = useState(120);
  const [message, setMessage] = useState<string>('');
  const [draggedFromIndex, setDraggedFromIndex] = useState<number | null>(null);

  const activeSong = getActiveSong();
  const activeTab = getActiveTab();

  useEffect(() => {
    if (activeTab) {
      setTempo(activeTab.tempo);
    }
  }, [activeSong?.id, activeTab]);

  useEffect(() => {
    const newPlayer = new RhythmPlayer();
    newPlayer.initialize();
    setPlayer(newPlayer);

    return () => {
      newPlayer.dispose();
    };
  }, []);

  if (!activeSong || !activeTab) {
    return <div className="p-4">加载中...</div>;
  }

  const handleNoteClick = (note: PaletteNoteType) => {
    if (selectedMeasureIndexes.length === 0) {
      setMessage('请先点击选择一个小节');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const measureIndex = selectedMeasureIndexes[0];
    const measure = activeTab.measures[measureIndex];
    if (!measure) return;

    const newNoteDuration = getNoteDuration(note.value, note.dots, note.tuplet);
    const maxDuration = measure.timeSignature.numerator;

    if (measure.totalDuration + newNoteDuration > maxDuration + 0.0001) {
      setMessage(`超过拍数限制！还差 ${(maxDuration - measure.totalDuration).toFixed(2)} 拍`);
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    if (isMeasureComplete(measure.totalDuration, maxDuration)) {
      setMessage('该小节已满拍，无法添加');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const newNote: RhythmNote = {
      id: uuidv4(),
      value: note.value,
      isRest: note.isRest,
      dots: note.dots,
      tuplet: note.tuplet,
    };

    addNoteToMeasure(measureIndex, newNote);
    setMessage(`已添加到第 ${measureIndex + 1} 小节`);
    setTimeout(() => setMessage(''), 1500);
  };

  const handlePlay = async () => {
    if (isPlaying) {
      player?.stop();
      setPlaying(false);
      return;
    }

    setPlaying(true);

    let startMeasure = 0;
    let endMeasure = activeTab.measures.length - 1;

    if (selectedMeasureIndexes.length > 0) {
      startMeasure = Math.min(...selectedMeasureIndexes);
      endMeasure = Math.max(...selectedMeasureIndexes);
    }

    await player?.play(
      activeTab,
      startMeasure,
      endMeasure,
      (measureIndex) => {
        setPlayhead(measureIndex, 0);
      },
      () => {
        setPlaying(false);
      }
    );
  };

  const handleDeleteSelected = () => {
    if (selectedMeasureIndexes.length === 0) {
      setMessage('请先选择要删除的小节');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    if (activeTab.measures.length <= 1) {
      setMessage('至少要保留一个小节');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    deleteSelectedMeasures();
    setMessage(`已删除 ${selectedMeasureIndexes.length} 个小节`);
    setTimeout(() => setMessage(''), 2000);
  };

  const handleDragStart = (index: number) => {
    setDraggedFromIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-blue-400');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-blue-400');
  };

  const handleDrop = (toIndex: number) => {
    if (draggedFromIndex !== null && draggedFromIndex !== toIndex) {
      moveMeasure(draggedFromIndex, toIndex);
      setDraggedFromIndex(null);
      setMessage(`已移动小节 ${draggedFromIndex + 1} 到位置 ${toIndex + 1}`);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎸 吉他节奏练习工具</h1>
            <p className="text-sm text-gray-500">{activeSong.title} • {tempo} BPM</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">速度:</label>
              <input
                type="range"
                min="40"
                max="200"
                value={tempo}
                onChange={(e) => {
                  const newTempo = parseInt(e.target.value, 10);
                  setTempo(newTempo);
                  useRhythmStore.getState().updateTempo(newTempo);
                }}
                className="w-32"
              />
              <span className="text-sm font-mono w-12">{tempo}</span>
            </div>

            <button
              onClick={handlePlay}
              className={`px-6 py-2 rounded font-medium text-white transition-colors ${
                isPlaying
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isPlaying ? '⏹ 停止' : '▶ 播放'}
            </button>

            {selectedMeasureIndexes.length > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                已选中 {selectedMeasureIndexes.length} 个小节
              </span>
            )}

            <button
              onClick={() => addMeasure()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              + 小节
            </button>

            <button
              onClick={handleDeleteSelected}
              disabled={selectedMeasureIndexes.length === 0}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              🗑 删除选中
            </button>

            {message && (
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded">
                {message}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {/* 歌曲选择器 */}
        <SongSelector />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧：音符调色板 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">🎵 音符调色板</h2>
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {PALETTE_NOTES.map((note) => (
                  <NotePaletteItem 
                    key={note.id} 
                    note={note} 
                    onSelect={handleNoteClick}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 italic">点击音符添加到选中的小节</p>
            </div>
          </div>

          {/* 右侧：小节编辑器 */}
          <div className="lg:col-span-3">
            <div className="space-y-3">
              {activeTab.measures.map((measure, idx) => (
                <MeasureCell
                  key={measure.id}
                  measure={measure}
                  measureIndex={idx}
                  isPlaying={isPlaying && idx === currentMeasureIndex}
                  isSelected={selectedMeasureIndexes.includes(idx)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>

            {activeTab.measures.every((m) => m.isComplete) && (
              <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded text-green-700 font-semibold">
                ✓ 所有小节已满拍！可以播放练习了。
              </div>
            )}

            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <p>💡 功能说明：</p>
              <p>• 在顶部的歌曲列表中创建或切换歌曲</p>
              <p>• 点击小节选择 | Ctrl/Cmd + 点击多选 | 拖动调整小节顺序</p>
              <p>• 点击左侧音符，添加到第一个选中小节的末尾</p>
              <p>• 所有编辑会自动保存到浏览器，刷新后继续使用</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}