import React from 'react';
import axios from 'axios';
import departmentEquipment from './departmentEquipment';
import './equipmentBooking.css';

const EquipmentBooking = ({ adminSession }) => {
    const isAdminMode = !!adminSession;
    
    const [equipmentList, setEquipmentList] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [bookingSuccess, setBookingSuccess] = React.useState(false);
    const [showForm, setShowForm] = React.useState(false);
    const [formData, setFormData] = React.useState({});
    const [selectedDepartments, setSelectedDepartments] = React.useState([]);
    const [selectedEquipment, setSelectedEquipment] = React.useState({});
    
    // Admin state
    const [showAdminView, setShowAdminView] = React.useState(false);
    const [equipmentBookings, setEquipmentBookings] = React.useState([]);
    const [loadingBookings, setLoadingBookings] = React.useState(false);
    const [selectedBookingForCancel, setSelectedBookingForCancel] = React.useState(null);
    const [showCancelDialog, setShowCancelDialog] = React.useState(false);
    
    // Status change state
    const [selectedStatusBooking, setSelectedStatusBooking] = React.useState(null);
    const [showStatusDialog, setShowStatusDialog] = React.useState(false);
    const [newStatus, setNewStatus] = React.useState('');

    React.useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            const response = await axios.get('/api/equipment');
            if (Array.isArray(response.data)) {
                setEquipmentList(response.data);
            } else {
                setEquipmentList([]);
            }
        } catch (error) {
            console.error('Error fetching equipment:', error);
            setError('Failed to load equipment');
            setEquipmentList([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEquipmentBookings = React.useCallback(async () => {
        if (!isAdminMode) return;
        
        setLoadingBookings(true);
        try {
            const response = await axios.get('/api/equipment-bookings/bookings');
            setEquipmentBookings(response.data);
        } catch (err) {
            console.error('Error fetching equipment bookings:', err);
            setEquipmentBookings([]);
        } finally {
            setLoadingBookings(false);
        }
    }, [isAdminMode]);

    React.useEffect(() => {
        if (isAdminMode && showAdminView) {
            fetchEquipmentBookings();
        }
    }, [isAdminMode, showAdminView, fetchEquipmentBookings]);

    const handleRentClick = () => {
        if (selectedDepartments.length === 0) {
            alert('Please select at least one department first.');
            return;
        }
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedEquipment({});
        setFormData({});
        setBookingSuccess(false);
    };

    const handleDepartmentCheckbox = (departmentID) => {
        setSelectedDepartments(prev => {
            if (prev.includes(departmentID)) {
                const newSelection = prev.filter(id => id !== departmentID);
                const newSelectedEquipment = { ...selectedEquipment };
                Object.keys(newSelectedEquipment).forEach(key => {
                    if (key.startsWith(departmentID)) {
                        delete newSelectedEquipment[key];
                    }
                });
                setSelectedEquipment(newSelectedEquipment);
                return newSelection;
            } else {
                if (prev.length >= 3) {
                    alert('You can only select up to 3 departments. Please deselect one first.');
                    return prev;
                }
                return [...prev, departmentID];
            }
        });
    };

    const handleEquipmentCheckbox = (departmentID, equipmentID, equipmentName, checked) => {
        const equipmentKey = `${departmentID}_${equipmentID}`;
        
        setSelectedEquipment(prev => ({
            ...prev,
            [equipmentKey]: checked ? equipmentName : undefined
        }));
        
        if (!checked) {
            const newFormData = { ...formData };
            const dept = departmentEquipment[departmentID];
            const equipment = dept?.equipment.find(eq => eq.id === equipmentID);
            if (equipment && equipment.fields) {
                equipment.fields.forEach(field => {
                    delete newFormData[field.name];
                });
            }
            setFormData(newFormData);
        }
    };

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleCheckboxArrayChange = (fieldName, option, checked) => {
        const currentValue = formData[fieldName] || [];
        let newValues;
        if (checked) {
            newValues = [...currentValue, option];
        } else {
            newValues = currentValue.filter(item => item !== option);
        }
        setFormData(prev => ({
            ...prev,
            [fieldName]: newValues
        }));
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        
        const hasSelectedEquipment = Object.values(selectedEquipment).some(value => value !== undefined);
        if (!hasSelectedEquipment) {
            alert('Please select at least one piece of equipment to rent.');
            return;
        }
        
        // Validate user info fields
        if (!formData.fullName || !formData.uncwId || !formData.email) {
            alert('Please fill in all required user fields: Name, UNCW ID, and Email');
            return;
        }
        
        // Collect equipment IDs and names
        const equipmentIds = [];
        const equipmentNames = [];
        
        Object.keys(selectedEquipment).forEach(key => {
            if (selectedEquipment[key]) {
                const [departmentID, equipmentID] = key.split('_');
                equipmentIds.push(parseInt(equipmentID));
                equipmentNames.push(selectedEquipment[key]);
            }
        });
        
        // Prepare booking data for backend
        const bookingData = {
            uncw_id: parseInt(formData.uncwId),
            first_name: formData.fullName.split(' ')[0] || '',
            last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
            email: formData.email,
            phone: formData.phone || '',
            equipment_ids: equipmentIds,
            equipment_names: equipmentNames,
            departments: selectedDepartments,
            return_date: formData.returnDate || null,
            purpose: formData.purpose || '',
            notes: JSON.stringify(formData)
        };
        
        console.log('Submitting booking:', bookingData);
        
        try {
            const response = await axios.post('/api/equipment-bookings/bookings', bookingData);            
            if (response.data) {
                alert('Equipment booking submitted successfully!');
                setBookingSuccess(true);
                setTimeout(() => {
                    handleCloseForm();
                    setSelectedDepartments([]);
                    if (isAdminMode && showAdminView) {
                        fetchEquipmentBookings();
                    }
                }, 2000);
            }
        } catch (err) {
            console.error('Error submitting booking:', err);
            alert('Failed to submit booking: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            await axios.patch(`/api/equipment-bookings/bookings/${bookingId}/cancel`, {
                admin_uncw_id: adminSession?.uncw_id
            });
            alert('Booking cancelled successfully!');
            fetchEquipmentBookings();
            setShowCancelDialog(false);
            setSelectedBookingForCancel(null);
        } catch (err) {
            console.error('Error cancelling booking:', err);
            alert('Failed to cancel booking: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleStatusChange = async (bookingId, status) => {
        try {
            await axios.patch(`/api/equipment-bookings/bookings/${bookingId}/status`, {
                admin_uncw_id: adminSession?.uncw_id,
                status: status
            });
            alert(`Booking status changed to ${status}!`);
            fetchEquipmentBookings();
            setShowStatusDialog(false);
            setSelectedStatusBooking(null);
        } catch (err) {
            console.error('Error changing status:', err);
            alert('Failed to change status: ' + (err.response?.data?.error || err.message));
        }
    };

    const renderEquipmentInForm = () => {
        if (selectedDepartments.length === 0) return null;
        
        return (
            <div className="equipment-selection-section">
                <h3>Select Equipment</h3>
                {selectedDepartments.map(deptID => {
                    const dept = departmentEquipment[deptID];
                    if (!dept) return null;
                    
                    return (
                        <div key={deptID} className="department-equipment-section">
                            <h4>{dept.name}</h4>
                            <div className="equipment-checkboxes">
                                {dept.equipment.map(equipment => {
                                    const equipmentKey = `${deptID}_${equipment.id}`;
                                    return (
                                        <label key={equipment.id} className="equipment-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={!!selectedEquipment[equipmentKey]}
                                                onChange={(e) => handleEquipmentCheckbox(
                                                    deptID,
                                                    equipment.id,
                                                    equipment.name,
                                                    e.target.checked
                                                )}
                                            />
                                            {equipment.name}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDynamicFormFields = () => {
        const equipmentFields = [];
        
        Object.keys(selectedEquipment).forEach(key => {
            if (selectedEquipment[key]) {
                const [departmentID, equipmentID] = key.split('_');
                const dept = departmentEquipment[departmentID];
                const equipment = dept?.equipment.find(eq => eq.id === parseInt(equipmentID));
                if (equipment && equipment.fields) {
                    equipmentFields.push({
                        equipmentName: equipment.name,
                        fields: equipment.fields,
                        key: key
                    });
                }
            }
        });
        
        if (equipmentFields.length === 0) return null;
        
        return (
            <div className="equipment-info-section">
                <h3>Equipment Information</h3>
                {equipmentFields.map(equip => (
                    <div key={equip.key} className="equipment-form-group">
                        <h4>{equip.equipmentName}</h4>
                        {equip.fields.map(field => {
                            if (field.type === 'text' || field.type === 'date' || field.type === 'number' || field.type === 'email') {
                                return (
                                    <div key={field.name} className="form-field">
                                        <label>{field.label}{field.required && ' *'}</label>
                                        <input
                                            type={field.type}
                                            value={formData[field.name] || ''}
                                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                                            required={field.required}
                                            placeholder={field.placeholder || ''}
                                        />
                                    </div>
                                );
                            } else if (field.type === 'textarea') {
                                return (
                                    <div key={field.name} className="form-field">
                                        <label>{field.label}{field.required && ' *'}</label>
                                        <textarea
                                            value={formData[field.name] || ''}
                                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                                            required={field.required}
                                            rows={3}
                                            placeholder={field.placeholder || ''}
                                        />
                                    </div>
                                );
                            } else if (field.type === 'checkbox-group' && field.options) {
                                return (
                                    <div key={field.name} className="form-field">
                                        <label>{field.label}{field.required && ' *'}</label>
                                        <div className="checkbox-group">
                                            {field.options.map(option => (
                                                <label key={option}>
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData[field.name] || []).includes(option)}
                                                        onChange={(e) => handleCheckboxArrayChange(field.name, option, e.target.checked)}
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                ))}
            </div>
        );
    };

    const renderAdminBookingsView = () => {
        if (!isAdminMode || !showAdminView) return null;

        const formatDateTime = (dt) => {
            if (!dt) return '—';
            return new Date(dt).toLocaleString([], {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        };

        return (
            <div className="admin-equipment-view">
                <div className="admin-view-header">
                    <h3>Equipment Reservations</h3>
                    <button 
                        className="close-admin-view-btn"
                        onClick={() => setShowAdminView(false)}
                    >
                        Back to Booking
                    </button>
                </div>
                
                {loadingBookings ? (
                    <div className="admin-loading">Loading reservations...</div>
                ) : (
                    <table className="admin-equipment-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User</th>
                                <th>Equipment</th>
                                <th>Departments</th>
                                <th>Booking Date</th>
                                <th>Return Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipmentBookings.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="admin-no-bookings">No equipment reservations found.</td>
                                </tr>
                            )}
                            {equipmentBookings.map(booking => {
                                let equipmentNames = [];
                                try {
                                    equipmentNames = JSON.parse(booking.equipment_names || '[]');
                                } catch {
                                    equipmentNames = [];
                                }
                                
                                let departments = [];
                                try {
                                    departments = JSON.parse(booking.departments || '[]');
                                } catch {
                                    departments = [];
                                }
                                
                                return (
                                    <tr key={booking.booking_id} className={booking.status === 'cancelled' ? 'row-cancelled' : ''}>
                                        <td>{booking.booking_id}</td>
                                        <td>
                                            {booking.first_name || booking.last_name
                                                ? `${booking.first_name || ''} ${booking.last_name || ''}`.trim()
                                                : booking.uncw_id}
                                            <br />
                                            <span className="admin-sub">ID: {booking.uncw_id}</span>
                                            <br />
                                            <span className="admin-sub">{booking.email}</span>
                                        </td>
                                        <td>{equipmentNames.join(', ') || '—'}</td>
                                        <td>{departments.join(', ') || '—'}</td>
                                        <td>{formatDateTime(booking.created_at)}</td>
                                        <td>{formatDateTime(booking.end_time)}</td>
                                        <td>
                                            <span className={`status-badge status-${booking.status || 'active'}`}>
                                                {booking.status || 'active'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="admin-action-buttons">
                                                {booking.status !== 'cancelled' && (
                                                    <>
                                                        <button
                                                            className="status-btn status-active-btn"
                                                            onClick={() => {
                                                                setSelectedStatusBooking(booking);
                                                                setNewStatus('active');
                                                                setShowStatusDialog(true);
                                                            }}
                                                            title="Set to Active"
                                                        >
                                                            ✓ Active
                                                        </button>
                                                        <button
                                                            className="status-btn status-pending-btn"
                                                            onClick={() => {
                                                                setSelectedStatusBooking(booking);
                                                                setNewStatus('pending');
                                                                setShowStatusDialog(true);
                                                            }}
                                                            title="Set to Pending"
                                                        >
                                                            ⏳ Pending
                                                        </button>
                                                        <button
                                                            className="status-btn status-completed-btn"
                                                            onClick={() => {
                                                                setSelectedStatusBooking(booking);
                                                                setNewStatus('completed');
                                                                setShowStatusDialog(true);
                                                            }}
                                                            title="Set to Completed"
                                                        >
                                                            ✔ Completed
                                                        </button>
                                                        <button
                                                            className="cancel-btn"
                                                            onClick={() => {
                                                                setSelectedBookingForCancel(booking);
                                                                setShowCancelDialog(true);
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {booking.status === 'cancelled' && (
                                                    <span className="cancelled-label">Cancelled</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        );
    };

    const renderCancelDialog = () => {
        if (!showCancelDialog || !selectedBookingForCancel) return null;

        const { booking_id, first_name, last_name, uncw_id, equipment_names } = selectedBookingForCancel;
        let equipmentList = [];
        try {
            equipmentList = JSON.parse(equipment_names || '[]');
        } catch {
            equipmentList = [];
        }
        
        const name = (first_name || last_name)
            ? `${first_name || ''} ${last_name || ''}`.trim()
            : `UNCW ID ${uncw_id}`;

        return (
            <div className="booking-form-overlay" onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setShowCancelDialog(false);
                    setSelectedBookingForCancel(null);
                }
            }}>
                <div className="booking-form block-edit-dialog">
                    <button
                        className="block-edit-close-btn"
                        onClick={() => {
                            setShowCancelDialog(false);
                            setSelectedBookingForCancel(null);
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                    <h2>Cancel Equipment Booking</h2>
                    <div className="booking-location">
                        <p><strong>Booking #{booking_id}</strong></p>
                        <p><strong>User:</strong> {name}</p>
                        <p><strong>Equipment:</strong> {equipmentList.join(', ')}</p>
                        <p><strong>Date:</strong> {new Date(selectedBookingForCancel.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="block-info-text" style={{ borderColor: '#b66000', background: '#fff8ee' }}>
                        This will cancel the equipment reservation and make it available for others.
                    </p>
                    <div className="form-buttons" style={{ marginTop: '16px' }}>
                        <button type="button" onClick={() => {
                            setShowCancelDialog(false);
                            setSelectedBookingForCancel(null);
                        }}>
                            Keep Booking
                        </button>
                        <button
                            type="button"
                            className="block-submit-btn"
                            onClick={() => handleCancelBooking(selectedBookingForCancel.booking_id)}
                        >
                            Cancel Booking
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderStatusDialog = () => {
        if (!showStatusDialog || !selectedStatusBooking) return null;

        const { booking_id, first_name, last_name, equipment_names } = selectedStatusBooking;
        let equipmentList = [];
        try {
            equipmentList = JSON.parse(equipment_names || '[]');
        } catch {
            equipmentList = [];
        }
        
        const name = (first_name || last_name)
            ? `${first_name || ''} ${last_name || ''}`.trim()
            : `UNCW ID ${selectedStatusBooking.uncw_id}`;

        const statusOptions = ['active', 'pending', 'completed', 'cancelled'];
        const statusColors = {
            active: '#4CAF50',
            pending: '#FF9800',
            completed: '#2196F3',
            cancelled: '#f44336'
        };

        return (
            <div className="booking-form-overlay" onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setShowStatusDialog(false);
                    setSelectedStatusBooking(null);
                }
            }}>
                <div className="booking-form status-dialog">
                    <button
                        className="block-edit-close-btn"
                        onClick={() => {
                            setShowStatusDialog(false);
                            setSelectedStatusBooking(null);
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                    <h2>Change Booking Status</h2>
                    <div className="booking-location">
                        <p><strong>Booking #{booking_id}</strong></p>
                        <p><strong>User:</strong> {name}</p>
                        <p><strong>Equipment:</strong> {equipmentList.join(', ')}</p>
                    </div>
                    
                    <div className="status-options">
                        <h3>Select New Status:</h3>
                        <div className="status-buttons">
                            {statusOptions.map(option => (
                                <button
                                    key={option}
                                    className={`status-option-btn ${newStatus === option ? 'selected' : ''}`}
                                    style={{ backgroundColor: statusColors[option] }}
                                    onClick={() => setNewStatus(option)}
                                >
                                    {option.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-buttons" style={{ marginTop: '20px' }}>
                        <button type="button" onClick={() => {
                            setShowStatusDialog(false);
                            setSelectedStatusBooking(null);
                        }}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="submit-booking-btn"
                            onClick={() => handleStatusChange(selectedStatusBooking.booking_id, newStatus)}
                        >
                            Update Status
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleResetAll = () => {
        setSelectedDepartments([]);
        setSelectedEquipment({});
        setFormData({});
    };

    if (loading) {
        return <p>Loading equipment...</p>;
    }

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">Error loading equipment: {error}</p>
                <button onClick={fetchEquipment}>Retry</button>
            </div>
        );
    }

    // Show admin view if active
    if (isAdminMode && showAdminView) {
        return (
            <div className="equipment-booking-container">
                {renderAdminBookingsView()}
                {renderCancelDialog()}
                {renderStatusDialog()}
            </div>
        );
    }

    return (
        <div className="equipment-booking-container">
            {isAdminMode && (
                <div className="admin-mode-header">
                    <button 
                        className="admin-view-bookings-btn"
                        onClick={() => setShowAdminView(true)}
                    >
                        View All Equipment Reservations
                    </button>
                    <span className="admin-badge">Admin Mode</span>
                </div>
            )}
            
            <p>All equipment is located in the library.</p>
            <div className="equipment-booking-page">
                <div className='hd-equipment department-card'>
                    <h2>Help Desk (HD)</h2>
                    <div className="department-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedDepartments.includes('HD')}
                                onChange={() => handleDepartmentCheckbox('HD')}
                            />
                            Select HD Department
                        </label>
                    </div>
                    <p>Available equipment:</p>
                    <ul>
                        <li>Calculator</li>
                        <li>Kindle</li>
                        <li>Dvd Player</li>
                        <li>Media Cart</li>
                    </ul>
                </div>

                <div className='tac-equipment department-card'>
                    <h2>Technical Assistance Center (TAC)</h2>
                    <div className="department-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedDepartments.includes('TAC')}
                                onChange={() => handleDepartmentCheckbox('TAC')}
                            />
                            Select TAC Department
                        </label>
                    </div>
                    <p>Available equipment:</p>
                    <ul>
                        <li>Dell (Windows - OS)</li>
                        <li>Macbook (MacOS - OS)</li>
                        <li>Usb-C Chargers</li>
                    </ul>
                </div>

                <div className='ms-equipment department-card'>
                    <h2>Makerstudio (MS)</h2>
                    <div className="department-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedDepartments.includes('MS')}
                                onChange={() => handleDepartmentCheckbox('MS')}
                            />
                            Select MS Department
                        </label>
                    </div>
                    <p>Available equipment:</p>
                    <ul>
                        <li>Camera</li>
                        <li>Camcorder</li>
                    </ul>
                </div>
                
                <div className="buttons-container">
                    <button 
                        className="form-button" 
                        onClick={handleRentClick}
                        disabled={selectedDepartments.length === 0}
                    >
                        Continue to Equipment Selection ({selectedDepartments.length}/3 departments)
                    </button>
                    
                    <button className="reload-button" onClick={handleResetAll}>
                        Reset All
                    </button>
                </div>
            </div>

            {/* Modal Form Popup */}
            {showForm && (
                <div className="booking-form-overlay">
                    <div className="booking-form equipment-booking-form">
                        <button
                            className="booking-form-close-btn"
                            onClick={handleCloseForm}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <h2>Equipment Booking Request</h2>
                        <form onSubmit={handleSubmitForm}>
                            {/* User Information Section */}
                            <div className="user-info-section">
                                <h3>Your Information</h3>
                                <input
                                    type="text"
                                    placeholder="Full Name *"
                                    value={formData.fullName || ''}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="UNCW ID *"
                                    value={formData.uncwId || ''}
                                    onChange={(e) => handleInputChange('uncwId', e.target.value)}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email Address *"
                                    value={formData.email || ''}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number (Optional)"
                                    value={formData.phone || ''}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                />
                                <input
                                    type="date"
                                    placeholder="Expected Return Date"
                                    value={formData.returnDate || ''}
                                    onChange={(e) => handleInputChange('returnDate', e.target.value)}
                                />
                                <textarea
                                    placeholder="Purpose of Equipment Use (Optional)"
                                    value={formData.purpose || ''}
                                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                                    rows="3"
                                />
                            </div>
                            
                            {renderEquipmentInForm()}
                            {renderDynamicFormFields()}
                            
                            <div className="form-buttons">
                                <button type="submit" className="submit-button">
                                    Submit Booking Request
                                </button>
                                <button type="button" className="cancel-button" onClick={handleCloseForm}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {renderCancelDialog()}
            {renderStatusDialog()}
        </div>
    );
};

export default EquipmentBooking;