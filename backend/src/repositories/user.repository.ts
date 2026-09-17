/**
 * User Repository - Data Access Layer
 * Manages user profile, persistent dietary restrictions, allergens, and history.
 */

import { User } from '../models/types';
import { NotFoundError } from '../middleware/error.middleware';

export class UserRepository {
  private users: Map<string, User> = new Map();

  constructor() {
    this.seedUsers();
  }

  private seedUsers() {
    const seed: User[] = [
      {
        id: 'usr_sarah_01',
        name: 'Sarah Lin',
        email: 'sarah.lin@example.com',
        role: 'CUSTOMER',
        dietaryPreferences: ['gluten-free', 'high-protein'],
        allergens: ['dairy'],
        defaultZipCode: '94107',
        createdAt: '2025-01-15T08:00:00.000Z'
      },
      {
        id: 'usr_marcus_02',
        name: 'Marcus Vance',
        email: 'marcus.v@example.com',
        role: 'CUSTOMER',
        dietaryPreferences: ['vegan', 'nut-free'],
        allergens: ['peanuts', 'tree-nuts'],
        defaultZipCode: '94110',
        createdAt: '2025-02-10T12:30:00.000Z'
      },
      {
        id: 'usr_elena_03',
        name: 'Elena Rostova',
        email: 'elena.r@example.com',
        role: 'CUSTOMER',
        dietaryPreferences: ['keto', 'low-carb'],
        allergens: [],
        defaultZipCode: '94102',
        createdAt: '2025-03-01T17:15:00.000Z'
      }
    ];

    seed.forEach(u => this.users.set(u.id, u));
  }

  async findById(id: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updatePreferences(id: string, dietaryPreferences: User['dietaryPreferences'], allergens: string[]): Promise<User> {
    const user = await this.findById(id);
    user.dietaryPreferences = dietaryPreferences;
    user.allergens = allergens;
    this.users.set(id, user);
    return user;
  }
}
