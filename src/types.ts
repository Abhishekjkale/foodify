import { DietaryTag, OrderStatus } from '../backend/src/models/types';

export type AppView = 'marketplace' | 'analytics' | 'mcp' | 'architecture';

export interface ActiveUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'ADMIN' | 'AI_AGENT';
  dietaryPreferences: DietaryTag[];
  allergens: string[];
  defaultZipCode: string;
}

export interface ClientCartItem {
  menuItemId: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  quantity: number;
  dietaryTags: DietaryTag[];
  allergens: string[];
  imageUrl: string;
}

export interface ClientOrder {
  id: string;
  restaurantName: string;
  items: {
    name: string;
    quantity: number;
    subtotal: number;
  }[];
  total: number;
  status: OrderStatus;
  placedAt: string;
  estimatedDeliveryAt: string;
  driverName?: string;
  driverPhone?: string;
  currentTrackingStage: 1 | 2 | 3 | 4;
}

export interface ClientDishRecommendation {
  chunk: {
    id: string;
    restaurantId: string;
    restaurantName: string;
    dishName: string;
    category: string;
    price: number;
    calories: number;
    proteinGrams: number;
    dietaryTags: DietaryTag[];
    allergens: string[];
    prepTimeMinutes: number;
    imageUrl: string;
    chunkText: string;
  };
  score: number;
  denseScore: number;
  lexicalScore: number;
  dietaryBoost: number;
  explanation: string;
}
