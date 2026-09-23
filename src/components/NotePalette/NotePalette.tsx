import { useState, useCallback } from 'react';
import type { NoteValue, TupletRatio, PaletteNote } from '../../types/notation';
import { useScoreStore } from '../../store/scoreStore';

const NOTE_BUTTONS: { value: NoteValue; label: string }[] = [
  { value: 'whole', label: '𝅝' },
  { value: 'half', label: '𝅗𝅥' },
  { value: 'quarter', label: '𝅘𝅥' },
  { value: 'eighth', label: '𝅘𝅥𝅮' },
  { value: 'sixteenth', label: '𝅘𝅥𝅯' },
];

const REST_BUTTONS: { value: NoteValue; label: string }[] = [
  { value: 'whole', label: '𝄻' },
  { value: 'half', label: '𝄼' },
  { value: 'quarter', label: '𝄽' },
  { value: 'eighth', label: '𝄾' },
  { value: 'sixteenth', label: '𝄿' },
];

const TUPPLET_OPTIONS: { value: TupletRatio | null; label: string }[] = [
  { value: null, label: '关' },
  { value: '3:2', label: '₃ (3:2)' },
  { value: '3:4', label: '₃ (3:4)' },
];

const ACCENT_OPTIONS = [
  { value: 'normal' as const, label: '' },
  { value: 'accent' as const, label: '>' },
  { value: 'strong-accent' as const, label: '^' },
];

const NOTEHEAD_OPTIONS = [
  { value: 'normal' as const, label: '●' },
  { value: 'x' as const, label: '×' },
];

interface NotePaletteProps {
  selectedNote: PaletteNote;
  onSelectNote: (note: Partial<PaletteNote>) => void;
}

export function NotePalette({ selectedNote, onSelectNote }: NotePaletteProps) {
  const [isRestMode, setIsRestMode] = useState(selectedNote.isRest);
  const [dots, setDots] = useState(selectedNote.dots);
  const [tuplet, setTuplet] = useState<TupletRatio | null>(selectedNote.tuplet || null);
  const [accent, setAccent] = useState(selectedNote.accent);
  const [notehead, setNotehead] = useState(selectedNote.notehead);

  const handleValueSelect = useCallback((value: NoteValue) => {
    onSelectNote({ value, isRest: isRestMode });
  }, [isRestMode, onSelectNote]);

  const handleRestToggle = useCallback(() => {
    const newIsRest = !isRestMode;
    setIsRestMode(newIsRest);
    onSelectNote({ isRest: newIsRest });
  }, [isRestMode, onSelectNote]);

  const handleDotsChange = useCallback((newDots: number) => {
    setDots(newDots);
    onSelectNote({ dots: newDots });
  }, [onSelectNote]);

  const handleTupletChange = useCallback((newTuplet: TupletRatio | null) => {
    setTuplet(newTuplet);
    onSelectNote({ tuplet: newTuplet || undefined });
  }, [onSelectNote]);

  const handleAccentChange = useCallback((newAccent: 'normal' | 'accent' | 'strong-accent') => {
    setAccent(newAccent);
    onSelectNote({ accent: newAccent });
  }, [onSelectNote]);

  const handleNoteheadChange = useCallback((newNotehead: 'normal' | 'x' | 'diamond' | 'triangle') => {
    setNotehead(newNotehead);
    onSelectNote({ notehead: newNotehead });
  }, [onSelectNote]);

  const handleAdd = useCallback(() => {
    const note: PaletteNote = {
      value: selectedNote.value,
      dots,
      tuplet: tuplet || undefined,
      isRest: isRestMode,
      accent,
      notehead,
      label: '',
    };
    useScoreStore.getState().addNoteAtPreview(note);
  }, [selectedNote.value, dots, tuplet, isRestMode, accent, notehead]);

  const buttons = isRestMode ? REST_BUTTONS : NOTE_BUTTONS;

  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-200 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={handleRestToggle}
          className={`px-3 py-1.5 rounded text-sm font-mono transition-colors ${
            isRestMode 
              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          }`}
          title={isRestMode ? '切换到音符' : '切换到休止符'}
        >
          {isRestMode ? '𝄽 休止符' : '𝅘𝅥 音符'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {buttons.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleValueSelect(value)}
            className={`w-12 h-12 rounded border-2 font-mono text-xl transition-all ${
              selectedNote.value === value && selectedNote.isRest === isRestMode
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            title={`${isRestMode ? '休止符' : '音符'}: ${label}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs text-gray-500 mb-1">附点</label>
        <div className="flex gap-1">
          {[0, 1, 2].map((d) => (
            <button
              key={d}
              onClick={() => handleDotsChange(d)}
              className={`w-8 h-8 rounded border font-mono text-sm transition-colors ${
                dots === d
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {d === 0 ? '无' : d === 1 ? '·' : '··'}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs text-gray-500 mb-1">三连音</label>
        <div className="flex gap-1">
          {TUPPLET_OPTIONS.map(({ value, label }) => (
            <button
              key={value || 'none'}
              onClick={() => handleTupletChange(value)}
              className={`px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                tuplet === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs text-gray-500 mb-1">重音</label>
        <div className="flex gap-1">
          {ACCENT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleAccentChange(value)}
              className={`w-8 h-8 rounded border font-mono text-sm transition-colors ${
                accent === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {label || '无'}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs text-gray-500 mb-1">音符头</label>
        <div className="flex gap-1">
          {NOTEHEAD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleNoteheadChange(value)}
              className={`w-8 h-8 rounded border font-mono text-sm transition-colors ${
                notehead === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={handleAdd}
          className="w-full py-2 px-4 bg-green-500 text-white rounded font-medium hover:bg-green-600 transition-colors"
        >
          + 添加到五线谱
        </button>
        <p className="text-xs text-gray-500 mt-1 text-center">
          先点击五线谱选择位置（出现蓝线），再点击添加
        </p>
      </div>

      <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">1-6</kbd> 选音值 &nbsp;
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">R</kbd> 切换休止符 &nbsp;
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">.</kbd> 循环附点 &nbsp;
        <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">T</kbd> 切换三连音
      </div>
    </div>
  );
}
