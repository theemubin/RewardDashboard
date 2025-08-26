import React, { useState, useCallback, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createPortal } from "react-dom";
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';
import styles from './FeaturedWinnersCarousel.module.css';
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import type { UserProfile } from '../types/UserProfile';

const FeaturedWinnersCarousel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<any>(null);
  const [winners, setWinners] = useState<any[]>([]);

  // Fetch winners from Firestore
  useEffect(() => {
    async function fetchWinners() {
      try {
        const q = query(
          collection(db, 'winnerSubmissions'),
          where('status','==','approved'),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
        const snap = await getDocs(q);
        const docs = await Promise.all(snap.docs.map(async docSnap => {
          const data = docSnap.data();
          let profile: UserProfile = {} as UserProfile;
          if (data.uid) {
            try {
              const userRef = doc(db, 'users', data.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) profile = userSnap.data() as UserProfile;
            } catch {}
          }
          return {
            img: data.imageUrl || "https://iili.io/KHqzJZN.md.png",
            name: data.name || profile.displayName || "Anonymous",
            category: data.category || "Academic",
            achievement: data.testimonialHeading || "Achievement",
            house: data.house || profile.house || "",
            campus: data.campus || profile.campus || "",
            month: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString('default', { month: 'long', year: 'numeric' }) : '',
            testimonial: data.testimonial || "",
            linkedin: profile.linkedin || '',
            github: profile.github || '',
            portfolio: profile.portfolio || ''
          };
        }));
        setWinners(docs);
      } catch (err) {
        console.error('Failed to fetch winners:', err);
      }
    }
    fetchWinners();
  }, []);

  // Memoize winners to prevent unnecessary re-renders
  const infiniteWinners = useMemo(() => [...winners, ...winners, ...winners], [winners]);

  // Prevent aria-hidden issues by managing body scroll and aria attributes
  useEffect(() => {
    if (open) {
      // Store current body styles
      const originalOverflow = document.body.style.overflow;
      const originalAriaHidden = document.getElementById('root')?.getAttribute('aria-hidden');
      
      // Prevent scroll and remove any aria-hidden from root
      document.body.style.overflow = 'hidden';
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.removeAttribute('aria-hidden');
      }
      
      return () => {
        // Restore original styles when modal closes
        document.body.style.overflow = originalOverflow;
        if (originalAriaHidden && rootElement) {
          rootElement.setAttribute('aria-hidden', originalAriaHidden);
        }
      };
    }
  }, [open]);

  // Highly optimized click handler with proper debouncing
  const handleOpen = useCallback((winner: any) => {
    console.log('[Carousel] Card clicked:', winner.name);
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        if (!open) {
          setSelectedWinner(winner);
          setOpen(true);
          console.log('[Carousel] Modal opened for:', winner.name);
        }
      });
    } else {
      if (!open) {
        setSelectedWinner(winner);
        setOpen(true);
        console.log('[Carousel] Modal opened for:', winner.name);
      }
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Delay clearing the winner data to allow for smooth animation
    setTimeout(() => setSelectedWinner(null), 100);
  }, []);

  console.log('[Carousel] Render: open=', open, 'selectedWinner=', selectedWinner?.name);

  return (
    <section className="py-16 bg-[#111827] text-white overflow-hidden">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">Last Month's Winners</h2>
        <p className="text-lg opacity-80">Celebrating excellence in academics, culture, and overall achievement.</p>
      </div>
      <div className="relative w-full">
        <div className={styles.winnersCarouselContainer}>
          <div className={styles.winnersCarouselTrack}>
            {infiniteWinners.map((winner, i) => (
              <div
                key={i}
                className={`${styles.winnerCard} group relative cursor-pointer`}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleOpen(winner);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpen(winner);
                  }
                }}
                style={{ 
                  willChange: 'transform',
                  contain: 'layout style paint',
                  transform: 'translateZ(0)' // Hardware acceleration
                }}
              >
                <img
                  src={winner.img}
                  alt={winner.name}
                  className="w-full h-80 rounded-2xl shadow-lg"
                  style={{ objectFit: 'cover', objectPosition: 'center', background: '#222' }}
                />
                <div className={styles.winnerCardOverlay}></div>
                <div className={styles.winnerCardContent}>
                  <h3 className="text-xl font-semibold leading-normal mb-1">{winner.name}</h3>
                  <h4 className="text-lg font-medium mb-2">{winner.achievement}</h4>
                  <p className="details">
                    {winner.house}, {winner.campus}
                  </p>
                  <p className="details">
                    {winner.month}
                  </p>
                  <ul className="flex justify-center items-center mt-2">
                    {winner.linkedin && (
                      <li>
                        <a href={winner.linkedin} target="_blank" rel="noopener" className="w-8 h-8 text-lg text-blue-400 opacity-90 mx-1 inline-flex justify-center items-center hover:text-blue-600" title="LinkedIn">
                          <FontAwesomeIcon icon={faLinkedin} />
                        </a>
                      </li>
                    )}
                    {winner.github && (
                      <li>
                        <a href={winner.github} target="_blank" rel="noopener" className="w-8 h-8 text-lg text-gray-300 opacity-90 mx-1 inline-flex justify-center items-center hover:text-gray-100" title="GitHub">
                          <FontAwesomeIcon icon={faGithub} />
                        </a>
                      </li>
                    )}
                    {winner.portfolio && (
                      <li>
                        <a href={winner.portfolio} target="_blank" rel="noopener" className="w-8 h-8 text-lg text-green-300 opacity-90 mx-1 inline-flex justify-center items-center hover:text-green-500" title="Portfolio">
                          <FontAwesomeIcon icon={faGlobe} />
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Custom Modal to avoid Material UI conflicts */}
      <CustomModal 
        isOpen={open} 
        onClose={handleClose} 
        winner={selectedWinner} 
      />
    </section>
  );

  // Custom modal component to avoid Material UI conflicts
  function CustomModal({ isOpen, onClose, winner }: { 
    isOpen: boolean; 
    onClose: () => void; 
    winner: typeof winners[0] | null 
  }) {
    console.log('[CustomModal] Render: isOpen=', isOpen, 'winner=', winner?.name);
    if (!isOpen || !winner) return null;

    // Overlay and modal styles for dark theme
    const overlayStyle: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(18, 18, 22, 0.92)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.3s',
      opacity: 1,
      backdropFilter: 'blur(2px)',
      animation: 'fadeInModal 0.35s',
    };
    const modalStyle: React.CSSProperties = {
      background: 'none',
      borderRadius: '20px',
      boxShadow: 'none',
      padding: 0,
      minWidth: 260,
      maxWidth: '640px',
      width: '90vw',
      color: '#18181c',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: 'none',
      maxHeight: 'calc(100vh - 32px)',
      overflow: 'visible',
      animation: 'fadeInModal 0.35s',
    };

    // Close modal on ESC key
    React.useEffect(() => {
      if (!isOpen) return;
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    return createPortal(
      <div 
        style={overlayStyle}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-modal-title"
      >
        <div 
          style={modalStyle}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ width: '100%', textAlign: 'center', marginTop: 0 }}>
            <div style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)', borderRadius: '18px', overflow: 'hidden', background: 'none', maxWidth: '640px', width: '90vw', margin: '0 auto', position: 'relative' }}>
              {/* Cropped image: show 10%-60% */}
              <div style={{ width: '100%', height: 'min(180px,22vw)', overflow: 'hidden', position: 'relative' }}>
                <img 
                  src={winner.img} 
                  alt={winner.name}
                  style={{ width: '100%', height: '200%', objectFit: 'cover', objectPosition: 'center top', background: '#222', display: 'block', transform: 'translateY(-10%)' }}
                />
              </div>
              {/* Headline and testimonial together, no section break */}
              <div style={{ background: '#fff', padding: 'min(1.1rem,3vw) min(2.5rem,6vw) 0 min(2.5rem,6vw)', borderRadius: '0', textAlign: 'center' }}>
                <span style={{ fontWeight: 400, fontSize: 'min(1.25rem,4vw)', color: '#888', fontStyle: 'italic', letterSpacing: '-0.5px', display: 'block', marginBottom: winner.testimonial ? '0.5em' : 0 }}>
                  <i>{winner.achievement}</i>
                </span>
                {winner.testimonial && (
                  <span style={{ fontStyle: 'italic', color: '#888', fontSize: 'min(1.05rem,3vw)', lineHeight: 1.3, display: 'block', marginBottom: 0 }}>
                    “{winner.testimonial}”
                  </span>
                )}
              </div>
              {/* Gap */}
              <div style={{ background: '#fff', height: 'min(1.2rem,3vw)', border: 'none' }}></div>
              {/* Name and campus */}
              <div style={{ background: '#fff', padding: '0 min(2.5rem,6vw) min(1.2rem,3vw) min(2.5rem,6vw)', borderRadius: '0 0 18px 18px', textAlign: 'center', position: 'relative' }}>
                <h3 id="custom-modal-title" style={{ fontSize: 'min(2.2rem,7vw)', fontWeight: 700, color: '#18181c', marginBottom: 2, lineHeight: 1.1, letterSpacing: '-1px' }}>
                  “{winner.name?.split(' ').slice(-1)[0]}”
                </h3>
                <p style={{ fontWeight: 400, fontSize: 'min(1.1rem,3vw)', color: '#555', marginBottom: 2, marginTop: 0, lineHeight: 1.2 }}>
                  {winner.campus}
                </p>
                {/* Always show subtle social icons bottom right, even if links missing */}
                <ul style={{ position: 'absolute', right: 'min(1.2rem,3vw)', bottom: 'min(1.2rem,3vw)', display: 'flex', gap: 10, opacity: 0.35 }}>
                  <li>
                    <FontAwesomeIcon icon={faLinkedin} style={{ color: winner.linkedin ? '#3b82f6' : '#bbb', fontSize: 'min(22px,6vw)' }} />
                  </li>
                  <li>
                    <FontAwesomeIcon icon={faGithub} style={{ color: winner.github ? '#18181c' : '#bbb', fontSize: 'min(22px,6vw)' }} />
                  </li>
                  <li>
                    <FontAwesomeIcon icon={faGlobe} style={{ color: winner.portfolio ? '#34d399' : '#bbb', fontSize: 'min(22px,6vw)' }} />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes fadeInModal {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>,
      document.body
    );
  }
};

export default FeaturedWinnersCarousel;
