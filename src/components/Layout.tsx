import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'ダッシュボード' },
  { to: '/cattle', label: '牛台帳' },
  { to: '/intake', label: '入荷' },
  { to: '/shipment', label: '出荷' },
  { to: '/barns', label: '牛舎マスタ' },
  { to: '/movement', label: '移動' },
  { to: '/feed', label: '給餌管理' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-green-800 text-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-green-700">
          <h1 className="text-lg font-bold leading-tight">🐄 牧場管理システム</h1>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-700 text-white'
                    : 'text-green-100 hover:bg-green-700/60'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
