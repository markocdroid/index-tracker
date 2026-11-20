import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { TOP_20_INDEXES, calculateTileSize, applyTickUpdate } from './data/indexesData';
import { fetchOnlineQuote } from './services/onlineQuoteService';
import HeaderBar from './components/HeaderBar';
import MarketTickerBanner from './components/MarketTickerBanner';
import TradingViewTickerTape from './components/TradingViewTickerTape';
import IndexTile from './components/IndexTile';
import IndexDetailModal from './components/IndexDetailModal';
import './App.css';

function App() {
  const [indexes, setIndexes] = useState(TOP_20_INDEXES);
  const [standingMode, setStandingMode] = useState('magnitude'); // 'magnitude' | 'rank' | 'tier' | 'uniform' | 'custom'
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tileStyle, setTileStyle] = useState('vibrant'); // 'vibrant' | 'matte'
  const [isLiveSimActive, setIsLiveSimActive] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(() => {
    return localStorage.getItem('market_sound_muted') === 'true';
  });
  const [selectedDetailIndex, setSelectedDetailIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customSizes, setCustomSizes] = useState({});

  // Data mode: 'mock' (simulated ticks) or 'live' (TradingView live public widgets)
  const [dataMode, setDataMode] = useState(() => {
    const savedMode = localStorage.getItem('index_tracker_data_mode');
    if (savedMode === 'mock' || savedMode === 'live') {
      return savedMode;
    }
    return 'live';
  });

  useEffect(() => {
    localStorage.setItem('index_tracker_data_mode', dataMode);
  }, [dataMode]);

  // Online search states
  const [isOnlineSearching, setIsOnlineSearching] = useState(false);
  const [onlineSearchError, setOnlineSearchError] = useState(null);
  const lastFetchedQueryRef = useRef('');

  // Market engine status indicator
  const apiStatus = useMemo(() => {
    if (isOnlineSearching) {
      return { type: 'custom', label: 'Fetching Online...' };
    }
    if (dataMode === 'live') {
      return { type: 'live', label: 'TradingView: Live' };
    }
    if (isLiveSimActive) {
      return { type: 'live', label: 'Market Feed: Live' };
    }
    return { type: 'paused', label: 'Market Feed: Paused' };
  }, [isOnlineSearching, isLiveSimActive, dataMode]);

  // Live Simulated Market Movement (only in mock mode)
  useEffect(() => {
    if (!isLiveSimActive || dataMode !== 'mock') return;

    const interval = setInterval(() => {
      setIndexes((currentList) => {
        const idx1 = Math.floor(Math.random() * currentList.length);
        let idx2 = Math.floor(Math.random() * currentList.length);
        while (idx2 === idx1) {
          idx2 = Math.floor(Math.random() * currentList.length);
        }

        return currentList.map((item, index) => {
          if (index === idx1 || index === idx2) {
            return applyTickUpdate(item);
          }
          return item;
        });
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveSimActive, dataMode]);

  // Refresh market quotes
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIndexes((currentList) =>
        currentList.map((item) => applyTickUpdate(item))
      );
      setIsLoading(false);
    }, 350);
  }, []);

  // Custom resize handler
  const handleResizeTile = (indexId, newSize) => {
    setCustomSizes((prev) => ({
      ...prev,
      [indexId]: newSize
    }));
  };

  // Online quote fetcher
  const handleOnlineSearch = useCallback(
    async (queryToSearch) => {
      const q = (queryToSearch ?? searchQuery).trim();
      if (!q || isOnlineSearching) return;

      setIsOnlineSearching(true);
      setOnlineSearchError(null);
      lastFetchedQueryRef.current = q.toLowerCase();

      try {
        const result = await fetchOnlineQuote(q);
        if (result.success && result.data) {
          setIndexes((prev) => {
            const exists = prev.some(
              (idx) => idx.ticker.toUpperCase() === result.data.ticker.toUpperCase()
            );
            if (exists) {
              return prev.map((idx) =>
                idx.ticker.toUpperCase() === result.data.ticker.toUpperCase()
                  ? { ...idx, ...result.data }
                  : idx
              );
            }
            return [result.data, ...prev];
          });
          setSelectedRegion('All');
        } else {
          setOnlineSearchError(result.message || `No index or symbol found for "${q}".`);
        }
      } catch {
        setOnlineSearchError(`Network request failed for "${q}". Please try again.`);
      } finally {
        setIsOnlineSearching(false);
      }
    },
    [searchQuery, isOnlineSearching]
  );

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (onlineSearchError) {
      setOnlineSearchError(null);
    }
  };

  // Region index counts
  const countsByRegion = useMemo(() => {
    const counts = { All: indexes.length };
    indexes.forEach((idx) => {
      counts[idx.region] = (counts[idx.region] || 0) + 1;
    });
    return counts;
  }, [indexes]);

  // Filtered indexes
  const filteredIndexes = useMemo(() => {
    return indexes.filter((idx) => {
      const matchesRegion = selectedRegion === 'All' || idx.region === selectedRegion;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        idx.name.toLowerCase().includes(query) ||
        idx.fullName.toLowerCase().includes(query) ||
        idx.ticker.toLowerCase().includes(query) ||
        idx.proxySymbol.toLowerCase().includes(query) ||
        idx.country.toLowerCase().includes(query);

      return matchesRegion && matchesSearch;
    });
  }, [indexes, selectedRegion, searchQuery]);

  // Whenever user's search returns no filtered items, try to fetch online
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || filteredIndexes.length > 0) {
      return;
    }

    if (lastFetchedQueryRef.current === query.toLowerCase()) {
      return;
    }

    const timer = setTimeout(() => {
      handleOnlineSearch(query);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery, filteredIndexes.length, handleOnlineSearch]);

  // Standings and sizes
  const standingsMap = useMemo(() => {
    const magnitudeSorted = [...indexes].sort(
      (a, b) => Math.abs(b.baseChangePercent) - Math.abs(a.baseChangePercent)
    );
    const rankSorted = [...indexes].sort((a, b) => b.baseChangePercent - a.baseChangePercent);

    const map = {};

    indexes.forEach((idx) => {
      const magRank = magnitudeSorted.findIndex((item) => item.id === idx.id) + 1;
      const perfRank = rankSorted.findIndex((item) => item.id === idx.id) + 1;

      const calculatedSize = calculateTileSize(
        { ...idx, customSize: customSizes[idx.id] },
        indexes,
        standingMode
      );

      let rankDisplay;
      let labelDisplay;

      if (standingMode === 'magnitude') {
        rankDisplay = magRank;
        labelDisplay = magRank <= 4 ? 'TOP MOVER' : magRank <= 10 ? 'ACTIVE' : 'STABLE';
      } else if (standingMode === 'rank') {
        rankDisplay = perfRank;
        labelDisplay = perfRank <= 3 ? 'LEADER' : perfRank >= 18 ? 'LAGGARD' : 'MID';
      } else if (standingMode === 'tier') {
        rankDisplay = `T${idx.importanceTier}`;
        labelDisplay = idx.importanceTier === 1 ? 'GLOBAL ANCHOR' : 'REGIONAL LEADER';
      } else {
        rankDisplay = magRank;
        labelDisplay = 'INDEX';
      }

      map[idx.id] = {
        size: calculatedSize,
        rank: rankDisplay,
        label: labelDisplay
      };
    });

    return map;
  }, [indexes, standingMode, customSizes]);

  return (
    <div className="app-root">
      {/* Header & Controls */}
      <HeaderBar
        standingMode={standingMode}
        setStandingMode={setStandingMode}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        tileStyle={tileStyle}
        setTileStyle={setTileStyle}
        isLiveSimActive={isLiveSimActive}
        setIsLiveSimActive={setIsLiveSimActive}
        isAudioMuted={isAudioMuted}
        setIsAudioMuted={setIsAudioMuted}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        apiStatus={apiStatus}
        counts={countsByRegion}
        onSearchSubmit={() => handleOnlineSearch(searchQuery.trim())}
      />

      {/* Ticker Banner: TradingView Live Tape in Live Mode, or Custom Marquee Banner in Mock Mode */}
      {dataMode === 'live' ? (
        <TradingViewTickerTape theme="dark" />
      ) : (
        <MarketTickerBanner
          indexes={indexes}
          onSelectIndex={(idx) => setSelectedDetailIndex(idx)}
        />
      )}

      {/* Main Grid View */}
      <main className="main-content-container">
        {/* Section Heading Bar */}
        <div className="section-title-bar">
          <div className="section-title-wrap">
            <h2 className="section-heading">
              TOP 20 INDEXES
            </h2>
            <span className="section-subtext">
              Showing {filteredIndexes.length} of {indexes.length} Benchmarks • Sized by {standingMode === 'magnitude' ? 'Move Volatility' : standingMode === 'rank' ? 'Leaderboard Rank' : standingMode === 'tier' ? 'Market Importance' : 'Selected Grid'} • Click any tile for TradingView Chart
            </span>
          </div>

          <div className="grid-legend">
            <span className="legend-item legend-green">
              <span className="legend-square square-green"></span> Green: Up (+▲)
            </span>
            <span className="legend-item legend-red">
              <span className="legend-square square-red"></span> Red: Down (-▼)
            </span>
            <span className="legend-item legend-size">
              <span className="legend-icon">⊞</span> Sized by Standing
            </span>
          </div>
        </div>

        {/* Live Tiles Responsive Grid */}
        {filteredIndexes.length === 0 ? (
          isOnlineSearching ? (
            <div className="empty-state searching-state">
              <div className="search-pulse-spinner"></div>
              <h3>Searching online for "{searchQuery}"...</h3>
              <p>Connecting to global market feeds to fetch real-time quotes, charts, and technical metrics.</p>
            </div>
          ) : onlineSearchError ? (
            <div className="empty-state error-state">
              <div className="empty-icon">⚠️</div>
              <h3>No index or symbol found for "{searchQuery}"</h3>
              <p className="error-message">{onlineSearchError}</p>
              <div className="empty-actions">
                <button
                  className="app-button primary-btn"
                  onClick={() => handleOnlineSearch(searchQuery.trim())}
                >
                  Retry Online Fetch
                </button>
                <button
                  className="app-button secondary-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRegion('All');
                    setOnlineSearchError(null);
                  }}
                >
                  Clear Search
                </button>
              </div>
              <div className="search-tips">
                <span>Try standard market tickers: <code>NVDA</code>, <code>AAPL</code>, <code>MSFT</code>, <code>^VIX</code>, <code>BTC-USD</code></span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No local benchmarks match "{searchQuery}"</h3>
              <p>Looking up "{searchQuery}" across global market databases...</p>
              <button
                className="app-button primary-btn"
                onClick={() => handleOnlineSearch(searchQuery.trim())}
              >
                Fetch "{searchQuery}" Online
              </button>
            </div>
          )
        ) : (
          <div className="live-tiles-grid">
            {filteredIndexes.map((idx) => {
              const standing = standingsMap[idx.id] || { size: 'medium', rank: '', label: '' };
              return (
                <IndexTile
                  key={idx.id}
                  index={idx}
                  size={standing.size}
                  standingRank={standing.rank}
                  standingLabel={standing.label}
                  tileStyle={tileStyle}
                  standingMode={standingMode}
                  onSelectIndex={(clicked) => setSelectedDetailIndex(clicked)}
                  onResizeTile={handleResizeTile}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      {false && (<footer className="app-footer" >
        <div className="footer-left">
          <span className="footer-title">GLOBAL FINANCIAL PLATFORM</span>
          <span className="footer-detail">• {dataMode === 'live' ? 'TradingView Live Widgets (Public)' : 'Simulated Market Engine'}</span>
        </div>
        <div className="footer-right">
          <span className="footer-data-source">
            {dataMode === 'live' ? 'Live Feeds: TradingView Widgets (Zero API Keys)' : 'Engine: Simulated Ticks'}
          </span>
          <span className="footer-divider">|</span>
          <div className="data-mode-switch">
            <span className={`mode-label ${dataMode === 'mock' ? 'active' : ''}`}>Mock</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dataMode === 'live'}
                onChange={() => {
                  const next = dataMode === 'live' ? 'mock' : 'live';
                  setDataMode(next);
                  localStorage.setItem('index_tracker_data_mode', next);
                  if (next === 'mock') setIndexes(TOP_20_INDEXES);
                }}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className={`mode-label ${dataMode === 'live' ? 'active' : ''}`}>Live</span>
          </div>
        </div>
      </footer>)
      }

      {/* Deep Detail Modal with TradingView Chart Integration */}
      {selectedDetailIndex && (
        <IndexDetailModal
          index={selectedDetailIndex}
          onClose={() => setSelectedDetailIndex(null)}
        />
      )}
    </div>
  );
}

export default App;
