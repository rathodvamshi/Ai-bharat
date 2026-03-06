"use client";

import { useState, useEffect } from "react";

export type DeviceLayout = "mobile" | "tablet" | "desktop" | null;

const BREAKPOINTS = {
    mobile: 768,   // ≤ 768px → mobile
    tablet: 1024,  // 769–1024px → tablet (uses desktop layout)
    desktop: 1025, // > 1024px → desktop
} as const;

/**
 * useDeviceLayout
 *
 * Returns the current device layout category based on window width:
 *   - "mobile"  : ≤ 768px
 *   - "tablet"  : 769–1024px  (renders desktop layout)
 *   - "desktop" : > 1024px
 *   - null      : SSR / not yet measured (avoid hydration mismatch)
 *
 * The app renders only after the layout is determined on the client.
 */
export function useDeviceLayout(): DeviceLayout {
    const [layout, setLayout] = useState<DeviceLayout>(null);

    useEffect(() => {
        const getLayout = (width: number): DeviceLayout => {
            if (width <= BREAKPOINTS.mobile) return "mobile";
            if (width <= BREAKPOINTS.tablet) return "tablet";
            return "desktop";
        };

        // Set on first mount
        setLayout(getLayout(window.innerWidth));

        // Update on resize
        const handler = () => setLayout(getLayout(window.innerWidth));
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    return layout;
}
