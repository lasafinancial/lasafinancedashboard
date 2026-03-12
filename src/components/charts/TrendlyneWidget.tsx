import React, { useEffect, useRef } from 'react';

export type TrendlyneWidgetType = 'checklist-widget' | 'swot-widget' | 'technical-widget';

interface TrendlyneWidgetProps {
    symbol?: string;
    type: TrendlyneWidgetType;
    theme?: 'light' | 'dark';
}

const TrendlyneWidget: React.FC<TrendlyneWidgetProps> = ({ symbol, type, theme = 'dark' }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!symbol || !containerRef.current) return;

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

        // Append to container
        containerRef.current.appendChild(blockquote);
        containerRef.current.appendChild(script);

        return () => {
            // Cleanup on unmount or when symbol changes
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

    return (
        <div className={`w-full rounded-2xl border border-border/50 overflow-hidden shadow-sm relative min-h-[550px] h-auto ${theme === 'light' ? 'bg-white' : 'bg-[#000000]'}`}>
            {/* Loading state until the widget mounts inside the container */}
            <div className={`absolute inset-0 flex items-center justify-center -z-10 ${theme === 'light' ? 'bg-white' : 'bg-[#000000]'}`}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium">Loading {getDisplayName(type)}...</p>
                </div>
            </div>

            {/* Container for Trendlyne injection */}
            <div ref={containerRef} className="w-full relative z-10" />
        </div>
    );
};

export default TrendlyneWidget;
