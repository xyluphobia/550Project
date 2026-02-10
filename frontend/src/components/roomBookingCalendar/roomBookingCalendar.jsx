import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import axios from 'axios';
import './roomBookingCalendar.css';

const RoomBookingCalendar = () => {
    const [events, setEvents] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingDetails, setBookingDetails] = useState({
        title: '',
        description: '',
        userName: '',
        userEmail: '',
    });

    const API_BASE_URL = 'http://localhost:5000/api'; // Update with your backend URL
    const BUILDINGS_API_URL = `${API_BASE_URL}/buildings`;
    const ROOMS_API_URL = `${API_BASE_URL}/rooms`;
    const BOOKINGS_API_URL = `${API_BASE_URL}/bookings`;

    const avaliableBuildings = [
        // Building data - capacity represents number of rooms in the building
        { id: 'bldg1', name: 'Discovery Hall', capacity: 12, color: '#ff5733' },
        { id: 'bldg2', name: 'Randall Hall', capacity: 32, color: '#33c1ff' },
        { id: 'bldg3', name: 'Makerstudio', capacity: 4, color: '#75ff33' },
    ]
    
    const roomData = [
        // Discovery Hall rooms (12 rooms total)
        { id: 'discovery-101', name: 'Room 101', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 20, floor: '1', color: '#ff5733' },
        { id: 'discovery-102', name: 'Room 102', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 15, floor: '1', color: '#ff5733' },
        { id: 'discovery-201', name: 'Room 201', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 25, floor: '2', color: '#ff5733' },
        { id: 'discovery-202', name: 'Room 202', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 30, floor: '2', color: '#ff5733' },
        { id: 'discovery-301', name: 'Conference Room', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 40, floor: '3', color: '#ff5733' },
        
        // Randall Hall rooms (32 rooms total)
        { id: 'randall-101', name: 'Classroom A', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 30, floor: '1', color: '#33c1ff' },
        { id: 'randall-102', name: 'Classroom B', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 25, floor: '1', color: '#33c1ff' },
        { id: 'randall-201', name: 'Lecture Hall', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 100, floor: '2', color: '#33c1ff' },
        { id: 'randall-202', name: 'Lab Room 1', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 20, floor: '2', color: '#33c1ff' },
        { id: 'randall-301', name: 'Meeting Room', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 15, floor: '3', color: '#33c1ff' },
        { id: 'randall-302', name: 'Study Room A', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 10, floor: '3', color: '#33c1ff' },
        
        // Makerstudio rooms (4 rooms total)
        { id: 'maker-101', name: 'Studio A', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 8, floor: '1', color: '#75ff33' },
        { id: 'maker-102', name: 'Studio B', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 6, floor: '1', color: '#75ff33' },
        { id: 'maker-201', name: 'Workshop', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 12, floor: '2', color: '#75ff33' },
        { id: 'maker-202', name: '3D Printing Lab', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 10, floor: '2', color: '#75ff33' },
    ];

    const bookings = [
        // Example bookings
        {
            title: 'Team Meeting',
            start: '2024-07-01T10:00:00',
            end: '2024-07-01T11:00:00',
            room: 'discovery-101',
            building: 'bldg1',
            color: '#ff5733'
        },
        {
            title: 'Project Discussion',
            start: '2024-07-02T14:00:00',
            end: '2024-07-02T15:30:00',
            room: 'randall-201',
            building: 'bldg2',
            color: '#33c1ff'
        }
    ];

    useEffect(() => {

        
        // Fetch rooms and bookings from API
    //     const fetchData = async () => {
    //         try {
    //             setLoading(true);
    //             setError(null);
                
    //             // Fetch buildings
    //             const buildingsResponse = await axios.get(BUILDINGS_API_URL);
    //             console.log('Buildings data:', buildingsResponse.data);
    //             setBuildings(buildingsResponse.data);
                
    //             // Fetch rooms
    //             const roomsResponse = await axios.get(ROOMS_API_URL);
    //             console.log('Rooms data:', roomsResponse.data);
    //             setRooms(roomsResponse.data);
                
    //             // Fetch bookings
    //             const bookingsResponse = await axios.get(BOOKINGS_API_URL);
    //             console.log('Bookings data:', bookingsResponse.data);
    //             setEvents(bookingsResponse.data.map(booking => ({
    //                 ...booking,
    //                 start: booking.startTime,
    //                 end: booking.endTime,
    //                 title: booking.eventName || booking.title,
    //                 color: booking.roomColor || '#3788d8'
    //             })));
                
    //             // Set initial filtered rooms (all rooms)
    //             setFilteredRooms(roomsResponse.data);
                
    //         } catch (err) {
    //             console.error('Error fetching data:', err);
    //             setError('Failed to load data from server. Please try again later.');
    //             // Fallback to sample data for development
    //             setBuildings([
    //                 { id: 'bldg1', name: 'Discovery Hall', capacity: 12, color: '#ff5733' },
    //                 { id: 'bldg2', name: 'Randall Hall', capacity: 32, color: '#33c1ff' },
    //                 { id: 'bldg3', name: 'Makerstudio', capacity: 4, color: '#75ff33' },
    //             ]);
    //             setRooms([
    //                 { id: 'discovery-101', name: 'Room 101', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 20, floor: '1', color: '#ff5733' },
    //                 { id: 'discovery-102', name: 'Room 102', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 15, floor: '1', color: '#ff5733' },
    //                 { id: 'randall-101', name: 'Classroom A', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 30, floor: '1', color: '#33c1ff' },
    //                 { id: 'randall-201', name: 'Lecture Hall', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 100, floor: '2', color: '#33c1ff' },
    //             ]);
    //             setFilteredRooms([
    //                 { id: 'discovery-101', name: 'Room 101', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 20, floor: '1', color: '#ff5733' },
    //                 { id: 'discovery-102', name: 'Room 102', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 15, floor: '1', color: '#ff5733' },
    //                 { id: 'randall-101', name: 'Classroom A', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 30, floor: '1', color: '#33c1ff' },
    //                 { id: 'randall-201', name: 'Lecture Hall', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 100, floor: '2', color: '#33c1ff' },
    //             ]);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchData();
    // }, []); // Empty dependency array means this runs once on component mount

    useEffect(() => {
        // Filter rooms when building is selected
        if (selectedBuilding) {
            // Filter rooms by buildingId
            const buildingRooms = rooms.filter(room => room.buildingId === selectedBuilding);
            setFilteredRooms(buildingRooms);
            // Reset selected room when building changes
            setSelectedRoom('');
        } else {
            setFilteredRooms(rooms);
        }
    }, [selectedBuilding, rooms]);

    const handleDateSelect = (selectInfo) => {
        if (!selectedRoom) {
            alert('Please select a room before booking.');
            selectInfo.calendar.unselect(); // Clear the selection
            return;
        }

        setSelectedSlot({
            start: selectInfo.start,
            end: selectInfo.end,
            room: selectedRoom,
            building: selectedBuilding
        });
        setShowBookingForm(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();

        if (!selectedRoom) {
            alert('Please select a room before booking.');
            return;
        }

        const roomInfo = rooms.find(r => r.id === selectedRoom);
        const buildingInfo = buildings.find(b => b.id === selectedBuilding);

        const newBooking = {
            title: bookingDetails.title,
            start: selectedSlot.start,
            end: selectedSlot.end,
            room: selectedRoom,
            building: selectedBuilding,
            buildingName: buildingInfo?.name || '',
            roomName: roomInfo?.name || '',
            description: bookingDetails.description,
            userName: bookingDetails.userName,
            userEmail: bookingDetails.userEmail,
            color: roomInfo?.color || '#3788d8'
        };

        try {
            // Post new booking to API
            setEvents([...events, newBooking]);
            setShowBookingForm(false);
            setBookingDetails({
                title: '',
                description: '',
                userName: '',
                userEmail: '',
            });
            alert('Booking created successfully!');
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking.');
        }
    };

    const handleEventClick = (clickInfo) => {
        if (window.confirm('Delete booking "' + clickInfo.event.title + '"?')) {
            clickInfo.event.remove();
            // Delete booking from API
            alert('Booking deleted successfully!');
        }
    };
    
    const renderEventContent = (eventInfo) => {
        const roomName = rooms.find(r => r.id === eventInfo.event.extendedProps.room)?.name || 'Unknown Room';
        const buildingName = buildings.find(b => b.id === eventInfo.event.extendedProps.building)?.name || '';
        
        return (
            <div className="event-content">
                <div><strong>{eventInfo.event.title}</strong></div>
                <div className="event-room">{roomName}</div>
                {buildingName && <div className="event-building">{buildingName}</div>}
            </div>
        );
    };

    // Calculate number of rooms for each building dynamically
    const getRoomsForBuilding = (buildingId) => {
        return rooms.filter(room => room.buildingId === buildingId);
    };

    return (
        <div className="room-booking-calendar">
            <h2>Room Booking Calendar</h2>

            <div className="building-selector">
                <h3>Select Building</h3>
                <div className="building-options">
                    <button
                        className={`building-btn ${!selectedBuilding ? 'selected' : ''}`}
                        onClick={() => setSelectedBuilding('')}
                    >
                        All Buildings
                    </button>
                    {buildings.map((building) => {
                        const buildingRooms = getRoomsForBuilding(building.id);
                        return (
                            <button
                                key={building.id}
                                className={`building-btn ${selectedBuilding === building.id ? 'selected' : ''}`}
                                onClick={() => setSelectedBuilding(building.id)}
                                style={{ borderLeft: `4px solid ${building.color}` }}
                            >
                                <div className="building-name">{building.name}</div>
                                <div className="building-details">
                                    {buildingRooms.length} rooms • Capacity: {building.capacity}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="room-selector">
                <h3>Select Room</h3>
                <div className='room-options'>
                    {filteredRooms.map((room) => {
                        const building = buildings.find(b => b.id === room.buildingId);
                        return (
                            <button
                                key={room.id}
                                className={`room-btn ${selectedRoom === room.id ? 'selected' : ''}`}
                                onClick={() => setSelectedRoom(room.id)}
                                style={{ backgroundColor: building?.color || room.color }}
                                title={`Building: ${room.buildingName}, Floor: ${room.floor}, Capacity: ${room.capacity} people`}
                            >
                                <div className="room-name">{room.name}</div>
                                <div className="room-details">
                                    <div>Floor {room.floor}</div>
                                    <div>{room.capacity} people</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
                {selectedBuilding && filteredRooms.length === 0 && (
                    <p className="no-rooms">No rooms available in this building.</p>
                )}
            </div>

            <div className='calendar-wrapper'>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView='timeGridWeek'
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                    }}
                    slotMinTime="08:00:00"
                    slotLabelInterval='01:00:00'
                    slotMaxTime="20:00:00"
                    businessHours={{
                        daysOfWeek: [1, 2, 3, 4, 5],
                        startTime: '08:00',
                        endTime: '20:00',
                    }}
                    selectable={true}
                    selectMirror={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    events={events}
                    eventContent={renderEventContent}
                    height="700px"
                    allDaySlot={false}
                    slotEventOverlap={false}
                    eventDisplay='block'
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }}
                />
            </div>

            {showBookingForm && (
                <div className="booking-form-overlay">
                    <div className="booking-form">
                        <h2>Book Room</h2>
                        {selectedRoom && (
                            <div className="booking-location">
                                <p>
                                    <strong>Location:</strong> 
                                    <span className="location-text">
                                        {rooms.find(r => r.id === selectedRoom)?.name} • 
                                        {buildings.find(b => b.id === selectedBuilding)?.name}
                                    </span>
                                </p>
                                <p><strong>Room Capacity:</strong> {rooms.find(r => r.id === selectedRoom)?.capacity} people</p>
                                <p><strong>Floor:</strong> {rooms.find(r => r.id === selectedRoom)?.floor}</p>
                            </div>
                        )}
                        <div className="booking-time">
                            <p>
                                <strong>Time:</strong> {selectedSlot?.start?.toLocaleString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) || ''} - {selectedSlot?.end?.toLocaleString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) || ''}
                            </p>
                            <p>
                                <strong>Date:</strong> {selectedSlot?.start?.toLocaleDateString() || ''}
                            </p>
                        </div>

                        <div className='booking-form-fields'>
                            <input 
                                type="text" 
                                placeholder='Meeting Title *'
                                value={bookingDetails.title}
                                onChange={(e) => setBookingDetails({...bookingDetails, title: e.target.value})}
                                required
                            />
                            <input 
                                type="text" 
                                placeholder='Your Name *'
                                value={bookingDetails.userName}
                                onChange={(e) => setBookingDetails({...bookingDetails, userName: e.target.value})}
                                required
                            />
                            <input 
                                type="email" 
                                placeholder='Your Email *'
                                value={bookingDetails.userEmail}
                                onChange={(e) => setBookingDetails({...bookingDetails, userEmail: e.target.value})}
                                required
                            />
                            <textarea 
                                placeholder='Meeting Description (Optional)'
                                value={bookingDetails.description}
                                onChange={(e) => setBookingDetails({...bookingDetails, description: e.target.value})}
                                rows="3"
                            />

                            <div className='form-buttons'>
                                <button type="button" onClick={() => setShowBookingForm(false)}>Cancel</button>
                                <button
                                    type="submit"
                                    onClick={handleBookingSubmit}
                                    disabled={!bookingDetails.title || !bookingDetails.userName || !bookingDetails.userEmail}
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className='legend'>
                <h3>Building & Room Legend</h3>
                {buildings.map((building) => {
                    const buildingRooms = getRoomsForBuilding(building.id);
                    return (
                        <div key={building.id} className='building-legend'>
                            <h4 style={{ color: building.color }}>
                                {building.name} ({buildingRooms.length} rooms)
                            </h4>
                            {buildingRooms.map((room) => (
                                <div key={room.id} className='legend-item'>
                                    <span className='color-box' style={{ backgroundColor: building.color }}></span>
                                    <span>
                                        <strong>{room.name}</strong> - Floor {room.floor}, Capacity: {room.capacity} people
                                    </span>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default RoomBookingCalendar;