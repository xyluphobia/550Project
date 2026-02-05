# API Contract - UNCW Booking System
**Version:** Draft v1.0
**Last Updated:** Feb 4, 2026

**Base URL:** `/api`

## Users
**GET /api/users/me**
Returns the currently authenticated user.

Response:
```
{
  "user_id": 850621017,
  "first_name": "Matthew",
  "last_name": "Scavone",
  "email": "ms3164@uncw.edu",
  "role": "student"
}
``` 

**GET /api/users**
Returns a list of all users. This is restricted to administrators only.

## Rooms
**GET /api/rooms**
Returns a list of rooms with optional filters.
Query Paramters (Optional):
 - building_name
 - room_capacity
 - has_whiteboard
 - has_monitor

Example Usage:
`GET /api/rooms?building_name=Randall&room_capacity=4&has_whiteboard=1&has_monitor=1`

Response:
```
[
  {
    "room_id": 30171,
    "building_name": "Randall Library",
    "room_capacity": 6,
    "has_projector": 1,
    "has_whiteboard": 1
  }
]

```

**GET /api/rooms/{roomId}/availability**
Checks if a room is available for a given time period.
Query Paramters:
 - start_time
 - end_time

Response:
```
{
  "room_id": 30171,
  "is_available": 1
}
```

## Equipment
**GET /api/equipment**
Returns a list of all available equipment.

Response:
```
[
  {
    "equipment_id": 5,
    "equipment_name": "Canon DSLR Camera",
    "equipment_category": "camera",
    "available_quantity": 3
  }
]
```

**GET /api/equipment/{equipment_id}/availability**
Returns available quantity for a piece of equipment during a given time period.
Query Patameters:
 - start_time
 - end_time

Response:
```
{
  "equipment_id": 5,
  "available_quantity": 2
}
```

## Bookings
**POST /api/bookings**
Creates a new booking request.

Room Booking Request:
```
{
  "booking_type": "room",
  "resource_id": 10,
  "start_time": "2026-03-01T10:00",
  "end_time": "2026-03-01T12:00"
}
```

Equipment Booking Request:
```
{
  "booking_type": "equipment",
  "items": [
    { "equipment_id": 5, "quantity": 2 },
    { "equipment_id": 8, "quantity": 1 }
  ],
  "start_time": "2026-03-01T10:00",
  "end_time": "2026-03-01T12:00"
}
```

Response:
```
{
  "booking_id": 9001,
  "status": "pending",
  "message": "Booking submitted successfully"
}
```

**GET /api/bookings/me**
Returns all bookings for the current user.

**POST /api/bookings/{booking_id}/cancel**
Cancels an existing booking with the given ID.
