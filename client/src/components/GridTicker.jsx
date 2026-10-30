import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';

export default function GridTicker() {
  const [telemetry, setTelemetry] = useState({
    freq: 50.02,
    hub: 'Karnataka South Hub (Anekal / E-City)',
    status: 'ONLINE • STABLE',
    activeCrews: 3,
    feed: [
      '⚡ Grid monitoring active across Electronic City & Anekal',
      '🛠️ Field Technician Karthik Murthy (EB-TECH-1001) online in Zone 1',
      '📟 Automated smart meter dispatch system ready'
    ]
  });

  const [feedIndex, setFeedIndex] = useState(0);

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const data = await apiRequest('/complaints/live-feed');
        if (data && data.feed && data.feed.length > 0) {
          const formattedFeed = data.feed.map(
            (f) =>
              `📍 [${f.area}] ${f.problemType.replace(/_/g, ' ')}: ${f.note} (${new Date(
                f.timestamp
              ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
          );
          setTelemetry((prev) => ({
            ...prev,
            feed: formattedFeed.length > 0 ? formattedFeed : prev.feed
          }));
        }
      } catch {
        // Fallback to initial local telemetry
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  // Rotate feed messages every 5 seconds
  useEffect(() => {
    if (telemetry.feed.length <= 1) return;
    const rotateTimer = setInterval(() => {
      setFeedIndex((prev) => (prev + 1) % telemetry.feed.length);
    }, 4500);
    return () => clearInterval(rotateTimer);
  }, [telemetry.feed.length]);

  return (
    <div className="grid-ticker-bar">
      <div className="ticker-telemetry">
        <span className="ticker-pill ticker-pill-green">
          <span className="live-pulse-dot"></span> 50.02 Hz STABLE
        </span>
        <span className="ticker-pill ticker-pill-blue">
          ⚡ {telemetry.hub}
        </span>
        <span className="ticker-pill ticker-pill-amber">
          🛠️ 3 Techs Active
        </span>
      </div>

      <div className="ticker-feed-window">
        <span className="ticker-feed-label">📡 LIVE DISPATCH FEED:</span>
        <span className="ticker-feed-text animate-fade-in" key={feedIndex}>
          {telemetry.feed[feedIndex] || telemetry.feed[0]}
        </span>
      </div>
    </div>
  );
}
