import React, { useState, useEffect} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import axios from 'axios';
import './roomBookingCalendar.css';

const RoomBookingCalendar = () => {
    const [events, setEvents] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [bookingDetails, setBookingDetails] = useState({
        title: '',
        description: '',
        userName: '',
        userEmail: '',
    });

    const avaliableRooms = [
        // room API call here
        // Example rooms
        { id: 'Room A', name: 'Room A', capacity: 10, color: '#ff5733' },
        { id: 'Room B', name: 'Room B', capacity: 20, color: '#33c1ff' },
        { id: 'Room C', name: 'Room C', capacity: 15, color: '#75ff33' },
    ]

    const bookings = [
        // booking API call here
        // Example bookings
        {
            title: 'Team Meeting',
            start: '2024-07-01T10:00:00',
            end: '2024-07-01T11:00:00',
            room: 'Room A',
            color: '#ff5733'
        },
        {
            title: 'Project Discussion',
            start: '2024-07-02T14:00:00',
            end: '2024-07-02T15:30:00',
            room: 'Room B',
            color: '#33c1ff'
        }
    ]

    useEffect(() => {
        // Fetch rooms and booking from API
        setRooms(avaliableRooms);
        setEvents(bookings);
    }, []);

    const handleDateSelect = (selectInfo) => {
        setSelectedSlot({
            start: selectInfo.start,
            end: selectInfo.end,
            room: selectedRoom
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

        const newBooking = {
            title: bookingDetails.title,
            start: selectedSlot.start,
            end: selectedSlot.end,
            room: selectedSlot.room,
            description: bookingDetails.description,
            userName: bookingDetails.userName,
            userEmail: bookingDetails.userEmail,
            color: rooms.find(r => r.id === selectedSlot.room)?.color || '#3788d8'
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

    return (
        <div className="room-booking-calendar">
            <h2>Room Booking Calendar</h2>

            <div className="room-selector">
                <h2>Room Selector</h2>
                <div className='room-options'>
                    {rooms.map((room) => (
                        <button
                            key={room.id}
                            className={`room-btn ${selectedRoom === room.id ? 'selected' : ''}`}
                            onClick={() => setSelectedRoom(room.id)}
                            style={{ backgroundColor: room.color }}
                        >
                            {room.name} ({room.capacity} ppl)
                        </button>
                    ))}
                </div>
            </div>

            <div className='calender-wrapper'>
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
                    <h2>Book {selectedRoom}</h2>
                    <p>
                        Time: {selectedSlot.start.toLocaleString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })} - {selectedSlot.end.toLocaleString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                    <p>
                        Date: {selectedSlot.start.toLocaleDateString()}
                    </p>

                    <div className='booking-form'>
                        <input 
                            type="text" 
                            placeholder='Meeting Title'
                            value={bookingDetails.title}
                            onChange={(e) => setBookingDetails({...bookingDetails, title: e.target.value})}
                         />
                         <input 
                            type="text" 
                            placeholder='Your Name'
                            value={bookingDetails.name}
                            onChange={(e) => setBookingDetails({...bookingDetails, name: e.target.value})}
                         />
                         <input 
                            type="text" 
                            placeholder='Your Email'
                            value={bookingDetails.email}
                            onChange={(e) => setBookingDetails({...bookingDetails, email: e.target.value})}
                         />
                         <textarea 
                            placeholder='Meeting Description (Optional'
                            value={bookingDetails.description}
                            onChange={(e) => setBookingDetails({...bookingDetails, description: e.target.value})}
                         />

                        <div className='form-bottons'>
                        <button onClick={() => setShowBookingForm(false)}>Cancel</button>
                        <button
                            onClick={handleBookingSubmit}
                            disabled={!bookingDetails.title || !bookingDetails.name || !bookingDetails.email}
                            >
                            Confirm Booking
                        </button>

                        </div>
                    </div>
                </div>
            </div>
            )}

            <div className='legend'>
                <h3>Room Legend</h3>
                {rooms.map((room) => (
                    <div key={room.id} className='legend-item'>
                        <span className='color-box' style={{ backgroundColor: room.color }}></span>
                        <span>{room.name}</span>
                    </div>
                ))}

            </div>

        </div>
    );
};

export default RoomBookingCalendar;