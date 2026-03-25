import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'; // Add this
import interactionPlugin from '@fullcalendar/interaction';
import {EmailJSConfigBooking} from '../EmailJS/emailJSConfiguration';
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
    const [calendarSlots, setCalendarSlots] = useState([]);
    const [timeSlotsAdded, setTimeSlotsAdded] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date()); // Add state for selected date
    const [bookingDetails, setBookingDetails] = useState({
        title: '',
        description: '',
        userName: '',
        userEmail: '',
    });

    const API_BASE_URL = '/api';
    const ROOMS_API_URL = `${API_BASE_URL}/rooms`;
    const BOOKINGS_API_URL = `${API_BASE_URL}/bookings`;

    const renderCalHight = rooms.length > 0 ? 'auto' : rooms.length * 150; // Set height to auto if rooms exist, otherwise fixed height
    const currentHour = new Date().getHours() - 1; // Scroll an hour before current time



    const generateTimeSlots = () => {
        if (!filteredRooms.length || !selectedDate) {
            return [];
        }

        const slots = [];
        const startHour = 6; // Start at 6 AM
        const endHour = 26;
        const currentDate = new Date(selectedDate);
        currentDate.setHours(0, 0, 0, 0); // Set to start of the day

        filteredRooms.forEach(room => {
            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const startTime = new Date(currentDate);
                    startTime.setHours(hour, minute, 0, 0);
                    const endTime = new Date(startTime);
                    endTime.setMinutes(endTime.getMinutes() + 30);

                    const isBooked = events.some(booking =>
                        booking.resourceId === room.id &&
                        new Date(booking.start) < endTime &&
                        new Date(booking.end) > startTime
                    );

                    slots.push({
                        id: `slot-${room.id}-${hour}-${minute}-${Date.now()}-${Math.random()}`, // Unique ID for each slot
                        resourceId: room.id,
                        start: startTime,
                        end: endTime,
                        display: 'background',
                        color: isBooked ? '#D4FFFD' : '#4AE0BA',
                        classNames: isBooked ? ['booked-slot'] : ['available-slot'],
                        extendedProps: {
                            isBooked: isBooked,
                            isAvailable: !isBooked
                        }
                    });
                }
            }
        });

        return slots;
    }
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // const buildingsResponse = await axios.get(BUILDINGS_API_URL);
                // console.log('Buildings data:', buildingsResponse.data);
                // setBuildings(buildingsResponse.data);
                
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
                    { id: 'bldg1', name: 'Discovery Hall', capacity: 12},
                    { id: 'bldg2', name: 'Randall Hall', capacity: 32},
                    { id: 'bldg3', name: 'Makerstudio', capacity: 4},
                ]);
                setRooms([
                    { id: 'discovery-101', name: 'Room 101', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 20, floor: '1'},
                    { id: 'discovery-102', name: 'Room 102', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 15, floor: '1'},
                    { id: 'randall-101', name: 'Classroom A', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 30, floor: '1'},
                    { id: 'randall-201', name: 'Lecture Hall', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 100, floor: '2'},
                    { id: 'makerstudio-1', name: '3D Printing Area', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 4, floor: '1'},
                    { id: 'makerstudio-2', name: 'Electronics Lab', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 6, floor: '1'},
                ]);
                setFilteredRooms([
                    { id: 'discovery-101', name: 'Room 101', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 20, floor: '1'},
                    { id: 'discovery-102', name: 'Room 102', buildingId: 'bldg1', buildingName: 'Discovery Hall', capacity: 15, floor: '1'},
                    { id: 'randall-101', name: 'Classroom A', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 30, floor: '1'},
                    { id: 'randall-201', name: 'Lecture Hall', buildingId: 'bldg2', buildingName: 'Randall Hall', capacity: 100, floor: '2'},
                    { id: 'makerstudio-1', name: '3D Printing Area', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 4, floor: '1'},
                    { id: 'makerstudio-2', name: 'Electronics Lab', buildingId: 'bldg3', buildingName: 'Makerstudio', capacity: 6, floor: '1'},
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
        } else {
            setFilteredRooms(rooms);
        }
    }, [selectedBuilding, rooms]);

    useEffect(() => {
        const slots = generateTimeSlots();
        setCalendarSlots(slots);
    }, [filteredRooms, selectedDate, events]);

    // Transform rooms into resources for FullCalendar
    const getResources = () => {
        return filteredRooms.map(room => ({
            id: room.id,
            title: `${room.id}: ${room.name}`,
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
        const resourceId = selectInfo.resource?.id;
        if (resourceId) {
            const selectedRoomInfo = rooms.find(r => r.id === resourceId);
            if (selectedRoomInfo) {
                setSelectedRoom(selectedRoomInfo.id);
                setSelectedBuilding(selectedRoomInfo.buildingId);
            } else {
                setSelectedRoom('');
                setSelectedBuilding('');
            }
        }

        setSelectedSlot({
            start: selectInfo.start,
            end: selectInfo.end,
            room: resourceId,
            building: selectedBuilding
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
            EmailJSConfigBooking({ events: [...events, newBooking], rooms, buildings, loading: false, error: null });
            alert('Booking created successfully!');
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking.');
        }
    };

    // Handle date change
    const handleDatesSet = (dateInfo) => {
        setSelectedDate(dateInfo.start);
    };

    const getRoomsForBuilding = (buildingId) => {
        return rooms.filter(room => room.buildingId === buildingId);
    };

    const addTime = (increment = 1) => {
        if (!selectedSlot) return;

        // Calculate how many 30-minute slots we're adding
        const slotsToAdd = increment;
        
        // Calculate the potential new end time
        const newEndTime = new Date(selectedSlot.end);
        newEndTime.setMinutes(newEndTime.getMinutes() + (30 * slotsToAdd));

        // Check if extended time exceeds 2 AM (26:00)
        const hours = newEndTime.getHours();
        const minutes = newEndTime.getMinutes();
        const totalHours = hours + (minutes / 60);
        
        if (totalHours > 26 || (totalHours === 26 && minutes > 0)) {
            alert('Cannot extend beyond 2:00 AM');
            return;
        }

        // Check each 30-minute segment for conflicts
        let conflictFound = false;
        let conflictTime = '';

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
                conflictFound = true;
                conflictTime = segmentStart.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                break;
            }
        }
        
        if (!conflictFound) {
            setTimeSlotsAdded(timeSlotsAdded + slotsToAdd);
            setSelectedSlot({
                ...selectedSlot,
                end: newEndTime
            });
        } else {
            alert(`Cannot extend time. The slot starting at ${conflictTime} is already booked.`);
        }
    };

    const subtractTime = (decrement = 1) => {
        if (!selectedSlot || timeSlotsAdded <= 0) return;
        
        // Calculate new end time by subtracting 30 minutes
        const newEndTime = new Date(selectedSlot.end);
        newEndTime.setMinutes(newEndTime.getMinutes() - 30);
        
        setTimeSlotsAdded(timeSlotsAdded - decrement);
        setSelectedSlot({
            ...selectedSlot,
            end: newEndTime
        });
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
                                    {buildingRooms.length} rooms
                                </div>
                            </button>
                        );
                    })}
                </div>
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
                    resourceAreaHeaderContent="Study Rooms"
                    events={calendarSlots}

                    editable={false}
                    eventDurationEditable={false}
                    eventStartEditable={false}

                    selectable={true}
                    selectMirror={true}
                    select={handleDateSelect}

                    eventClick={(info) => {
                        if (info.event.extendedProps.isBooked) {
                            alert(`This slot is already booked for ${info.event.title}. Please select another slot.`);
                            return false; // Prevent click action on booked slots
                        }
                    }}

                    selectAllow={(selectInfo) => {
                        const hasOverLap = events.some(booking =>
                            booking.resourceId === selectInfo.resource?.id &&
                            new Date(booking.start) < selectInfo.end &&
                            new Date(booking.end) > selectInfo.start
                        );
                        return !hasOverLap;
                    }}

                    height={renderCalHight}

                    // Time slot settings
                    slotDuration="00:30:00" // 30 minute slots
                    slotLabelInterval="01:00:00" // Show hour labels
                    slotMinTime="06:00:00" // Start at 6 AM
                    slotMaxTime="26:00:00" // End at 1 AM
                    resourceAreaWidth="200px" // Width of room column
                    snapDuration="00:30:00" // Snap to 30 minute intervals  

                    selectConstraint={{
                        start:"06:00:00",
                        end:"26:00:00"
                    }}
                    
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
                    scrollTime={`${currentHour}:00:00`} // Scroll an hour before current time
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
                                <div className="time-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => subtractTime()}
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
                                        onClick={() => addTime()}
                                        className="time-control-btn"
                                        style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#4AE0BA',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}>+ 30 min</button>
                                </div>
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
                <h3>Legend</h3>
                <div className='legend-items'>
                    <div className='legend-item'>
                        <div className='legend-block' style={{ backgroundColor: '#4AE0BA' }}></div>
                        <span className='legend-color'>Available</span>
                    </div>
                    <div className='legend-item'>
                        <div className='legend-block' style={{ backgroundColor: '#c26efe' }}></div>
                        <span className='legend-color'>Your Booking</span>
                    </div>
                    <div className='legend-item'>
                        <div className='legend-block' style={{ backgroundColor: '#ff6b6b' }}></div>
                        <span className='legend-color'>Booked</span>
                    </div>
                    <div className='legend-item'>
                        <div className='legend-block' style={{ backgroundColor: '#d3d3d3' }}></div>
                        <span className='legend-color'>Unavailable</span>
                    </div>
                </div>
                
            </div>

        </div>
    );
};

export default RoomBookingCalendar;