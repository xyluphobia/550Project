import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './adminPanel.css';

const API_BASE_URL = '/api';
const BOOKINGS_API_URL = `${API_BASE_URL}/bookings`;

const AdminPanel = ({ adminSession }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(BOOKINGS_API_URL);
                setBookings(response.data);
            } catch (err) {
                setError('Failed to load bookings.');
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleCancelClick = (booking) => {
        setConfirmCancel(booking);
    };

    const handleConfirmCancel = async () => {
        if (!confirmCancel) return;
        setCancellingId(confirmCancel.booking_id);
        setConfirmCancel(null);
        try {
            await axios.patch(`${BOOKINGS_API_URL}/${confirmCancel.booking_id}/cancel`, {
                admin_uncw_id: adminSession.uncw_id
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

    const formatDateTime = (dt) => {
        if (!dt) return '—';
        return new Date(dt).toLocaleString([], {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h2>Admin Panel — Reservations</h2>
                <span className="admin-panel-user">Logged in as {adminSession.name}</span>
            </div>

            {error && <div className="admin-error">{error}</div>}
            {loading && <div className="admin-loading">Loading reservations...</div>}

            {!loading && (
                <table className="admin-bookings-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Type</th>
                            <th>Room / Equipment</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Notes</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 && (
                            <tr><td colSpan="9" className="admin-no-bookings">No reservations found.</td></tr>
                        )}
                        {bookings.map(b => (
                            <tr key={b.booking_id} className={b.status === 'cancelled' ? 'row-cancelled' : ''}>
                                <td>{b.booking_id}</td>
                                <td>
                                    {b.first_name || b.last_name
                                        ? `${b.first_name} ${b.last_name}`.trim()
                                        : b.uncw_id}
                                    <br />
                                    <span className="admin-sub">ID: {b.uncw_id}</span>
                                </td>
                                <td>{b.booking_type}</td>
                                <td>
                                    {b.room_code
                                        ? `${b.room_code} — ${b.building_name}`
                                        : b.equipment_id ? `Equipment #${b.equipment_id}` : '—'}
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
            )}

            {confirmCancel && (
                <div className="confirm-overlay">
                    <div className="confirm-dialog">
                        <h3>Confirm Cancellation</h3>
                        <p>
                            Cancel reservation <strong>#{confirmCancel.booking_id}</strong> for{' '}
                            <strong>
                                {confirmCancel.first_name || confirmCancel.last_name
                                    ? `${confirmCancel.first_name} ${confirmCancel.last_name}`.trim()
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
