import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import {EmailJSConfigBooking} from '../EmailJS/emailJSConfiguration';
import axios from 'axios';
import './roomBookingCalendar.css';

// Constants
const API_BASE_URL = '/api';
const ROOMS_API_URL = `${API_BASE_URL}/rooms`;
const BOOKINGS_API_URL = `${API_BASE_URL}/bookings`;

const CALENDAR_CONFIG = {
    START_HOUR: 6,
    END_HOUR: 26,
    SLOT_DURATION: 30,
    COLORS: {
        AVAILABLE: '#4AE0BA',
        BOOKED: '#D4FFFD',
        YOUR_BOOKING: '#c26efe',
        UNAVAILABLE: '#d3d3d3',
        DEFAULT_EVENT: '#3788d8'
    }
};

const FALLBACK_BUILDINGS = [
    { id: 'bldg1', name: 'Discovery Hall', color: '#ff6b6b' },
    { id: 'bldg2', name: 'Randall Hall', color: '#4AE0BA' },
    { id: 'bldg3', name: 'Makerstudio', color: '#c26efe' },
];

const FALLBACK_ROOMS = [
    { id: 'discovery-101', name: 'Room 101', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 20, floor: '1' },
    { id: 'discovery-102', name: 'Room 102', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 15, floor: '1' },
    { id: 'randall-101', name: 'Classroom A', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 30, floor: '1' },
    { id: 'randall-201', name: 'Lecture Hall', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 100, floor: '2' },
    { id: 'makerstudio-1', name: '3D Printing Area', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 4, floor: '1' },
    { id: 'makerstudio-2', name: 'Electronics Lab', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 6, floor: '1' },
];

const RoomBookingCalendar = () => {
    // State
    const [events, setEvents] = useState([]);
    const [buildings, setBuildings] = useState(FALLBACK_BUILDINGS);
    const [rooms, setRooms] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [calendarSlots, setCalendarSlots] = useState([]);
    const [timeSlotsAdded, setTimeSlotsAdded] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookingDetails, setBookingDetails] = useState({
        title: '',
        description: '',
        userName: '',
        uncw_id: '',
        userEmail: '',
    });

    // Computed values
    const renderCalHeight = rooms.length > 0 ? 'auto' : rooms.length * 150;
    const currentHour = new Date().getHours() - 1;

    // Helper functions
    const formatTime = (date) => {
        return date?.toLocaleString([], { hour: '2-digit', minute: '2-digit' }) || '';
    };

    const formatDate = (date) => {
        return date?.toLocaleDateString() || '';
    };

    const getRoomById = useCallback((roomId) => {
        return rooms.find(r => r.id === roomId);
    }, [rooms]);

    const getBuildingById = useCallback((buildingId) => {
        return buildings.find(b => b.id === buildingId);
    }, [buildings]);

    const getRoomsForBuilding = useCallback((buildingId) => {
        return rooms.filter(room => room.buildingId === buildingId);
    }, [rooms]);

    // Generate time slots
    const generateTimeSlots = useCallback(() => {
        if (!filteredRooms.length || !selectedDate) return [];

        const slots = [];
        const currentDate = new Date(selectedDate);
        currentDate.setHours(0, 0, 0, 0);

        filteredRooms.forEach(room => {
            for (let hour = CALENDAR_CONFIG.START_HOUR; hour < CALENDAR_CONFIG.END_HOUR; hour++) {
                for (let minute = 0; minute < 60; minute += CALENDAR_CONFIG.SLOT_DURATION) {
                    const startTime = new Date(currentDate);
                    startTime.setHours(hour, minute, 0, 0);
                    const endTime = new Date(startTime);
                    endTime.setMinutes(endTime.getMinutes() + CALENDAR_CONFIG.SLOT_DURATION);

                    const isBooked = events.some(booking =>
                        booking.resourceId === room.id &&
                        new Date(booking.start) < endTime &&
                        new Date(booking.end) > startTime
                    );

                    slots.push({
                        id: `slot-${room.id}-${hour}-${minute}-${Date.now()}-${Math.random()}`,
                        resourceId: room.id,
                        start: startTime,
                        end: endTime,
                        display: 'background',
                        color: isBooked ? CALENDAR_CONFIG.COLORS.BOOKED : CALENDAR_CONFIG.COLORS.AVAILABLE,
                        classNames: isBooked ? ['booked-slot'] : ['available-slot'],
                        extendedProps: { isBooked, isAvailable: !isBooked }
                    });
                }
            }
        });

        return slots;
    }, [filteredRooms, selectedDate, events]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [roomsResponse, bookingsResponse] = await Promise.all([
                    axios.get(ROOMS_API_URL),
                    axios.get(BOOKINGS_API_URL)
                ]);

                // Transform API rooms to component format
                const apiRooms = roomsResponse.data;
                const uniqueBuildings = [...new Set(apiRooms.map(room => room.building_name))];
                const transformedBuildings = uniqueBuildings.map((buildingName, index) => ({
                    id: `bldg${index + 1}`,
                    name: buildingName,
                    color: FALLBACK_BUILDINGS[index % FALLBACK_BUILDINGS.length]?.color || CALENDAR_CONFIG.COLORS.DEFAULT_EVENT
                }));

                const transformedRooms = apiRooms.map(room => {
                    const building = transformedBuildings.find(b => b.name === room.building_name);
                    return {
                        id: room.room_id.toString(),
                        name: room.room_code,
                        buildingId: building?.id || '',
                        buildingName: room.building_name,
                        capacity: room.room_capacity,
                        floor: '' // Not available in DB currently
                    };
                });

                setBuildings(transformedBuildings);
                setRooms(transformedRooms);
                setFilteredRooms(transformedRooms);
                
                setEvents(bookingsResponse.data.map(booking => ({
                    ...booking,
                    resourceId: booking.room_id,
                    start: booking.start_time,
                    end: booking.end_time,
                    title: booking.notes || 'Booked',
                    color: CALENDAR_CONFIG.COLORS.BOOKED
                })));
                
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data from server. Using fallback data.');
                setRooms(FALLBACK_ROOMS);
                setFilteredRooms(FALLBACK_ROOMS);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter rooms by building
    useEffect(() => {
        setFilteredRooms(
            selectedBuilding 
                ? rooms.filter(room => room.buildingId === selectedBuilding)
                : rooms
        );
    }, [selectedBuilding, rooms]);

    // Update calendar slots
    useEffect(() => {
        setCalendarSlots(generateTimeSlots());
    }, [generateTimeSlots]);

    // Transform rooms into resources for FullCalendar
    const resources = useMemo(() => {
        return filteredRooms.map(room => {
            const building = getBuildingById(room.buildingId);
            return {
                id: room.id,
                title: `${room.name}: Capacity ${room.capacity}`,
                building: room.buildingName,
                extendedProps: {
                    capacity: room.capacity,
                    floor: room.floor,
                    buildingId: room.buildingId,
                    color: building?.color || CALENDAR_CONFIG.COLORS.DEFAULT_EVENT
                }
            };
        });
    }, [filteredRooms, getBuildingById]);

    // Event handlers
    const handleDateSelect = (selectInfo) => {
        const resourceId = selectInfo.resource?.id;
        if (resourceId) {
            const selectedRoomInfo = getRoomById(resourceId);
            if (selectedRoomInfo) {
                setSelectedRoom(selectedRoomInfo.id);
                setSelectedBuilding(selectedRoomInfo.buildingId);
            }
        }

        setSelectedSlot({
            start: selectInfo.start,
            end: selectInfo.end,
            room: resourceId,
        });
        setTimeSlotsAdded(0);
        setShowBookingForm(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();

        if (!selectedRoom) {
            alert('Please select a room for booking.');
            return;
        }

        const roomInfo = getRoomById(selectedRoom);
        const buildingInfo = getBuildingById(selectedBuilding);

        // Format dates for MySQL (YYYY-MM-DD HH:MM:SS)
        const formatDateTime = (date) => {
            return date.toISOString().slice(0, 19).replace('T', ' ');
        };

        try {
            // First, ensure the user exists
            const userData = {
                uncw_id: parseInt(bookingDetails.uncw_id),
                first_name: bookingDetails.userName.split(' ')[0] || '',
                last_name: bookingDetails.userName.split(' ').slice(1).join(' ') || '',
                email: bookingDetails.userEmail,
                role: 'student',
                is_active: 1
            };

            try {
                // Try to create the user (will fail if already exists due to unique constraints)
                await axios.post(`${API_BASE_URL}/users`, userData);
            } catch (userError) {
                // User might already exist, that's okay
                console.log('User may already exist:', userError.response?.data?.error);
            }

            // Now create the booking
            const bookingData = {
                uncw_id: parseInt(bookingDetails.uncw_id),
                booking_type: 'room',
                start_time: formatDateTime(selectedSlot.start),
                end_time: formatDateTime(selectedSlot.end),
                notes: `${bookingDetails.title}: ${bookingDetails.description}`,
                room_id: parseInt(selectedRoom),
                group_size: roomInfo?.capacity || null,
                is_joinable: false
            };

            const response = await axios.post(BOOKINGS_API_URL, bookingData);
            
            // Add the new booking to events
            const newBooking = {
                id: `booking-${response.data.booking_id}`,
                resourceId: selectedRoom,
                title: bookingDetails.title,
                start: selectedSlot.start,
                end: selectedSlot.end,
                room: selectedRoom,
                building: selectedBuilding,
                buildingName: buildingInfo?.name || '',
                roomName: roomInfo?.name || '',
                description: bookingDetails.description,
                userName: bookingDetails.userName,
                uncw_id: bookingDetails.uncw_id,
                color: roomInfo?.color || CALENDAR_CONFIG.COLORS.DEFAULT_EVENT
            };

            setEvents([...events, newBooking]);
            setShowBookingForm(false);
            setBookingDetails({
                title: '',
                description: '',
                userName: '',
                uncw_id: '',
                userEmail: '',
            });
            EmailJSConfigBooking({ events: [...events, newBooking], rooms, buildings, loading: false, error: null });
            alert('Booking created successfully!');
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDatesSet = (dateInfo) => {
        setSelectedDate(dateInfo.start);
    };

    const handleEventClick = (info) => {
        if (info.event.extendedProps.isBooked) {
            alert(`This slot is already booked. Please select another slot.`);
            return false;
        }
    };

    const handleSelectAllow = (selectInfo) => {
        const hasOverlap = events.some(booking =>
            booking.resourceId === selectInfo.resource?.id &&
            new Date(booking.start) < selectInfo.end &&
            new Date(booking.end) > selectInfo.start
        );
        return !hasOverlap;
    };

    const handleResourceLabelMount = (info) => {
        const building = getBuildingById(info.resource.extendedProps.buildingId);
        if (building) {
            info.el.style.borderLeft = `4px solid ${building.color}`;
        }
    };

    // Time adjustment function
    const adjustTime = (increment) => {
        if (!selectedSlot) return;

        const slotsToAdd = Math.abs(increment);
        const direction = increment > 0 ? 1 : -1;
        
        if (direction < 0 && timeSlotsAdded <= 0) return;

        const newEndTime = new Date(selectedSlot.end);
        newEndTime.setMinutes(newEndTime.getMinutes() + (30 * increment));

        // Check time bounds
        const totalHours = newEndTime.getHours() + (newEndTime.getMinutes() / 60);
        if (totalHours > CALENDAR_CONFIG.END_HOUR) {
            alert('Cannot extend beyond 2:00 AM');
            return;
        }

        // Check for conflicts when adding time
        if (direction > 0) {
            for (let i = 1; i <= slotsToAdd; i++) {
                const segmentStart = new Date(selectedSlot.end);
                segmentStart.setMinutes(segmentStart.getMinutes() + ((i - 1) * 30));
                const segmentEnd = new Date(selectedSlot.end);
                segmentEnd.setMinutes(segmentEnd.getMinutes() + (i * 30));

                const hasConflict = events.some(booking => 
                    booking.resourceId === selectedSlot.room &&
                    new Date(booking.start) < segmentEnd &&
                    new Date(booking.end) > segmentStart
                );

                if (hasConflict) {
                    alert(`Cannot extend. The slot starting at ${formatTime(segmentStart)} is already booked.`);
                    return;
                }
            }
        }

        setTimeSlotsAdded(timeSlotsAdded + increment);
        setSelectedSlot({ ...selectedSlot, end: newEndTime });
    };

    // Render methods
    const renderBuildingSelector = () => (
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
                                {buildingRooms.length} rooms
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderBookingForm = () => {
        if (!showBookingForm || !selectedRoom) return null;

        const roomInfo = getRoomById(selectedRoom);
        const buildingInfo = getBuildingById(selectedBuilding);

        return (
            <div className="booking-form-overlay">
                <div className="booking-form">
                    <h2>Book Room</h2>
                    
                    <div className="booking-location">
                        <p>
                            <strong>Location:</strong> 
                            <span className="location-text">
                                {roomInfo?.name} • {buildingInfo?.name}
                            </span>
                        </p>
                        <p><strong>Room Capacity:</strong> {roomInfo?.capacity} people</p>
                        <p><strong>Floor:</strong> {roomInfo?.floor}</p>
                    </div>

                    <div className="booking-time">
                        <p>
                            <strong>Time:</strong> {formatTime(selectedSlot?.start)} - {formatTime(selectedSlot?.end)}
                        </p>
                        <div className="time-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                            <button 
                                type="button" 
                                onClick={() => adjustTime(-1)}
                                disabled={timeSlotsAdded <= 0}
                                className="time-control-btn"
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: timeSlotsAdded <= 0 ? '#ccc' : '#ff6b6b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: timeSlotsAdded <= 0 ? 'not-allowed' : 'pointer'
                                }}
                            >- 30 min</button>
                            <span style={{ fontWeight: 'bold' }}>
                                Duration: {((timeSlotsAdded + 1) * 30)} minutes
                            </span>
                            <button 
                                type="button" 
                                onClick={() => adjustTime(1)}
                                className="time-control-btn"
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: CALENDAR_CONFIG.COLORS.AVAILABLE,
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}>+ 30 min</button>
                        </div>
                        <p><strong>Date:</strong> {formatDate(selectedSlot?.start)}</p>
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
                            type="number" 
                            placeholder='UNCW ID *'
                            value={bookingDetails.uncw_id}
                            onChange={(e) => setBookingDetails({...bookingDetails, uncw_id: e.target.value})}
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
                                disabled={!bookingDetails.title || !bookingDetails.userName || !bookingDetails.uncw_id || !bookingDetails.userEmail}
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderLegend = () => {
        const hasRealData = rooms.length > 0 && events.length > 0 && !loading;
    
        console.log('Legend render check:', {
            loading,
            eventsLength: events.length,
            roomsLength: rooms.length,
            hasRealData
        });
        
        if (!hasRealData) {
            return null;
        }

        if (loading || events.length === 0 || rooms.length === 0) return null;
        return (
            <div className="legend-container">
                <div className='legend'>
                    <h3>Legend</h3>
                    <div className='legend-items'>
                        {[
                            { color: CALENDAR_CONFIG.COLORS.AVAILABLE, label: 'Available' },
                            { color: CALENDAR_CONFIG.COLORS.YOUR_BOOKING, label: 'Your Booking' },
                            { color: CALENDAR_CONFIG.COLORS.BOOKED, label: 'Booked' },
                            { color: CALENDAR_CONFIG.COLORS.UNAVAILABLE, label: 'Unavailable' },
                        ].map(item => (
                            <div key={item.label} className='legend-item'>
                                <div className='legend-block' style={{ backgroundColor: item.color }}></div>
                                <span className='legend-color'>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            );
    };

    if (loading) return <div className="loading">Loading calendar...</div>;

    return (
        <div className="room-booking-calendar">
            <h2>Room Booking Calendar</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            {renderBuildingSelector()}
            
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
                    resources={resources}
                    resourceAreaHeaderContent="Study Rooms"
                    events={calendarSlots}
                    editable={false}
                    eventDurationEditable={false}
                    eventStartEditable={false}
                    selectable={true}
                    selectMirror={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    selectAllow={handleSelectAllow}
                    height={renderCalHeight}
                    slotDuration="00:30:00"
                    slotLabelInterval="01:00:00"
                    slotMinTime={`${CALENDAR_CONFIG.START_HOUR}:00:00`}
                    slotMaxTime={`${CALENDAR_CONFIG.END_HOUR}:00:00`}
                    resourceAreaWidth="200px"
                    snapDuration="00:30:00"
                    selectConstraint={{
                        start: `${CALENDAR_CONFIG.START_HOUR}:00:00`,
                        end: `${CALENDAR_CONFIG.END_HOUR}:00:00`
                    }}
                    resourceLabelDidMount={handleResourceLabelMount}
                    datesSet={handleDatesSet}
                    nowIndicator={true}
                    scrollTime={`${currentHour}:00:00`}
                />
            </div>

            {renderBookingForm()}
            {renderLegend()}
        </div>
    );
};

export default RoomBookingCalendar;