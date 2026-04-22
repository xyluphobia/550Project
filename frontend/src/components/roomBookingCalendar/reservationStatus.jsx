import { useState, useEffect } from 'react';
import axios from 'axios';
import './reservationStatus.css';

const ReservationStatus = ({ adminSession }) => {
    const isAdminMode = !!adminSession;
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/bookings');
            setReservations(response.data);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setError('Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this room booking?')) return;
        
        setProcessingId(bookingId);
        try {
            await axios.patch(`/api/bookings/${bookingId}/cancel`, {
                admin_uncw_id: adminSession?.uncw_id
            });
            alert('Room booking cancelled successfully!');
            fetchReservations();
        } catch (err) {
            console.error('Error cancelling booking:', err);
            alert('Failed to cancel booking');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch(status?.toLowerCase()) {
            case 'approved':
            case 'confirmed':
                return <span className="status-badge status-approved">✓ Confirmed</span>;
            case 'active':
                return <span className="status-badge status-active">● Active</span>;
            case 'pending':
                return <span className="status-badge status-pending">⏳ Pending</span>;
            case 'cancelled':
                return <span className="status-badge status-cancelled">✗ Cancelled</span>;
            case 'rejected':
                return <span className="status-badge status-rejected">✗ Rejected</span>;
            default:
                return <span className="status-badge status-pending">⏳ {status || 'Pending'}</span>;
        }
    };

    const formatDateTime = (dt) => {
        if (!dt) return '—';
        return new Date(dt).toLocaleString([], {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return <div className="admin-loading">Loading room reservations...</div>;
    if (error) return <div className="admin-error">{error}</div>;

    return (
        <div className="reservation-status-container">
            <div className="admin-panel-header">
                <h2>🏢 Room Reservations</h2>
                {isAdminMode && <span className="admin-panel-user">Admin Mode</span>}
            </div>
            
            {reservations.length === 0 ? (
                <div className="admin-no-bookings">No room reservations found.</div>
            ) : (
                <div className="table-responsive">
                    <table className="admin-bookings-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Room</th>
                                <th>Building</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map((reservation) => {
                                const isCancelled = reservation.status?.toLowerCase() === 'cancelled';
                                const isEnded = new Date(reservation.end_time) < new Date();
                                
                                return (
                                    <tr key={reservation.booking_id} className={isCancelled ? 'row-cancelled' : ''}>
                                        <td>{reservation.booking_id}</td>
                                        <td>
                                            {reservation.room_code || `Room ${reservation.room_id}`}
                                        </td>
                                        <td>{reservation.building_name || '—'}</td>
                                        <td>{formatDateTime(reservation.start_time)}</td>
                                        <td>{formatDateTime(reservation.end_time)}</td>
                                        <td>{getStatusBadge(reservation.status)}</td>
                                        <td>
                                            {isCancelled ? (
                                                <span className="cancelled-label">Cancelled</span>
                                            ) : isEnded ? (
                                                <span className="ended-label">Ended</span>
                                            ) : isAdminMode ? (
                                                <button
                                                    className="cancel-btn"
                                                    onClick={() => handleCancel(reservation.booking_id)}
                                                    disabled={processingId === reservation.booking_id}
                                                >
                                                    {processingId === reservation.booking_id ? '...' : 'Cancel'}
                                                </button>
                                            ) : (
                                                <span className="ended-label">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReservationStatus;