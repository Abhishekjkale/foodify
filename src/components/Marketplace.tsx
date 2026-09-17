import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Check, 
  Clock, 
  Flame, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Zap,
  Info
} from 'lucide-react';
import { ActiveUser, ClientCartItem, ClientDishRecommendation } from '../types';
import { Restaurant, MenuItem, DietaryTag } from '../../backend/src/models/types';

interface MarketplaceProps {
  user: ActiveUser;
  onAddToCart: (item: ClientCartItem) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ user, onAddToCart }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [recommendations, setRecommendations] = useState<ClientDishRecommendation[]>([]);
  const [ragLoading, setRagLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [zipCheckInput, setZipCheckInput] = useState<string>(user.defaultZipCode);
  const [zipCheckResult, setZipCheckResult] = useState<{ isEligible: boolean; message: string } | null>(null);
  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // 1. Fetch Restaurants
  useEffect(() => {
    fetch('/api/restaurants')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setRestaurants(res.data);
        }
      })
      .catch(console.error);
  }, []);

  // 2. Fetch RAG Personalized Recommendations
  useEffect(() => {
    setRagLoading(true);
    const bodyPayload = {
      userId: user.id,
      query: searchQuery || undefined,
      dietaryFilters: selectedTag !== 'all' ? [selectedTag as DietaryTag] : user.dietaryPreferences,
      allergens: user.allergens,
      limit: 6
    };

    fetch('/api/rag/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setRecommendations(res.data.recommendations);
          setLatencyMs(res.data.latencyBreakdown.totalMs);
        }
      })
      .catch(console.error)
      .finally(() => setRagLoading(false));
  }, [user.id, user.dietaryPreferences, user.allergens, searchQuery, selectedTag]);

  const handleAddItem = (item: MenuItem, restaurantName: string, restaurantId: string) => {
    onAddToCart({
      menuItemId: item.id,
      restaurantId,
      restaurantName,
      name: item.name,
      price: item.price,
      quantity: 1,
      dietaryTags: item.dietaryTags,
      allergens: item.allergens,
      imageUrl: item.imageUrl
    });

    setAddedItemMap(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemMap(prev => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  const handleZipCheck = async () => {
    if (!zipCheckInput.trim()) return;
    try {
      const res = await fetch(`/api/delivery/check/${zipCheckInput.trim()}`).then(r => r.json());
      if (res.success && res.data.isEligible) {
        setZipCheckResult({
          isEligible: true,
          message: `Delivery Available! ${res.data.availableRestaurantsCount} active partner kitchens in ${zipCheckInput}. Est. ~${res.data.estimatedTransitMinutes} min.`
        });
      } else {
        setZipCheckResult({
          isEligible: false,
          message: `Sorry, Foodify couriers do not currently service ZIP ${zipCheckInput}. Try 94107 or 94110.`
        });
      }
    } catch {
      setZipCheckResult({ isEligible: false, message: 'Could not verify delivery zone.' });
    }
  };

  const dietaryTagsList = [
    { key: 'all', label: 'All Preferences' },
    { key: 'gluten-free', label: 'Gluten-Free' },
    { key: 'vegan', label: 'Vegan' },
    { key: 'high-protein', label: 'High Protein' },
    { key: 'keto', label: 'Keto' },
    { key: 'dairy-free', label: 'Dairy-Free' }
  ];

  return (
    <div className="space-y-10 pb-16">
      
      {/* Hero & Context Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/80 border border-slate-700/60 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>RAG Personalization Engine Active</span>
              <span className="text-slate-400 font-mono">({latencyMs > 0 ? `${latencyMs}ms latency` : 'ready'})</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Personalized Menu Curation for <span className="text-emerald-400">{user.name}</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Filtered for <span className="font-semibold text-emerald-300">[{user.dietaryPreferences.join(', ') || 'Standard'}]</span> with strict allergen safeguards for <span className="font-semibold text-rose-300">[{user.allergens.join(', ') || 'No fatal allergens'}]</span>.
            </p>
          </div>

          {/* Quick ZIP Delivery Checker */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 shadow-md min-w-[280px]">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Delivery Availability Check</span>
            </div>
            <div className="flex space-x-2">
              <input
                id="zip-check-input"
                type="text"
                value={zipCheckInput}
                onChange={(e) => setZipCheckInput(e.target.value)}
                placeholder="Enter ZIP (e.g. 94107)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                id="zip-check-btn"
                onClick={handleZipCheck}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs whitespace-nowrap transition-colors"
              >
                Check
              </button>
            </div>
            {zipCheckResult && (
              <p className={`mt-2 text-[11px] font-medium leading-tight ${zipCheckResult.isEligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                {zipCheckResult.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Semantic Search & Dietary Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="rag-search-input"
            type="text"
            placeholder="Search dish, craving, or macro (e.g., 'truffle quinoa', 'spicy ramen')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Dietary Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1">
          {dietaryTagsList.map(tag => (
            <button
              key={tag.key}
              onClick={() => setSelectedTag(tag.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedTag === tag.key
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: RAG Recommended Dishes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">RAG Hybrid-Ranked Recommendations</h2>
          </div>
          <span className="text-xs text-slate-400">
            {recommendations.length} dish candidates reranked via dense cosine + sparse BM25
          </span>
        </div>

        {ragLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-slate-800/50 animate-pulse border border-slate-700/50" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60">
            <p className="text-sm text-slate-400">No dishes matched your criteria without violating allergen restrictions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map(rec => {
              const item = rec.chunk;
              const isAdded = addedItemMap[item.id] || false;
              const matchPercent = Math.round(rec.score * 100);

              return (
                <div 
                  key={item.id} 
                  className="group relative flex flex-col rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 overflow-hidden shadow-lg hover:shadow-emerald-500/5"
                >
                  {/* Image Container with Match Badge */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                    <img 
                      src={item.imageUrl} 
                      alt={item.dishName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    
                    {/* Match Score Badge */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>{matchPercent}% Match</span>
                    </div>

                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-[11px] font-medium text-slate-300 border border-slate-700">
                      {item.restaurantName}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1 text-slate-300">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.calories} kcal</span>
                        </span>
                        <span className="flex items-center space-x-1 text-slate-300">
                          <Zap className="w-3.5 h-3.5 text-teal-400" />
                          <span>{item.proteinGrams}g pro</span>
                        </span>
                      </div>
                      <span className="flex items-center space-x-1 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.prepTimeMinutes}m</span>
                      </span>
                    </div>
                  </div>

                  {/* Content & AI Rationale */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {item.dishName}
                        </h3>
                        <span className="text-base font-extrabold text-emerald-400">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>

                      {/* AI Transparent Rationale Chip */}
                      <div className="mt-2.5 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start space-x-2">
                        <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{rec.explanation}</span>
                      </div>

                      {/* Dietary Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {item.dietaryTags.map(tag => (
                          <span 
                            key={tag} 
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-medium text-slate-300 border border-slate-700/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        id={`add-rag-item-${item.id}`}
                        onClick={() => {
                          const originalItem: MenuItem = {
                            id: item.id.replace('chunk_', ''),
                            restaurantId: item.restaurantId,
                            name: item.dishName,
                            description: '',
                            price: item.price,
                            category: item.category as MenuItem['category'],
                            dietaryTags: item.dietaryTags,
                            allergens: item.allergens,
                            calories: item.calories,
                            proteinGrams: item.proteinGrams,
                            isAvailable: true,
                            imageUrl: item.imageUrl,
                            prepTimeMinutes: item.prepTimeMinutes
                          };
                          handleAddItem(originalItem, item.restaurantName, item.restaurantId);
                        }}
                        className={`w-full py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Added to Cart</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Add to Order · ${item.price.toFixed(2)}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Partner Kitchens & Full Menus */}
      <section className="space-y-6 pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Partner Restaurants</h2>
            <p className="text-xs text-slate-400">Verified kitchens fulfilling to {user.defaultZipCode}</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Filter Kitchen:</span>
            <select
              aria-label="Filter Restaurant Kitchen"
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">All Kitchens ({restaurants.length})</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Restaurant Cards & Menus */}
        <div className="space-y-8">
          {restaurants
            .filter(r => selectedRestaurant === 'all' || r.id === selectedRestaurant)
            .map(restaurant => (
              <div key={restaurant.id} className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-md">
                
                {/* Restaurant Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={restaurant.bannerImage} 
                      alt={restaurant.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-white">{restaurant.name}</h3>
                        <span className="flex items-center space-x-1 text-xs text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{restaurant.rating}</span>
                          <span className="text-slate-400">({restaurant.reviewCount})</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{restaurant.cuisine.join(' · ')} · {restaurant.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-300">
                    <div className="text-right">
                      <span className="block font-medium text-slate-400">Delivery Fee</span>
                      <span className="font-bold text-white">${restaurant.deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-medium text-slate-400">Est. Time</span>
                      <span className="font-bold text-emerald-400">{restaurant.deliveryTimeRange[0]}-{restaurant.deliveryTimeRange[1]} mins</span>
                    </div>
                  </div>
                </div>

                {/* Restaurant Menu Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restaurant.menu.map(item => {
                    const isAdded = addedItemMap[item.id] || false;
                    const hasAllergenWarning = item.allergens.some(a => user.allergens.includes(a.toLowerCase()));

                    return (
                      <div 
                        key={item.id}
                        className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                          hasAllergenWarning 
                            ? 'bg-rose-950/20 border-rose-800/40 opacity-75' 
                            : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1.5 pr-3 max-w-[70%]">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                            {hasAllergenWarning && (
                              <span className="flex items-center space-x-1 text-[10px] text-rose-400 bg-rose-900/40 px-1.5 py-0.5 rounded border border-rose-800">
                                <ShieldCheck className="w-3 h-3 text-rose-400" />
                                <span>Allergen Warning</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                            <span className="font-bold text-emerald-400">${item.price.toFixed(2)}</span>
                            <span>·</span>
                            <span>{item.calories} kcal</span>
                            <span>·</span>
                            <span>{item.proteinGrams}g protein</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover border border-slate-700"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            id={`add-kitchen-item-${item.id}`}
                            onClick={() => handleAddItem(item, restaurant.name, restaurant.id)}
                            className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                              isAdded 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
        </div>
      </section>

    </div>
  );
};
