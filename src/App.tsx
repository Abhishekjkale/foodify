/**
 * Foodify - Enterprise AI Platform App Entry
 * Integrates Consumer Marketplace, AI PM Analytics Dashboard, MCP Protocol Inspector,
 * and Decoupled Architecture Viewer.
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Marketplace } from './components/Marketplace';
import { CartDrawer } from './components/CartDrawer';
import { OrderTracker } from './components/OrderTracker';
import { AiPmDashboard } from './components/AiPmDashboard';
import { McpInspector } from './components/McpInspector';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { AppView, ActiveUser, ClientCartItem, ClientOrder } from './types';
import { UtensilsCrossed, ShieldCheck, Heart, Sparkles } from 'lucide-react';

const INITIAL_USERS: ActiveUser[] = [
  {
    id: 'usr_sarah_01',
    name: 'Sarah Lin',
    email: 'sarah.lin@enterprise.ai',
    role: 'CUSTOMER',
    dietaryPreferences: ['gluten-free', 'high-protein'],
    allergens: ['dairy', 'peanuts'],
    defaultZipCode: '94107'
  },
  {
    id: 'usr_marcus_02',
    name: 'Marcus Vance',
    email: 'marcus.vance@enterprise.ai',
    role: 'CUSTOMER',
    dietaryPreferences: ['vegan', 'nut-free'],
    allergens: ['tree-nuts'],
    defaultZipCode: '94110'
  },
  {
    id: 'usr_elena_03',
    name: 'Elena Rostova',
    email: 'elena.rostova@enterprise.ai',
    role: 'CUSTOMER',
    dietaryPreferences: ['keto', 'low-carb'],
    allergens: ['soy'],
    defaultZipCode: '94107'
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('marketplace');
  const [users, setUsers] = useState<ActiveUser[]>(INITIAL_USERS);
  const [selectedUser, setSelectedUser] = useState<ActiveUser>(INITIAL_USERS[0]);
  const [cart, setCart] = useState<ClientCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);

  // Fetch users from API if available
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data?.length > 0) {
          setUsers(res.data);
          setSelectedUser(res.data[0]);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch orders for current user
  useEffect(() => {
    if (!selectedUser?.id) return;
    fetch(`/api/users/${selectedUser.id}/orders`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setOrders(res.data);
        }
      })
      .catch(console.error);
  }, [selectedUser.id]);

  const handleAddToCart = (item: ClientCartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map(i => 
          i.menuItemId === item.menuItemId 
            ? { ...i, quantity: i.quantity + item.quantity } 
            : i
        );
      }
      return [...prev, item];
    });
  };

  const handleUpdateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev => 
      prev
        .map(i => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter((i): i is ClientCartItem => i !== null)
    );
  };

  const handleRemoveItem = (menuItemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
  };

  const handleOrderPlaced = (newOrder: ClientOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setIsOrderTrackerOpen(true);
  };

  const handleOrderUpdated = (updatedOrder: ClientOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Navigation Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        users={users}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        activeOrderCount={orders.filter(o => o.currentTrackingStage < 4).length}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentView === 'marketplace' && (
          <Marketplace 
            user={selectedUser} 
            onAddToCart={handleAddToCart} 
          />
        )}

        {currentView === 'analytics' && (
          <AiPmDashboard />
        )}

        {currentView === 'mcp' && (
          <McpInspector />
        )}

        {currentView === 'architecture' && (
          <ArchitectureViewer />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        user={selectedUser}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Live Order Tracker Modal */}
      <OrderTracker
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        orders={orders}
        onOrderUpdated={handleOrderUpdated}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-8 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white">Foodify</span>
            <span className="text-slate-500">|</span>
            <span>Enterprise AI Product Manager Portfolio Reference</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <span className="flex items-center space-x-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>pgvector Embeddings</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Model Context Protocol v1.0</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
