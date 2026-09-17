/**
 * Foodify Core Domain Models & API Payloads
 * Enterprise-grade explicit TypeScript types
 */

export type DietaryTag = 
  | 'vegan' 
  | 'vegetarian' 
  | 'gluten-free' 
  | 'keto' 
  | 'halal' 
  | 'dairy-free' 
  | 'high-protein' 
  | 'low-carb' 
  | 'nut-free';

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PREPARING' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN' | 'AI_AGENT';
  dietaryPreferences: DietaryTag[];
  allergens: string[];
  defaultZipCode: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: 'Bowls' | 'Entrees' | 'Sides' | 'Beverages' | 'Desserts';
  dietaryTags: DietaryTag[];
  allergens: string[];
  calories: number;
  proteinGrams: number;
  isAvailable: boolean;
  imageUrl: string;
  prepTimeMinutes: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  deliveryTimeRange: [number, number]; // [minMinutes, maxMinutes]
  servicedZipCodes: string[];
  address: string;
  isOpen: boolean;
  bannerImage: string;
  menu: MenuItem[];
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  placedAt: string;
  estimatedDeliveryAt: string;
  deliveredAt?: string;
  driverName?: string;
  driverPhone?: string;
  currentTrackingStage: 1 | 2 | 3 | 4;
}

export interface DeliveryZone {
  zipCode: string;
  city: string;
  state: string;
  isEligible: boolean;
  estimatedMinutes: number;
  surgeMultiplier: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    latencyMs: number;
  };
}
