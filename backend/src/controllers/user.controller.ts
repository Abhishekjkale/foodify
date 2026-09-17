/**
 * User Controller - HTTP Request Handlers
 */

import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  constructor(private userService: UserService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.listUsers();
      res.json({
        success: true,
        data: users
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUser(id);
      res.json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { dietaryPreferences, allergens } = req.body;
      const updated = await this.userService.updatePreferences(id, dietaryPreferences, allergens);
      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  analyzeHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const analysis = await this.userService.analyzeOrderHistory(id);
      res.json({
        success: true,
        data: analysis
      });
    } catch (err) {
      next(err);
    }
  };
}
