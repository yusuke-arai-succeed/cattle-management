import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'ダッシュボード', icon: '📊' },
  { to: '/cattle', label: '牛台帳', icon: '📋' },
  { to: '/intake', label: '入荷', icon: '📥' },
  { to: '/shipment', label: '出荷', icon: '📤' },
  { to: '/barns', label: '牛舎マスタ', icon: '🏚' },
  { to: '/movement', label: '移動', icon: '🔄' },
  { to: '/feed', label: '給餌管理', icon: '🌾' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find(item =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* ===== デスクトップ サイドバー ===== */}
      <aside className="hidden md:flex w-56 bg-green-800 text-white flex-col shrink-0 min-h-screen">
        <div className="px-4 py-5 border-b border-green-700">
          <h1 className="text-base font-bold leading-tight">🐄 牧場管理システム</h1>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-700/60'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ===== モバイル ヘッダー ===== */}
      <header className="md:hidden bg-green-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1.5 rounded-lg hover:bg-green-700 transition-colors"
            aria-label="メニューを開く"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-sm">🐄 牧場管理</span>
        </div>
        {currentPage && (
          <span className="text-green-200 text-sm font-medium">
            {currentPage.icon} {currentPage.label}
          </span>
        )}
      </header>

      {/* ===== モバイル ドロワー オーバーレイ ===== */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ===== モバイル ドロワー ===== */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-green-800 text-white z-50 flex flex-col transition-transform duration-300 md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-5 border-b border-green-700 flex items-center justify-between">
          <h1 className="text-base font-bold">🐄 牧場管理システム</h1>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1 rounded hover:bg-green-700"
            aria-label="メニューを閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-700/60'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ===== メインコンテンツ ===== */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
