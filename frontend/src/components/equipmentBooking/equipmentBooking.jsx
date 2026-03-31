import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {EmailJSConfigEquipment} from '../EmailJS/emailJSConfiguration';
import './equipmentBooking.css';

const EquipmentBooking = () => {
    const [equipmentList, setEquipmentList] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [selectedEquipment, setSelectedEquipment] = React.useState(null);
    const [bookingSuccess, setBookingSuccess] = React.useState(false);
    const [showForm, setShowForm] = React.useState(false);
    
    const backupList = [
        { id: 'laptop-mac', name: 'laptop-MacOS', department: 'TAC'},
        { id: 'laptop-win', name: 'laptop-DelWin', department: 'TAC'},
        { id: 'calc-ti83', name: 'calculator-TI83', department: 'HD'},
        { id: 'calc-ti84', name: 'calculator-TI84', department: 'HD'},
        { id: 'charger-usbc', name: 'charger-laptop-usb-c', department: 'TAC'},
        { id: 'camcorder-1', name: 'camcorder-1', department: 'MS'},
        { id: 'camera-1', name: 'camera-1', department: 'MS'},
    ];

    React.useEffect(() => {
        axios.get('/api/equipment')
            .then(response => {
                if (Array.isArray(response.data)) {
                    setEquipmentList(response.data);
                } else {
                    console.error('Expected array but got:', typeof response.data);
                    setEquipmentList(backupList);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching equipment data:', error);
                setEquipmentList(backupList);
                setLoading(false);
            });
    }, []);

    const equipmentArray = Array.isArray(equipmentList) ? equipmentList : [];

    const handleRentClick = () => {
        setShowForm(true);
    };

    const handleEquipmentSelect = (equipment) => {
        setSelectedEquipment(equipment);
        setBookingSuccess(true);
        setTimeout(() => {
            setBookingSuccess(false);
            setShowForm(false);
            setSelectedEquipment(null);
        }, 3000);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setSelectedEquipment(null);
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

    if (equipmentArray.length === 0) {
          return (
            <div>
                <p>No equipment available at the moment.</p>
                <p>Showing backup equipment list:</p>
                <ul>
                    {backupList.map((item, index) => (
                        <li key={item.id || index}>{item.name} ({item.department})</li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className="equipment-booking-container">
        <p>All equipment is located in the library.</p>
        <div className="equipment-booking-page">
            {/* TAC Section */}
            <div className='tac-equipment'>
                <h2>Technical Assistance Center (TAC)</h2>
                {equipmentArray.filter(item => item.department === 'TAC').length > 0 ? (
                    <ul>
                        {equipmentArray.filter(item => item.department === 'TAC').map((item, index) => (
                            <li key={item.id || `tac-${index}`}>
                                {item.name || 'Unnamed Equipment'}
                                    <button 
                                        className="select-button" 
                                        onClick={() => handleEquipmentSelect(item)}
                                        style={{marginLeft: '10px', padding: '2px 8px'}}
                                    >
                                        Select
                                    </button>
                            </li>
                        ))}
                    </ul>
                ) : ( 
                    <p>No equipment available for TAC at the moment.</p>
                )}
            </div>

            {/* HD Section */}
            <div className='hd-equipment'>
                <h2>Help Desk (HD)</h2>
                {equipmentArray.filter(item => item.department === 'HD').length > 0 ? (
                    <ul>
                        {equipmentArray.filter(item => item.department === 'HD').map((item, index) => (
                            <li key={item.id || `hd-${index}`}>
                                {item.name || 'Unnamed Equipment'}
                                    <button 
                                        className="select-button" 
                                        onClick={() => handleEquipmentSelect(item)}
                                        style={{marginLeft: '10px', padding: '2px 8px'}}
                                    >
                                        Select
                                    </button>
                            </li>
                        ))}
                    </ul>
                ) : ( 
                    <p>No equipment available for HD at the moment.</p>
                )}
            </div>

            {/* MS Section */}
            <div className='ms-equipment'>
                <h2>Makerstudio (MS)</h2>
                {equipmentArray.filter(item => item.department === 'MS').length > 0 ? (
                    <ul>
                        {equipmentArray.filter(item => item.department === 'MS').map((item, index) => (
                            <li key={item.id || `ms-${index}`}>
                                {item.name || 'Unnamed Equipment'}
                                    <button 
                                        className="select-button" 
                                        onClick={() => handleEquipmentSelect(item)}
                                        style={{marginLeft: '10px', padding: '2px 8px'}}
                                    >
                                        Select
                                    </button>
                            </li>
                        ))}
                    </ul>
                ) : ( 
                    <p>No equipment available for MS at the moment.</p>
                )}
            </div>
            <button className="form-button" onClick={handleRentClick}>Rent Equipment</button>
            <button className="reload-button" onClick={() => window.location.reload()}>Reload</button>
        </div>
        </div>
    );
};

export default EquipmentBooking;