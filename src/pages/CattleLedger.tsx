import { useState } from 'react';
import { useApp } from '../context';
import type { Cattle } from '../types';

export default function CattleLedger() {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'shipped'>('all');
  const [selected, setSelected] = useState<Cattle | null>(null);

  const barnMap = Object.fromEntries(data.barns.map(b => [b.id, b]));
  const penMap = Object.fromEntries(
    data.barns.flatMap(b => b.pens.map(p => [p.id, p]))
  );

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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">牛台帳</h2>

      <div className="flex gap-3 mb-4">
        <input
          className="border rounded-lg px-3 py-2 text-sm w-64"
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
        <span className="ml-auto text-sm text-gray-500 self-center">{filtered.length} 頭</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  牛が登録されていません
                </td>
              </tr>
            ) : (
              filtered.map(c => {
                const barn = c.barnId ? barnMap[c.barnId] : null;
                const pen = c.penId ? penMap[c.penId] : null;
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium">{c.id}</td>
                    <td className="px-4 py-3">{c.breed}</td>
                    <td className="px-4 py-3">{c.gender === 'male' ? '♂ 雄' : '♀ 雌'}</td>
                    <td className="px-4 py-3">{c.birthDate}</td>
                    <td className="px-4 py-3">{c.arrivalDate}</td>
                    <td className="px-4 py-3 text-xs">
                      {barn ? `${barn.name}${pen ? ` / ${pen.name}` : ''}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.status === 'active' ? '蓄養中' : '出荷済'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(c)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4">牛詳細</h3>
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
            <button
              onClick={() => setSelected(null)}
              className="mt-6 w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <dt className="w-32 text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}
