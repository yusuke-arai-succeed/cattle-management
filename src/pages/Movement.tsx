import { useState } from 'react';
import { useApp } from '../context';
import type { MovementRecord } from '../types';
import { generateId } from '../store';

export default function Movement() {
  const { data, update } = useApp();
  const [tab, setTab] = useState<'move' | 'history'>('move');

  // 選択中の牛IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 移動先
  const [toBarnId, setToBarnId] = useState('');
  const [toPenId, setToPenId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [showDestModal, setShowDestModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const activeCattle = data.cattle.filter(c => c.status === 'active');

  // 牛舎ごとにペン→牛をグルーピング
  const barnGroups = data.barns.map(barn => {
    const pens = barn.pens.map(pen => {
      const cattle = activeCattle.filter(c => c.barnId === barn.id && c.penId === pen.id);
      return { pen, cattle };
    });
    const unassigned = activeCattle.filter(c => c.barnId === barn.id && !c.penId);
    return { barn, pens, unassigned };
  });

  function toggleCow(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePen(cattleIds: string[]) {
    const allSelected = cattleIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) cattleIds.forEach(id => next.delete(id));
      else cattleIds.forEach(id => next.add(id));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const toBarn = data.barns.find(b => b.id === toBarnId);

  function openDestModal() {
    if (selectedIds.size === 0) return;
    setToBarnId('');
    setToPenId('');
    setErrors({});
    setShowDestModal(true);
  }

  function executeMove() {
    const e: Record<string, string> = {};
    if (!toBarnId) e.barn = '移動先牛舎を選択してください';
    if (!toPenId) e.pen = '移動先ペンを選択してください';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    // 移動元情報を抽出（複数ペンからの移動も考慮し、最初の牛の元ペンを代表として記録）
    const selectedArr = Array.from(selectedIds);
    const firstCow = activeCattle.find(c => c.id === selectedArr[0]);
    const record: MovementRecord = {
      id: generateId(),
      date,
      cattleIds: selectedArr,
      fromBarnId: firstCow?.barnId ?? '',
      fromPenId: firstCow?.penId ?? '',
      toBarnId,
      toPenId,
      reason: reason.trim() || undefined,
    };

    update(prev => ({
      ...prev,
      cattle: prev.cattle.map(c =>
        selectedIds.has(c.id) ? { ...c, barnId: toBarnId, penId: toPenId } : c
      ),
      movementRecords: [...prev.movementRecords, record],
    }));

    setShowDestModal(false);
    setSelectedIds(new Set());
    setReason('');
    setSuccess(`${selectedArr.length} 頭を移動しました`);
    setTimeout(() => setSuccess(''), 3000);
  }

  const barnMap = Object.fromEntries(data.barns.map(b => [b.id, b]));
  const penMap = Object.fromEntries(data.barns.flatMap(b => b.pens.map(p => [p.id, p])));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">牛移動</h2>
        <div className="flex gap-2">
          <button onClick={() => setTab('move')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'move' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            移動登録
          </button>
          <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'history' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            移動履歴
          </button>
        </div>
      </div>

      {tab === 'move' && (
        <div>
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
              ✓ {success}
            </div>
          )}

          {/* 操作バー */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4 mb-5 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">移動日</label>
              <input type="date" className="border rounded-lg px-3 py-1.5 text-sm" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="flex-1" />
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
                  {selectedIds.size} 頭 選択中
                </span>
                <button onClick={clearSelection} className="text-sm text-gray-500 hover:text-gray-700 underline">
                  選択解除
                </button>
                <button
                  onClick={openDestModal}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm"
                >
                  → 移動先を指定
                </button>
              </div>
            ) : (
              <span className="text-sm text-gray-400">ペンの牛にチェックを入れて移動先を指定</span>
            )}
          </div>

          {/* 牛舎カード群 */}
          {data.barns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              牛舎が登録されていません。「牛舎マスタ」から登録してください。
            </div>
          ) : (
            <div className="space-y-6">
              {barnGroups.map(({ barn, pens, unassigned }) => {
                const barnTotal = activeCattle.filter(c => c.barnId === barn.id).length;
                return (
                  <div key={barn.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* 牛舎ヘッダー */}
                    <div className="bg-green-50 border-b border-green-100 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🏚</span>
                        <h3 className="font-bold text-green-900 text-base">{barn.name}</h3>
                      </div>
                      <span className="text-sm text-green-700 font-medium">
                        在籍 {barnTotal} 頭 / 上限 {barn.capacity} 頭
                      </span>
                    </div>

                    {/* ペンカード */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pens.map(({ pen, cattle }) => {
                        const penCattleIds = cattle.map(c => c.id);
                        const allChecked = penCattleIds.length > 0 && penCattleIds.every(id => selectedIds.has(id));
                        const someChecked = penCattleIds.some(id => selectedIds.has(id));

                        return (
                          <div
                            key={pen.id}
                            className={`border-2 rounded-xl overflow-hidden transition-all ${
                              someChecked ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            {/* ペンヘッダー */}
                            <div
                              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer select-none ${
                                someChecked ? 'bg-blue-100/60' : 'bg-white border-b border-gray-200'
                              }`}
                              onClick={() => penCattleIds.length > 0 && togglePen(penCattleIds)}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={allChecked}
                                  ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                                  onChange={() => {}}
                                  onClick={e => e.stopPropagation()}
                                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                  disabled={penCattleIds.length === 0}
                                />
                                <span className="font-semibold text-sm text-gray-800">{pen.name}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {cattle.length} / {pen.capacity} 頭
                              </span>
                            </div>

                            {/* 牛リスト */}
                            <div className="divide-y divide-gray-100">
                              {cattle.length === 0 ? (
                                <div className="px-4 py-3 text-xs text-gray-400 text-center">空き</div>
                              ) : (
                                cattle.map(c => {
                                  const checked = selectedIds.has(c.id);
                                  return (
                                    <label
                                      key={c.id}
                                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                        checked ? 'bg-blue-100/50' : 'hover:bg-gray-100'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleCow(c.id)}
                                        className="w-4 h-4 rounded accent-blue-600"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-mono text-xs font-semibold text-gray-800 truncate">{c.id}</p>
                                        <p className="text-xs text-gray-500">{c.breed} / {c.gender === 'male' ? '♂ 雄' : '♀ 雌'}</p>
                                      </div>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* ペン未割当 */}
                      {unassigned.length > 0 && (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-500">ペン未割当</span>
                            <span className="text-xs text-gray-400">{unassigned.length} 頭</span>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {unassigned.map(c => (
                              <label key={c.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-100 ${selectedIds.has(c.id) ? 'bg-blue-100/50' : ''}`}>
                                <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleCow(c.id)} className="w-4 h-4 rounded accent-blue-600" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-mono text-xs font-semibold text-gray-800 truncate">{c.id}</p>
                                  <p className="text-xs text-gray-500">{c.breed}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {pens.length === 0 && unassigned.length === 0 && (
                        <div className="col-span-full text-center text-sm text-gray-400 py-6">
                          この牛舎にはペンが登録されていません
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">移動日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">頭数</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">移動元</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">移動先</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">理由</th>
              </tr>
            </thead>
            <tbody>
              {data.movementRecords.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">移動記録がありません</td></tr>
              ) : (
                [...data.movementRecords].reverse().map(r => {
                  const fromB = barnMap[r.fromBarnId];
                  const fromP = penMap[r.fromPenId];
                  const toB = barnMap[r.toBarnId];
                  const toP = penMap[r.toPenId];
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{r.date}</td>
                      <td className="px-4 py-3 font-semibold text-blue-700">{r.cattleIds.length} 頭</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{fromB?.name ?? '-'}{fromP ? ` / ${fromP.name}` : ''}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{toB?.name ?? '-'}{toP ? ` / ${toP.name}` : ''}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.reason ?? '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 移動先指定モーダル */}
      {showDestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDestModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-1">移動先を指定</h3>
            <p className="text-sm text-gray-500 mb-6">
              選択中: <span className="font-semibold text-blue-700">{selectedIds.size} 頭</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">移動日</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full text-sm" value={date} onChange={e => setDate(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">移動先牛舎 *</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full text-sm"
                  value={toBarnId}
                  onChange={e => { setToBarnId(e.target.value); setToPenId(''); }}
                >
                  <option value="">選択してください</option>
                  {data.barns.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.barn && <p className="text-red-500 text-xs mt-1">{errors.barn}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">移動先ペン *</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full text-sm"
                  value={toPenId}
                  onChange={e => setToPenId(e.target.value)}
                  disabled={!toBarnId}
                >
                  <option value="">選択してください</option>
                  {(toBarn?.pens ?? []).map(p => {
                    const cnt = activeCattle.filter(c => c.barnId === toBarnId && c.penId === p.id).length;
                    return <option key={p.id} value={p.id}>{p.name}（現在 {cnt} 頭）</option>;
                  })}
                </select>
                {errors.pen && <p className="text-red-500 text-xs mt-1">{errors.pen}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">移動理由</label>
                <input
                  className="border rounded-lg px-3 py-2 w-full text-sm"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="生育ステージ移行 など"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={executeMove}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                移動実行
              </button>
              <button
                onClick={() => setShowDestModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
