import { useState } from 'react';
import { useApp } from '../context';
import type { Cattle } from '../types';

export default function CattleLedger() {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'shipped'>('all');
  const [selected, setSelected] = useState<Cattle | null>(null);

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
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(c)} className="text-xs text-blue-600 hover:text-blue-800">詳細</button>
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
                onClick={() => setSelected(c)}
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
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-0 md:p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl p-6 w-full md:max-w-md" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
            <h3 className="text-lg font-bold text-gray-800 mb-4">牛詳細</h3>
            <dl className="space-y-2 text-sm">
              <Row label="耳標番号" value={selected.id} />
              <Row label="品種" value={selected.breed} />
              <Row label="性別" value={selected.gender === 'male' ? '♂ 雄' : '♀ 雌'} />
              <Row label="生年月日" value={selected.birthDate} />
              <Row label="入荷日" value={selected.arrivalDate} />
              <Row label="入荷時体重" value={`${selected.arrivalWeight} kg`} />
              <Row label="仕入先" value={selected.supplierName ?? '-'} />
              <Row label="購入価格" value={selected.purchasePrice ? `¥${selected.purchasePrice.toLocaleString()}` : '-'} />
              <Row label="備考" value={selected.notes ?? '-'} />
            </dl>
            <button onClick={() => setSelected(null)} className="mt-5 w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">
              閉じる
            </button>
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
