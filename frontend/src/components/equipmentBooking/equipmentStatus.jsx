import { useState, useEffect } from 'react';
import axios from 'axios';
import '../roomBookingCalendar/reservationStatus.css'; 

const EquipmentStatus = ({ adminSession }) => {
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
            const response = await axios.get('/api/equipment-bookings/bookings');
            setReservations(response.data);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setError('Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (bookingId) => {
        setProcessingId(bookingId);
        try {
            await axios.patch(`/api/equipment-bookings/bookings/${bookingId}/status`, {
                admin_uncw_id: adminSession?.uncw_id,
                status: 'approved'
            });
            alert('Booking approved successfully!');
            fetchReservations();
        } catch (err) {
            console.error('Error approving booking:', err);
            alert('Failed to approve booking');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        
        setProcessingId(bookingId);
        try {
            await axios.patch(`/api/equipment-bookings/bookings/${bookingId}/cancel`, {
                admin_uncw_id: adminSession?.uncw_id
            });
            alert('Booking cancelled successfully!');
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
                return <span className="status-badge status-approved">✓ Approved</span>;
            case 'pending':
                return <span className="status-badge status-pending">⏳ Pending</span>;
            case 'rejected':
                return <span className="status-badge status-rejected">✗ Rejected</span>;
            case 'cancelled':
                return <span className="status-badge status-cancelled">✗ Cancelled</span>;
            default:
                return <span className="status-badge status-pending">⏳ Pending</span>;
        }
    };

    const formatDateTime = (dt) => {
        if (!dt) return '—';
        return new Date(dt).toLocaleString([], {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return <div className="admin-loading">Loading equipment reservations...</div>;
    if (error) return <div className="admin-error">{error}</div>;

    return (
        <div className="reservation-status-container">
            <div className="admin-panel-header">
                <h2>🖥️ Equipment Reservations</h2>
                {isAdminMode && <span className="admin-panel-user">Admin Mode</span>}
            </div>
            
            {reservations.length === 0 ? (
                <div className="admin-no-bookings">No equipment reservations found.</div>
            ) : (
                <div className="table-responsive">
                    <table className="admin-bookings-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Equipment</th>
                                <th>Departments</th>
                                <th>Booking Date</th>
                                <th>Return Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map((reservation) => {
                                let equipmentNames = [];
                                try {
                                    equipmentNames = JSON.parse(reservation.equipment_names || '[]');
                                } catch {
                                    equipmentNames = [];
                                }
                                
                                const isCancelled = reservation.status?.toLowerCase() === 'cancelled';
                                const isPending = reservation.status?.toLowerCase() === 'pending';
                                const isApproved = reservation.status?.toLowerCase() === 'approved';
                                
                                return (
                                    <tr key={reservation.booking_id} className={isCancelled ? 'row-cancelled' : ''}>
                                        <td>{reservation.booking_id}</td>
                                        <td>{equipmentNames.join(', ') || reservation.equipment_list || '—'}</td>
                                        <td>{reservation.departments || '—'}</td>
                                        <td>{formatDateTime(reservation.booking_date || reservation.start_time)}</td>
                                        <td>{formatDateTime(reservation.return_date || reservation.end_time)}</td>
                                        <td>{getStatusBadge(reservation.status)}</td>
                                        <td>
                                            {isCancelled ? (
                                                <span className="cancelled-label">Cancelled</span>
                                            ) : isAdminMode && isPending ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="approve-btn"
                                                        onClick={() => handleApprove(reservation.booking_id)}
                                                        disabled={processingId === reservation.booking_id}
                                                    >
                                                        {processingId === reservation.booking_id ? '...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={() => handleCancel(reservation.booking_id)}
                                                        disabled={processingId === reservation.booking_id}
                                                    >
                                                        {processingId === reservation.booking_id ? '...' : 'Cancel'}
                                                    </button>
                                                </div>
                                            ) : isAdminMode && isApproved ? (
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

export default EquipmentStatus;