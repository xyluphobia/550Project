-- Equipment bookings are handled by the existing bookings table
-- This file is a placeholder to prevent errors
-- Equipment bookings use:
-- - bookings table (booking_type = 'equipment')
-- - booking_equipment junction table for equipment items
-- No separate equipment_bookings table needed
SELECT 'Equipment bookings use existing bookings + booking_equipment tables' as status;
