import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'; // Add this
import interactionPlugin from '@fullcalendar/interaction';
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
    const [selectedDate, setSelectedDate] = useState(new Date()); // Add state for selected date
    const [bookingDetails, setBookingDetails] = useState({
        title: '',
        description: '',
        userName: '',
        userEmail: '',
    });

    const API_BASE_URL = 'http://localhost:5000/api';
    const BUILDINGS_API_URL = `${API_BASE_URL}/buildings`;
    const ROOMS_API_URL = `${API_BASE_URL}/rooms`;
    const BOOKINGS_API_URL = `${API_BASE_URL}/bookings`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const buildingsResponse = await axios.get(BUILDINGS_API_URL);
                console.log('Buildings data:', buildingsResponse.data);
                setBuildings(buildingsResponse.data);
                
                const roomsResponse = await axios.get(ROOMS_API_URL);
                console.log('Rooms data:', roomsResponse.data);
                setRooms(roomsResponse.data);
                
                const bookingsResponse = await axios.get(BOOKINGS_API_URL);
                console.log('Bookings data:', bookingsResponse.data);
                setEvents(bookingsResponse.data.map(booking => ({
                    ...booking,
                    resourceId: booking.roomId || booking.room, // Map room to resourceId
                    start: booking.startTime,
                    end: booking.endTime,
                    title: booking.eventName || booking.title,
                    color: booking.roomColor || '#3788d8'
                })));
                
                setFilteredRooms(roomsResponse.data);
                
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data from server. Please try again later.');
                // Fallback data
                setBuildings([
                    { id: 'bldg1', name: 'Discovery Hall', capacity: 12, color: '#ff5733' },
                    { id: 'bldg2', name: 'Randall Hall', capacity: 32, color: '#33c1ff' },
                    { id: 'bldg3', name: 'Makerstudio', capacity: 4, color: '#75ff33' },
                ]);
                setRooms([
                    { id: 'discovery-101', name: 'Room 101', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 20, floor: '1', color: '#ff5733' },
                    { id: 'discovery-102', name: 'Room 102', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 15, floor: '1', color: '#ff5733' },
                    { id: 'randall-101', name: 'Classroom A', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 30, floor: '1', color: '#33c1ff' },
                    { id: 'randall-201', name: 'Lecture Hall', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 100, floor: '2', color: '#33c1ff' },
                    { id: 'makerstudio-1', name: '3D Printing Area', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 4, floor: '1', color: '#75ff33' },
                    { id: 'makerstudio-2', name: 'Electronics Lab', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 6, floor: '1', color: '#75ff33' },
                ]);
                setFilteredRooms([
                    { id: 'discovery-101', name: 'Room 101', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 20, floor: '1', color: '#ff5733' },
                    { id: 'discovery-102', name: 'Room 102', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 15, floor: '1', color: '#ff5733' },
                    { id: 'randall-101', name: 'Classroom A', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 30, floor: '1', color: '#33c1ff' },
                    { id: 'randall-201', name: 'Lecture Hall', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 100, floor: '2', color: '#33c1ff' },
                    { id: 'makerstudio-1', name: '3D Printing Area', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 4, floor: '1', color: '#75ff33' },
                    { id: 'makerstudio-2', name: 'Electronics Lab', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 6, floor: '1', color: '#75ff33' },  
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (selectedBuilding) {
            const buildingRooms = rooms.filter(room => room.buildingId === selectedBuilding);
            setFilteredRooms(buildingRooms);
            setSelectedRoom('');
        } else {
            setFilteredRooms(rooms);
        }
    }, [selectedBuilding, rooms]);

    // Transform rooms into resources for FullCalendar
    const getResources = () => {
        return filteredRooms.map(room => ({
            id: room.id,
            title: `${room.name} - Floor ${room.floor} (${room.capacity}p)`,
            building: room.buildingName,
            eventColor: room.color,
            extendedProps: {
                capacity: room.capacity,
                floor: room.floor,
                buildingId: room.buildingId
            }
        }));
    };

    const handleDateSelect = (selectInfo) => {
        if (!selectedRoom) {
            alert('Please select a room before booking.');
            selectInfo.calendar.unselect();
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
            id: `booking-${Date.now()}`, // Add unique ID
            resourceId: selectedRoom, // Map to resourceId
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
            alert('Booking deleted successfully!');
        }
    };
    
    const renderEventContent = (eventInfo) => {
        return (
            <div className="event-content">
                <div><strong>{eventInfo.event.title}</strong></div>
                <div className="event-time">
                    {eventInfo.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {eventInfo.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {eventInfo.event.extendedProps.userName && (
                    <div className="event-user">Booked by: {eventInfo.event.extendedProps.userName}</div>
                )}
            </div>
        );
    };

    // Handle date change
    const handleDatesSet = (dateInfo) => {
        setSelectedDate(dateInfo.start);
    };

    const getRoomsForBuilding = (buildingId) => {
        return rooms.filter(room => room.buildingId === buildingId);
    };

    const renderCalHight = rooms.length > 0 ? 'auto' : rooms.length * 150; // Set height to auto if rooms exist, otherwise fixed height

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
                    plugins={[resourceTimelinePlugin, interactionPlugin]}
                    schedulerLicenseKey='GPL-My-Project-Is-Open-Source'
                    initialView='resourceTimelineDay'
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'resourceTimelineDay'
                    }}
                    resources={getResources()}
                    events={events}
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height={renderCalHight}
                    slotDuration="00:30:00" // 30 minute slots
                    slotLabelInterval="01:00:00" // Show hour labels
                    slotMinTime="06:00:00" // Start at 0 AM
                    slotMaxTime="26:00:00" // End at 12 PM
                    resourceAreaWidth="200px" // Width of room column
                    resourceLabelDidMount={(info) => {
                        // Add custom styling to resource headers
                        const building = buildings.find(b => 
                            b.id === info.resource.extendedProps.buildingId
                        );
                        if (building) {
                            info.el.style.borderLeft = `4px solid ${building.color}`;
                        }
                    }}
                    datesSet={handleDatesSet}
                    nowIndicator={true}
                    scrollTime="07:00:00" // Scroll to 8 AM on load
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