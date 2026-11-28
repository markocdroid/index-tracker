import { useCallback, useEffect, useMemo, useState } from 'react';
import { TOP_20_INDEXES, calculateTileSize, stripMockQuoteFields } from './data/indexesData';
import HeaderBar from './components/HeaderBar';
import MarketTickerBanner from './components/MarketTickerBanner';
import IndexTile from './components/IndexTile';
import IndexDetailModal from './components/IndexDetailModal';
import { fetchYahooIndexBatch } from './services/yahooIndexService';
import './App.css';

function App() {
  const [indexes, setIndexes] = useState(() => stripMockQuoteFields(TOP_20_INDEXES));
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
  const [syncError, setSyncError] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);

  const refreshQuotes = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const liveMap = await fetchYahooIndexBatch(stripMockQuoteFields(TOP_20_INDEXES));

      setIndexes((prev) => prev.map((idx) => ({
        ...idx,
        ...(liveMap[idx.id] || {})
      })));

      setSelectedDetailIndex((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...(liveMap[prev.id] || {})
        };
      });

      setSyncError('');
      setLastSyncAt(new Date());
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to refresh quotes');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshQuotes(false);
  }, [refreshQuotes]);

  useEffect(() => {
    if (!isLiveSimActive) return undefined;

    const timer = setInterval(() => {
      refreshQuotes(true);
    }, 60_000);

    return () => clearInterval(timer);
  }, [isLiveSimActive, refreshQuotes]);

  // Market engine status indicator
  const apiStatus = useMemo(() => {
    if (syncError) {
      return { type: 'paused', label: 'Yahoo: Degraded' };
    }

    if (isLiveSimActive) {
      return { type: 'live', label: 'Yahoo: Live' };
    }
    return { type: 'paused', label: 'Yahoo: Paused' };
  }, [isLiveSimActive, syncError]);

  const handleRefresh = async () => {
    await refreshQuotes(false);
  };

  // Custom resize handler
  const handleResizeTile = (indexId, newSize) => {
    setCustomSizes((prev) => ({
      ...prev,
      [indexId]: newSize
    }));
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
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
        idx.exchange.toLowerCase().includes(query) ||
        idx.country.toLowerCase().includes(query);

      return matchesRegion && matchesSearch;
    });
  }, [indexes, selectedRegion, searchQuery]);

  // Standings and sizes
  const standingsMap = useMemo(() => {
    const pct = (idx) => {
      const n = Number(idx.baseChangePercent);
      return Number.isFinite(n) ? n : 0;
    };

    const magnitudeSorted = [...indexes].sort(
      (a, b) => Math.abs(pct(b)) - Math.abs(pct(a))
    );
    const rankSorted = [...indexes].sort((a, b) => pct(b) - pct(a));

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
        onSearchSubmit={() => {}}
      />

      <MarketTickerBanner
        indexes={indexes}
        onSelectIndex={(clicked) => setSelectedDetailIndex(clicked)}
      />

      {/* Main Grid View */}
      <main className="main-content-container">
        {/* Section Heading Bar */}
        <div className="section-title-bar">
          <div className="section-title-wrap">
            <h2 className="section-heading">
              TOP 20 INDEXES
            </h2>
            <span className="section-subtext">
              Showing {filteredIndexes.length} of {indexes.length} Benchmarks • Sized by {standingMode === 'magnitude' ? 'Move Volatility' : standingMode === 'rank' ? 'Leaderboard Rank' : standingMode === 'tier' ? 'Market Importance' : 'Selected Grid'} • Yahoo Finance public endpoints • {lastSyncAt ? `Last sync ${lastSyncAt.toLocaleTimeString()}` : 'Syncing...'}
            </span>
            {syncError && <span className="section-subtext" style={{ color: '#ffb3b3' }}>Feed warning: {syncError}</span>}
          </div>

          <div className="section-center-attribution">
            Source attribution: <a className="source-link" href="https://finance.yahoo.com/" target="_blank" rel="noopener nofollow">Yahoo Finance</a>
          </div>
        </div>

        {/* Live Tiles Responsive Grid */}
        {filteredIndexes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No benchmarks match "{searchQuery}"</h3>
            <p>Try searching by name, ticker, exchange, or country.</p>
          </div>
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

      {/* Deep Detail Modal with yahoo_finance chart integration */}
      {selectedDetailIndex && (
        <IndexDetailModal
          index={selectedDetailIndex}
          onClose={() => setSelectedDetailIndex(null)}
        />
      )}

      <footer className="app-footer">
        <span>
          <span className="footer-title">DATA ATTRIBUTION</span>
          <span className="footer-divider">|</span>
          Quotes and charts sourced from <a className="source-link" href="https://finance.yahoo.com/" target="_blank" rel="noopener nofollow">Yahoo Finance</a> (direct or read-only CORS relay)
        </span>
        <span>
          Delayed market data. For informational use only.
        </span>
      </footer>
    </div>
  );
}

export default App;
