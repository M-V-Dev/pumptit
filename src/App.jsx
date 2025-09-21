import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [mcap, setMcap] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(null); // 'up' or 'down'
  const lastMcapRef = useRef(0);
  const lastFetchRef = useRef(0);
  const videoRef = useRef(null);
  const maxMcap = 800_000; // $1,000,000
  const lastVideoTimeRef = useRef(0);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const fetchMcap = async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 500) return; // Debounce 500ms
    try {
      const res = await fetch(`${API_BASE}/api/mcap`);
      const data = await res.json();
      const newMcap = data.mcap || 0;

      // Only update if change >= 1000
      if (Math.abs(newMcap - lastMcapRef.current) >= 1000) {
        setDirection(
          newMcap > lastMcapRef.current ? 'up' : 'down'
        );

        // Update video position based on new MCAP
        if (videoRef.current && videoRef.current.duration) {
          const videoTime = (newMcap / maxMcap) * videoRef.current.duration;
          videoRef.current.currentTime = videoTime;
          lastVideoTimeRef.current = videoTime;
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

  // Loop video in 2-second segments
  useEffect(() => {
    const loopInterval = setInterval(() => {
      if (videoRef.current) {
        const startTime = lastVideoTimeRef.current;
        if (videoRef.current.currentTime >= startTime + 2) {
          videoRef.current.currentTime = startTime;
        }
      }
    }, 50); // check every 50ms
    return () => clearInterval(loopInterval);
  }, []);

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
          ${mcap.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>
      )}
      <video
        ref={videoRef}
        src="/video.mp4"
        autoPlay
        loop={false} // loop handled manually
        muted
        playsInline
        className="mcap-video"
      />
    </div>
  );
}

export default App;
