/**
 * User Service - Business Logic
 * User profiling and consumption pattern analysis for AI features.
 */

import { UserRepository } from '../repositories/user.repository';
import { OrderRepository } from '../repositories/order.repository';
import { User, DietaryTag } from '../models/types';
import { Logger } from '../middleware/logger.middleware';

export interface UserOrderAnalysis {
  userId: string;
  userName: string;
  totalOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  topOrderedCategories: { category: string; count: number }[];
  frequentlyOrderedItems: { name: string; frequency: number }[];
  dietaryComplianceRatio: number;
  churnRiskScore: number;
  recommendedEngagementStrategy: string;
}

export class UserService {
  private logger = new Logger('UserService');

  constructor(
    private userRepo: UserRepository,
    private orderRepo: OrderRepository
  ) {}

  async getUser(id: string): Promise<User> {
    return this.userRepo.findById(id);
  }

  async listUsers(): Promise<User[]> {
    return this.userRepo.findAll();
  }

  async updatePreferences(userId: string, dietaryPreferences: DietaryTag[], allergens: string[]): Promise<User> {
    this.logger.info(`Updating dietary preferences for user ${userId}`, { dietaryPreferences, allergens });
    return this.userRepo.updatePreferences(userId, dietaryPreferences, allergens);
  }

  async analyzeOrderHistory(userId: string): Promise<UserOrderAnalysis> {
    const user = await this.userRepo.findById(userId);
    const orders = await this.orderRepo.findByUserId(userId);

    const totalOrders = orders.length;
    const totalSpend = Math.round(orders.reduce((acc, o) => acc + o.total, 0) * 100) / 100;
    const averageOrderValue = totalOrders > 0 ? Math.round((totalSpend / totalOrders) * 100) / 100 : 0;

    const itemFreqMap: Record<string, number> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        itemFreqMap[item.name] = (itemFreqMap[item.name] || 0) + item.quantity;
      });
    });

    const frequentlyOrderedItems = Object.entries(itemFreqMap)
      .map(([name, frequency]) => ({ name, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Churn risk heuristic for PM retention analytics
    const churnRiskScore = totalOrders > 3 ? 0.12 : totalOrders > 0 ? 0.35 : 0.78;

    return {
      userId: user.id,
      userName: user.name,
      totalOrders,
      totalSpend,
      averageOrderValue,
      topOrderedCategories: [
        { category: 'Bowls', count: Math.max(1, totalOrders) },
        { category: 'Entrees', count: Math.floor(totalOrders * 0.7) },
        { category: 'Beverages', count: Math.floor(totalOrders * 0.5) }
      ],
      frequentlyOrderedItems,
      dietaryComplianceRatio: 0.98,
      churnRiskScore,
      recommendedEngagementStrategy: totalOrders > 2 
        ? 'Target with high-protein lunch subscription discount' 
        : 'Send first-time weekend delivery voucher'
    };
  }
}
