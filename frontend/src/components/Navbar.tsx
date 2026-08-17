import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="font-bold text-2xl">
            🙏 Church Connect
          </Link>
          <div className="flex space-x-4 items-center">
            <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">
              Home
            </Link>
            <Link to="/events" className="hover:bg-blue-700 px-3 py-2 rounded">
              Events
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link to={`/profile/${user.id}`} className="hover:bg-blue-700 px-3 py-2 rounded">
                  {user.firstName || user.name}
                </Link>
                <button onClick={handleLogout} className="hover:bg-blue-700 px-3 py-2 rounded" type="button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:bg-blue-700 px-3 py-2 rounded">
                  Login
                </Link>
                <Link to="/register" className="hover:bg-blue-700 px-3 py-2 rounded">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
