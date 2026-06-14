import { useState } from 'react';
import { useApp } from '../context';
import type { FeedRecord } from '../types';
import { generateId } from '../store';

const FEED_TYPES = ['配合飼料', '乾草', 'サイレージ', 'TMR', 'その他'];

export default function Feed() {
  const { data, update } = useApp();
  const [tab, setTab] = useState<'form' | 'history'>('form');

  const [barnId, setBarnId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [feedType, setFeedType] = useState(FEED_TYPES[0]);
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const selectedBarn = data.barns.find(b => b.id === barnId);
  const cattleCount = selectedBarn
    ? data.cattle.filter(c => c.status === 'active' && c.barnId === barnId).length
    : 0;
  const perCattle = cattleCount > 0 && totalAmount ? (Number(totalAmount) / cattleCount).toFixed(2) : null;

  function validate() {
    const e: Record<string, string> = {};
    if (!barnId) e.barnId = '牛舎を選択してください';
    if (!totalAmount || Number(totalAmount) <= 0) e.amount = '給餌量を入力してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    const record: FeedRecord = {
      id: generateId(),
      date,
      barnId,
      feedType,
      totalAmount: Number(totalAmount),
      cattleCount,
      perCattleAmount: cattleCount > 0 ? Number(totalAmount) / cattleCount : 0,
      notes: notes.trim() || undefined,
    };
    update(prev => ({ ...prev, feedRecords: [...prev.feedRecords, record] }));
    setBarnId('');
    setTotalAmount('');
    setNotes('');
    setErrors({});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  const barnMap = Object.fromEntries(data.barns.map(b => [b.id, b.name]));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">給餌量管理</h2>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('form')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'form' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          給餌登録
        </button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'history' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          給餌履歴
        </button>
      </div>

      {tab === 'form' && (
        <div className="max-w-2xl">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
              ✓ 給餌登録が完了しました
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">給餌日 *</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full text-sm" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">飼料種類 *</label>
                <select className="border rounded-lg px-3 py-2 w-full text-sm" value={feedType} onChange={e => setFeedType(e.target.value)}>
                  {FEED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">牛舎 *</label>
              <select className="border rounded-lg px-3 py-2 w-full text-sm" value={barnId} onChange={e => setBarnId(e.target.value)}>
                <option value="">選択してください</option>
                {data.barns.map(b => {
                  const count = data.cattle.filter(c => c.status === 'active' && c.barnId === b.id).length;
                  return <option key={b.id} value={b.id}>{b.name}（{count} 頭）</option>;
                })}
              </select>
              {errors.barnId && <p className="text-red-500 text-xs mt-1">{errors.barnId}</p>}
            </div>

            {barnId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                現在の在籍頭数: <strong>{cattleCount} 頭</strong>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">総給餌量 (kg) *</label>
              <input
                type="number"
                className="border rounded-lg px-3 py-2 w-full text-sm"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="1000"
                step="0.1"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            {perCattle && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-medium text-green-700 mb-1">牛1頭あたり給餌量（按分計算）</p>
                <p className="text-3xl font-bold text-green-800">{perCattle} <span className="text-lg font-normal">kg</span></p>
                <p className="text-xs text-green-600 mt-1">{totalAmount} kg ÷ {cattleCount} 頭 = {perCattle} kg/頭</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
              <textarea className="border rounded-lg px-3 py-2 w-full text-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <button onClick={submit} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              給餌登録
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">給餌日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">牛舎</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">飼料種類</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">頭数</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">総給餌量</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">1頭あたり</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">備考</th>
              </tr>
            </thead>
            <tbody>
              {data.feedRecords.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">給餌記録がありません</td></tr>
              ) : (
                [...data.feedRecords].reverse().map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{r.date}</td>
                    <td className="px-4 py-3">{barnMap[r.barnId] ?? '-'}</td>
                    <td className="px-4 py-3">{r.feedType}</td>
                    <td className="px-4 py-3 text-right">{r.cattleCount} 頭</td>
                    <td className="px-4 py-3 text-right">{r.totalAmount} kg</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{r.perCattleAmount.toFixed(2)} kg</td>
                    <td className="px-4 py-3 text-gray-500">{r.notes ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
