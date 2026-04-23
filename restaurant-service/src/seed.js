require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');

const sampleRestaurants = [
  {
    name: 'Spice Garden',
    description: 'Authentic Sri Lankan and Indian cuisine',
    category: 'Asian',
    address: '12 Lake Road, Colombo',
    rating: 4.6,
    ownerId: 'seed-owner-1'
  },
  {
    name: 'Pasta Point',
    description: 'Fresh handmade Italian pasta',
    category: 'Italian',
    address: '5 Galle Road, Colombo',
    rating: 4.4,
    ownerId: 'seed-owner-2'
  }
];

async function runSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});

    const created = await Restaurant.insertMany(sampleRestaurants);

    await MenuItem.insertMany([
      {
        restaurantId: created[0]._id,
        name: 'Chicken Kottu',
        description: 'Chopped roti with chicken and vegetables',
        category: 'Main',
        price: 8.99
      },
      {
        restaurantId: created[0]._id,
        name: 'Paneer Curry',
        description: 'Cottage cheese curry with spices',
        category: 'Main',
        price: 7.49
      },
      {
        restaurantId: created[1]._id,
        name: 'Chicken Alfredo',
        description: 'Creamy Alfredo pasta with grilled chicken',
        category: 'Main',
        price: 11.99
      },
      {
        restaurantId: created[1]._id,
        name: 'Tiramisu',
        description: 'Classic coffee-flavored Italian dessert',
        category: 'Dessert',
        price: 5.5
      }
    ]);

    console.log('Restaurant and menu data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
}

runSeed();
