import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [mcap, setMcap] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(null);
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

  useEffect(() => {
    fetchMcap();
    const interval = setInterval(fetchMcap, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loopInterval = setInterval(() => {
      if (!videoRef.current) return;

      if (mcap >= maxMcap) {
        const startTime = videoRef.current.duration - 3;
        if (videoRef.current.currentTime >= videoRef.current.duration) {
          videoRef.current.currentTime = startTime;
        }
      } else {
        const startTime = lastVideoTimeRef.current;
        const loopEnd = Math.min(startTime + 2, videoRef.current.duration - 3);
        if (videoRef.current.currentTime >= loopEnd) {
          videoRef.current.currentTime = startTime;
        }
      }
    }, 50);
    return () => clearInterval(loopInterval);
  }, [mcap]);

  return (
    <div className="App">
      {/* X link in top-right */}
      <a
        href="https://x.com/i/communities/1970515317651636432/"
        className="x-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="https://abs.twimg.com/favicons/twitter.2.ico" alt="X Logo" />
      </a>

      {/* Overlay with headline + mcap */}
      <div className="overlay">
        <h1>PUMP MY TITS!</h1>
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
      </div>

      {/* Background video */}
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
