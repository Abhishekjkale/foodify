/**
 * Order Repository - Data Access Layer
 * Transactional state transitions, status tracking, and order history queries.
 */

import { Order, OrderStatus } from '../models/types';
import { NotFoundError, ConflictError } from '../middleware/error.middleware';

export class OrderRepository {
  private orders: Map<string, Order> = new Map();

  constructor() {
    this.seedOrders();
  }

  private seedOrders() {
    const seed: Order[] = [
      {
        id: 'ord_9011',
        userId: 'usr_sarah_01',
        restaurantId: 'rest_01',
        restaurantName: 'Artisan Harvest Bowls',
        items: [
          {
            menuItemId: 'item_01_02',
            name: 'Citrus Miso Salmon Harvest Bowl',
            quantity: 1,
            unitPrice: 21.00,
            subtotal: 21.00,
            specialInstructions: 'Dressing on the side, extra edamame'
          },
          {
            menuItemId: 'item_01_04',
            name: 'Cold Pressed Golden Turmeric Elixir',
            quantity: 1,
            unitPrice: 6.50,
            subtotal: 6.50
          }
        ],
        subtotal: 27.50,
        tax: 2.34,
        deliveryFee: 2.99,
        total: 32.83,
        status: 'DELIVERED',
        deliveryAddress: {
          street: '450 Townsend St, Apt 4B',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94107'
        },
        placedAt: '2025-05-12T19:20:00.000Z',
        estimatedDeliveryAt: '2025-05-12T19:50:00.000Z',
        deliveredAt: '2025-05-12T19:48:12.000Z',
        driverName: 'Carlos M.',
        driverPhone: '(415) 555-0199',
        currentTrackingStage: 4
      },
      {
        id: 'ord_9012',
        userId: 'usr_marcus_02',
        restaurantId: 'rest_03',
        restaurantName: 'Verde Kitchen Plant Bar',
        items: [
          {
            menuItemId: 'item_03_01',
            name: 'Smoked Jackfruit Carnitas Bowl',
            quantity: 2,
            unitPrice: 15.75,
            subtotal: 31.50
          }
        ],
        subtotal: 31.50,
        tax: 2.68,
        deliveryFee: 1.99,
        total: 36.17,
        status: 'DELIVERED',
        deliveryAddress: {
          street: '1020 Valencia St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94110'
        },
        placedAt: '2025-05-13T12:15:00.000Z',
        estimatedDeliveryAt: '2025-05-13T12:40:00.000Z',
        deliveredAt: '2025-05-13T12:38:40.000Z',
        driverName: 'Jenna K.',
        driverPhone: '(415) 555-0245',
        currentTrackingStage: 4
      }
    ];

    seed.forEach(o => this.orders.set(o.id, o));
  }

  async create(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async findById(id: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new NotFoundError('Order', id);
    }
    return order;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  }

  async findAll(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  }

  async updateStatus(id: string, status: OrderStatus, stage: 1 | 2 | 3 | 4): Promise<Order> {
    const order = await this.findById(id);
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new ConflictError(`Cannot transition order ${id} from terminal state ${order.status}`);
    }
    order.status = status;
    order.currentTrackingStage = stage;
    if (status === 'DELIVERED') {
      order.deliveredAt = new Date().toISOString();
    }
    this.orders.set(id, order);
    return order;
  }
}
