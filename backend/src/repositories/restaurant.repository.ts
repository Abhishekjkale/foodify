/**
 * Restaurant Repository - Data Access Layer
 * Supports relational querying, category filtering, and delivery zone validation.
 */

import { Restaurant, MenuItem } from '../models/types';
import { NotFoundError } from '../middleware/error.middleware';

export class RestaurantRepository {
  private restaurants: Map<string, Restaurant> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const seed: Restaurant[] = [
      {
        id: 'rest_01',
        name: 'Artisan Harvest Bowls',
        cuisine: ['Healthy', 'Salads', 'Grain Bowls', 'Organic'],
        rating: 4.8,
        reviewCount: 342,
        deliveryFee: 2.99,
        deliveryTimeRange: [20, 35],
        servicedZipCodes: ['94102', '94103', '94107', '94110', '94114', '94105'],
        address: '580 Mission St, San Francisco, CA 94105',
        isOpen: true,
        bannerImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        menu: [
          {
            id: 'item_01_01',
            restaurantId: 'rest_01',
            name: 'Truffle Quinoa & Avocado Power Bowl',
            description: 'Organic tri-color quinoa, cold-pressed white truffle vinaigrette, Hass avocado, heirloom tomatoes, roasted pumpkin seeds, and wild baby arugula.',
            price: 16.50,
            category: 'Bowls',
            dietaryTags: ['vegan', 'gluten-free', 'high-protein', 'nut-free'],
            allergens: [],
            calories: 540,
            proteinGrams: 19,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 12
          },
          {
            id: 'item_01_02',
            restaurantId: 'rest_01',
            name: 'Citrus Miso Salmon Harvest Bowl',
            description: 'Wild Alaskan grilled salmon filet, citrus miso glaze, forbidden black rice, edamame, shaved daikon, and pickled ginger with toasted sesame.',
            price: 21.00,
            category: 'Bowls',
            dietaryTags: ['gluten-free', 'high-protein', 'dairy-free'],
            allergens: ['fish', 'soy', 'sesame'],
            calories: 680,
            proteinGrams: 42,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 15
          },
          {
            id: 'item_01_03',
            restaurantId: 'rest_01',
            name: 'Crispy Tempeh Superfood Salad',
            description: 'Organic maple-smoked tempeh, massaged dinosaur kale, shredded purple cabbage, hemp hearts, and green goddess avocado-tahini dressing.',
            price: 15.25,
            category: 'Bowls',
            dietaryTags: ['vegan', 'gluten-free', 'dairy-free', 'high-protein'],
            allergens: ['soy', 'sesame'],
            calories: 490,
            proteinGrams: 24,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 10
          },
          {
            id: 'item_01_04',
            restaurantId: 'rest_01',
            name: 'Cold Pressed Golden Turmeric Elixir',
            description: 'Fresh pressed turmeric root, Meyer lemon, organic ginger, cracked black pepper, and raw local wildflower honey.',
            price: 6.50,
            category: 'Beverages',
            dietaryTags: ['vegetarian', 'gluten-free', 'dairy-free'],
            allergens: [],
            calories: 95,
            proteinGrams: 1,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 3
          }
        ]
      },
      {
        id: 'rest_02',
        name: 'Tokyo Craft Ramen & Yakitori',
        cuisine: ['Japanese', 'Ramen', 'Robata', 'Asian'],
        rating: 4.9,
        reviewCount: 890,
        deliveryFee: 3.49,
        deliveryTimeRange: [30, 45],
        servicedZipCodes: ['94102', '94103', '94107', '94110', '94108', '94109'],
        address: '240 Sutter St, San Francisco, CA 94108',
        isOpen: true,
        bannerImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
        menu: [
          {
            id: 'item_02_01',
            restaurantId: 'rest_02',
            name: 'Rich 24-Hour Tonkotsu Deluxe Ramen',
            description: 'Simmered Berkshire pork bone broth, hand-pulled springy noodles, slow-braised chashu pork belly, ajitsuke tamago egg, menma bamboo shoots, and black garlic oil.',
            price: 19.50,
            category: 'Entrees',
            dietaryTags: ['high-protein'],
            allergens: ['wheat', 'soy', 'egg', 'pork'],
            calories: 890,
            proteinGrams: 38,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 18
          },
          {
            id: 'item_02_02',
            restaurantId: 'rest_02',
            name: 'Creamy Sesame Spicy Vegan Ramen',
            description: 'Rich roasted oat and sesame broth, spicy chili oil, glazed king oyster mushrooms, pak choi, sweet corn, scallions, and gluten-free konjac noodles available upon request.',
            price: 18.00,
            category: 'Entrees',
            dietaryTags: ['vegan', 'vegetarian', 'dairy-free'],
            allergens: ['soy', 'sesame'],
            calories: 610,
            proteinGrams: 18,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 14
          },
          {
            id: 'item_02_03',
            restaurantId: 'rest_02',
            name: 'Charcoal Grilled Chicken Yakitori Skewers',
            description: 'Free-range chicken thigh with sweet scallion skewers, basted in house-aged tare glaze over Binchotan bincho charcoal.',
            price: 12.00,
            category: 'Sides',
            dietaryTags: ['high-protein', 'dairy-free'],
            allergens: ['soy'],
            calories: 360,
            proteinGrams: 31,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 12
          }
        ]
      },
      {
        id: 'rest_03',
        name: 'Verde Kitchen Plant Bar',
        cuisine: ['100% Plant-Based', 'Bowls', 'Gluten-Free', 'Healthy'],
        rating: 4.7,
        reviewCount: 275,
        deliveryFee: 1.99,
        deliveryTimeRange: [15, 30],
        servicedZipCodes: ['94102', '94103', '94107', '94110', '94114', '94117'],
        address: '890 Valencia St, San Francisco, CA 94110',
        isOpen: true,
        bannerImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80',
        menu: [
          {
            id: 'item_03_01',
            restaurantId: 'rest_03',
            name: 'Smoked Jackfruit Carnitas Bowl',
            description: 'Slow-braised spiced green jackfruit, organic black beans, charred street corn, pico de gallo, cilantro-lime cauli-rice, and chipotle crema.',
            price: 15.75,
            category: 'Bowls',
            dietaryTags: ['vegan', 'gluten-free', 'low-carb', 'dairy-free'],
            allergens: [],
            calories: 420,
            proteinGrams: 16,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 12
          },
          {
            id: 'item_03_02',
            restaurantId: 'rest_03',
            name: 'Keto Cauliflower Falafel Wrap',
            description: 'Almond-flour wrap packed with golden herb-baked cauliflower falafels, cucumber ribbons, pickled pink turnips, and lemon garlic coconut-yogurt tzatziki.',
            price: 14.50,
            category: 'Entrees',
            dietaryTags: ['vegan', 'keto', 'gluten-free', 'low-carb', 'dairy-free'],
            allergens: ['nuts'],
            calories: 390,
            proteinGrams: 15,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 10
          }
        ]
      },
      {
        id: 'rest_04',
        name: 'Napoli Antica Wood-Fired Pizza',
        cuisine: ['Italian', 'Artisan Pizza', 'Pasta', 'Mediterranean'],
        rating: 4.8,
        reviewCount: 520,
        deliveryFee: 3.99,
        deliveryTimeRange: [25, 40],
        servicedZipCodes: ['94102', '94103', '94107', '94108', '94109', '94110'],
        address: '152 Columbus Ave, San Francisco, CA 94133',
        isOpen: true,
        bannerImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
        menu: [
          {
            id: 'item_04_01',
            restaurantId: 'rest_04',
            name: 'D.O.P. Margherita Verace',
            description: 'San Marzano tomatoes, buffalo mozzarella from Campania, fresh sweet basil, extra virgin olive oil on 72-hour cold-fermented leopard dough.',
            price: 18.00,
            category: 'Entrees',
            dietaryTags: ['vegetarian'],
            allergens: ['wheat', 'dairy'],
            calories: 790,
            proteinGrams: 28,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 14
          },
          {
            id: 'item_04_02',
            restaurantId: 'rest_04',
            name: 'Gluten-Free Wild Forest Mushroom Pizza',
            description: 'Crisp cauliflower & cassava crust, roasted chanterelles and cremini, vegan cashew truffle ricotta, and thyme sprigs.',
            price: 21.50,
            category: 'Entrees',
            dietaryTags: ['vegan', 'gluten-free', 'dairy-free'],
            allergens: ['nuts'],
            calories: 590,
            proteinGrams: 17,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
            prepTimeMinutes: 16
          }
        ]
      }
    ];

    seed.forEach(r => this.restaurants.set(r.id, r));
  }

  async findAll(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }

  async findById(id: string): Promise<Restaurant> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) {
      throw new NotFoundError('Restaurant', id);
    }
    return restaurant;
  }

  async findByZipCode(zipCode: string): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).filter(r => 
      r.servicedZipCodes.includes(zipCode)
    );
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    const items: MenuItem[] = [];
    for (const r of this.restaurants.values()) {
      items.push(...r.menu);
    }
    return items;
  }

  async findMenuItem(menuItemId: string): Promise<{ restaurant: Restaurant; item: MenuItem }> {
    for (const restaurant of this.restaurants.values()) {
      const item = restaurant.menu.find(m => m.id === menuItemId);
      if (item) {
        return { restaurant, item };
      }
    }
    throw new NotFoundError('MenuItem', menuItemId);
  }
}
