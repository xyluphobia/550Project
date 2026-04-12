import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';

const Navbar = ({ adminSession, onLogin, onLogout }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [inputId, setInputId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const isOnAdminPage = location.pathname === '/admin';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
                setError('');
                setInputId('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdminButtonClick = () => {
        if (adminSession) {
            navigate('/admin');
        } else {
            setShowDropdown(prev => !prev);
            setError('');
            setInputId('');
        }
    };

    const handleLogin = async () => {
        if (!inputId) {
            setError('Enter your UNCW ID.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('/api/users');
            const user = response.data.find(u => u.uncw_id === parseInt(inputId));
            if (!user) {
                setError('User not found.');
                return;
            }
            if (user.role !== 'admin') {
                setError('Access denied. Admin role required.');
                return;
            }
            onLogin({ uncw_id: user.uncw_id, name: `${user.first_name} ${user.last_name}` });
            setShowDropdown(false);
            setInputId('');
            navigate('/admin');
        } catch {
            setError('Failed to verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    return (
        <nav>
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/equipment">Equipment</Link></li>
                <li><Link to="/my-reservations">My Reservations</Link></li>
                <li className="admin-nav-item" ref={dropdownRef}>
                    {isOnAdminPage && adminSession ? (
                        <button className="nav-logout-btn" onClick={handleLogout}>
                            Log Out
                        </button>
                    ) : (
                        <>
                            <button
                                className={`nav-admin-btn ${adminSession ? 'nav-admin-btn--logged-in' : ''}`}
                                onClick={handleAdminButtonClick}
                            >
                                {adminSession ? `Admin: ${adminSession.name}` : 'Admin'}
                            </button>

                            {showDropdown && (
                                <div className="admin-dropdown">
                                    <p className="admin-dropdown-title">Admin Login</p>
                                    <input
                                        type="number"
                                        placeholder="Enter UNCW ID"
                                        value={inputId}
                                        onChange={e => setInputId(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                        autoFocus
                                    />
                                    {error && <p className="admin-dropdown-error">{error}</p>}
                                    <button
                                        className="admin-dropdown-btn"
                                        onClick={handleLogin}
                                        disabled={loading}
                                    >
                                        {loading ? 'Verifying...' : 'Log In'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
