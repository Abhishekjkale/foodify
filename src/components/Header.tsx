import React from 'react';
import { 
  ShoppingBag, 
  BarChart3, 
  Terminal, 
  Layers, 
  UtensilsCrossed, 
  UserCircle,
  Truck,
  Sparkles
} from 'lucide-react';
import { AppView, ActiveUser } from '../types';

interface HeaderProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  users: ActiveUser[];
  selectedUser: ActiveUser;
  setSelectedUser: (user: ActiveUser) => void;
  cartCount: number;
  onOpenCart: () => void;
  activeOrderCount: number;
  onOpenOrderTracker: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  users,
  selectedUser,
  setSelectedUser,
  cartCount,
  onOpenCart,
  activeOrderCount,
  onOpenOrderTracker,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('marketplace')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <UtensilsCrossed className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">Foodify</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Enterprise AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">RAG Personalization & MCP Protocol Platform</p>
            </div>
          </div>

          {/* Navigation Views */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="nav-marketplace-btn"
              onClick={() => setCurrentView('marketplace')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'marketplace'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </button>

            <button
              id="nav-analytics-btn"
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="flex items-center gap-1.5">
                AI PM Analytics
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse"></span>
              </span>
            </button>

            <button
              id="nav-mcp-btn"
              onClick={() => setCurrentView('mcp')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'mcp'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>MCP Server</span>
            </button>

            <button
              id="nav-arch-btn"
              onClick={() => setCurrentView('architecture')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'architecture'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Architecture</span>
            </button>
          </nav>

          {/* Right Action Tools: Persona Switcher & Cart */}
          <div className="flex items-center space-x-3">
            
            {/* Persona Switcher */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
              <UserCircle className="w-4 h-4 text-emerald-400" />
              <div className="text-left hidden lg:block">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">User Profile:</span>
              </div>
              <select
                id="user-persona-select"
                aria-label="Select Customer Persona"
                value={selectedUser.id}
                onChange={(e) => {
                  const u = users.find(usr => usr.id === e.target.value);
                  if (u) setSelectedUser(u);
                }}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-800 text-slate-200">
                    {u.name} ({u.dietaryPreferences.join(', ') || 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Order Tracker Button */}
            {activeOrderCount > 0 && (
              <button
                id="active-orders-btn"
                onClick={onOpenOrderTracker}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-all animate-pulse"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Tracking ({activeOrderCount})</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              id="open-cart-btn"
              onClick={onOpenCart}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-800">
          <button
            onClick={() => setCurrentView('marketplace')}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${currentView === 'marketplace' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${currentView === 'analytics' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            AI PM Analytics
          </button>
          <button
            onClick={() => setCurrentView('mcp')}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${currentView === 'mcp' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            MCP Server
          </button>
          <button
            onClick={() => setCurrentView('architecture')}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${currentView === 'architecture' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Architecture
          </button>
        </div>

      </div>
    </header>
  );
};
