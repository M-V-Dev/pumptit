import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [mcap, setMcap] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(null); // 'up' or 'down'
  const [showBigger, setShowBigger] = useState(false);
  const lastMcapRef = useRef(0);
  const lastFetchRef = useRef(0);
  const videoRef = useRef(null);
  const maxMcap = 500_000;
  const lastVideoTimeRef = useRef(0);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const fetchMcap = async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 500) return;

    try {
      const res = await fetch(`${API_BASE}/api/mcap`);
      const data = await res.json();
      const newMcap = data.mcap || 0;

      const threshold = newMcap < 100_000 ? 1000 : 3000;

      if (Math.abs(newMcap - lastMcapRef.current) >= threshold) {
        setDirection(newMcap > lastMcapRef.current ? 'up' : 'down');

        if (videoRef.current && videoRef.current.duration) {
          let targetTime;

          if (newMcap >= maxMcap) {
            targetTime = videoRef.current.duration - 3;
            lastVideoTimeRef.current = targetTime;
          } else {
            targetTime = Math.min(
              (newMcap / maxMcap) * videoRef.current.duration,
              videoRef.current.duration - 3
            );
            lastVideoTimeRef.current = targetTime;
          }

          videoRef.current.currentTime = targetTime;
        }

        lastMcapRef.current = newMcap;
      }

      setMcap(newMcap);
      lastFetchRef.current = now;
    } catch (err) {
      console.error('Fetch MCAP error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 1s
  useEffect(() => {
    fetchMcap();
    const interval = setInterval(fetchMcap, 1000);
    return () => clearInterval(interval);
  }, []);

  // Loop segment and trigger "BIGGER" flash
  useEffect(() => {
    let flashInterval = null;

    const loopInterval = setInterval(() => {
      if (!videoRef.current) return;

      const videoDuration = videoRef.current.duration;

      if (mcap >= maxMcap) {
        const startTime = videoDuration - 3;
        if (videoRef.current.currentTime >= videoDuration) {
          videoRef.current.currentTime = startTime;
        }
        setShowBigger(false); // hide BIGGER once max reached
      } else {
        const startTime = lastVideoTimeRef.current;
        const loopEnd = Math.min(startTime + 2, videoDuration - 3);
        if (videoRef.current.currentTime >= loopEnd) {
          videoRef.current.currentTime = startTime;
        }

        // Show BIGGER if within last 3 seconds before max
        if (mcap >= maxMcap - 5000) { // 5k buffer before max
          if (!flashInterval) {
            flashInterval = setInterval(() => {
              setShowBigger((prev) => !prev);
            }, 500);
          }
        } else {
          setShowBigger(false);
          if (flashInterval) {
            clearInterval(flashInterval);
            flashInterval = null;
          }
        }
      }
    }, 50);

    return () => {
      clearInterval(loopInterval);
      if (flashInterval) clearInterval(flashInterval);
    };
  }, [mcap]);

  return (
    <div className="App">
      <a
        href="https://x.com"
        className="x-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="https://abs.twimg.com/favicons/twitter.2.ico" alt="X Logo" />
      </a>
      <h1>PUMP MY TITS!</h1>
      {showBigger && <h2 className="bigger-text">BIGGER</h2>}
      {loading ? (
        <div className="spinner">Loading...</div>
      ) : (
        <p className={`mcap ${direction}`}>
          <span className="arrow">
            {direction === 'up' ? '↑' : direction === 'down' ? '↓' : ''}
          </span>
          $
          {mcap.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>
      )}
      <video
        ref={videoRef}
        src="/video.mp4"
        autoPlay
        loop={false}
        muted
        playsInline
        className="mcap-video"
      />
    </div>
  );
}

export default App;
