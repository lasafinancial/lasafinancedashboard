import React, { useEffect, useRef, memo } from 'react';

interface TechnicalAnalysisWidgetProps {
    symbol?: string;
    height?: number;
    width?: string | number;
}

function TechnicalAnalysisWidget({
    symbol = "NASDAQ:AAPL",
    height = 450,
    width = "100%"
}: TechnicalAnalysisWidgetProps) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentContainer = container.current;
        if (!currentContainer) return;

        // Clear existing content
        currentContainer.innerHTML = '';

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "interval": "1D",
            "width": "100%",
            // Transparent so it sits on the site's dark card (the widget ignores backgroundColor)
            "isTransparent": true,
            "height": height,
            "symbol": symbol,
            "showIntervalTabs": true,
            "displayMode": "multiple",
            "locale": "en",
            "colorTheme": "dark"
        });

        currentContainer.appendChild(script);

        return () => {
            if (currentContainer) {
                currentContainer.innerHTML = '';
            }
        };
    }, [symbol, height, width]);

    return (
        <div className="tradingview-widget-container" ref={container} style={{ height }}>
            <div className="tradingview-widget-container__widget"></div>
            <div className="tradingview-widget-copyright">
                <a href={`https://www.tradingview.com/symbols/${symbol}/technicals/`} rel="noopener nofollow" target="_blank">
                    <span className="blue-text">{symbol} technical analysis</span>
                </a> by TradingView
            </div>
        </div>
    );
}

export default memo(TechnicalAnalysisWidget);
