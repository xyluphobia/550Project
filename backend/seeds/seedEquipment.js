import { query } from '../src/db.js';

export async function seedEquipment() {
  console.log('Seeding equipment...');

  await query('DELETE FROM booking_equipment');
  await query('DELETE FROM equipment');

  const equipment = [
    ['Projector', 'AV', 'HD Projector', 5, 5, 1],
    ['Laptop', 'Computing', 'Windows laptops', 10, 10, 1],
    ['Camera', 'Media', 'DSLR Camera', 3, 3, 1],
    ['Microphone', 'Audio', 'USB Microphone', 6, 6, 1],
  ];

  for (const e of equipment) {
    await query(
      `INSERT INTO equipment
       (equipment_name, equipment_category, equipment_description, 
        total_quantity, available_quantity, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      e
    );
  }

  console.log('- Equipment seeded');
}

