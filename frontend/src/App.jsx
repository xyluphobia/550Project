import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import { useState } from 'react';

function Home() {
    return (
        <div className="app">
            <header>
                <h1>CSC-550</h1>
                <h2>Room / Equipment Booking</h2>
            </header>

            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/equipment">Equipment</Link></li>
                    <li><Link to="/login">Login</Link></li>
                </ul>
            </nav>

            <main>
                <h3>Welcome to CSC-550 Booking System</h3>
                <p>Book rooms and equipment for your projects.</p>
            </main>
            
            <footer>
                <p>&copy; 2026</p>
            </footer>
        </div>
    );
}

function EquipmentPage() {
    return (
        <div className="equipment-page">
            <header>
                <h1>CSC-550</h1>
                <h2>Equipment Booking</h2>
            </header>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/equipment">Equipment</Link></li>
                    <li><Link to="/login">Login</Link></li>
                </ul>
            </nav>
            <main>
                <h3>Available Equipment</h3>
                
            </main>
            <footer>
                <p>&copy; 2026</p>
            </footer>
        </div>
    );
}

function LoginPage() {
    const [isLogin, setIsLogin] = useState(true); // true = login, false = register 
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev =>({...prev, [name]: value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isLogin) {
            console.log('Login attempt:', { email: formData.email });
        } else {
            console.log('Register attempt:', {
                name: formData.name,
                email: formData.email
            });

            // registration logic
        }
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        // clear the form
        setFormData({
            email: '',
            name: '',
            password: '',
            confirmPassword: '',
        });
    };

    return (
        <div className="login-page">
            <header>
                <h1>CSC-550</h1>
                <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
            </header>
            <nav>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/equipment">Equipment</Link></li>
                    <li><Link to="/login">Login</Link></li>
                </ul>
            </nav>

            <main className='auth-container'>
                <div className='form-toggle'>
                    <button 
                        className={`toggle-btn ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}>
                        Login
                    </button>
                    <button 
                        className={`toggle-btn ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}>
                        Create Account
                    </button>
                </div>

                <form className='auth-form' onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="name">Full Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password:</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <button type="submit" className="submit-btn">
                        {isLogin ? 'Login' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-switch">
                    <p>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            type="button" 
                            className="link-btn"
                            onClick={toggleForm}
                        >
                            {isLogin ? 'Create Account' : 'Login'}
                        </button>
                    </p>
                </div>
            </main>

            <footer>
                <p>&copy; 2026</p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/equipment" element={<EquipmentPage />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
