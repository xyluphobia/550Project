import { query } from '../src/db.js';

export async function seedRooms() {
  console.log('Seeding rooms...');

  await query('DELETE FROM booking_rooms');
  await query('DELETE FROM rooms');

  const rooms = [
    [101, 'Dobo Hall', 12, 1, 1, 1],
    [102, 'Dobo Hall', 30, 1, 1, 1],
    [201, 'Watson College', 20, 1, 0, 1],
    [301, 'Congdon Hall', 8, 0, 0, 1],
  ];

  for (const r of rooms) {
    await query(
      `INSERT INTO rooms
       (room_id, building_name, room_capacity, has_whiteboard, has_monitor, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      r
    );
  }

  console.log('- Rooms seeded');
}

