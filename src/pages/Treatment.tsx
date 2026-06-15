import { useState } from 'react';
import { useApp } from '../context';
import type { TreatmentRecord, TreatmentCategory } from '../types';
import { generateId } from '../store';

const CATEGORIES: TreatmentCategory[] = ['投薬', '注射', 'ワクチン', '手術', '診察', 'その他'];

const CATEGORY_COLORS: Record<TreatmentCategory, string> = {
  投薬:     'bg-orange-100 text-orange-700 border-orange-200',
  注射:     'bg-blue-100 text-blue-700 border-blue-200',
  ワクチン: 'bg-purple-100 text-purple-700 border-purple-200',
  手術:     'bg-red-100 text-red-700 border-red-200',
  診察:     'bg-teal-100 text-teal-700 border-teal-200',
  その他:   'bg-gray-100 text-gray-600 border-gray-200',
};

const initialForm = {
  date: new Date().toISOString().slice(0, 10),
  cattleId: '',
  category: '診察' as TreatmentCategory,
  description: '',
  drug: '',
  dosage: '',
  veterinarian: '',
  cost: '',
  notes: '',
};

export default function Treatment() {
  const { data, update } = useApp();
  const [tab, setTab] = useState<'form' | 'history'>('form');
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // 履歴フィルタ
  const [filterCattleId, setFilterCattleId] = useState('');
  const [filterCategory, setFilterCategory] = useState<TreatmentCategory | ''>('');

  const allCattle = data.cattle;

  const barnMap = Object.fromEntries(data.barns.map(b => [b.id, b.name]));
  const penMap = Object.fromEntries(data.barns.flatMap(b => b.pens.map(p => [p.id, p.name])));

  function setF(key: keyof typeof initialForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // 入力中の牛情報プレビュー
  const previewCattle = allCattle.find(c => c.id === form.cattleId.trim());

  function validate() {
    const e: Record<string, string> = {};
    if (!form.cattleId.trim()) e.cattleId = '耳標番号は必須です';
    else if (!allCattle.find(c => c.id === form.cattleId.trim())) e.cattleId = '登録されていない耳標番号です';
    if (!form.description.trim()) e.description = '処置内容は必須です';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    const record: TreatmentRecord = {
      id: generateId(),
      date: form.date,
      cattleId: form.cattleId.trim(),
      category: form.category,
      description: form.description.trim(),
      drug: form.drug.trim() || undefined,
      dosage: form.dosage.trim() || undefined,
      veterinarian: form.veterinarian.trim() || undefined,
      cost: Number(form.cost) || 0,
      notes: form.notes.trim() || undefined,
    };
    update(prev => ({ ...prev, treatmentRecords: [...prev.treatmentRecords, record] }));
    setForm(initialForm);
    setErrors({});
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  // 履歴（降順）
  const filteredHistory = [...(data.treatmentRecords ?? [])]
    .filter(r => {
      if (filterCattleId && !r.cattleId.includes(filterCattleId)) return false;
      if (filterCategory && r.category !== filterCategory) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalCost = filteredHistory.reduce((s, r) => s + r.cost, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-6">投薬・治療管理</h2>

      <div className="flex gap-2 mb-6">
        {(['form', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t === 'form' ? '処置登録' : '処置履歴'}
          </button>
        ))}
      </div>

      {/* ===== 登録フォーム ===== */}
      {tab === 'form' && (
        <div className="max-w-2xl">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
              ✓ 処置記録を登録しました
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

            {/* 対象牛 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">耳標番号 *</label>
              <input
                className="border rounded-lg px-3 py-2 w-full text-sm font-mono"
                value={form.cattleId}
                onChange={e => setF('cattleId', e.target.value)}
                placeholder="JP000000000000"
                list="cattle-list"
              />
              {/* datalistでオートコンプリート */}
              <datalist id="cattle-list">
                {allCattle.map(c => (
                  <option key={c.id} value={c.id}>{c.breed} / {c.gender === 'male' ? '雄' : '雌'}</option>
                ))}
              </datalist>
              {errors.cattleId && <p className="text-red-500 text-xs mt-1">{errors.cattleId}</p>}
              {previewCattle && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-center gap-3 flex-wrap">
                  <span className="font-semibold">{previewCattle.breed}</span>
                  <span>{previewCattle.gender === 'male' ? '♂ 雄' : '♀ 雌'}</span>
                  {previewCattle.barnId && (
                    <span>📍 {barnMap[previewCattle.barnId]}{previewCattle.penId ? ` / ${penMap[previewCattle.penId]}` : ''}</span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${previewCattle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {previewCattle.status === 'active' ? '蓄養中' : '出荷済'}
                  </span>
                </div>
              )}
            </div>

            {/* 日付・カテゴリ */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">処置日 *</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.date} onChange={e => setF('date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ *</label>
                <select className="border rounded-lg px-3 py-2 w-full text-sm" value={form.category} onChange={e => setF('category', e.target.value as TreatmentCategory)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* 処置内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">処置内容 *</label>
              <input
                className="border rounded-lg px-3 py-2 w-full text-sm"
                value={form.description}
                onChange={e => setF('description', e.target.value)}
                placeholder="例：口蹄疫ワクチン接種、下痢症状への投薬"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* 薬品・用量 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">使用薬品</label>
                <input className="border rounded-lg px-3 py-2 w-full text-sm" value={form.drug} onChange={e => setF('drug', e.target.value)} placeholder="薬品名" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用量・投与方法</label>
                <input className="border rounded-lg px-3 py-2 w-full text-sm" value={form.dosage} onChange={e => setF('dosage', e.target.value)} placeholder="例：2mL 筋肉注射" />
              </div>
            </div>

            {/* 担当者・費用 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当獣医・実施者</label>
                <input className="border rounded-lg px-3 py-2 w-full text-sm" value={form.veterinarian} onChange={e => setF('veterinarian', e.target.value)} placeholder="田中獣医師" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">費用 (円)</label>
                <input type="number" className="border rounded-lg px-3 py-2 w-full text-sm" value={form.cost} onChange={e => setF('cost', e.target.value)} placeholder="3500" />
              </div>
            </div>

            {/* 備考 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備考・観察メモ</label>
              <textarea className="border rounded-lg px-3 py-2 w-full text-sm" rows={2} value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="次回接種予定、経過観察など" />
            </div>

            <button onClick={submit} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              処置記録を登録
            </button>
          </div>
        </div>
      )}

      {/* ===== 履歴一覧 ===== */}
      {tab === 'history' && (
        <div>
          {/* フィルタ */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <input
              className="border rounded-lg px-3 py-2 text-sm w-48"
              placeholder="耳標番号で絞り込み"
              value={filterCattleId}
              onChange={e => setFilterCattleId(e.target.value)}
              list="cattle-list-filter"
            />
            <datalist id="cattle-list-filter">
              {allCattle.map(c => <option key={c.id} value={c.id} />)}
            </datalist>
            <select className="border rounded-lg px-3 py-2 text-sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value as TreatmentCategory | '')}>
              <option value="">全カテゴリ</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
              <span>{filteredHistory.length} 件</span>
              {filteredHistory.length > 0 && (
                <span className="font-semibold text-gray-700">合計費用: ¥{totalCost.toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* デスクトップ: テーブル */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">処置日</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">耳標番号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">カテゴリ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">処置内容</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">薬品</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">担当者</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">費用</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">処置記録がありません</td></tr>
                ) : (
                  filteredHistory.map(r => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">{r.date}</td>
                        <td className="px-4 py-3 font-mono text-xs">{r.cattleId}</td>
                        <td className="px-4 py-3">
                          <CategoryBadge category={r.category} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{r.description}</p>
                          {r.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{r.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {r.drug ?? '-'}
                          {r.dosage && <p className="text-gray-400">{r.dosage}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{r.veterinarian ?? '-'}</td>
                        <td className="px-4 py-3 text-right font-medium">{r.cost > 0 ? `¥${r.cost.toLocaleString()}` : '-'}</td>
                      </tr>
                  ))
                )}
              </tbody>
              {filteredHistory.length > 0 && (
                <tfoot className="border-t border-gray-200 bg-gray-50">
                  <tr>
                    <td colSpan={6} className="px-4 py-2 text-sm font-semibold text-gray-600 text-right">合計</td>
                    <td className="px-4 py-2 text-right font-bold text-gray-800">¥{totalCost.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* モバイル: カードリスト */}
          <div className="md:hidden space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">処置記録がありません</div>
            ) : (
              filteredHistory.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-400">{r.date}</p>
                      <p className="font-mono text-xs font-bold text-gray-700 mt-0.5">{r.cattleId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={r.category} />
                      {r.cost > 0 && <span className="text-sm font-semibold text-gray-700">¥{r.cost.toLocaleString()}</span>}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{r.description}</p>
                  {r.drug && <p className="text-xs text-gray-500 mt-1">💊 {r.drug}{r.dosage ? ` / ${r.dosage}` : ''}</p>}
                  {r.veterinarian && <p className="text-xs text-gray-500 mt-0.5">👨‍⚕️ {r.veterinarian}</p>}
                  {r.notes && <p className="text-xs text-gray-400 mt-1 border-t border-gray-100 pt-1">{r.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryBadge({ category }: { category: TreatmentCategory }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[category]}`}>
      {category}
    </span>
  );
}
