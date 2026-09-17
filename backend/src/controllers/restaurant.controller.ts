/**
 * Restaurant Controller - HTTP Request Handlers
 */

import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../services/restaurant.service';

export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const zipCode = req.query.zipCode as string | undefined;
      const restaurants = await this.restaurantService.listRestaurants(zipCode);
      res.json({
        success: true,
        data: restaurants,
        meta: { count: restaurants.length, timestamp: new Date().toISOString() }
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const restaurant = await this.restaurantService.getRestaurant(id);
      res.json({
        success: true,
        data: restaurant
      });
    } catch (err) {
      next(err);
    }
  };

  getMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const menu = await this.restaurantService.getMenu(id);
      res.json({
        success: true,
        data: menu,
        meta: { count: menu.length }
      });
    } catch (err) {
      next(err);
    }
  };

  checkDelivery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const zipCode = req.params.zipCode || (req.query.zipCode as string);
      const result = await this.restaurantService.checkDeliveryEligibility(zipCode);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };
}
