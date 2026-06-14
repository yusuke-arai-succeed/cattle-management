import { useState } from 'react';
import { useApp } from '../context';
import type { ShipmentRecord } from '../types';
import { generateId } from '../store';

export default function Shipment() {
  const { data, update } = useApp();
  const [tab, setTab] = useState<'form' | 'history'>('form');

  const [earTag, setEarTag] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [buyer, setBuyer] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const activeCattle = data.cattle.filter(c => c.status === 'active');
  const found = activeCattle.find(c => c.id === earTag.trim());

  function validate() {
    const e: Record<string, string> = {};
    if (!earTag.trim()) e.earTag = '耳標番号は必須です';
    else if (!found) e.earTag = 'この耳標番号の蓄養中の牛が見つかりません';
    if (!buyer.trim()) e.buyer = '出荷先は必須です';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    const record: ShipmentRecord = {
      id: generateId(),
      date,
      cattleId: earTag.trim(),
      weight: Number(weight) || 0,
      salePrice: Number(salePrice) || 0,
      buyer: buyer.trim(),
      notes: notes.trim() || undefined,
    };
    update(prev => ({
      ...prev,
      cattle: prev.cattle.map(c => c.id === earTag.trim() ? { ...c, status: 'shipped', barnId: null, penId: null } : c),
      shipmentRecords: [...prev.shipmentRecords, record],
    }));
    setEarTag('');
    setWeight('');
    setSalePrice('');
    setBuyer('');
    setNotes('');
    setErrors({});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">出荷登録</h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('form')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'form' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          出荷登録
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'history' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          出荷履歴
        </button>
      </div>

      {tab === 'form' && (
        <div className="max-w-2xl">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
              ✓ 出荷登録が完了しました
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">耳標番号 *</label>
              <input
                className="border rounded-lg px-3 py-2 w-full text-sm"
                value={earTag}
                onChange={e => setEarTag(e.target.value)}
                placeholder="JP000000000000"
              />
              {errors.earTag && <p className="text-red-500 text-xs mt-1">{errors.earTag}</p>}
              {found && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  品種: {found.breed} ／ 性別: {found.gender === 'male' ? '雄' : '雌'} ／ 入荷日: {found.arrivalDate}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出荷日 *</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full text-sm" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出荷時体重 (kg)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full text-sm" value={weight} onChange={e => setWeight(e.target.value)} placeholder="600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出荷先 *</label>
                <input className="border rounded-lg px-3 py-2 w-full text-sm" value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="〇〇市場" />
                {errors.buyer && <p className="text-red-500 text-xs mt-1">{errors.buyer}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">販売価格 (円)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full text-sm" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="1000000" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
              <textarea className="border rounded-lg px-3 py-2 w-full text-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <button onClick={submit} className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
              出荷登録
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">出荷日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">耳標番号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">品種</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">出荷時体重</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">出荷先</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">販売価格</th>
              </tr>
            </thead>
            <tbody>
              {data.shipmentRecords.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">出荷記録がありません</td></tr>
              ) : (
                [...data.shipmentRecords].reverse().map(r => {
                  const cattle = data.cattle.find(c => c.id === r.cattleId);
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{r.date}</td>
                      <td className="px-4 py-3 font-mono">{r.cattleId}</td>
                      <td className="px-4 py-3">{cattle?.breed ?? '-'}</td>
                      <td className="px-4 py-3">{r.weight > 0 ? `${r.weight} kg` : '-'}</td>
                      <td className="px-4 py-3">{r.buyer}</td>
                      <td className="px-4 py-3 text-right">{r.salePrice > 0 ? `¥${r.salePrice.toLocaleString()}` : '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
