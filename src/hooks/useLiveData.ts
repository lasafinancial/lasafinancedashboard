import { useState, useEffect, useCallback } from 'react';
import {
  fetchLiveStockData,
  fetchLiveMarketMood,
  fetchLiveMarketStrength,
  fetchLiveTopMovers,
  fetchMarketPositionData,
  subscribeToDataRefresh,
  startAutoRefresh,
  getLastRefreshTime,
  getCachedStockData,
  getCachedMarketMood,
  getCachedMarketStrength,
  getCachedTopMovers,
  getCachedMarketPosition,
  refreshAllData,
  TopMoversData,
  MarketPositionData
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
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDataFromCache = useCallback(() => {
    const cachedStock = getCachedStockData();
    const cachedMood = getCachedMarketMood();
    const cachedStrength = getCachedMarketStrength();
    const refreshTime = getLastRefreshTime();

    if (cachedStock) setStockData(cachedStock);
    if (cachedMood) setMarketMood(cachedMood);
    if (cachedStrength) setMarketStrength(cachedStrength);
    if (refreshTime) setLastRefresh(refreshTime);
  }, []);

  const manualRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await refreshAllData();
      updateDataFromCache();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [updateDataFromCache]);

  useEffect(() => {
    startAutoRefresh();

    const unsubscribe = subscribeToDataRefresh(() => {
      updateDataFromCache();
    });

    return () => {
      unsubscribe();
    };
  }, [updateDataFromCache]);

  return {
    stockData,
    marketMood,
    marketStrength,
    lastRefresh,
    isLoading,
    error,
    manualRefresh
  };
}

export function useStockData() {
  const [data, setData] = useState<any[]>(staticStockData);

  useEffect(() => {
    const unsubscribe = subscribeToDataRefresh(() => {
      const cached = getCachedStockData();
      if (cached) setData(cached);
    });

    fetchLiveStockData().then(setData).catch(() => {});

    return unsubscribe;
  }, []);

  return data;
}

export function useMarketMood() {
  const [data, setData] = useState<any>(staticMarketMood);

  useEffect(() => {
    const unsubscribe = subscribeToDataRefresh(() => {
      const cached = getCachedMarketMood();
      if (cached) setData(cached);
    });

    fetchLiveMarketMood().then(setData).catch(() => {});

    return unsubscribe;
  }, []);

  return data;
}

export function useMarketStrength() {
  const [data, setData] = useState<any[]>(staticMarketStrength);

  useEffect(() => {
    const unsubscribe = subscribeToDataRefresh(() => {
      const cached = getCachedMarketStrength();
      if (cached) setData(cached);
    });

    fetchLiveMarketStrength().then(setData).catch(() => {});

    return unsubscribe;
  }, []);

  return data;
}

export function useTopMovers() {
  const [data, setData] = useState<TopMoversData>(staticTopMovers as TopMoversData);

  useEffect(() => {
    const unsubscribe = subscribeToDataRefresh(() => {
      const cached = getCachedTopMovers();
      if (cached) setData(cached);
    });

    fetchLiveTopMovers().then(result => {
      if (result.topGainers.length > 0 || result.topLosers.length > 0) {
        setData(result);
      }
    }).catch(() => {});

    return unsubscribe;
  }, []);

  return data;
}

export function useMarketPosition() {
  const [data, setData] = useState<MarketPositionData>(() => {
    return getCachedMarketPosition() || (staticMarketPosition as MarketPositionData);
  });
  const [isLoading, setIsLoading] = useState(!getCachedMarketPosition());

  useEffect(() => {
    const unsubscribe = subscribeToDataRefresh(() => {
      const cached = getCachedMarketPosition();
      if (cached) setData(cached);
    });

    if (!getCachedMarketPosition()) {
      fetchMarketPositionData()
        .then(result => {
          setData(result);
          setIsLoading(false);
        })
        .catch(() => {
          setData(staticMarketPosition as MarketPositionData);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return unsubscribe;
  }, []);

  return { data, isLoading };
}
