import { useState, useEffect } from 'react';
import {
  subscribeToData,
  refreshAllData,
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
  const [stockData, setStockData] = useState<any[]>(staticStockData);
  const [marketMood, setMarketMood] = useState<any>(staticMarketMood);
  const [marketStrength, setMarketStrength] = useState<any[]>(staticMarketStrength);
  const [topMovers, setTopMovers] = useState<TopMoversData>(staticTopMovers as unknown as TopMoversData);
  const [marketPosition, setMarketPosition] = useState<MarketPositionData | null>(staticMarketPosition as unknown as MarketPositionData);
  const [indexPerformance, setIndexPerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const unsubscribe = subscribeToData((data: GoogleSheetsData) => {
      setStockData(data.stockData);
      setMarketMood(data.marketMood);
      setMarketStrength(data.marketStrength);
      setTopMovers(data.topMovers);
      setMarketPosition(data.marketPosition);
      setIndexPerformance(data.indexPerformance || []);
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
