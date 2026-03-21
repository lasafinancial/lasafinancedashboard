import { useState, useEffect } from 'react';
import {
  subscribeToData,
  refreshAllData,
  getCachedData,
  TopMoversData,
  MarketPositionData,
  GoogleSheetsData
} from '../lib/googleSheetsService';

import staticStockData from '../data/processed/stock_data.json';
import staticMarketMood from '../data/processed/market_mood.json';
import staticMarketStrength from '../data/processed/market_strength.json';
import staticTopMovers from '../data/processed/top_movers.json';
import staticMarketPosition from '../data/processed/market_position.json';

export function useLiveData() {
  const cached = getCachedData();

  const [stockData, setStockData] = useState<any[]>(cached ? cached.stockData : (Array.isArray(staticStockData) ? staticStockData : []));
  const [marketMood, setMarketMood] = useState<any>(cached ? cached.marketMood : staticMarketMood);
  const [marketStrength, setMarketStrength] = useState<any[]>(cached ? cached.marketStrength : staticMarketStrength);
  const [topMovers, setTopMovers] = useState<TopMoversData>(cached ? cached.topMovers : (staticTopMovers as unknown as TopMoversData));
  const [marketPosition, setMarketPosition] = useState<MarketPositionData | null>(cached ? cached.marketPosition : (staticMarketPosition as unknown as MarketPositionData));
  const [indexPerformance, setIndexPerformance] = useState<any[]>(cached ? cached.indexPerformance || [] : []);
  const [nifty50Stocks, setNifty50Stocks] = useState<any[]>(cached ? (cached as any).nifty50Stocks || [] : []);
  const [nearResistance, setNearResistance] = useState<any[]>(cached ? cached.nearResistance || [] : []);
  const [supportReversal, setSupportReversal] = useState<any[]>(cached ? cached.supportReversal || [] : []);
  const [reactionZone, setReactionZone] = useState<any[]>(cached ? cached.reactionZone || [] : []);
  const [intradayBreakout, setIntradayBreakout] = useState<any[]>(cached ? cached.intradayBreakout || [] : []);
  const [intradayDev, setIntradayDev] = useState<any[]>(cached ? cached.intradayDev || [] : []);
  const [intradayDevChanges, setIntradayDevChanges] = useState<any[]>(cached ? cached.intradayDevChanges || [] : []);
  const [playbackSnapshots, setPlaybackSnapshots] = useState<any[]>(cached ? cached.playbackSnapshots || [] : []);
  const [dailyNews, setDailyNews] = useState<any[]>(cached ? (cached as any).dailyNews || [] : []);
  const [niftyAnalysis, setNiftyAnalysis] = useState<any | null>(cached ? (cached as any).niftyAnalysis || null : null);
  const [isLoading, setIsLoading] = useState(!cached);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const unsubscribe = subscribeToData((data: GoogleSheetsData) => {
      setStockData(data.stockData);
      setMarketMood(data.marketMood);
      setMarketStrength(data.marketStrength);
      setTopMovers(data.topMovers);
      setMarketPosition(data.marketPosition);
      setIndexPerformance(data.indexPerformance || []);
      setNifty50Stocks((data as any).nifty50Stocks || []);
      setNearResistance(data.nearResistance || []);
      setSupportReversal(data.supportReversal || []);
      setReactionZone(data.reactionZone || []);
      setIntradayBreakout(data.intradayBreakout || []);
      setIntradayDev(data.intradayDev || []);
      setIntradayDevChanges(data.intradayDevChanges || []);
      setPlaybackSnapshots(data.playbackSnapshots || []);
      setDailyNews((data as any).dailyNews || []);
      setNiftyAnalysis((data as any).niftyAnalysis || null);
      setLastUpdate(new Date().toLocaleTimeString());
      setIsLoading(false);
    });

    refreshAllData().finally(() => {
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    stockData,
    marketMood,
    marketStrength,
    topMovers,
    marketPosition,
    indexPerformance,
    nifty50Stocks,
    nearResistance,
    supportReversal,
    reactionZone,
    intradayBreakout,
    intradayDev,
    intradayDevChanges,
    playbackSnapshots,
    dailyNews,
    niftyAnalysis,
    isLoading,
    lastUpdate,
    refresh: refreshAllData
  };
}

export function useTopMovers() {
  const [topMovers, setTopMovers] = useState<TopMoversData>(staticTopMovers as unknown as TopMoversData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToData((data: GoogleSheetsData) => {
      setTopMovers(data.topMovers);
      setIsLoading(false);
    });

    refreshAllData().finally(() => {
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { topMovers, isLoading };
}

export function useMarketPosition() {
  const [marketPosition, setMarketPosition] = useState<MarketPositionData | null>(staticMarketPosition as unknown as MarketPositionData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToData((data: GoogleSheetsData) => {
      setMarketPosition(data.marketPosition);
      setIsLoading(false);
    });

    refreshAllData().finally(() => {
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { data: marketPosition, isLoading };
}
