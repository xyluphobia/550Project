import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './adminPanel.css';

const API_BASE_URL = '/api';
const BOOKINGS_API_URL = `${API_BASE_URL}/bookings`;
const EQUIPMENT_BOOKINGS_API_URL = `${API_BASE_URL}/equipment-bookings`;

const AdminPanel = ({ adminSession }) => {
    const [bookings, setBookings] = useState([]);
    const [equipmentBookings, setEquipmentBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('rooms');
    const [loading, setLoading] = useState(false);
    const [loadingEquipment, setLoadingEquipment] = useState(false);
    const [error, setError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState(null);

    useEffect(() => {
        fetchRoomBookings();
        fetchEquipmentBookings();
    }, []);

    const fetchRoomBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(BOOKINGS_API_URL);
            setBookings(response.data);
        } catch (err) {
            setError('Failed to load room bookings.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEquipmentBookings = async () => {
        setLoadingEquipment(true);
        try {
            const response = await axios.get(EQUIPMENT_BOOKINGS_API_URL);
            setEquipmentBookings(response.data);
        } catch (err) {
            console.error('Failed to load equipment bookings:', err);
        } finally {
            setLoadingEquipment(false);
        }
    };

    const handleCancelClick = (booking) => {
        setConfirmCancel(booking);
    };

    const handleConfirmCancel = async () => {
        if (!confirmCancel) return;
        setCancellingId(confirmCancel.booking_id);
        setConfirmCancel(null);
        try {
            await axios.patch(`${BOOKINGS_API_URL}/${confirmCancel.booking_id}/cancel`, {
                admin_uncw_id: adminSession?.uncw_id
            });
            setBookings(prev =>
                prev.map(b =>
                    b.booking_id === confirmCancel.booking_id
                        ? { ...b, status: 'cancelled' }
                        : b
                )
            );
        } catch (err) {
            setError('Failed to cancel booking: ' + (err.response?.data?.error || err.message));
        } finally {
            setCancellingId(null);
        }
    };

    const handleCancelEquipmentBooking = async (bookingId) => {
        setCancellingId(bookingId);
        try {
            await axios.patch(`${EQUIPMENT_BOOKINGS_API_URL}/${bookingId}/cancel`, {
                admin_uncw_id: adminSession?.uncw_id
            });
            setEquipmentBookings(prev =>
                prev.map(b =>
                    b.booking_id === bookingId
                        ? { ...b, status: 'cancelled' }
                        : b
                )
            );
            alert('Equipment booking cancelled successfully!');
        } catch (err) {
            console.error('Failed to cancel equipment booking:', err);
            alert('Failed to cancel equipment booking.');
        } finally {
            setCancellingId(null);
        }
    };

    const formatDateTime = (dt) => {
        if (!dt) return '—';
        return new Date(dt).toLocaleString([], {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getAdminName = () => {
        if (adminSession?.name) return adminSession.name;
        if (adminSession?.first_name && adminSession?.last_name) return `${adminSession.first_name} ${adminSession.last_name}`;
        if (adminSession?.first_name) return adminSession.first_name;
        if (adminSession?.uncw_id) return `Admin ${adminSession.uncw_id}`;
        return 'Admin';
    };

    if (!adminSession) {
        return <div className="admin-panel"><p>Loading admin session...</p></div>;
    }

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h2>Admin Panel — Reservations</h2>
                <span className="admin-panel-user">Logged in as {getAdminName()}</span>
            </div>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'rooms' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rooms')}
                >
                    Room Reservations ({bookings.length})
                </button>
                <button
                    className={`admin-tab ${activeTab === 'equipment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('equipment')}
                >
                    Equipment Reservations ({equipmentBookings.length})
                </button>
            </div>

            {error && <div className="admin-error">{error}</div>}

            {activeTab === 'rooms' && (
                <>
                    {loading && <div className="admin-loading">Loading room reservations...</div>}
                    {!loading && (
                        <div className="table-responsive">
                            <table className="admin-bookings-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User</th>
                                        <th>Type</th>
                                        <th>Room</th>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Notes</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.length === 0 && (
                                        <tr><td colSpan="9" className="admin-no-bookings">No room reservations found.</td></tr>
                                    )}
                                    {bookings.map(b => (
                                        <tr key={b.booking_id} className={b.status === 'cancelled' ? 'row-cancelled' : ''}>
                                            <td>{b.booking_id}</td>
                                            <td>
                                                {b.first_name || b.last_name
                                                    ? `${b.first_name || ''} ${b.last_name || ''}`.trim()
                                                    : b.uncw_id}
                                                <br />
                                                <span className="admin-sub">ID: {b.uncw_id}</span>
                                            </td>
                                            <td>{b.booking_type || 'room'}</td>
                                            <td>
                                                {b.room_code || `Room ${b.room_id}`}
                                                {b.building_name && <br />}
                                                {b.building_name && <span className="admin-sub">{b.building_name}</span>}
                                            </td>
                                            <td>{formatDateTime(b.start_time)}</td>
                                            <td>{formatDateTime(b.end_time)}</td>
                                            <td>{b.notes || '—'}</td>
                                            <td>
                                                <span className={`status-badge status-${b.status || 'active'}`}>
                                                    {b.status || 'active'}
                                                </span>
                                            </td>
                                            <td>
                                                {b.status === 'cancelled' ? (
                                                    <span className="cancelled-label">Cancelled</span>
                                                ) : new Date(b.end_time) < new Date() ? (
                                                    <span className="ended-label">Ended</span>
                                                ) : (
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={() => handleCancelClick(b)}
                                                        disabled={cancellingId === b.booking_id}
                                                    >
                                                        {cancellingId === b.booking_id ? 'Cancelling...' : 'Cancel'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'equipment' && (
                <>
                    {loadingEquipment && <div className="admin-loading">Loading equipment reservations...</div>}
                    {!loadingEquipment && (
                        <div className="table-responsive">
                            <table className="admin-bookings-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User</th>
                                        <th>Equipment</th>
                                        <th>Departments</th>
                                        <th>Booking Date</th>
                                        <th>Return Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equipmentBookings.length === 0 && (
                                        <tr><td colSpan="8" className="admin-no-bookings">No equipment reservations found.</td></tr>
                                    )}
                                    {equipmentBookings.map(b => {
                                        let equipmentList = [];
                                        try {
                                            equipmentList = JSON.parse(b.equipment_names || '[]');
                                        } catch {
                                            equipmentList = [];
                                        }
                                        return (
                                            <tr key={b.booking_id} className={b.status === 'cancelled' ? 'row-cancelled' : ''}>
                                                <td>{b.booking_id}</td>
                                                <td>
                                                    {b.first_name || b.last_name
                                                        ? `${b.first_name || ''} ${b.last_name || ''}`.trim()
                                                        : b.uncw_id}
                                                    <br />
                                                    <span className="admin-sub">ID: {b.uncw_id}</span>
                                                    <br />
                                                    <span className="admin-sub">{b.email || '—'}</span>
                                                </td>
                                                <td>{equipmentList.join(', ') || b.equipment_list || '—'}</td>
                                                <td>{b.departments || '—'}</td>
                                                <td>{formatDateTime(b.booking_date || b.start_time)}</td>
                                                <td>{formatDateTime(b.return_date || b.end_time)}</td>
                                                <td>
                                                    <span className={`status-badge status-${b.status || 'pending'}`}>
                                                        {b.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {b.status === 'cancelled' ? (
                                                        <span className="cancelled-label">Cancelled</span>
                                                    ) : (
                                                        <button
                                                            className="cancel-btn"
                                                            onClick={() => handleCancelEquipmentBooking(b.booking_id)}
                                                            disabled={cancellingId === b.booking_id}
                                                        >
                                                            {cancellingId === b.booking_id ? 'Cancelling...' : 'Cancel'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {confirmCancel && (
                <div className="confirm-overlay">
                    <div className="confirm-dialog">
                        <h3>Confirm Cancellation</h3>
                        <p>
                            Cancel reservation <strong>#{confirmCancel.booking_id}</strong> for{' '}
                            <strong>
                                {confirmCancel.first_name || confirmCancel.last_name
                                    ? `${confirmCancel.first_name || ''} ${confirmCancel.last_name || ''}`.trim()
                                    : `UNCW ID ${confirmCancel.uncw_id}`}
                            </strong>?
                        </p>
                        <p className="confirm-times">
                            {formatDateTime(confirmCancel.start_time)} — {formatDateTime(confirmCancel.end_time)}
                        </p>
                        <p className="confirm-warning">This will release the room for the reserved time slot.</p>
                        <div className="confirm-buttons">
                            <button className="confirm-no-btn" onClick={() => setConfirmCancel(null)}>Keep Reservation</button>
                            <button className="confirm-yes-btn" onClick={handleConfirmCancel}>Yes, Cancel It</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;