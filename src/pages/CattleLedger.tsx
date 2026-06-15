import { useState } from 'react';
import { useApp } from '../context';
import type { Cattle, TreatmentCategory } from '../types';

const CATEGORY_COLORS: Record<TreatmentCategory, string> = {
  投薬:     'bg-orange-100 text-orange-700 border-orange-200',
  注射:     'bg-blue-100 text-blue-700 border-blue-200',
  ワクチン: 'bg-purple-100 text-purple-700 border-purple-200',
  手術:     'bg-red-100 text-red-700 border-red-200',
  診察:     'bg-teal-100 text-teal-700 border-teal-200',
  その他:   'bg-gray-100 text-gray-600 border-gray-200',
};

export default function CattleLedger() {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'shipped'>('all');
  const [selected, setSelected] = useState<Cattle | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'movement' | 'treatment'>('info');

  const barnMap = Object.fromEntries(data.barns.map(b => [b.id, b]));
  const penMap = Object.fromEntries(data.barns.flatMap(b => b.pens.map(p => [p.id, p])));

  const filtered = data.cattle.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch =
      !search ||
      c.id.includes(search) ||
      c.breed.includes(search) ||
      (c.supplierName ?? '').includes(search);
    return matchStatus && matchSearch;
  });

  function openDetail(c: Cattle) {
    setSelected(c);
    setDetailTab('info');
  }

  // 選択中の牛の移動履歴
  const movementHistory = selected
    ? [...data.movementRecords]
        .filter(r => r.cattleIds.includes(selected.id))
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  // 選択中の牛の治療履歴
  const treatmentHistory = selected
    ? [...(data.treatmentRecords ?? [])]
        .filter(r => r.cattleId === selected.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const treatmentTotalCost = treatmentHistory.reduce((s, r) => s + r.cost, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-6">牛台帳</h2>

      {/* 検索バー */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-0"
          placeholder="耳標番号・品種で検索"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'shipped')}
        >
          <option value="all">全て</option>
          <option value="active">蓄養中</option>
          <option value="shipped">出荷済</option>
        </select>
        <span className="text-sm text-gray-500 self-center whitespace-nowrap">{filtered.length} 頭</span>
      </div>

      {/* デスクトップ: テーブル */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">耳標番号</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">品種</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">性別</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">生年月日</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">入荷日</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">所在</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">状態</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">牛が登録されていません</td>
              </tr>
            ) : (
              filtered.map(c => {
                const barn = c.barnId ? barnMap[c.barnId] : null;
                const pen = c.penId ? penMap[c.penId] : null;
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-xs">{c.id}</td>
                    <td className="px-4 py-3">{c.breed}</td>
                    <td className="px-4 py-3">{c.gender === 'male' ? '♂ 雄' : '♀ 雌'}</td>
                    <td className="px-4 py-3">{c.birthDate}</td>
                    <td className="px-4 py-3">{c.arrivalDate}</td>
                    <td className="px-4 py-3 text-xs">{barn ? `${barn.name}${pen ? ` / ${pen.name}` : ''}` : '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(c)} className="text-xs text-blue-600 hover:text-blue-800">詳細</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* モバイル: カードリスト */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            牛が登録されていません
          </div>
        ) : (
          filtered.map(c => {
            const barn = c.barnId ? barnMap[c.barnId] : null;
            const pen = c.penId ? penMap[c.penId] : null;
            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm"
                onClick={() => openDetail(c)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold text-gray-800 truncate">{c.id}</p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {c.breed} / {c.gender === 'male' ? '♂ 雄' : '♀ 雌'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {barn ? `${barn.name}${pen ? ` › ${pen.name}` : ''}` : '所在不明'} ・ 入荷 {c.arrivalDate}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={c.status} />
                    <span className="text-xs text-blue-500">詳細 ›</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 詳細モーダル */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-lg flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* モバイル用ドラッグハンドル */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 md:hidden shrink-0" />

            {/* ヘッダー */}
            <div className="px-6 pt-4 pb-0 shrink-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-mono text-sm font-bold text-gray-800">{selected.id}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{selected.breed} / {selected.gender === 'male' ? '♂ 雄' : '♀ 雌'}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {/* タブ */}
              <div className="flex gap-1 border-b border-gray-200">
                <button
                  onClick={() => setDetailTab('info')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === 'info'
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  基本情報
                </button>
                <button
                  onClick={() => setDetailTab('movement')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    detailTab === 'movement'
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  移動履歴
                  {movementHistory.length > 0 && (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                      {movementHistory.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setDetailTab('treatment')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    detailTab === 'treatment'
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  治療履歴
                  {treatmentHistory.length > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                      {treatmentHistory.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* タブコンテンツ */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {detailTab === 'info' && (
                <dl className="space-y-2.5 text-sm">
                  <Row label="入荷日" value={selected.arrivalDate} />
                  <Row label="生年月日" value={selected.birthDate} />
                  <Row label="入荷時体重" value={`${selected.arrivalWeight} kg`} />
                  {selected.barnId && (
                    <Row
                      label="現在の所在"
                      value={`${barnMap[selected.barnId]?.name ?? '-'}${selected.penId ? ` / ${penMap[selected.penId]?.name ?? '-'}` : ''}`}
                    />
                  )}
                  <div className="border-t border-gray-100 pt-2.5 mt-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">取引情報</p>
                    <dl className="space-y-2.5">
                      <Row label="入荷元" value={selected.supplierName ?? '-'} />
                      {selected.entryNumber && <Row label="入場番号" value={selected.entryNumber} />}
                      {selected.auctionPriceExcTax != null && (
                        <Row label="セリ価格(税抜)" value={`¥${selected.auctionPriceExcTax.toLocaleString()}`} />
                      )}
                      {selected.consumptionTax != null && (
                        <Row label="消費税額" value={`¥${selected.consumptionTax.toLocaleString()}`} />
                      )}
                      <Row label="購買金額(税込)" value={selected.purchasePrice ? `¥${selected.purchasePrice.toLocaleString()}` : '-'} />
                    </dl>
                  </div>
                  {selected.notes && <Row label="備考" value={selected.notes} />}
                </dl>
              )}

              {detailTab === 'treatment' && (
                <div>
                  {treatmentHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">治療・投薬記録がありません</div>
                  ) : (
                    <div>
                      <div className="flex justify-end mb-3">
                        <span className="text-xs text-gray-500">
                          累計費用: <span className="font-bold text-gray-700">¥{treatmentTotalCost.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="space-y-3">
                        {treatmentHistory.map(r => (
                          <div key={r.id} className="border border-gray-200 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-400">{r.date}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[r.category as TreatmentCategory]}`}>
                                  {r.category}
                                </span>
                              </div>
                              {r.cost > 0 && (
                                <span className="text-xs font-semibold text-gray-700 shrink-0">¥{r.cost.toLocaleString()}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-800">{r.description}</p>
                            {r.drug && (
                              <p className="text-xs text-gray-500 mt-1">
                                💊 {r.drug}{r.dosage ? ` — ${r.dosage}` : ''}
                              </p>
                            )}
                            {r.veterinarian && (
                              <p className="text-xs text-gray-500 mt-0.5">👨‍⚕️ {r.veterinarian}</p>
                            )}
                            {r.notes && (
                              <p className="text-xs text-gray-400 mt-1.5 pt-1.5 border-t border-gray-100">{r.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'movement' && (
                <div>
                  {movementHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      移動記録がありません
                    </div>
                  ) : (
                    <div className="relative">
                      {/* タイムライン */}
                      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
                      <div className="space-y-4">
                        {movementHistory.map((r, i) => {
                          const fromB = barnMap[r.fromBarnId];
                          const fromP = penMap[r.fromPenId];
                          const toB = barnMap[r.toBarnId];
                          const toP = penMap[r.toPenId];
                          return (
                            <div key={r.id} className="relative pl-9">
                              {/* ドット */}
                              <div className={`absolute left-1 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${i === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                <p className="text-xs font-semibold text-gray-500 mb-2">{r.date}</p>
                                <div className="flex items-center gap-2 text-sm flex-wrap">
                                  <span className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 font-medium">
                                    {fromB?.name ?? '不明'}{fromP ? ` / ${fromP.name}` : ''}
                                  </span>
                                  <span className="text-gray-400 text-base">→</span>
                                  <span className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-xs text-blue-700 font-medium">
                                    {toB?.name ?? '不明'}{toP ? ` / ${toP.name}` : ''}
                                  </span>
                                </div>
                                {r.reason && (
                                  <p className="text-xs text-gray-500 mt-2">📝 {r.reason}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  同時移動: {r.cattleIds.length} 頭
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="px-6 pb-5 pt-3 shrink-0 border-t border-gray-100">
              <button
                onClick={() => setSelected(null)}
                className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {status === 'active' ? '蓄養中' : '出荷済'}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800 break-all">{value}</dd>
    </div>
  );
}
