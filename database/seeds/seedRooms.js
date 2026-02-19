import { query } from '../src/db.js';

export async function seedRooms() {
  console.log('Seeding rooms...');

  await query('DELETE FROM booking_rooms');
  await query('DELETE FROM rooms');

  const discoveryRooms = [
    ['DH2093A', 'Discovery Hall', 5, 1, 1, 1],
    ['DH2093B', 'Discovery Hall', 5, 1, 1, 1],
    ['DH3002A', 'Discovery Hall', 5, 1, 1, 1],
    ['DH3002B', 'Discovery Hall', 5, 1, 1, 1],
    ['DH3002C', 'Discovery Hall', 5, 1, 1, 1],
    ['DH3002D', 'Discovery Hall', 5, 1, 1, 1],
    ['DH3017A', 'Discovery Hall', 5, 1, 1, 1],
    ['DH3017B', 'Discovery Hall', 5, 1, 1, 1],
    ['DH3017C', 'Discovery Hall', 5, 1, 1, 1],
    ['DH3017D', 'Discovery Hall', 5, 1, 1, 1],
    ['DH3017E', 'Discovery Hall', 5, 1, 1, 1],
    ['VAL', 'Discovery Hall', 45, 1, 1, 1],
  ];

  const randalRooms = [
    ['RL1001C1', 'Randal Hall', 6, 0, 0, 1],
    ['RL1001C2', 'Randal Hall', 6, 0, 0, 1],
    ['RL1001C3', 'Randal Hall', 6, 0, 0, 1],
    ['RL1001C4', 'Randal Hall', 6, 0, 0, 1],
    ['RL1001C5', 'Randal Hall', 9, 0, 0, 1],
    ['RL1001C6', 'Randal Hall', 9, 0, 0, 1],
    ['RL1001C7', 'Randal Hall', 9, 0, 0, 1],
    ['RL1001C8', 'Randal Hall', 9, 0, 0, 1],
    ['RL1001S6', 'Randal Hall', 6, 0, 0, 1],
    ['RL1001S7', 'Randal Hall', 4, 0, 0, 1],
    ['RL2053', 'Randal Hall', 4, 0, 0, 1],
    ['RL2054', 'Randal Hall', 5, 0, 0, 1],
    ['RL2055', 'Randal Hall', 5, 0, 0, 1],
    ['RL2056', 'Randal Hall', 5, 0, 0, 1],
    ['RL2058', 'Randal Hall', 5, 0, 0, 1],
    ['RL2065', 'Randal Hall', 5, 0, 0, 1],
    ['RL2066', 'Randal Hall', 5, 0, 0, 1],
    ['RL2067', 'Randal Hall', 5, 0, 0, 1],
    ['RL2068', 'Randal Hall', 5, 0, 0, 1],
    ['RL2069', 'Randal Hall', 5, 0, 0, 1],
    ['RL2070', 'Randal Hall', 5, 0, 0, 1],
    ['RL2071', 'Randal Hall', 5, 0, 0, 1],
    ['RL2072', 'Randal Hall', 5, 0, 0, 1],
    ['RL2073', 'Randal Hall', 5, 0, 0, 1],
    ['RL2074', 'Randal Hall', 5, 0, 0, 1],
    ['RL2075', 'Randal Hall', 5, 0, 0, 1],
    ['RL2076', 'Randal Hall', 5, 0, 0, 1],
    ['RL2078', 'Randal Hall', 5, 0, 0, 1],
    ['RL2079', 'Randal Hall', 5, 0, 0, 1],
    ['RL2080', 'Randal Hall', 5, 0, 0, 1],
    ['RL2048A', 'Randal Hall', 5, 0, 0, 1],
    ['RL2048B', 'Randal Hall', 5, 0, 0, 1],
  ];

  const makerstudioRooms = [
    ['Audio Production A', 'Discovery Hall', 6, 0, 0, 1],
    ['Video Production A', 'Discovery Hall', 10, 0, 0, 1],
    ['Audio Production B', 'Discovery Hall', 4, 0, 0, 1],
    ['VR Station B', 'Discovery Hall', 1, 0, 0, 1],
  ];

  for (const r of [...discoveryRooms, ...randalRooms, ...makerstudioRooms]) {
    await query(
      `INSERT INTO rooms
       (room_code, building_name, room_capacity, has_whiteboard, has_monitor, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      r
    );
  }

  console.log('- Rooms seeded');
}

