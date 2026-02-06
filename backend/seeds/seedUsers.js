import { query } from '../src/db.js';

export async function seedUsers() {
  console.log('Seeding users...');

  await query('DELETE FROM users');

  const users = [
    [850600010, 'Bob', 'Smith', 'bob@example.com', 'student', 1],
    [850600017, 'Alice', 'Johnson', 'alice@example.com', 'student', 1],
    [850600012, 'Carol', 'Davis', 'carol@example.com', 'faculty', 1],
    [850600025, 'Dave', 'Miller', 'dave@example.com', 'staff', 0]
  ];

  for (const u of users) {
    await query(
      `INSERT INTO users 
       (uncw_id, first_name, last_name, email, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      u
    );
  }

  console.log('- Users seeded');
}

