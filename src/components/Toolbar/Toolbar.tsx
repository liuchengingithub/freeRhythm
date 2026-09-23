import { useState } from 'react';
import type { TimeSignature, PaletteNote } from '../../types/notation';
import { useScoreStore } from '../../store/scoreStore';
import { NotePalette } from '../NotePalette/NotePalette';

const COMMON_TIME_SIGNATURES: TimeSignature[] = [
  { numerator: 2, denominator: 4 },
  { numerator: 3, denominator: 4 },
  { numerator: 4, denominator: 4 },
  { numerator: 6, denominator: 8 },
  { numerator: 7, denominator: 8 },
  { numerator: 5, denominator: 4 },
  { numerator: 9, denominator: 8 },
  { numerator: 12, denominator: 8 },
];

export function Toolbar() {
  const { 
    score, 
    isPlaying, 
    updateTempo, 
    updateTimeSignature, 
    updateSubdivision,
    addMeasure,
    setPlaying,
  } = useScoreStore();

  const [paletteNote, setPaletteNote] = useState<PaletteNote>({
    value: 'quarter',
    dots: 0,
    isRest: false,
    accent: 'normal',
    notehead: 'normal',
    label: '𝅘𝅥',
  });

  const handleTimeSigChange = (measureIndex: number, timeSig: TimeSignature) => {
    updateTimeSignature(timeSig, measureIndex);
  };

  const handleCustomTimeSig = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const numerator = parseInt((form.elements.namedItem('numerator') as HTMLInputElement).value);
    const denominator = parseInt((form.elements.namedItem('denominator') as HTMLInputElement).value);
    if (numerator > 0 && [2, 4, 8, 16].includes(denominator)) {
      handleTimeSigChange(0, { numerator, denominator });
    }
  };

  const handleTapTempo = () => {
    const now = Date.now();
    if (!window.lastTap) {
      window.lastTap = now;
      return;
    }
    const interval = now - window.lastTap;
    window.lastTap = now;
    if (interval > 200 && interval < 3000) {
      updateTempo(Math.round(60000 / interval));
    }
  };

  const handlePaletteChange = (note: Partial<PaletteNote>) => {
    setPaletteNote(prev => ({ ...prev, ...note }));
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-full mx-auto p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">BPM</label>
            <input
              type="number"
              value={score.tempo}
              onChange={(e) => updateTempo(parseInt(e.target.value) || 120)}
              min={20}
              max={300}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
            />
            <button
              onClick={handleTapTempo}
              className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200 transition-colors"
              title="点击 4 次设置速度"
            >
              Tap
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <label className="text-sm font-medium text-gray-700">拍号</label>
            <div className="flex gap-1">
              {COMMON_TIME_SIGNATURES.map((ts) => (
                <button
                  key={`${ts.numerator}/${ts.denominator}`}
                  onClick={() => handleTimeSigChange(0, ts)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                    score.timeSignature.numerator === ts.numerator && 
                    score.timeSignature.denominator === ts.denominator
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {ts.numerator}/{ts.denominator}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
            <form onSubmit={handleCustomTimeSig} className="flex items-center gap-1">
              <input
                name="numerator"
                type="number"
                min="1"
                max="16"
                value={score.timeSignature.numerator}
                onChange={(e) => handleTimeSigChange(0, { 
                  numerator: parseInt(e.target.value) || 1, 
                  denominator: score.timeSignature.denominator 
                })}
                className="w-10 px-1 py-1 border border-gray-300 rounded text-center text-sm"
              />
              <span className="text-gray-500">/</span>
              <select
                name="denominator"
                value={score.timeSignature.denominator}
                onChange={(e) => handleTimeSigChange(0, { 
                  numerator: score.timeSignature.numerator, 
                  denominator: parseInt(e.target.value) 
                })}
                className="w-14 px-1 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={16}>16</option>
              </select>
            </form>
          </div>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <button
              onClick={() => useScoreStore.getState().undo()}
              disabled={!useScoreStore.getState().canUndo()}
              className="p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="撤销 (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              onClick={() => useScoreStore.getState().redo()}
              disabled={!useScoreStore.getState().canRedo()}
              className="p-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="重做 (Ctrl+Y)"
            >
              ↷
            </button>
            <button
              onClick={() => addMeasure()}
              className="px-3 py-1.5 bg-green-100 border border-green-300 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
            >
              + 小节
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaying(!isPlaying)}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isPlaying ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <button
              onClick={() => setPlaying(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              ⏹ 停止
            </button>
            <label className="flex items-center gap-1 text-sm text-gray-700">
              <input type="checkbox" className="w-4 h-4" />
              循环
            </label>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-gray-700">细分</label>
            <select
              value={score.subdivision}
              onChange={(e) => updateSubdivision(e.target.value as 'eighth' | 'sixteenth')} 
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="eighth">八分</option>
              <option value="sixteenth">十六分</option>
            </select>
            <label className="text-sm text-gray-700">音量</label>
            <input type="range" min="0" max="100" value={70} className="w-32" />
          </div>
        </div>

        <NotePalette 
          selectedNote={paletteNote} 
          onSelectNote={handlePaletteChange}
        />
      </div>
    </div>
  );
}

declare global {
  interface Window {
    lastTap?: number;
  }
}
