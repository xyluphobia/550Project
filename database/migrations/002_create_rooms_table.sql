CREATE TABLE rooms (
<<<<<<< HEAD
  room_id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(20) NOT NULL,
=======
  room_id INT PRIMARY KEY,
>>>>>>> frontend
  building_name VARCHAR(128) NOT NULL,
  room_capacity INT,
  has_whiteboard BIT,
  has_monitor BIT,
  is_active BIT NOT NULL
)
