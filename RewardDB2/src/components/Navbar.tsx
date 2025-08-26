

import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';
import './Navbar.css';

export const Navbar = () => {
  // Debug: log user object to console
  const auth = getAuth();
  const [user] = useAuthState(auth);
  // Debug: log user object to console
  useEffect(() => {
    console.log('[Navbar] user:', user);
  }, [user]);
  // Debug: log user object to console
  useEffect(() => {
    console.log('[Navbar] user:', user);
  }, [user]);
  // Debug: log user object to console
  useEffect(() => {
    console.log('[Navbar] user:', user);
  }, [user]);
  // Debug: log user object to console
  useEffect(() => {
    console.log('[Navbar] user:', user);
  }, [user]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // ...existing code...

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    signOut(auth);
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__logo">
          <i className="fas fa-trophy"></i>
        </div>
        <div className="navbar__center-group">
          <ul className="navbar__links">
            <li><a href="#dashboard" className="hover-underline">Dashboard</a></li>
            <li><a href="#rewards" className="hover-underline">Rewards</a></li>
            <li><a href="#leaderboard" className="hover-underline">Leaderboard</a></li>
            <li><a href="#request" className="hover-underline">Request Rewards</a></li>
            {!user ? (
              <li><a href="#login" className="hover-underline" onClick={handleLogin}>Log in</a></li>
            ) : (
              <>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                  <a href="#profile" className="hover-underline" style={{ fontWeight: 500 }}>
                    {user.displayName || user.email}
                  </a>
                  <img
                    src={user.photoURL || '/favicon-32x32.png'}
                    alt="avatar"
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                  />
                </li>
                <li><a href="#logout" className="hover-underline" onClick={handleLogout}>Log out</a></li>
              </>
            )}
          </ul>
        </div>
        {isMobile && (
          <button className="navbar__toggle" aria-label="Open menu">
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        )}
      </div>
    </nav>
  );
}

