import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import departmentEquipment from './departmentEquipment';
import {EmailJSConfigEquipment} from '../EmailJS/emailJSConfiguration';
import './equipmentBooking.css';

const EquipmentBooking = () => {
    const [equipmentList, setEquipmentList] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [bookingSuccess, setBookingSuccess] = React.useState(false);
    const [showForm, setShowForm] = React.useState(false);
    const [formData, setFormData] = React.useState({});
    const [selectedDepartments, setSelectedDepartments] = React.useState([]);
    const [selectedEquipment, setSelectedEquipment] = React.useState({});

    React.useEffect(() => {
        axios.get('/api/equipment')
            .then(response => {
                if (Array.isArray(response.data)) {
                    setEquipmentList(response.data);
                } else {
                    console.error('Expected array but got:', typeof response.data);
                    setEquipmentList([]);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching equipment data:', error);
                setEquipmentList([]);
                setLoading(false);
            });
    }, []);

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
                // Remove department and its equipment selections
                const newSelection = prev.filter(id => id !== departmentID);
                const newSelectedEquipment = { ...selectedEquipment };
                // Clear equipment for this department
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
        
        // Remove form data if equipment is unchecked
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
        
        // Check if at least one equipment is selected
        const hasSelectedEquipment = Object.values(selectedEquipment).some(value => value !== undefined);
        if (!hasSelectedEquipment) {
            alert('Please select at least one piece of equipment to rent.');
            return;
        }
        
        // Validate required fields for selected equipment
        let isValid = true;
        let missingFields = [];
        
        Object.keys(selectedEquipment).forEach(key => {
            if (selectedEquipment[key]) {
                const [departmentID, equipmentID] = key.split('_');
                const dept = departmentEquipment[departmentID];
                const equipment = dept?.equipment.find(eq => eq.id === parseInt(equipmentID));
                if (equipment && equipment.fields) {
                    equipment.fields.forEach(field => {
                        const value = formData[field.name];
                        if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
                            isValid = false;
                            missingFields.push(`${equipment.name}: ${field.label}`);
                        }
                    });
                }
            }
        });
        
        if (!isValid) {
            alert(`Please fill in the following required fields:\n${missingFields.join('\n')}`);
            return;
        }
        
        // Prepare email data
        const emailData = {
            departments: selectedDepartments.map(dept => {
                const deptInfo = departmentEquipment[dept];
                return {
                    name: deptInfo.name,
                    equipment: Object.keys(selectedEquipment)
                        .filter(key => key.startsWith(dept))
                        .map(key => {
                            const [, equipmentID] = key.split('_');
                            return deptInfo.equipment.find(eq => eq.id === parseInt(equipmentID))?.name;
                        })
                        .filter(name => name)
                };
            }),
            userInfo: formData
        };
        
        console.log('Booking submitted:', emailData);
        
        // Here you would send the email using EmailJS
        setBookingSuccess(true);
        alert('Booking request submitted successfully!');
        setTimeout(() => {
            handleCloseForm();
            setSelectedDepartments([]);
        }, 2000);
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

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">Error loading equipment: {error.message}</p>
                <p>Nothing available at the moment.</p>
                <button onClick={() => window.location.reload()}>Reload</button>
            </div>
        );
    }   

    if (loading) {
        return <p>Loading equipment...</p>;
    }

    return (
        <div className="equipment-booking-container">
            <p>All equipment is located in the library.</p>
            <div className="equipment-booking-page">
                {/* HD Section */}
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

                {/* TAC Section */}
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

                {/* MS Section */}
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
                    
                    <button className="reload-button" onClick={() => {
                        setSelectedDepartments([]);
                        setSelectedEquipment({});
                        setFormData({});
                    }}>
                        Reset All
                    </button>
                </div>
            </div>

            {/* Modal Form Popup */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Equipment Booking Request</h2>
                            <button className="close-button" onClick={handleCloseForm}>×</button>
                        </div>
                        <form onSubmit={handleSubmitForm}>
                            {renderEquipmentInForm()}
                            {renderDynamicFormFields()}
                            <div className="form-actions">
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
        </div>
    );
};

export default EquipmentBooking;