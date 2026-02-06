import { query } from '../src/db.js';

export async function seedBookings() {
  console.log('Seeding bookings...');

  // Clear dependent tables first
  await query('DELETE FROM booking_equipment');
  await query('DELETE FROM booking_rooms');
  await query('DELETE FROM bookings');

  // Insert bookings
  const bookings = [
    [850600010, 'room', '2026-02-10 10:00:00', '2026-02-10 12:00:00', '2026-02-06 09:00:00', 'Study group', 4, 1],
    [850600017, 'equipment', '2026-02-11 14:00:00', '2026-02-11 16:00:00', '2026-02-06 09:10:00', 'Project filming', 2, 0],
  ];

  const bookingIds = [];

  for (const b of bookings) {
    const result = await query(
      `INSERT INTO bookings
       (uncw_id, booking_type, start_time, end_time, created_at, notes, group_size, is_joinable)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      b
    );

    bookingIds.push(result.insertId);
  }

  // booking_rooms
  await query(
    `INSERT INTO booking_rooms (booking_id, room_id)
     VALUES (?, ?)`,
    [bookingIds[0], 101]
  );

  // booking_equipment
  await query(
    `INSERT INTO booking_equipment (booking_id, equipment_id, quantity_requested)
     VALUES (?, ?, ?)`,
    [bookingIds[1], 1, 2]
  );

  console.log('- Bookings + joins seeded');
}

