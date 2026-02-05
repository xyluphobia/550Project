CREATE TABLE equipment (
  equipment_id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_name VARCHAR(128),
  equipment_category VARCHAR(64),
  equipment_description VARCHAR(500),
  total_quantity INT,
  available_quantity INT,
  is_active BIT NOT NULL,
)
