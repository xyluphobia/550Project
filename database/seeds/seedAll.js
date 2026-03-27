import { seedUsers } from './seedUsers.js';
import { seedRooms } from './seedRooms.js';
import { seedEquipment } from './seedEquipment.js';
import { seedBookings } from './seedBookings.js';

async function seedAll() {
  try {
    await seedUsers();
    await seedRooms();
    await seedEquipment();
    await seedBookings();

    console.log('~~ALL TABLES SEEDED SUCCESSFULLY~~');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedAll();

