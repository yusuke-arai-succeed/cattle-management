import { useState } from 'react';
import { useApp } from '../context';
import type { Barn } from '../types';
import { generateId } from '../store';

export default function BarnMaster() {
  const { data, update } = useApp();
  const [showBarnForm, setShowBarnForm] = useState(false);
  const [barnName, setBarnName] = useState('');
  const [barnCapacity, setBarnCapacity] = useState('');
  const [editingBarnId, setEditingBarnId] = useState<string | null>(null);

  const [showPenForm, setShowPenForm] = useState<string | null>(null);
  const [penName, setPenName] = useState('');
  const [penCapacity, setPenCapacity] = useState('');

  function saveBarn() {
    if (!barnName.trim()) return;
    update(prev => {
      if (editingBarnId) {
        return {
          ...prev,
          barns: prev.barns.map(b =>
            b.id === editingBarnId
              ? { ...b, name: barnName.trim(), capacity: Number(barnCapacity) || 0 }
              : b
          ),
        };
      }
      const newBarn: Barn = {
        id: generateId(),
        name: barnName.trim(),
        capacity: Number(barnCapacity) || 0,
        pens: [],
      };
      return { ...prev, barns: [...prev.barns, newBarn] };
    });
    resetBarnForm();
  }

  function deleteBarn(id: string) {
    if (!confirm('この牛舎を削除しますか？')) return;
    update(prev => ({ ...prev, barns: prev.barns.filter(b => b.id !== id) }));
  }

  function startEditBarn(barn: Barn) {
    setEditingBarnId(barn.id);
    setBarnName(barn.name);
    setBarnCapacity(String(barn.capacity));
    setShowBarnForm(true);
  }

  function resetBarnForm() {
    setShowBarnForm(false);
    setEditingBarnId(null);
    setBarnName('');
    setBarnCapacity('');
  }

  function savePen(barnId: string) {
    if (!penName.trim()) return;
    update(prev => ({
      ...prev,
      barns: prev.barns.map(b =>
        b.id === barnId
          ? {
              ...b,
              pens: [...b.pens, { id: generateId(), name: penName.trim(), capacity: Number(penCapacity) || 0 }],
            }
          : b
      ),
    }));
    setPenName('');
    setPenCapacity('');
    setShowPenForm(null);
  }

  function deletePen(barnId: string, penId: string) {
    if (!confirm('このペンを削除しますか？')) return;
    update(prev => ({
      ...prev,
      barns: prev.barns.map(b =>
        b.id === barnId ? { ...b, pens: b.pens.filter(p => p.id !== penId) } : b
      ),
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">牛舎マスタ</h2>
        <button
          onClick={() => setShowBarnForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          + 牛舎を追加
        </button>
      </div>

      {showBarnForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">{editingBarnId ? '牛舎を編集' : '新規牛舎'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">牛舎名 *</label>
              <input
                className="border rounded-lg px-3 py-2 w-full text-sm"
                value={barnName}
                onChange={e => setBarnName(e.target.value)}
                placeholder="例：第1牛舎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">収容可能頭数</label>
              <input
                type="number"
                className="border rounded-lg px-3 py-2 w-full text-sm"
                value={barnCapacity}
                onChange={e => setBarnCapacity(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveBarn} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              保存
            </button>
            <button onClick={resetBarnForm} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {data.barns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          牛舎が登録されていません
        </div>
      ) : (
        <div className="space-y-4">
          {data.barns.map(barn => {
            const activeCattle = data.cattle.filter(c => c.status === 'active' && c.barnId === barn.id).length;
            return (
              <div key={barn.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{barn.name}</h3>
                    <p className="text-sm text-gray-500">
                      収容上限 {barn.capacity} 頭 ／ 現在 {activeCattle} 頭
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditBarn(barn)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteBarn(barn.id)}
                      className="text-sm text-red-500 hover:text-red-700 px-2 py-1"
                    >
                      削除
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-600">ペン一覧</h4>
                    <button
                      onClick={() => setShowPenForm(barn.id)}
                      className="text-xs text-green-600 hover:text-green-800 font-medium"
                    >
                      + ペン追加
                    </button>
                  </div>

                  {showPenForm === barn.id && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">ペン名 *</label>
                          <input
                            className="border rounded px-2 py-1.5 w-full text-sm"
                            value={penName}
                            onChange={e => setPenName(e.target.value)}
                            placeholder="例：A-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">収容可能頭数</label>
                          <input
                            type="number"
                            className="border rounded px-2 py-1.5 w-full text-sm"
                            value={penCapacity}
                            onChange={e => setPenCapacity(e.target.value)}
                            placeholder="20"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => savePen(barn.id)}
                          className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700"
                        >
                          追加
                        </button>
                        <button
                          onClick={() => setShowPenForm(null)}
                          className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-200"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}

                  {barn.pens.length === 0 ? (
                    <p className="text-sm text-gray-400">ペンが登録されていません</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {barn.pens.map(pen => {
                        const penCattle = data.cattle.filter(c => c.status === 'active' && c.barnId === barn.id && c.penId === pen.id).length;
                        return (
                          <div key={pen.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-700">{pen.name}</span>
                              <button
                                onClick={() => deletePen(barn.id, pen.id)}
                                className="text-xs text-red-400 hover:text-red-600"
                              >
                                ×
                              </button>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">{penCattle} / {pen.capacity} 頭</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
