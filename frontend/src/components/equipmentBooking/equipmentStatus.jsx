import { useState, useEffect } from 'react';
import axios from 'axios';
import './equipmentStatus.css';

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
            // Fetch all equipment bookings
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
        switch(status) {
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

    if (loading) return <div className="loading">Loading reservations...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="equipment-status-container">
            <h2>Equipment Reservations</h2>
            
            {reservations.length === 0 ? (
                <p className="no-reservations">No equipment reservations found.</p>
            ) : (
                <div className="reservations-grid">
                    {reservations.map((reservation) => {
                        let equipmentNames = [];
                        try {
                            equipmentNames = JSON.parse(reservation.equipment_names || '[]');
                        } catch {
                            equipmentNames = [];
                        }
                        
                        const userName = `${reservation.first_name || ''} ${reservation.last_name || ''}`.trim() || `UNCW ID: ${reservation.uncw_id}`;
                        
                        return (
                            <div key={reservation.booking_id} className="reservation-card">
                                <div className="reservation-header">
                                    <span className="reservation-id">Booking #{reservation.booking_id}</span>
                                    {getStatusBadge(reservation.status)}
                                </div>
                                
                                <div className="reservation-body">
                                    <p><strong>User:</strong> {userName}</p>
                                    <p><strong>Email:</strong> {reservation.email || 'N/A'}</p>
                                    <p><strong>Equipment:</strong> {equipmentNames.join(', ') || 'N/A'}</p>
                                    <p><strong>Booking Date:</strong> {new Date(reservation.created_at).toLocaleDateString()}</p>
                                    <p><strong>Return By:</strong> {new Date(reservation.end_time).toLocaleDateString()}</p>
                                    {reservation.purpose && <p><strong>Purpose:</strong> {reservation.purpose}</p>}
                                </div>
                                
                                {isAdminMode && reservation.status !== 'approved' && reservation.status !== 'cancelled' && reservation.status !== 'rejected' && (
                                    <div className="reservation-actions">
                                        <button
                                            className="approve-btn"
                                            onClick={() => handleApprove(reservation.booking_id)}
                                            disabled={processingId === reservation.booking_id}
                                        >
                                            {processingId === reservation.booking_id ? 'Processing...' : '✓ Approve'}
                                        </button>
                                        <button
                                            className="cancel-btn"
                                            onClick={() => handleCancel(reservation.booking_id)}
                                            disabled={processingId === reservation.booking_id}
                                        >
                                            {processingId === reservation.booking_id ? 'Processing...' : '✗ Cancel'}
                                        </button>
                                    </div>
                                )}
                                
                                {isAdminMode && reservation.status === 'pending' && (
                                    <div className="reservation-actions">
                                        <button
                                            className="approve-btn"
                                            onClick={() => handleApprove(reservation.booking_id)}
                                            disabled={processingId === reservation.booking_id}
                                        >
                                            {processingId === reservation.booking_id ? 'Processing...' : '✓ Approve'}
                                        </button>
                                        <button
                                            className="cancel-btn"
                                            onClick={() => handleCancel(reservation.booking_id)}
                                            disabled={processingId === reservation.booking_id}
                                        >
                                            {processingId === reservation.booking_id ? 'Processing...' : '✗ Cancel'}
                                        </button>
                                    </div>
                                )}
                                
                                {isAdminMode && reservation.status === 'approved' && (
                                    <div className="reservation-actions">
                                        <button
                                            className="cancel-btn"
                                            onClick={() => handleCancel(reservation.booking_id)}
                                            disabled={processingId === reservation.booking_id}
                                        >
                                            {processingId === reservation.booking_id ? 'Processing...' : 'Cancel Booking'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EquipmentStatus;