#!/bin/bash

DB_NAME=550project

echo "Resetting database $DB_NAME..."

# Drop + recreate database
mariadb <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
EOF

echo "Database reset."

echo "Running migrations..."

mariadb $DB_NAME < database/migrations/001_create_users_table.sql
mariadb $DB_NAME < database/migrations/002_create_rooms_table.sql
mariadb $DB_NAME < database/migrations/003_create_equipment_table.sql
mariadb $DB_NAME < database/migrations/004_create_bookings_table.sql
mariadb $DB_NAME < database/migrations/005_create_bookings_rooms_table.sql
mariadb $DB_NAME < database/migrations/006_create_bookings_equipment_table.sql

echo "✅ Migrations complete!"

