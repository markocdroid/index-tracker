/**
 * Global Market Hours and Trading Session Utility
 * Computes live open/closed status for major international stock exchanges
 */

export const MARKET_SESSIONS = [
  {
    id: 'nyse',
    name: 'New York (NYSE / NASDAQ)',
    code: 'US',
    flag: '🇺🇸',
    openUtc: 14.5, // 14:30 UTC (9:30 AM EST)
    closeUtc: 21.0 // 21:00 UTC (4:00 PM EST)
  },
  {
    id: 'lse',
    name: 'London (LSE)',
    code: 'GB',
    flag: '🇬🇧',
    openUtc: 8.0,  // 08:00 UTC
    closeUtc: 16.5 // 16:30 UTC
  },
  {
    id: 'fra',
    name: 'Frankfurt (XETRA)',
    code: 'DE',
    flag: '🇩🇪',
    openUtc: 8.0,  // 08:00 UTC (9:00 CET)
    closeUtc: 16.5 // 16:30 UTC
  },
  {
    id: 'tse',
    name: 'Tokyo (TSE)',
    code: 'JP',
    flag: '🇯🇵',
    openUtc: 0.0,  // 00:00 UTC (9:00 AM JST)
    closeUtc: 6.0  // 06:00 UTC (3:00 PM JST)
  },
  {
    id: 'hkex',
    name: 'Hong Kong (HKEX)',
    code: 'HK',
    flag: '🇭🇰',
    openUtc: 1.5,  // 01:30 UTC (9:30 AM HKT)
    closeUtc: 8.0  // 08:00 UTC (4:00 PM HKT)
  },
  {
    id: 'asx',
    name: 'Sydney (ASX)',
    code: 'AU',
    flag: '🇦🇺',
    openUtc: 23.0, // 23:00 UTC (previous day, 10:00 AM AEST)
    closeUtc: 5.0  // 05:00 UTC (4:00 PM AEST)
  }
];

export function getSessionStatus(session) {
  const now = new Date();
  const day = now.getUTCDay(); // 0 is Sunday, 6 is Saturday

  // Weekend check (Saturday or Sunday)
  if (day === 0 || day === 6) {
    return { isOpen: false, statusText: 'Closed (Weekend)', badgeClass: 'status-closed' };
  }

  const currentUtcHours = now.getUTCHours() + now.getUTCMinutes() / 60;

  if (session.openUtc < session.closeUtc) {
    // Normal day session
    if (currentUtcHours >= session.openUtc && currentUtcHours < session.closeUtc) {
      return { isOpen: true, statusText: 'Open', badgeClass: 'status-open' };
    }
  } else {
    // Crosses midnight UTC (e.g. Sydney)
    if (currentUtcHours >= session.openUtc || currentUtcHours < session.closeUtc) {
      return { isOpen: true, statusText: 'Open', badgeClass: 'status-open' };
    }
  }

  return { isOpen: false, statusText: 'Closed', badgeClass: 'status-closed' };
}
