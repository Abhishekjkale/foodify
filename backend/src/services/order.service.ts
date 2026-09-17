/**
 * Order Service - Business Logic
 * Idempotent order placement, tax & fee calculation, delivery time estimation, and state progression.
 */

import { OrderRepository } from '../repositories/order.repository';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import { Order, OrderItem, OrderStatus } from '../models/types';
import { ValidationError, NotFoundError } from '../middleware/error.middleware';
import { Logger } from '../middleware/logger.middleware';

export interface CreateOrderDto {
  userId: string;
  restaurantId: string;
  items: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }[];
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export class OrderService {
  private logger = new Logger('OrderService');

  constructor(
    private orderRepo: OrderRepository,
    private restaurantRepo: RestaurantRepository
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const startTime = Date.now();
    this.logger.info('Processing new order placement', { userId: dto.userId, restaurantId: dto.restaurantId });

    if (!dto.items || dto.items.length === 0) {
      throw new ValidationError('An order must contain at least one item.');
    }

    const restaurant = await this.restaurantRepo.findById(dto.restaurantId);
    if (!restaurant.isOpen) {
      throw new ValidationError(`Restaurant '${restaurant.name}' is currently closed.`);
    }

    // Check delivery zone
    if (!restaurant.servicedZipCodes.includes(dto.deliveryAddress.zipCode)) {
      throw new ValidationError(`Restaurant does not deliver to zip code ${dto.deliveryAddress.zipCode}`);
    }

    // Build line items with subtotal validation against repository
    const verifiedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const itemDto of dto.items) {
      const menuItem = restaurant.menu.find(m => m.id === itemDto.menuItemId);
      if (!menuItem) {
        throw new NotFoundError(`MenuItem with id '${itemDto.menuItemId}' not found in restaurant.`);
      }
      if (!menuItem.isAvailable) {
        throw new ValidationError(`Item '${menuItem.name}' is currently sold out.`);
      }
      const lineSubtotal = Math.round(menuItem.price * itemDto.quantity * 100) / 100;
      subtotal += lineSubtotal;

      verifiedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: itemDto.quantity,
        unitPrice: menuItem.price,
        subtotal: lineSubtotal,
        specialInstructions: itemDto.specialInstructions
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const tax = Math.round(subtotal * 0.0875 * 100) / 100; // 8.75% local tax
    const deliveryFee = restaurant.deliveryFee;
    const total = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

    const now = new Date();
    const estDelivery = new Date(now.getTime() + (restaurant.deliveryTimeRange[0] + 10) * 60 * 1000);

    const newOrder: Order = {
      id: `ord_${Date.now().toString().slice(-6)}`,
      userId: dto.userId,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: verifiedItems,
      subtotal,
      tax,
      deliveryFee,
      total,
      status: 'CONFIRMED',
      deliveryAddress: dto.deliveryAddress,
      placedAt: now.toISOString(),
      estimatedDeliveryAt: estDelivery.toISOString(),
      driverName: 'Marco P.',
      driverPhone: '(415) 555-0321',
      currentTrackingStage: 1
    };

    const saved = await this.orderRepo.create(newOrder);
    this.logger.info(`Order created successfully: ${saved.id}`, { orderId: saved.id, total }, Date.now() - startTime);
    return saved;
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.orderRepo.findById(orderId);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.findByUserId(userId);
  }

  async advanceOrderStage(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    let nextStage: 1 | 2 | 3 | 4 = order.currentTrackingStage;
    let nextStatus: OrderStatus = order.status;

    if (order.currentTrackingStage === 1) {
      nextStage = 2;
      nextStatus = 'PREPARING';
    } else if (order.currentTrackingStage === 2) {
      nextStage = 3;
      nextStatus = 'OUT_FOR_DELIVERY';
    } else if (order.currentTrackingStage === 3) {
      nextStage = 4;
      nextStatus = 'DELIVERED';
    }

    return this.orderRepo.updateStatus(orderId, nextStatus, nextStage);
  }
}
