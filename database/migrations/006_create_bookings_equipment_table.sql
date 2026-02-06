CREATE TABLE booking_equipment (
  booking_equipment_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  equipment_id INT NOT NULL,
  quantity_requested INT NOT NULL,

  CONSTRAINT fk_booking_equipment_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_booking_equipment_equipment
    FOREIGN KEY (equipment_id)
    REFERENCES equipment(equipment_id)
) ENGINE=InnoDB;

