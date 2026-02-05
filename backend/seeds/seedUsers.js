import { query } from '../src/db.js';

async function seedUsers() {
  try {
    // Optional: clear existing users first
    await query('DELETE FROM users');

    // Insert dummy users
    const users = [
      [850600017, 'Alice', 'Johnson', 'alice@example.com', 'student', 1],
      [850600010, 'Bob', 'Smith', 'bob@example.com', 'student', 1],
      [850600012, 'Carol', 'Davis', 'carol@example.com', 'faculty', 1],
      [850600025, 'Dave', 'Miller', 'dave@example.com', 'staff', 0]
    ];

    for (const user of users) {
      await query(
        'INSERT INTO users (uncw_id, first_name, last_name, email, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        user
      );
    }

    console.log('✅ Users table seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding users:', err);
    process.exit(1);
  }
}

// Run the seed
seedUsers();

