import { useState } from 'react';
import axios from 'axios';
import './MyReservations.css';

function formatDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function isCancellable(reservation) {
    return reservation.status === 'active' && new Date(reservation.end_time) > new Date();
}

export default function MyReservations() {
    const [uncwId, setUncwId] = useState('');
    const [email, setEmail] = useState('');
    const [student, setStudent] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [loginError, setLoginError] = useState('');
    const [fetchError, setFetchError] = useState('');
    const [loading, setLoading] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [cancellingId, setCancellingId] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!uncwId || !email) {
            setLoginError('Please enter your UNCW ID and email.');
            return;
        }
        setLoading(true);
        setLoginError('');
        setFetchError('');

        let verifiedStudent = null;

        try {
            const verifyRes = await axios.post('/api/users/verify', {
                uncw_id: parseInt(uncwId),
                email: email.trim()
            });
            verifiedStudent = verifyRes.data;
        } catch (err) {
            if (err.response?.status === 401) {
                setLoginError('No account found with that UNCW ID and email.');
            } else if (err.response?.status === 400) {
                setLoginError(err.response.data.error || 'Invalid input.');
            } else {
                setLoginError('Unable to connect to the server. Please try again.');
            }
            setLoading(false);
            return;
        }

        try {
            const bookingsRes = await axios.get(`/api/bookings/user/${verifiedStudent.uncw_id}`);
            setReservations(bookingsRes.data);
            setStudent(verifiedStudent);
        } catch {
            setFetchError('Failed to load your reservations. Please try again.');
            setStudent(verifiedStudent);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        setCancelError('');
        setCancellingId(bookingId);
        try {
            await axios.patch(`/api/bookings/${bookingId}/student-cancel`, {
                uncw_id: student.uncw_id,
                email: student.email
            });
            setReservations(prev =>
                prev.map(r => r.booking_id === bookingId ? { ...r, status: 'cancelled' } : r)
            );
        } catch (err) {
            setCancelError(err.response?.data?.error || 'Failed to cancel reservation. Please try again.');
        } finally {
            setCancellingId(null);
        }
    };

    if (!student) {
        return (
            <div className="my-reservations">
                <h2>My Reservations</h2>
                <p>Enter your UNCW ID and email to view your reservation history.</p>
                <form className="reservation-login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="uncw-id">UNCW ID</label>
                        <input
                            id="uncw-id"
                            type="number"
                            placeholder="e.g. 850600010"
                            value={uncwId}
                            onChange={e => setUncwId(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="res-email">Email</label>
                        <input
                            id="res-email"
                            type="email"
                            placeholder="e.g. student@uncw.edu"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    {loginError && <p className="reservation-error">{loginError}</p>}
                    <button type="submit" className="reservation-btn" disabled={loading}>
                        {loading ? 'Verifying...' : 'View My Reservations'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="my-reservations">
            <div className="reservation-header">
                <h2>My Reservations</h2>
                <span className="reservation-student-name">
                    {student.first_name} {student.last_name}
                </span>
            </div>

            {fetchError && <p className="reservation-error">{fetchError}</p>}
            {cancelError && <p className="reservation-error">{cancelError}</p>}

            {!fetchError && reservations.length === 0 ? (
                <p className="reservation-empty">You have no reservation history.</p>
            ) : (
                <table className="reservation-table">
                    <thead>
                        <tr>
                            <th>Reservation ID</th>
                            <th>Room</th>
                            <th>Date</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map(r => (
                            <tr key={r.booking_id}>
                                <td>{r.booking_id}</td>
                                <td>{r.room_code ? `${r.room_code} — ${r.building_name}` : '—'}</td>
                                <td>{formatDate(r.start_time)}</td>
                                <td>{formatTime(r.start_time)}</td>
                                <td>{formatTime(r.end_time)}</td>
                                <td>
                                    {(() => {
                                        const ended = r.status === 'active' && new Date(r.end_time) <= new Date();
                                        const label = ended ? 'Ended' : r.status.charAt(0).toUpperCase() + r.status.slice(1);
                                        const cls = ended ? 'status-ended' : `status-${r.status}`;
                                        return <span className={`status-badge ${cls}`}>{label}</span>;
                                    })()}
                                </td>
                                <td>
                                    {isCancellable(r) && (
                                        <button
                                            className="cancel-btn"
                                            onClick={() => handleCancel(r.booking_id)}
                                            disabled={cancellingId === r.booking_id}
                                        >
                                            {cancellingId === r.booking_id ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
