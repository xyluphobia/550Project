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

// Convert a Date object or date string to the value format required by datetime-local inputs
function toDatetimeLocal(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// A reservation can be edited or cancelled only if it is active and hasn't ended yet
function isModifiable(reservation) {
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

    // Cancel state
    const [confirmCancel, setConfirmCancel] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [cancelError, setCancelError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    // Edit state
    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm] = useState({ startTime: '', endTime: '', notes: '', groupSize: '' });
    const [editError, setEditError] = useState('');
    const [editSaving, setEditSaving] = useState(false);

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

    // Cancel handlers
    const handleConfirmCancel = async () => {
        if (!confirmCancel) return;
        const bookingId = confirmCancel.booking_id;
        setConfirmCancel(null);
        setCancelError('');
        setActionSuccess('');
        setCancellingId(bookingId);
        try {
            await axios.patch(`/api/bookings/${bookingId}/student-cancel`, {
                uncw_id: student.uncw_id,
                email: student.email
            });
            setReservations(prev =>
                prev.map(r => r.booking_id === bookingId ? { ...r, status: 'cancelled' } : r)
            );
            setActionSuccess(`Reservation #${bookingId} has been successfully cancelled.`);
        } catch (err) {
            setCancelError(err.response?.data?.error || 'Failed to cancel reservation. Please try again.');
        } finally {
            setCancellingId(null);
        }
    };

    // Edit handlers
    const handleEditClick = (r) => {
        setCancelError('');
        setActionSuccess('');
        setEditError('');
        setEditForm({
            startTime: toDatetimeLocal(r.start_time),
            endTime: toDatetimeLocal(r.end_time),
            notes: r.notes || '',
            groupSize: r.group_size != null ? String(r.group_size) : ''
        });
        setEditTarget(r);
    };

    const handleEditSave = async () => {
        // Client-side validation
        if (!editForm.startTime || !editForm.endTime) {
            setEditError('Start time and end time are required.');
            return;
        }
        const start = new Date(editForm.startTime);
        const end = new Date(editForm.endTime);
        const now = new Date();

        if (start < now) {
            setEditError('Start time cannot be in the past.');
            return;
        }
        if (end < now) {
            setEditError('End time cannot be in the past.');
            return;
        }
        if (start >= end) {
            setEditError('Start time must be before end time.');
            return;
        }

        const groupSize = editForm.groupSize !== '' ? parseInt(editForm.groupSize) : null;
        if (groupSize !== null) {
            if (isNaN(groupSize) || groupSize < 1) {
                setEditError('Group size must be at least 1.');
                return;
            }
            if (editTarget.room_capacity != null && groupSize > editTarget.room_capacity) {
                setEditError(`Group size cannot exceed the room capacity of ${editTarget.room_capacity}.`);
                return;
            }
        }

        setEditSaving(true);
        setEditError('');
        try {
            await axios.patch(`/api/bookings/${editTarget.booking_id}/student-edit`, {
                uncw_id: student.uncw_id,
                email: student.email,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                notes: editForm.notes || null,
                group_size: groupSize
            });

            const bookingId = editTarget.booking_id;
            setReservations(prev => prev.map(r =>
                r.booking_id === bookingId
                    ? { ...r, start_time: start, end_time: end, notes: editForm.notes, group_size: groupSize }
                    : r
            ));
            setActionSuccess(`Reservation #${bookingId} has been successfully updated.`);
            setEditTarget(null);
        } catch (err) {
            setEditError(err.response?.data?.error || 'Failed to update reservation. Please try again.');
        } finally {
            setEditSaving(false);
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
            {actionSuccess && <p className="reservation-success">{actionSuccess}</p>}

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
                                <td className="action-cell">
                                    {isModifiable(r) && (
                                        <>
                                            <button
                                                className="edit-btn"
                                                onClick={() => handleEditClick(r)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="cancel-btn"
                                                onClick={() => { setCancelError(''); setActionSuccess(''); setConfirmCancel(r); }}
                                                disabled={cancellingId === r.booking_id}
                                            >
                                                {cancellingId === r.booking_id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Cancel confirmation dialog */}
            {confirmCancel && (
                <div className="confirm-overlay">
                    <div className="confirm-dialog">
                        <h3>Cancel Reservation</h3>
                        <p>
                            Are you sure you want to cancel reservation{' '}
                            <strong>#{confirmCancel.booking_id}</strong>?
                        </p>
                        <p className="confirm-times">
                            {confirmCancel.room_code && (
                                <span>{confirmCancel.room_code} — {confirmCancel.building_name}<br /></span>
                            )}
                            {formatDate(confirmCancel.start_time)},{' '}
                            {formatTime(confirmCancel.start_time)} – {formatTime(confirmCancel.end_time)}
                        </p>
                        <p className="confirm-warning">This action cannot be undone.</p>
                        <div className="confirm-buttons">
                            <button className="confirm-no-btn" onClick={() => setConfirmCancel(null)}>
                                Keep Reservation
                            </button>
                            <button className="confirm-yes-btn" onClick={handleConfirmCancel}>
                                Yes, Cancel It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit dialog */}
            {editTarget && (
                <div className="confirm-overlay">
                    <div className="confirm-dialog edit-dialog">
                        <h3>Edit Reservation #{editTarget.booking_id}</h3>
                        <p className="confirm-times">
                            {editTarget.room_code
                                ? `${editTarget.room_code} — ${editTarget.building_name}`
                                : 'Room details unavailable'}
                            {editTarget.room_capacity != null && (
                                <span className="room-capacity"> (capacity: {editTarget.room_capacity})</span>
                            )}
                        </p>

                        <div className="edit-form">
                            <div className="edit-field">
                                <label htmlFor="edit-start">Start Time</label>
                                <input
                                    id="edit-start"
                                    type="datetime-local"
                                    value={editForm.startTime}
                                    onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
                                />
                            </div>
                            <div className="edit-field">
                                <label htmlFor="edit-end">End Time</label>
                                <input
                                    id="edit-end"
                                    type="datetime-local"
                                    value={editForm.endTime}
                                    onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))}
                                />
                            </div>
                            <div className="edit-field">
                                <label htmlFor="edit-group">
                                    Group Size
                                    {editTarget.room_capacity != null && (
                                        <span className="field-hint"> (max {editTarget.room_capacity})</span>
                                    )}
                                </label>
                                <input
                                    id="edit-group"
                                    type="number"
                                    min="1"
                                    max={editTarget.room_capacity ?? undefined}
                                    value={editForm.groupSize}
                                    onChange={e => setEditForm(f => ({ ...f, groupSize: e.target.value }))}
                                />
                            </div>
                            <div className="edit-field">
                                <label htmlFor="edit-notes">Notes</label>
                                <textarea
                                    id="edit-notes"
                                    rows={3}
                                    value={editForm.notes}
                                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Optional notes"
                                />
                            </div>
                        </div>

                        {editError && <p className="reservation-error">{editError}</p>}

                        <div className="confirm-buttons">
                            <button
                                className="confirm-no-btn"
                                onClick={() => setEditTarget(null)}
                                disabled={editSaving}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-yes-btn edit-save-btn"
                                onClick={handleEditSave}
                                disabled={editSaving}
                            >
                                {editSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
