import { useState } from 'react';
import { useApp } from '../context';
import { demoData } from '../demoData';

export default function Dashboard() {
  const { data, setData } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);

  const activeCattle = data.cattle.filter(c => c.status === 'active');
  const shippedCattle = data.cattle.filter(c => c.status === 'shipped');

  const today = new Date().toISOString().slice(0, 10);
  const todayIntake = data.intakeRecords.filter(r => r.date === today).length;
  const todayShipment = data.shipmentRecords.filter(r => r.date === today).length;

  const barnStats = data.barns.map(barn => {
    const count = activeCattle.filter(c => c.barnId === barn.id).length;
    return { barn, count };
  });

  function loadDemo() {
    setData(demoData);
    setShowConfirm(false);
  }

  function clearAll() {
    setData({ barns: [], cattle: [], intakeRecords: [], shipmentRecords: [], movementRecords: [], feedRecords: [] });
    setShowConfirm(false);
  }

  const hasData = data.cattle.length > 0 || data.barns.length > 0;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-800">ダッシュボード</h2>
        <div className="flex gap-2">
          {hasData ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100"
            >
              データをリセット
            </button>
          ) : (
            <button
              onClick={loadDemo}
              className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 shadow-sm flex items-center gap-1.5"
            >
              🐄 デモデータを挿入
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card label="蓄養中" value={activeCattle.length} unit="頭" color="green" />
        <Card label="累計出荷" value={shippedCattle.length} unit="頭" color="blue" />
        <Card label="本日入荷" value={todayIntake} unit="頭" color="yellow" />
        <Card label="本日出荷" value={todayShipment} unit="頭" color="red" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-700 mb-4">牛舎別在籍状況</h3>
        {data.barns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">牛舎が登録されていません</p>
            <button
              onClick={loadDemo}
              className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
            >
              🐄 デモデータを挿入して始める
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {barnStats.map(({ barn, count }) => (
              <div key={barn.id} className="flex items-center gap-3">
                <span className="w-20 md:w-32 text-sm font-medium text-gray-700 truncate shrink-0">{barn.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all"
                    style={{ width: barn.capacity > 0 ? `${Math.min((count / barn.capacity) * 100, 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-xs md:text-sm text-gray-600 w-16 md:w-24 text-right shrink-0">
                  {count} / {barn.capacity} 頭
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 確認モーダル */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-2">データをリセット</h3>
            <p className="text-sm text-gray-500 mb-5">全データを削除します。デモデータに入れ替えることもできます。</p>
            <div className="space-y-2">
              <button onClick={loadDemo} className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700">
                🐄 デモデータに入れ替え
              </button>
              <button onClick={clearAll} className="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100">
                全データを削除
              </button>
              <button onClick={() => setShowConfirm(false)} className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-xl border p-4 md:p-5 ${colors[color]}`}>
      <p className="text-xs md:text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl md:text-3xl font-bold mt-1">
        {value} <span className="text-sm md:text-base font-normal">{unit}</span>
      </p>
    </div>
  );
}
