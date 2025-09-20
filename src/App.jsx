import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [mcap, setMcap] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [direction, setDirection] = useState(null); // 'up' or 'down'
  const lastMcapRef = useRef(0);
  const lastFetchRef = useRef(0);
  const videoRef = useRef(null);
  const maxMcap = 1_000_000; // $1,000,000

  // Use env variable for API base URL
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  // Fetch MCAP from server
  const fetchMcap = async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < 500) return; // Debounce 500ms
    try {
      const res = await fetch(`${API_BASE}/api/mcap`);
      const data = await res.json();
      const newMcap = data.mcap || 0;

      // Determine direction
      if (newMcap !== lastMcapRef.current) {
        setDirection(
          newMcap > lastMcapRef.current
            ? 'up'
            : newMcap < lastMcapRef.current
            ? 'down'
            : null
        );

        // Update video time
        if (videoRef.current && videoRef.current.duration) {
          const videoTime = (newMcap / maxMcap) * videoRef.current.duration;
          videoRef.current.currentTime = Math.max(
            0,
            Math.min(videoTime, videoRef.current.duration)
          );
        }

        lastMcapRef.current = newMcap;
      }

      setMcap(newMcap);
      setError(data.error || '');
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

  // Handle video load errors
  const handleVideoError = () => {
    setError('Failed to load video. Please ensure video.mp4 exists in the public folder.');
  };

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
      <h1>PUMP THE TITS!</h1>
      {error && <p className="error">{error}</p>}
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
        loop
        muted
        playsInline
        className="mcap-video"
        onError={handleVideoError}
      />
    </div>
  );
}

export default App;
