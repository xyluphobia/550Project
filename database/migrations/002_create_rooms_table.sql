CREATE TABLE rooms (
  room_id INT PRIMARY KEY,
  building_name VARCHAR(128) NOT NULL,
  room_capacity INT,
  has_whiteboard BIT,
  has_monitor BIT,
  is_active BIT NOT NULL
)
