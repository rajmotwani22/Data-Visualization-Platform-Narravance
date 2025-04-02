import React, { useState, useEffect, createContext } from 'react';
//import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import TaskCreator from './components/TaskCreator';
import TaskList from './components/TaskList';
import TaskDetails from './components/TaskDetails';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import './styles/App.css';

// Create Auth Context
export const AuthContext = createContext();

// Login Component
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = React.useContext(AuthContext);
  const navigate = useNavigate();  // Add this line

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const success = await login(username, password);
      if (success) {
        console.log("Login successful, navigating to home");
        navigate('/');  // Add this line to navigate after successful login
      }
    } catch (err) {
      console.error("Login error in component:", err);
      setError('Login failed. Please check your credentials.');
    }
  };
  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = React.useContext(AuthContext);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token
    const token = localStorage.getItem('token');
    if (token) {
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token is valid
      axios.get('http://localhost:8000/api/me')
        .then(response => {
          setUser(response.data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);
// In App.js, modify your login function:
const login = async (username, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    console.log("Sending login request with:", username, password);
    
    const response = await axios.post(
      'http://localhost:8000/api/token', 
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log("Login response:", response.data);
    const { access_token } = response.data;
    
    // Save token and set auth header
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    // Get user info
    const userResponse = await axios.get('http://localhost:8000/api/me');
    setUser(userResponse.data);
    setIsAuthenticated(true);
    
    console.log("Login completed, authentication state:", isAuthenticated);
    return true;  // Return true to indicate success
  } catch (error) {
    console.error("Login error:", error.response?.data || error);
    throw error;
  }
};

  const logout = () => {
    // Clear token and auth state
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const authContextValue = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <Router>
        <div className="app-container">
          <header className="app-header">
            <h1>Data Visualization Platform</h1>
            <nav>
              <ul className="nav-links">
                {isAuthenticated ? (
                  <>
                    <li><Link to="/">Tasks</Link></li>
                    <li><Link to="/create">Create Task</Link></li>
                    <li>
                      <button 
                        onClick={logout}
                        className="logout-button"
                      >
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <li><Link to="/login">Login</Link></li>
                )}
              </ul>
            </nav>
          </header>

          <main className="app-main">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <TaskList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create" 
                element={
                  <ProtectedRoute>
                    <TaskCreator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tasks/:taskId" 
                element={
                  <ProtectedRoute>
                    <TaskDetails />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>Data Visualization Platform © 2025</p>
          </footer>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;