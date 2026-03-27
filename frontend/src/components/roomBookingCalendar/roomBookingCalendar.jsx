import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
const BLOCKS_API_URL = `${API_BASE_URL}/blocks`;

const CALENDAR_CONFIG = {
    START_HOUR: 6,
    END_HOUR: 26,
    SLOT_DURATION: 30,
    COLORS: {
        AVAILABLE: '#4AE0BA',
        BOOKED: '#D4FFFD',
        YOUR_BOOKING: '#c26efe',
        UNAVAILABLE: '#d3d3d3',
        BLOCKED: '#CC2200',
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

const RoomBookingCalendar = ({ adminSession }) => {
    const isAdminMode = !!adminSession;

    // --- Booking state ---
    const [events, setEvents] = useState([]);
    const [buildings, setBuildings] = useState(FALLBACK_BUILDINGS);
    const [rooms, setRooms] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [filters, setFilters] = useState({
        min_capacity: '',
        has_whiteboard: '',
        has_monitor: '',
        available_start: '',
        available_end: '',
    });
    const [appliedFilters, setAppliedFilters] = useState({
        min_capacity: '',
        has_whiteboard: '',
        has_monitor: '',
        available_start: '',
        available_end: '',
    });
    const isInitialLoad = useRef(true);
    const [showFilters, setShowFilters] = useState(false);
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

    // --- Block state (admin only) ---
    const [blocks, setBlocks] = useState([]);
    const [isBlockMode, setIsBlockMode] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    // --- Block edit dialog state (admin only) ---
    const [showBlockEditDialog, setShowBlockEditDialog] = useState(false);
    const [selectedBlockForEdit, setSelectedBlockForEdit] = useState(null);
    const [blockEditDurationMinutes, setBlockEditDurationMinutes] = useState(0);

    // --- Cancel booking dialog state (admin only) ---
    const [showCancelBookingDialog, setShowCancelBookingDialog] = useState(false);
    const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);

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
                        booking.resourceId?.toString() === room.id &&
                        booking.extendedProps?.status !== 'cancelled' &&
                        new Date(booking.start) < endTime &&
                        new Date(booking.end) > startTime
                    );

                    const isBlocked = blocks.some(block =>
                        block.room_id.toString() === room.id &&
                        new Date(block.start_time) < endTime &&
                        new Date(block.end_time) > startTime
                    );

                    let color = CALENDAR_CONFIG.COLORS.AVAILABLE;
                    let classNames = ['available-slot'];
                    if (isBlocked) {
                        color = CALENDAR_CONFIG.COLORS.BLOCKED;
                        classNames = ['blocked-slot'];
                    } else if (isBooked) {
                        color = CALENDAR_CONFIG.COLORS.BOOKED;
                        classNames = ['booked-slot'];
                    }

                    slots.push({
                        id: `slot-${room.id}-${hour}-${minute}-${Date.now()}-${Math.random()}`,
                        resourceId: room.id,
                        start: startTime,
                        end: endTime,
                        display: 'background',
                        color,
                        classNames,
                        extendedProps: { isBooked, isBlocked, isAvailable: !isBooked && !isBlocked }
                    });
                }
            }
        });

        return slots;
    }, [filteredRooms, selectedDate, events, blocks]);

    // Build query params from applied filters
    const buildRoomParams = useCallback(() => {
        const params = {};
        if (appliedFilters.min_capacity) params.min_capacity = appliedFilters.min_capacity;
        if (appliedFilters.has_whiteboard !== '') params.has_whiteboard = appliedFilters.has_whiteboard;
        if (appliedFilters.has_monitor !== '') params.has_monitor = appliedFilters.has_monitor;
        if (appliedFilters.available_start) params.available_start = appliedFilters.available_start;
        if (appliedFilters.available_end) params.available_end = appliedFilters.available_end;
        return params;
    }, [appliedFilters]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (isInitialLoad.current) {
                    setLoading(true);
                }
                setError(null);

                const requests = [axios.get(ROOMS_API_URL, { params: buildRoomParams() })];
                if (isInitialLoad.current) {
                    requests.push(axios.get(BOOKINGS_API_URL));
                    requests.push(axios.get(BLOCKS_API_URL));
                }

                const responses = await Promise.all(requests);
                const roomsResponse = responses[0];

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

                if (isInitialLoad.current) {
                    if (responses[1]) {
                        setEvents(responses[1].data.map(booking => ({
                            id: `booking-${booking.booking_id}`,
                            resourceId: booking.room_id?.toString(),
                            start: booking.start_time,
                            end: booking.end_time,
                            title: booking.notes || 'Booked',
                            color: CALENDAR_CONFIG.COLORS.BOOKED,
                            extendedProps: {
                                isBooking: true,
                                booking_id: booking.booking_id,
                                uncw_id: booking.uncw_id,
                                first_name: booking.first_name,
                                last_name: booking.last_name,
                                status: booking.status || 'active'
                            }
                        })));
                    }
                    if (responses[2]) {
                        setBlocks(responses[2].data);
                    }
                    isInitialLoad.current = false;
                }

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
    }, [buildRoomParams]);

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

    // Block events to display on the calendar as foreground events
    const blockEvents = useMemo(() => {
        return blocks.map(block => ({
            id: `block-${block.block_id}`,
            resourceId: block.room_id.toString(),
            start: block.start_time,
            end: block.end_time,
            title: block.reason ? `BLOCKED: ${block.reason}` : 'BLOCKED',
            color: CALENDAR_CONFIG.COLORS.BLOCKED,
            classNames: ['block-event'],
            editable: false,
            extendedProps: { isBlock: true }
        }));
    }, [blocks]);

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
        setIsBlockMode(false);
        setBlockReason('');
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
                await axios.post(`${API_BASE_URL}/users`, userData);
            } catch (userError) {
                console.log('User may already exist:', userError.response?.data?.error);
            }

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

    const handleBlockSubmit = async () => {
        if (!selectedRoom) return;

        const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

        try {
            const response = await axios.post(BLOCKS_API_URL, {
                admin_uncw_id: parseInt(adminSession.uncw_id),
                room_id: parseInt(selectedRoom),
                start_time: formatDateTime(selectedSlot.start),
                end_time: formatDateTime(selectedSlot.end),
                reason: blockReason || null
            });

            const newBlock = {
                block_id: response.data.block_id,
                room_id: parseInt(selectedRoom),
                start_time: new Date(response.data.start_time).toISOString(),
                end_time: new Date(response.data.end_time).toISOString(),
                reason: blockReason || null
            };

            if (response.data.merged && response.data.merged_block_ids?.length > 0) {
                setBlocks(prev => [
                    ...prev.filter(b => !response.data.merged_block_ids.includes(b.block_id)),
                    newBlock
                ]);
            } else {
                setBlocks(prev => [...prev, newBlock]);
            }
            setShowBookingForm(false);
            setIsBlockMode(false);
            setBlockReason('');
            alert('Room blocked successfully!');
        } catch (error) {
            console.error('Error blocking room:', error);
            alert('Failed to block room: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDatesSet = (dateInfo) => {
        setSelectedDate(dateInfo.start);
    };

    const handleEventClick = (info) => {
        if (info.event.extendedProps.isBlock) {
            if (isAdminMode) {
                const blockId = parseInt(info.event.id.replace('block-', ''));
                const block = blocks.find(b => b.block_id === blockId);
                if (block) {
                    const durationMs = new Date(block.end_time) - new Date(block.start_time);
                    const durationMinutes = Math.round(durationMs / 60000);
                    setSelectedBlockForEdit(block);
                    setBlockEditDurationMinutes(durationMinutes);
                    setShowBlockEditDialog(true);
                }
            } else {
                alert(`This time slot is blocked by an administrator.\n${info.event.title}`);
            }
            return false;
        }

        if (info.event.extendedProps.isBooking) {
            if (isAdminMode) {
                const status = info.event.extendedProps.status;
                if (status !== 'cancelled') {
                    setSelectedBookingForCancel({
                        booking_id: info.event.extendedProps.booking_id,
                        title: info.event.title,
                        start: info.event.start,
                        end: info.event.end,
                        uncw_id: info.event.extendedProps.uncw_id,
                        first_name: info.event.extendedProps.first_name,
                        last_name: info.event.extendedProps.last_name,
                    });
                    setShowCancelBookingDialog(true);
                }
            }
            return false;
        }
    };

    // Escape key closes admin dialogs
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowBlockEditDialog(false);
                setShowCancelBookingDialog(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const removeBlock = async (blockId) => {
        try {
            await axios.delete(`${BLOCKS_API_URL}/${blockId}`, {
                data: { admin_uncw_id: parseInt(adminSession.uncw_id) }
            });
            setBlocks(prev => prev.filter(b => b.block_id !== blockId));
            setShowBlockEditDialog(false);
            setSelectedBlockForEdit(null);
        } catch (error) {
            console.error('Error removing block:', error);
            alert('Failed to remove block: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleBlockEditSave = async () => {
        if (!selectedBlockForEdit) return;

        if (blockEditDurationMinutes <= 0) {
            await removeBlock(selectedBlockForEdit.block_id);
            return;
        }

        const formatDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
        const newEndTime = new Date(selectedBlockForEdit.start_time);
        newEndTime.setMinutes(newEndTime.getMinutes() + blockEditDurationMinutes);

        try {
            await axios.put(`${BLOCKS_API_URL}/${selectedBlockForEdit.block_id}`, {
                admin_uncw_id: parseInt(adminSession.uncw_id),
                end_time: formatDateTime(newEndTime)
            });
            setBlocks(prev => prev.map(b =>
                b.block_id === selectedBlockForEdit.block_id
                    ? { ...b, end_time: newEndTime.toISOString() }
                    : b
            ));
            setShowBlockEditDialog(false);
            setSelectedBlockForEdit(null);
        } catch (error) {
            console.error('Error updating block:', error);
            alert('Failed to update block: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleCancelBookingFromCalendar = async () => {
        if (!selectedBookingForCancel) return;
        try {
            await axios.patch(`${BOOKINGS_API_URL}/${selectedBookingForCancel.booking_id}/cancel`, {
                admin_uncw_id: parseInt(adminSession.uncw_id)
            });
            setEvents(prev => prev.map(e =>
                e.extendedProps?.booking_id === selectedBookingForCancel.booking_id
                    ? { ...e, color: CALENDAR_CONFIG.COLORS.UNAVAILABLE, extendedProps: { ...e.extendedProps, status: 'cancelled' } }
                    : e
            ));
            setShowCancelBookingDialog(false);
            setSelectedBookingForCancel(null);
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleSelectAllow = (selectInfo) => {
        if (selectInfo.end <= new Date()) return false;

        const hasOverlap = events.some(booking =>
            booking.resourceId?.toString() === selectInfo.resource?.id &&
            booking.extendedProps?.status !== 'cancelled' &&
            new Date(booking.start) < selectInfo.end &&
            new Date(booking.end) > selectInfo.start
        );
        if (hasOverlap) return false;

        // Admins can select over blocked slots (to block on top of existing blocks)
        if (isAdminMode) return true;

        const isBlocked = blocks.some(block =>
            block.room_id.toString() === selectInfo.resource?.id &&
            new Date(block.start_time) < selectInfo.end &&
            new Date(block.end_time) > selectInfo.start
        );
        return !isBlocked;
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

        const totalHours = newEndTime.getHours() + (newEndTime.getMinutes() / 60);
        if (totalHours > CALENDAR_CONFIG.END_HOUR) {
            alert('Cannot extend beyond 2:00 AM');
            return;
        }

        if (direction > 0) {
            for (let i = 1; i <= slotsToAdd; i++) {
                const segmentStart = new Date(selectedSlot.end);
                segmentStart.setMinutes(segmentStart.getMinutes() + ((i - 1) * 30));
                const segmentEnd = new Date(selectedSlot.end);
                segmentEnd.setMinutes(segmentEnd.getMinutes() + (i * 30));

                const hasConflict = events.some(booking =>
                    booking.resourceId?.toString() === selectedSlot.room &&
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

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        setAppliedFilters({ ...filters });
    };

    const clearFilters = () => {
        const empty = {
            min_capacity: '',
            has_whiteboard: '',
            has_monitor: '',
            available_start: '',
            available_end: '',
        };
        setFilters(empty);
        setAppliedFilters(empty);
    };

    const hasActiveFilters = Object.values(appliedFilters).some(v => v !== '');
    const hasPendingFilters = JSON.stringify(filters) !== JSON.stringify(appliedFilters);

    const renderFilters = () => (
        <div className="room-filters">
            <button
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
            >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {hasActiveFilters && <span className="filter-badge">Active</span>}
            </button>
            {showFilters && (
                <div className="filter-panel">
                    <div className="filter-row">
                        <label>
                            Min Capacity
                            <input
                                type="number"
                                min="1"
                                placeholder="Any"
                                value={filters.min_capacity}
                                onChange={(e) => handleFilterChange('min_capacity', e.target.value)}
                            />
                        </label>
                        <label>
                            Whiteboard
                            <select
                                value={filters.has_whiteboard}
                                onChange={(e) => handleFilterChange('has_whiteboard', e.target.value)}
                            >
                                <option value="">Any</option>
                                <option value="1">Yes</option>
                                <option value="0">No</option>
                            </select>
                        </label>
                        <label>
                            Monitor
                            <select
                                value={filters.has_monitor}
                                onChange={(e) => handleFilterChange('has_monitor', e.target.value)}
                            >
                                <option value="">Any</option>
                                <option value="1">Yes</option>
                                <option value="0">No</option>
                            </select>
                        </label>
                    </div>
                    <div className="filter-row">
                        <label>
                            Available From
                            <input
                                type="datetime-local"
                                value={filters.available_start}
                                onChange={(e) => handleFilterChange('available_start', e.target.value)}
                            />
                        </label>
                        <label>
                            Available Until
                            <input
                                type="datetime-local"
                                value={filters.available_end}
                                onChange={(e) => handleFilterChange('available_end', e.target.value)}
                            />
                        </label>
                    </div>
                    <div className="filter-actions">
                        <button className="apply-filters-btn" onClick={handleApplyFilters}>
                            {hasPendingFilters ? 'Apply Filters *' : 'Apply Filters'}
                        </button>
                        {hasActiveFilters && (
                            <button className="clear-filters-btn" onClick={clearFilters}>
                                Clear All Filters
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderBookingForm = () => {
        if (!showBookingForm || !selectedRoom) return null;

        const roomInfo = getRoomById(selectedRoom);
        const buildingInfo = getBuildingById(selectedBuilding);

        return (
            <div className="booking-form-overlay">
                <div className="booking-form">
                    <h2>{isBlockMode ? 'Block Room' : 'Book Room'}</h2>

                    {isAdminMode && (
                        <div className="form-mode-toggle">
                            <button
                                type="button"
                                className={`mode-btn ${!isBlockMode ? 'mode-btn-active' : ''}`}
                                onClick={() => setIsBlockMode(false)}
                            >
                                Book Room
                            </button>
                            <button
                                type="button"
                                className={`mode-btn mode-btn-block ${isBlockMode ? 'mode-btn-block-active' : ''}`}
                                onClick={() => setIsBlockMode(true)}
                            >
                                Block Reservations
                            </button>
                        </div>
                    )}

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
                                }}
                            >+ 30 min</button>
                        </div>
                        <p><strong>Date:</strong> {formatDate(selectedSlot?.start)}</p>
                    </div>

                    {isBlockMode ? (
                        <div className="booking-form-fields">
                            <p className="block-info-text">
                                Blocking this room will prevent all reservations during the selected time window.
                                Overlapping blocks will be automatically merged.
                            </p>
                            <textarea
                                placeholder="Reason for blocking (optional)"
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                rows="3"
                                maxLength={500}
                            />
                            <div className="form-buttons">
                                <button
                                    type="button"
                                    onClick={() => { setShowBookingForm(false); setIsBlockMode(false); setBlockReason(''); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="block-submit-btn"
                                    onClick={handleBlockSubmit}
                                >
                                    Block Reservations
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className='booking-form-fields'>
                            <input
                                type="text"
                                placeholder='Meeting Title *'
                                value={bookingDetails.title}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, title: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder='Your Name *'
                                value={bookingDetails.userName}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, userName: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder='UNCW ID *'
                                value={bookingDetails.uncw_id}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, uncw_id: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder='Your Email *'
                                value={bookingDetails.userEmail}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, userEmail: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder='Meeting Description (Optional)'
                                value={bookingDetails.description}
                                onChange={(e) => setBookingDetails({ ...bookingDetails, description: e.target.value })}
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
                    )}
                </div>
            </div>
        );
    };

    const formatDuration = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    const renderBlockEditDialog = () => {
        if (!showBlockEditDialog || !selectedBlockForEdit) return null;

        return (
            <div
                className="booking-form-overlay"
                onClick={(e) => { if (e.target === e.currentTarget) setShowBlockEditDialog(false); }}
            >
                <div className="booking-form block-edit-dialog">
                    <button
                        className="block-edit-close-btn"
                        onClick={() => setShowBlockEditDialog(false)}
                        aria-label="Close"
                    >
                        ×
                    </button>
                    <h2>Edit Block</h2>

                    <div className="block-edit-duration-section">
                        <h3>Increase/Decrease Duration</h3>
                        <div className="block-edit-duration-controls">
                            <button
                                type="button"
                                className="block-edit-duration-btn"
                                onClick={() => setBlockEditDurationMinutes(m => Math.max(0, m - 30))}
                            >
                                -
                            </button>
                            <span className="block-edit-duration-value">{formatDuration(blockEditDurationMinutes)}</span>
                            <button
                                type="button"
                                className="block-edit-duration-btn"
                                onClick={() => setBlockEditDurationMinutes(m => m + 30)}
                            >
                                +
                            </button>
                        </div>
                        {blockEditDurationMinutes <= 0 && (
                            <p className="block-edit-remove-warning">Duration is 0 — block will be removed on save.</p>
                        )}
                    </div>

                    <div className="form-buttons block-edit-actions">
                        <button
                            type="button"
                            className="block-edit-save-btn"
                            onClick={handleBlockEditSave}
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className="block-submit-btn block-edit-remove-btn"
                            onClick={() => removeBlock(selectedBlockForEdit.block_id)}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderCancelBookingDialog = () => {
        if (!showCancelBookingDialog || !selectedBookingForCancel) return null;

        const { booking_id, title, start, end, first_name, last_name, uncw_id } = selectedBookingForCancel;
        const name = (first_name || last_name)
            ? `${first_name || ''} ${last_name || ''}`.trim()
            : `UNCW ID ${uncw_id}`;

        return (
            <div
                className="booking-form-overlay"
                onClick={(e) => { if (e.target === e.currentTarget) setShowCancelBookingDialog(false); }}
            >
                <div className="booking-form block-edit-dialog">
                    <button
                        className="block-edit-close-btn"
                        onClick={() => setShowCancelBookingDialog(false)}
                        aria-label="Close"
                    >
                        ×
                    </button>
                    <h2>Cancel Booking</h2>
                    <div className="booking-location">
                        <p><strong>Booking #{booking_id}</strong></p>
                        <p><strong>User:</strong> {name}</p>
                        <p><strong>Notes:</strong> {title}</p>
                        <p><strong>Time:</strong> {formatTime(start)} – {formatTime(end)}</p>
                        <p><strong>Date:</strong> {formatDate(start)}</p>
                    </div>
                    <p className="block-info-text" style={{ borderColor: '#b66000', background: '#fff8ee' }}>
                        This will release the room for the reserved time slot.
                    </p>
                    <div className="form-buttons" style={{ marginTop: '16px' }}>
                        <button type="button" onClick={() => setShowCancelBookingDialog(false)}>
                            Keep Booking
                        </button>
                        <button
                            type="button"
                            className="block-submit-btn"
                            onClick={handleCancelBookingFromCalendar}
                        >
                            Cancel Booking
                        </button>
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
            {renderFilters()}

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
                    events={[
                        ...calendarSlots,
                        ...blockEvents,
                        ...(isAdminMode
                            ? events
                                .filter(e => e.extendedProps?.status !== 'cancelled')
                                .map(e => ({
                                    ...e,
                                    title: '',
                                    backgroundColor: 'transparent',
                                    borderColor: 'transparent',
                                    classNames: ['booking-click-target']
                                }))
                            : [])
                    ]}
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
            {renderBlockEditDialog()}
            {renderCancelBookingDialog()}
            {renderLegend()}
        </div>
    );
};

export default RoomBookingCalendar;
