import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ChefHat, 
  Bike, 
  PackageCheck, 
  Clock, 
  Phone, 
  MapPin, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ClientOrder } from '../types';

interface OrderTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ClientOrder[];
  onOrderUpdated: (updated: ClientOrder) => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  isOpen,
  onClose,
  orders,
  onOrderUpdated,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [isAdvancing, setIsAdvancing] = useState(false);

  if (!isOpen) return null;

  const currentOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const handleAdvanceStage = async () => {
    if (!currentOrder || currentOrder.currentTrackingStage >= 4) return;
    setIsAdvancing(true);

    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/advance`, {
        method: 'POST'
      }).then(r => r.json());

      if (res.success) {
        onOrderUpdated(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const stages = [
    { stage: 1, label: 'Order Confirmed', desc: 'Sent to restaurant kitchen', icon: CheckCircle2 },
    { stage: 2, label: 'Kitchen Preparing', desc: 'Fresh ingredients being cooked', icon: ChefHat },
    { stage: 3, label: 'Out for Delivery', desc: 'Courier on route with thermal bag', icon: Bike },
    { stage: 4, label: 'Delivered', desc: 'Dropped off at your door', icon: PackageCheck }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">Live Order Tracking</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {currentOrder?.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time state progression engine</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!currentOrder ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No orders placed yet. Add items from the marketplace to track an order.
            </div>
          ) : (
            <>
              {/* Restaurant & ETA Banner */}
              <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400">Order from</span>
                  <h3 className="text-base font-bold text-white">{currentOrder.restaurantName}</h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Estimated Arrival: <span className="text-emerald-400 font-semibold">15-25 mins</span></span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400">Total Paid</span>
                  <p className="text-lg font-extrabold text-emerald-400">${currentOrder.total.toFixed(2)}</p>
                  <span className="text-[11px] text-slate-500 font-mono">Status: {currentOrder.status}</span>
                </div>
              </div>

              {/* Multi-Stage Visual Stepper */}
              <div className="relative py-4 px-2">
                <div className="grid grid-cols-4 gap-2 relative z-10">
                  {stages.map((st) => {
                    const isPassed = currentOrder.currentTrackingStage >= st.stage;
                    const isCurrent = currentOrder.currentTrackingStage === st.stage;
                    const Icon = st.icon;

                    return (
                      <div key={st.stage} className="flex flex-col items-center text-center">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30 font-bold scale-105'
                            : isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[11px] font-semibold mt-2 ${isCurrent ? 'text-emerald-400' : isPassed ? 'text-slate-200' : 'text-slate-500'}`}>
                          {st.label}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5 max-w-[100px] leading-tight">
                          {st.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar Backing */}
                <div className="absolute top-9 left-12 right-12 h-1 bg-slate-800 -z-0">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${((currentOrder.currentTrackingStage - 1) / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Courier Simulation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                      {currentOrder.driverName ? currentOrder.driverName[0] : 'C'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{currentOrder.driverName || 'Courier Assigned'}</h4>
                      <p className="text-[11px] text-slate-400">Insulated thermal tote verified</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      {currentOrder.driverPhone || '(415) 555-0321'}
                    </span>
                  </div>
                </div>

                {/* Interactive Simulated Order Transition Control */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Architecture Demonstration Action:</span>
                  <button
                    id="advance-order-stage-btn"
                    onClick={handleAdvanceStage}
                    disabled={isAdvancing || currentOrder.currentTrackingStage >= 4}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <span>{currentOrder.currentTrackingStage >= 4 ? 'Delivered' : 'Simulate Next Stage'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Items</h4>
                <div className="rounded-xl bg-slate-850/60 border border-slate-800 divide-y divide-slate-800">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-emerald-400">{item.quantity}x</span>
                        <span className="text-white font-medium">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-300">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}
        </div>

      </div>
    </div>
  );
};
