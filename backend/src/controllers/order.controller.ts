/**
 * Order Controller - HTTP Request Handlers
 */

import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';

export class OrderController {
  constructor(private orderService: OrderService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await this.orderService.createOrder(req.body);
      res.status(201).json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const order = await this.orderService.getOrder(id);
      res.json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  };

  getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const orders = await this.orderService.getUserOrders(userId);
      res.json({
        success: true,
        data: orders,
        meta: { count: orders.length }
      });
    } catch (err) {
      next(err);
    }
  };

  advanceStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updated = await this.orderService.advanceOrderStage(id);
      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };
}
