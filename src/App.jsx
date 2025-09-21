import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [mcap, setMcap] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(null); // 'up' or 'down'
  const lastMcapRef = useRef(0);
  const lastFetchRef = useRef(0);
  const videoRef = useRef(null);
  const maxMcap = 500_000; // max cap threshold
  const lastVideoTimeRef = useRef(0);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const fetchMcap = async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 500) return; // debounce 500ms

    try {
      const res = await fetch(`${API_BASE}/api/mcap`);
      const data = await res.json();
      const newMcap = data.mcap || 0;

      // dynamic threshold: 1k below 100k, 3k otherwise
      const threshold = newMcap < 100_000 ? 1000 : 3000;

      if (Math.abs(newMcap - lastMcapRef.current) >= threshold) {
        setDirection(newMcap > lastMcapRef.current ? 'up' : 'down');

        if (videoRef.current && videoRef.current.duration) {
          let targetTime;

          if (newMcap >= maxMcap) {
            // lock at final loop segment, only once
            if (lastMcapRef.current < maxMcap) {
              targetTime = videoRef.current.duration - 3;
              videoRef.current.currentTime = targetTime;
              lastVideoTimeRef.current = targetTime;
            }
          } else {
            // map proportionally to MCAP
            targetTime = (newMcap / maxMcap) * videoRef.current.duration;
            videoRef.current.currentTime = targetTime;
            lastVideoTimeRef.current = targetTime;
          }
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

  // Loop segment (2s normally, 3s if above max cap)
  useEffect(() => {
    const loopInterval = setInterval(() => {
      if (videoRef.current) {
        if (mcap >= maxMcap) {
          const startTime = videoRef.current.duration - 3;
          if (videoRef.current.currentTime >= videoRef.current.duration) {
            videoRef.current.currentTime = startTime;
          }
        } else {
          const startTime = lastVideoTimeRef.current;
          if (videoRef.current.currentTime >= startTime + 2) {
            videoRef.current.currentTime = startTime;
          }
        }
      }
    }, 50);
    return () => clearInterval(loopInterval);
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
        loop={false} // handled manually
        muted
        playsInline
        className="mcap-video"
      />
    </div>
  );
}

export default App;
