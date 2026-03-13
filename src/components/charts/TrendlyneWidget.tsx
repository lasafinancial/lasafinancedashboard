import React, { useEffect, useRef, useState } from 'react';

export type TrendlyneWidgetType = 'checklist-widget' | 'swot-widget' | 'technical-widget';

interface TrendlyneWidgetProps {
    symbol?: string;
    type: TrendlyneWidgetType;
    theme?: 'light' | 'dark';
}

const TrendlyneWidget: React.FC<TrendlyneWidgetProps> = ({ symbol, type, theme = 'dark' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!symbol || !containerRef.current) return;

        setIsLoaded(false);

        // Clean up previous widget instance
        containerRef.current.innerHTML = '';

        // Create the blockquote required by Trendlyne
        const blockquote = document.createElement('blockquote');
        blockquote.className = 'trendlyne-widgets';

        // Set dynamic URL with the current stock symbol, widget type, and custom dashboard colors
        let widgetUrl = `https://trendlyne.com/web-widget/${type}/Poppins/${symbol}/?posCol=10B981&primaryCol=06b6d4&negCol=EF4444&neuCol=F59E0B&theme=${theme}`;

        // Only force black background and white text if we are in dark mode
        if (theme === 'dark') {
            widgetUrl += '&bgCol=000000&txtCol=FFFFFF';
        }

        blockquote.setAttribute('data-get-url', widgetUrl);
        blockquote.setAttribute('data-theme', theme);

        // Create the script tag
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://cdn-static.trendlyne.com/static/js/webwidgets/tl-widgets.js';
        script.charset = 'utf-8';

        // Listen for iframe load to hide loading spinner
        const observer = new MutationObserver(() => {
            const iframe = containerRef.current?.querySelector('iframe');
            if (iframe) {
                iframe.onload = () => setIsLoaded(true);
                // Also set loaded after a timeout as fallback
                setTimeout(() => setIsLoaded(true), 3000);
                observer.disconnect();
            }
        });
        observer.observe(containerRef.current, { childList: true, subtree: true });

        // Append to container
        containerRef.current.appendChild(blockquote);
        containerRef.current.appendChild(script);

        return () => {
            observer.disconnect();
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol, type, theme]);

    if (!symbol) return null;

    // Helper to get nice display name for loading
    const getDisplayName = (t: string) => {
        if (t === 'checklist-widget') return 'Checklist';
        if (t === 'swot-widget') return 'SWOT Analysis';
        return 'Technical Insights';
    };

    // SWOT widget needs more height since it expands with click-to-reveal content
    const minHeight = type === 'swot-widget' ? 'min-h-[650px]' : 'min-h-[550px]';

    return (
        // NOTE: overflow-visible is critical for SWOT widget so expanded content isn't clipped
        <div
            className={`w-full rounded-2xl border border-border/50 shadow-sm relative ${minHeight} h-auto ${theme === 'light' ? 'bg-white' : 'bg-[#000000]'}`}
            style={{ overflow: 'visible' }}
        >
            {/* Loading spinner — shown until widget iframe loads */}
            {!isLoaded && (
                <div className={`absolute inset-0 flex items-center justify-center z-10 rounded-2xl ${theme === 'light' ? 'bg-white' : 'bg-[#000000]'}`}>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <p className="text-sm text-muted-foreground font-medium">Loading {getDisplayName(type)}...</p>
                    </div>
                </div>
            )}

            {/* Container for Trendlyne injection */}
            <div
                ref={containerRef}
                className="w-full relative z-0"
                style={{ minHeight: type === 'swot-widget' ? '650px' : '550px' }}
            />
        </div>
    );
};

export default TrendlyneWidget;
