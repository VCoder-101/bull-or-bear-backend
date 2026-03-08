export const COINS = {
  BTCUSDT:  { name: 'Bitcoin',   ticker: 'BTC',  color: '#f7931a', icon: '₿' },
  ETHUSDT:  { name: 'Ethereum',  ticker: 'ETH',  color: '#627eea', icon: 'Ξ' },
  BNBUSDT:  { name: 'BNB',       ticker: 'BNB',  color: '#f0b90b', icon: 'B' },
  SOLUSDT:  { name: 'Solana',    ticker: 'SOL',  color: '#9945ff', icon: '◎' },
  XRPUSDT:  { name: 'XRP',       ticker: 'XRP',  color: '#00aae4', icon: 'X' },
  DOGEUSDT: { name: 'Dogecoin',  ticker: 'DOGE', color: '#c2a633', icon: 'Ð' },
  ADAUSDT:  { name: 'Cardano',   ticker: 'ADA',  color: '#0033ad', icon: '₳' },
  AVAXUSDT: { name: 'Avalanche', ticker: 'AVAX', color: '#e84142', icon: 'A' },
};

export const SYMBOLS = Object.keys(COINS);

export function formatPrice(price) {
  if (!price && price !== 0) return '—';
  const n = parseFloat(price);
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
}
