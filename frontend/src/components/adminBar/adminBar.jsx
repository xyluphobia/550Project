import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AdminBar.css';

const AdminBar = ({ adminSession, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showLoginDropdown, setShowLoginDropdown] = useState(false);
    const [inputId, setInputId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const isAdminPage = location.pathname === '/admin';
    const isAdminMode = !!adminSession;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowLoginDropdown(false);
                setError('');
                setInputId('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdminClick = () => {
        if (adminSession) {
            navigate('/admin');
        } else {
            setShowLoginDropdown(prev => !prev);
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
            const adminData = { 
                uncw_id: user.uncw_id, 
                first_name: user.first_name,
                last_name: user.last_name,
                name: `${user.first_name} ${user.last_name}`
            };
            localStorage.setItem('adminSession', JSON.stringify(adminData));
            setShowLoginDropdown(false);
            setInputId('');
            navigate('/admin');
            window.location.reload();
        } catch {
            setError('Failed to verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminSession');
        onLogout();
        navigate('/');
        window.location.reload();
    };

    return (
        <div 
            className={`admin-bar ${isExpanded ? 'expanded' : 'collapsed'}`}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <div className="admin-bar-content">
                <div className="admin-icon" onClick={handleAdminClick}>
                    {isAdminMode ? '👑' : '🔒'}
                </div>
                
                {isExpanded && (
                    <div className="admin-info">
                        {isAdminMode ? (
                            <>
                                <span className="admin-name">
                                    {adminSession.first_name} {adminSession.last_name}
                                </span>
                                {!isAdminPage && (
                                    <button 
                                        className="admin-go-btn"
                                        onClick={() => navigate('/admin')}
                                    >
                                        Go to Admin
                                    </button>
                                )}
                                <button className="admin-logout-btn" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <span className="admin-login-prompt" onClick={handleAdminClick}>
                                Click 🔒 to login as admin
                            </span>
                        )}
                    </div>
                )}
            </div>

            {showLoginDropdown && (
                <div className="admin-login-dropdown" ref={dropdownRef}>
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
        </div>
    );
};

export default AdminBar;