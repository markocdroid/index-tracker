import { useState, useMemo } from 'react';
import { TOP_20_INDEXES, calculateTileSize } from './data/indexesData';
import HeaderBar from './components/HeaderBar';
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

  // Market engine status indicator
  const apiStatus = useMemo(() => {
    if (isLiveSimActive) {
      return { type: 'live', label: 'TradingView: Live' };
    }
    return { type: 'paused', label: 'Market Feed: Paused' };
  }, [isLiveSimActive]);

  // Refresh action for UI feedback (TradingView widgets refresh independently).
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 350);
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
        idx.proxySymbol.toLowerCase().includes(query) ||
        idx.country.toLowerCase().includes(query);

      return matchesRegion && matchesSearch;
    });
  }, [indexes, selectedRegion, searchQuery]);

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
        onSearchSubmit={() => {}}
      />

      {/* Ticker Banner: TradingView Live Tape */}
      <TradingViewTickerTape theme="dark" />

      {/* Main Grid View */}
      <main className="main-content-container">
        {/* Section Heading Bar */}
        <div className="section-title-bar">
          <div className="section-title-wrap">
            <h2 className="section-heading">
              TOP 20 INDEXES
            </h2>
            <span className="section-subtext">
              Showing {filteredIndexes.length} of {indexes.length} Benchmarks • Sized by {standingMode === 'magnitude' ? 'Move Volatility' : standingMode === 'rank' ? 'Leaderboard Rank' : standingMode === 'tier' ? 'Market Importance' : 'Selected Grid'} • TradingView widgets are the live source of truth
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
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No local benchmarks match "{searchQuery}"</h3>
            <p>Search currently filters the built-in benchmark set only.</p>
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
