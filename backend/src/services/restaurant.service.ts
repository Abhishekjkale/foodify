/**
 * Restaurant Service - Business Logic
 */

import { RestaurantRepository } from '../repositories/restaurant.repository';
import { Restaurant, MenuItem } from '../models/types';
import { Logger } from '../middleware/logger.middleware';

export class RestaurantService {
  private logger = new Logger('RestaurantService');

  constructor(private restaurantRepo: RestaurantRepository) {}

  async listRestaurants(zipCode?: string): Promise<Restaurant[]> {
    if (zipCode) {
      this.logger.info(`Filtering restaurants by zip code: ${zipCode}`);
      return this.restaurantRepo.findByZipCode(zipCode);
    }
    return this.restaurantRepo.findAll();
  }

  async getRestaurant(id: string): Promise<Restaurant> {
    return this.restaurantRepo.findById(id);
  }

  async getMenu(restaurantId: string): Promise<MenuItem[]> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    return restaurant.menu;
  }

  async checkDeliveryEligibility(zipCode: string): Promise<{
    zipCode: string;
    isEligible: boolean;
    availableRestaurantsCount: number;
    estimatedTransitMinutes: number;
  }> {
    const available = await this.restaurantRepo.findByZipCode(zipCode);
    const isEligible = available.length > 0;
    return {
      zipCode,
      isEligible,
      availableRestaurantsCount: available.length,
      estimatedTransitMinutes: isEligible ? 25 : 0
    };
  }
}
