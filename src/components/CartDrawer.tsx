import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { ClientCartItem, ClientOrder, ActiveUser } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: ClientCartItem[];
  user: ActiveUser;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onOrderPlaced: (order: ClientOrder) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  user,
  onUpdateQuantity,
  onRemoveItem,
  onOrderPlaced,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streetAddress, setStreetAddress] = useState('450 Townsend St, Apt 4B');
  const [specialNotes, setSpecialNotes] = useState('Ring buzzer 4B, leave outside door');

  if (!isOpen) return null;

  const subtotal = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  const deliveryFee = items.length > 0 ? 2.99 : 0;
  const tax = Math.round(subtotal * 0.0875 * 100) / 100;
  const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      const primaryRestaurantId = items[0].restaurantId;
      const orderPayload = {
        userId: user.id,
        restaurantId: primaryRestaurantId,
        items: items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          specialInstructions: specialNotes
        })),
        deliveryAddress: {
          street: streetAddress,
          city: 'San Francisco',
          state: 'CA',
          zipCode: user.defaultZipCode
        }
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      }).then(r => r.json());

      if (res.success) {
        onOrderPlaced(res.data);
        onClose();
      } else {
        alert(res.error?.message || 'Checkout failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          
          {/* Cart Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Your Cart ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white">Your cart is empty</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Explore personalized dishes matched to your dietary profile and add your favorite items.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 font-medium pb-2 border-b border-slate-800/80">
                  Fulfilling from <span className="text-white font-semibold">{items[0]?.restaurantName}</span>
                </div>

                {items.map(item => (
                  <div 
                    key={item.menuItemId} 
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-x-3"
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                      <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <div className="flex items-center space-x-1.5 mt-2">
                        <button 
                          onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                          className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                          className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => onRemoveItem(item.menuItemId)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Delivery Address & Instructions */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Delivery Destination</span>
                  </div>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Delivery street address"
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Delivery dropoff instructions..."
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Bill Breakdown */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Tax (8.75%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-extrabold text-white">
                    <span>Total Amount</span>
                    <span className="text-emerald-400">${total.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Cart Footer / Checkout Action */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/95 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Simulated Apple Pay / Card</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Dietary Safety Guard</span>
                </span>
              </div>

              <button
                id="simulate-checkout-btn"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <span>Place Order · ${total.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
