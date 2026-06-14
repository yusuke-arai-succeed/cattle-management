import { useApp } from '../context';

export default function Dashboard() {
  const { data } = useApp();

  const activeCattle = data.cattle.filter(c => c.status === 'active');
  const shippedCattle = data.cattle.filter(c => c.status === 'shipped');

  const today = new Date().toISOString().slice(0, 10);
  const todayIntake = data.intakeRecords.filter(r => r.date === today).length;
  const todayShipment = data.shipmentRecords.filter(r => r.date === today).length;

  const barnStats = data.barns.map(barn => {
    const count = activeCattle.filter(c => c.barnId === barn.id).length;
    return { barn, count };
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="蓄養中" value={activeCattle.length} unit="頭" color="green" />
        <Card label="累計出荷" value={shippedCattle.length} unit="頭" color="blue" />
        <Card label="本日入荷" value={todayIntake} unit="頭" color="yellow" />
        <Card label="本日出荷" value={todayShipment} unit="頭" color="red" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">牛舎別在籍状況</h3>
        {data.barns.length === 0 ? (
          <p className="text-gray-400 text-sm">牛舎が登録されていません。「牛舎マスタ」から登録してください。</p>
        ) : (
          <div className="space-y-3">
            {barnStats.map(({ barn, count }) => (
              <div key={barn.id} className="flex items-center gap-4">
                <span className="w-32 text-sm font-medium text-gray-700 truncate">{barn.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all"
                    style={{ width: barn.capacity > 0 ? `${Math.min((count / barn.capacity) * 100, 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-24 text-right">
                  {count} / {barn.capacity} 頭
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
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
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">
        {value} <span className="text-base font-normal">{unit}</span>
      </p>
    </div>
  );
}
