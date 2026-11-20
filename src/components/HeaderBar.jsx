import { useState, useEffect } from 'react';
import { MARKET_SESSIONS, getSessionStatus } from '../utils/marketHours';
import { playFeedbackSound } from '../utils/audioUtils';

export default function HeaderBar({
  standingMode,
  setStandingMode,
  selectedRegion,
  setSelectedRegion,
  searchQuery,
  setSearchQuery,
  tileStyle,
  setTileStyle,
  isLiveSimActive,
  setIsLiveSimActive,
  isAudioMuted,
  setIsAudioMuted,
  onRefresh,
  isLoading,
  apiStatus,
  counts,
  onSearchSubmit
}) {
  const [timeUtc, setTimeUtc] = useState('');
  const [timeLocal, setTimeLocal] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
      setTimeLocal(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const regions = ['All', 'Americas', 'Europe', 'Asia-Pacific', 'Global'];

  return (
    <header className="app-header">
      {/* Top Banner: Global Financial Brand & World Clocks */}
      <div className="header-top-bar">
        <div className="header-brand">
          {/* Generic Financial Icon: Candlestick & Upward Market Trend */}
          <div className="financial-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="34" height="34" fill="none">
              <rect width="32" height="32" fill="#18181b" stroke="#333333" strokeWidth="1.5" />
              <line x1="4" y1="26" x2="28" y2="26" stroke="#3f3f46" strokeWidth="1" />
              {/* Candlestick bars */}
              <line x1="8.5" y1="16" x2="8.5" y2="25" stroke="#107c10" strokeWidth="1" />
              <rect x="7" y="18" width="3" height="6" fill="#107c10" />
              
              <line x1="14.5" y1="12" x2="14.5" y2="23" stroke="#e81123" strokeWidth="1" />
              <rect x="13" y="14" width="3" height="7" fill="#e81123" />
              
              <line x1="20.5" y1="8" x2="20.5" y2="22" stroke="#107c10" strokeWidth="1" />
              <rect x="19" y="10" width="3" height="10" fill="#107c10" />

              <line x1="26.5" y1="6" x2="26.5" y2="20" stroke="#107c10" strokeWidth="1" />
              <rect x="25" y="7" width="3" height="11" fill="#107c10" />

              {/* Dynamic Trend Line */}
              <polyline points="8,17 14,19 20,11 27,6" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="square" />
              <circle cx="27" cy="6" r="2" fill="#38bdf8" />
            </svg>
          </div>

          <div className="brand-titles">
            <span className="brand-subtitle">GLOBAL FINANCIAL MARKETS</span>
            <h1 className="brand-main-title">INDEX TRACKER</h1>
          </div>
        </div>

        {/* Live Clock & World Market Status */}
        <div className="market-sessions-container">
          <div className="market-clock">
            <span className="clock-time">{timeLocal}</span>
            <span className="clock-utc">{timeUtc}</span>
          </div>

          <div className="sessions-list">
            {MARKET_SESSIONS.map((session) => {
              const status = getSessionStatus(session);
              return (
                <div
                  key={session.id}
                  className={`session-pill ${status.badgeClass}`}
                  title={`${session.name}: ${status.statusText}`}
                >
                  <span className="session-flag">{session.flag}</span>
                  <span className="session-code">{session.code}</span>
                  <span className={`status-dot ${status.isOpen ? 'dot-open' : 'dot-closed'}`}></span>
                </div>
              );
            })}
          </div>

          {/* Live Engine Status Pill */}
          <div
            className={`api-status-pill ${apiStatus.type}`}
            title="Market Engine Status"
          >
            <span className="status-indicator"></span>
            <span className="status-label">{apiStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Main Command Bar */}
      <div className="app-command-bar">
        {/* Left: Region Filters */}
        <div className="command-group region-tabs-scrollable">
          {regions.map((region) => {
            const count = counts[region] || 0;
            const isActive = selectedRegion === region;
            return (
              <button
                key={region}
                className={`tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  playFeedbackSound('click');
                  setSelectedRegion(region);
                }}
              >
                {region} <span className="tab-count">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Middle: Search Box */}
        <div className="command-group search-group">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search index, ticker, or fetch online (e.g. AAPL, NVDA, ^VIX)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearchSubmit && onSearchSubmit();
                }
              }}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => {
                  playFeedbackSound('click');
                  setSearchQuery('');
                }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Sizing & Controls */}
        <div className="command-group command-actions">
          {/* Standing Sizing Selector */}
          <div className="standing-selector-wrap" title="Calculate tile sizes based on market performance">
            <label className="control-label">Sizing:</label>
            <select
              className="control-select"
              value={standingMode}
              onChange={(e) => {
                playFeedbackSound('click');
                setStandingMode(e.target.value);
              }}
            >
              <option value="magnitude">Move Magnitude (Biggest Movers Largest)</option>
              <option value="rank">Leaderboard Standing (Rank #1-20)</option>
              <option value="tier">Global Market Tier (Mega Caps Largest)</option>
              <option value="uniform">Uniform Tiles (Consistent Grid)</option>
              <option value="custom">Custom (Interactive Resize)</option>
            </select>
          </div>

          {/* Style Toggle */}
          <button
            className={`command-btn ${tileStyle === 'vibrant' ? 'active' : ''}`}
            onClick={() => {
              playFeedbackSound('click');
              setTileStyle(tileStyle === 'vibrant' ? 'matte' : 'vibrant');
            }}
            title="Toggle between Vibrant Colors and Matte Dark Surface"
          >
            <span className="btn-icon">🎨</span>
            <span className="btn-text">{tileStyle === 'vibrant' ? 'Vibrant' : 'Matte'}</span>
          </button>

          {/* Live Tick Simulator Toggle */}
          <button
            className={`command-btn ${isLiveSimActive ? 'active' : ''}`}
            onClick={() => {
              playFeedbackSound('click');
              setIsLiveSimActive(!isLiveSimActive);
            }}
            title={isLiveSimActive ? 'Live Market Ticks Active' : 'Live Market Ticks Paused'}
          >
            <span className={`pulse-dot ${isLiveSimActive ? 'active' : ''}`}></span>
            <span className="btn-text">{isLiveSimActive ? 'Live: ON' : 'Live: OFF'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            className={`command-btn ${!isAudioMuted ? 'active' : ''}`}
            onClick={() => {
              const nextMuted = !isAudioMuted;
              setIsAudioMuted(nextMuted);
              localStorage.setItem('market_sound_muted', String(nextMuted));
              if (!nextMuted) playFeedbackSound('click');
            }}
            title={isAudioMuted ? 'Audio Feedback Muted' : 'Audio Feedback Active'}
            aria-label="Toggle audio feedback"
          >
            <span className="btn-icon">{isAudioMuted ? '🔇' : '🔊'}</span>
          </button>

          {/* Refresh Button */}
          <button
            className={`command-btn refresh-btn ${isLoading ? 'loading' : ''}`}
            onClick={() => {
              playFeedbackSound('refresh');
              onRefresh();
            }}
            disabled={isLoading}
            title="Refresh Market Quotes"
          >
            <span className="btn-icon refresh-icon">⟳</span>
            <span className="btn-text">{isLoading ? 'Syncing...' : 'Refresh'}</span>
          </button>


        </div>
      </div>
    </header>
  );
}
