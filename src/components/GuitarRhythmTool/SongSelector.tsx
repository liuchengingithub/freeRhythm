import { useState } from 'react';
import { useRhythmStore } from '../../store/rhythmStore';
import type { Song } from '../../types/rhythm';

export function SongSelector() {
  const { songs, activeSongId, switchSong, createSong, deleteSong, updateSongTitle } = useRhythmStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [newSongTitle, setNewSongTitle] = useState('');

  const activeSong = songs.find((s) => s.id === activeSongId) || songs[0];

  const handleCreateSong = () => {
    if (newSongTitle.trim()) {
      createSong(newSongTitle);
      setNewSongTitle('');
    }
  };

  const handleStartEdit = (song: Song) => {
    setEditingId(song.id);
    setEditingTitle(song.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editingTitle.trim()) {
      updateSongTitle(editingId, editingTitle);
      setEditingId(null);
    }
  };

  const handleDeleteSong = (songId: string) => {
    if (songs.length > 1 && window.confirm('确定要删除这首歌吗？')) {
      deleteSong(songId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">📀 歌曲管理</h2>

      {/* 歌曲列表 */}
      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {songs.map((song) => (
          <div
            key={song.id}
            className={`flex items-center justify-between p-2 rounded border-2 transition-all cursor-pointer ${
              activeSongId === song.id
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => switchSong(song.id)}
          >
            <div className="flex-1">
              {editingId === song.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 border rounded text-sm font-medium"
                  autoFocus
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
              ) : (
                <div>
                  <div className="font-medium text-sm text-gray-800">{song.title}</div>
                  <div className="text-xs text-gray-500">
                    {song.tab.measures.length} 小节 • {song.tab.tempo} BPM
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit(song);
                }}
                className="text-xs px-2 py-1 bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
                title="编辑名称"
              >
                ✏️
              </button>
              {songs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSong(song.id);
                  }}
                  className="text-xs px-2 py-1 bg-red-400 text-white rounded hover:bg-red-500 transition-colors"
                  title="删除歌曲"
                >
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 创建新歌曲 */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="新歌曲名称..."
          value={newSongTitle}
          onChange={(e) => setNewSongTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateSong();
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={handleCreateSong}
          disabled={!newSongTitle.trim()}
          className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          + 新增
        </button>
      </div>
    </div>
  );
}