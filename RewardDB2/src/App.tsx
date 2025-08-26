import React from 'react';
import MinimalWinnerForm from './components/MinimalWinnerForm';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from './components/ThemeProvider';
import { CampusProvider } from './contexts/CampusContext';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { RewardsSection } from './components/RewardsSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { HeroSection } from './components/HeroSection';
import LoginPage from './pages/LoginPage';
import { EventPage } from './pages/EventPage';
import AdminLayout from './pages/admin/AdminLayout';
import EventsAdmin from './pages/admin/EventsAdmin';
import RewardsAdmin from './pages/admin/RewardsAdmin';
import PointsUploadAdmin from './pages/admin/PointsUploadAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import MediaAdmin from './pages/admin/MediaAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import ClaimsAdmin from './pages/admin/ClaimsAdmin';
import TestimonialsAdmin from './pages/admin/TestimonialsAdmin';
import './index.css';
import FeaturedWinnersCarousel from './components/FeaturedWinnersCarousel';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { createPortal } from 'react-dom';
import { AriaDebugger, preventRootAriaHidden } from './utils/ariaDebugger';


interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  campus?: string;
  house?: string;
  program?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  createdAt?: any;
  updatedAt?: any;
}

function App() {
  const [user] = useAuthState(auth);
  const [showTestimonialForm, setShowTestimonialForm] = React.useState(false);
  const openingGuard = React.useRef(false);
  const [overlayInteractive, _setOverlayInteractive] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  
  // Profile check for redirect
  const [profileChecked, setProfileChecked] = React.useState(false);
  const [profileIncomplete, setProfileIncomplete] = React.useState(false);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);

  // Real-time profile listener to avoid stale completeness state
  React.useEffect(() => {
    console.log('[DEBUG] App profile listener effect. user:', user?.uid || 'none');
    if (!user) {
      setProfileChecked(true);
      setProfileIncomplete(false);
      setProfile(null);
      return;
    }
    const ref = doc(db, 'users', user.uid);
    let created = false;
    const unsub = onSnapshot(ref, async (snap) => {
      try {
        if (!snap.exists()) {
          if (created) return; // avoid loop
            created = true;
            console.log('[DEBUG] App snapshot: no profile, creating.');
            await setDoc(ref, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            return; // wait for next snapshot
        }
        const data = snap.data() as UserProfile;
        const missingDetails = !data.campus || !data.house || !data.program || !data.displayName || !data.email || !data.linkedin || !data.github; // portfolio optional
        setProfileChecked(true);
        setProfileIncomplete(missingDetails);
        setProfile(data);
        console.log('[DEBUG] App snapshot profile update:', data, 'missingDetails:', missingDetails);
      } catch (err) {
        console.error('[DEBUG] App snapshot error:', err);
        setProfileChecked(true);
        setProfileIncomplete(true);
      }
    });
    return () => unsub();
  }, [user]);

  // Debug and prevent aria-hidden issues
  React.useEffect(() => {
    const ariaDebugger = AriaDebugger.startDebugging();
    const preventObserver = preventRootAriaHidden();
    return () => {
      ariaDebugger.stopDebugging();
      preventObserver?.disconnect();
    };
  }, []);

  // Handle testimonial button click
  const handleTestimonialClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    if (profileIncomplete) {
      // Redirect to login page for onboarding
      window.location.href = '/login';
    } else {
      setShowTestimonialForm(true);
    }
  }, [user, profileIncomplete]);

  const MainContent = () => (
    <div className="app-container">
      <HeroSection />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#182a36',
            color: '#fff',
            fontWeight: 500,
            borderRadius: 10
          }
        }}
      />
      <Navbar />
      <DashboardOverview id="dashboard" />
      <RewardsSection id="rewards" />
      <LeaderboardSection id="leaderboard" />
      <FeaturedWinnersCarousel />
      {/* Social links bar - only visible if user is logged in and profile is complete */}
      {profile && (
        <ul style={{ position: 'fixed', right: 'min(1.2rem,3vw)', bottom: 'min(1.2rem,3vw)', display: 'flex', gap: 10, opacity: 0.35, zIndex: 999 }}>
          {profile.linkedin && (
            <li>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                <svg data-prefix="fab" data-icon="linkedin" className="svg-inline--fa fa-linkedin" role="img" viewBox="0 0 448 512" aria-hidden="true" style={{ color: '#3b82f6', fontSize: 'min(22px,6vw)' }}><path fill="currentColor" d="M416 32L31.9 32C14.3 32 0 46.5 0 64.3L0 447.7C0 465.5 14.3 480 31.9 480L416 480c17.6 0 32-14.5 32-32.3l0-383.4C448 46.5 433.6 32 416 32zM135.4 416l-66.4 0 0-213.8 66.5 0 0 213.8-.1 0zM102.2 96a38.5 38.5 0 1 1 0 77 38.5 38.5 0 1 1 0-77zM384.3 416l-66.4 0 0-104c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9l0 105.8-66.4 0 0-213.8 63.7 0 0 29.2 .9 0c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9l0 117.2z"></path></svg>
              </a>
            </li>
          )}
          {profile.github && (
            <li>
              <a href={profile.github} target="_blank" rel="noopener noreferrer">
                <svg data-prefix="fab" data-icon="github" className="svg-inline--fa fa-github" role="img" viewBox="0 0 512 512" aria-hidden="true" style={{ color: '#18181c', fontSize: 'min(22px,6vw)' }}><path fill="currentColor" d="M252.8 8c-138.7 0-244.8 105.3-244.8 244 0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1 100-33.2 167.8-128.1 167.8-239 0-138.7-112.5-244-251.2-244z"></path></svg>
              </a>
            </li>
          )}
          {profile.portfolio && (
            <li>
              <a href={profile.portfolio} target="_blank" rel="noopener noreferrer">
                <svg data-prefix="fas" data-icon="globe" className="svg-inline--fa fa-globe" role="img" viewBox="0 0 512 512" aria-hidden="true" style={{ color: '#34d399', fontSize: 'min(22px,6vw)' }}><path fill="currentColor" d="M351.9 280l-190.9 0c2.9 64.5 17.2 123.9 37.5 167.4 11.4 24.5 23.7 41.8 35.1 52.4 11.2 10.5 18.9 12.2 22.9 12.2s11.7-1.7 22.9-12.2c11.4-10.6 23.7-28 35.1-52.4 20.3-43.5 34.6-102.9 37.5-167.4zM160.9 232l190.9 0C349 167.5 334.7 108.1 314.4 64.6 303 40.2 290.7 22.8 279.3 12.2 268.1 1.7 260.4 0 256.4 0s-11.7 1.7-22.9 12.2c-11.4 10.6-23.7 28-35.1 52.4-20.3 43.5-34.6 102.9-37.5 167.4zm-48 0C116.4 146.4 138.5 66.9 170.8 14.7 78.7 47.3 10.9 131.2 1.5 232l111.4 0zM1.5 280c9.4 100.8 77.2 184.7 169.3 217.3-32.3-52.2-54.4-131.7-57.9-217.3L1.5 280zm398.4 0c-3.5 85.6-25.6 165.1-57.9 217.3 92.1-32.7 159.9-116.5 169.3-217.3l-111.4 0zm111.4-48C501.9 131.2 434.1 47.3 342 14.7 374.3 66.9 396.4 146.4 399.9 232l111.4 0z"></path></svg>
              </a>
            </li>
          )}
        </ul>
      )}
      <footer className="site-footer">
        <div className="footer-columns footer-three-cols">
          <div className="footer-sitemap">
            <h4>Sitemap</h4>
            <ul>
              <li><a href="#dashboard">Dashboard</a></li>
              <li><a href="#rewards">Rewards</a></li>
              <li><a href="#leaderboard">Leaderboard</a></li>
              <li><a href="#request">Request Rewards</a></li>
              <li>
                <a href="/event" style={{ color: '#00e6d2', fontWeight: 600 }}>
                  Events
                </a>
              </li>
              <li>
                <Link to="/login" style={{ color: '#1ed760', fontWeight: 600 }}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/admin" style={{ color: '#fff', fontWeight: 600 }}>
                  Admin
                </Link>
              </li>
            </ul>
          </div>
          <div className="footer-calendar-col">
            <h4>Upcoming Events</h4>
            <ul className="footer-calendar-list">
              <li><strong>Sep 5:</strong> Teachers' Day</li>
              <li><strong>Sep 20:</strong> Sports Fest</li>
              <li><em>More events coming soon...</em></li>
            </ul>
          </div>
          <div className="footer-calendar-col footer-calendar-past">
            <h4>Past Events</h4>
            <ul className="footer-calendar-list">
              <li><strong>Aug 15:</strong> Independence Day Celebration</li>
              <li><strong>Aug 22:</strong> Coding Contest</li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            className="bg-[#00e6d2] text-[#232e44] font-bold py-2 px-6 rounded-full shadow-lg hover:bg-[#1ed760] transition"
            onClick={handleTestimonialClick}
            style={{
              willChange: 'transform',
              contain: 'layout style paint'
            }}
          >
            Submit Testimonial
          </button>
        </div>
        <div className="footer-bottom-message">
          Made with{' '}
          <span style={{ color: '#ff0058', fontWeight: 700 }}>&#10084;</span>{' '}
          for Navgurukul Partners.
        </div>
      </footer>
    </div>
  );

  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    if (!profileChecked) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }
    // If profile is incomplete and we're not already on /login, force onboarding route
    if (profileIncomplete && location.pathname !== '/login') {
      console.log('[DEBUG] RequireAuth redirecting to /login due to incomplete profile');
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  };

  // removed unused OnboardingSection component

  return (
    <Router>
      <ThemeProvider>
        <CampusProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/event"
              element={
                <RequireAuth>
                  <EventPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<EventsAdmin />} />
              <Route path="events" element={<EventsAdmin />} />
              <Route path="rewards" element={<RewardsAdmin />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="claims" element={<ClaimsAdmin />} />
              <Route path="media" element={<MediaAdmin />} />
              <Route path="testimonials" element={<TestimonialsAdmin />} />
              <Route path="points-upload" element={<PointsUploadAdmin />} />
              <Route path="settings" element={<SettingsAdmin />} />
              <Route path="*" element={<Navigate to="events" replace />} />
            </Route>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <MainContent />
                </RequireAuth>
              }
            />
          </Routes>

          {/* Testimonial Modal */}
          {showTestimonialForm &&
            createPortal(
              <div
                id="__testimonial_portal_overlay"
                style={{
                  position: 'fixed',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 10050,
                  pointerEvents: overlayInteractive ? 'auto' : 'none',
                  padding: '1rem'
                }}
                onClick={() => {
                  if (!overlayInteractive || openingGuard.current) return;
                  setShowTestimonialForm(false);
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="testimonial-modal-title"
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 10052,
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    background: overlayInteractive ? '#00e6d2' : '#ff0058',
                    color: '#232e44',
                    fontWeight: 700
                  }}
                >
                  {overlayInteractive ? 'Overlay: ACTIVE' : 'Overlay: WAIT'}
                </div>
                <div
                  ref={modalRef}
                  className="relative bg-gray-800 text-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto"
                  style={{
                    backgroundColor: '#1F2937',
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                    zIndex: 10051,
                    position: 'relative'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      padding: '0.5rem 0.5rem 0 0'
                    }}
                  >
                    <button
                      onClick={() => setShowTestimonialForm(false)}
                      aria-label="Close"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9aa6b2',
                        fontSize: 18,
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div
                    style={{
                      backgroundColor: '#0b1220',
                      color: '#fff',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.04)',
                      width: 'min(640px, 96vw)',
                      maxWidth: '640px',
                      maxHeight: '84vh',
                      overflowY: 'auto',
                      padding: '0.75rem 0.75rem',
                      boxSizing: 'border-box',
                      position: 'relative'
                    }}
                  >
                    <h2
                      id="testimonial-modal-title"
                      style={{
                        textAlign: 'center',
                        fontSize: '1.15rem',
                        margin: '0 0 0.5rem',
                        fontWeight: 700
                      }}
                    >
                      Submit Your Testimonial
                    </h2>
                    <div style={{ padding: '0 0.25rem 0.5rem' }}>
                      <MinimalWinnerForm
                        onClose={() => setShowTestimonialForm(false)}
                      />
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </CampusProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
