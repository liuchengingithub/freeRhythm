import { useState } from 'react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { StaffCanvas } from './components/StaffCanvas/StaffCanvas';
import { GuitarRhythmTool } from './components/GuitarRhythmTool/GuitarRhythmTool';
import { useScoreStore } from './store/scoreStore';

type ViewMode = 'staff' | 'rhythm';

function App() {
  const { score } = useScoreStore();
  const [viewMode, setViewMode] = useState<ViewMode>('rhythm');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">音乐练习工具</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('rhythm')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  viewMode === 'rhythm'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎸 吉他节奏工具
              </button>
              <button
                onClick={() => setViewMode('staff')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  viewMode === 'staff'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎼 五线谱编辑
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {viewMode === 'rhythm' ? (
        <GuitarRhythmTool />
      ) : (
        <>
          <Toolbar />
          <main className="max-w-full mx-auto px-4 py-6">
            <div className="mb-4 text-sm text-gray-500">
              <span className="font-mono">{score.title}</span> · 
              {score.measures.length} 小节 · 
              {score.timeSignature.numerator}/{score.timeSignature.denominator} · 
              {score.tempo} BPM
            </div>
            <StaffCanvas pxPerBeat={90} />
          </main>
        </>
      )}
    </div>
  );
}

export default App;