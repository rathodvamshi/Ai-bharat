import { useState, useEffect, useCallback } from "react";
import { WeatherData } from "../components/WeatherSky";

export interface ForecastDay {
    date: Date;
    tempMin: number;
    tempMax: number;
    condition: string;
    rainProb: number;
}

export interface DetailedWeather {
    current: WeatherData & {
        windSpeed: number;
        humidity: number;
        sunrise: number;
        sunset: number;
        soilTemp: number;
        precipitation: number;
    };
    forecast: ForecastDay[];
    alerts: string[];
}

export function useWeather() {
    const [locationGranted, setLocationGranted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [weatherData, setWeatherData] = useState<DetailedWeather | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fallback default weather
    const getFallbackWeather = useCallback((): DetailedWeather => {
        // Requirement: if location isn't enabled, show a default sunny sky.
        const type: WeatherData["type"] = "sunny";
        const condition = "Sunny";

        const mockForecast: ForecastDay[] = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            return {
                date,
                tempMin: 22 + Math.floor(Math.random() * 4),
                tempMax: 30 + Math.floor(Math.random() * 5),
                condition: i % 3 === 0 ? "Partly Cloudy" : "Sunny",
                rainProb: Math.floor(Math.random() * 30),
            };
        });

        return {
            current: {
                type, temp: 28, city: "Your Location", condition,
                windSpeed: 12, humidity: 45,
                sunrise: Date.now() - 3600000 * 6,
                sunset: Date.now() + 3600000 * 6,
                soilTemp: 26, precipitation: 0
            },
            forecast: mockForecast,
            alerts: ["🌾 Enable location for accurate weather data."]
        };
    }, []);

    const mapWeatherCodeToCondition = (code: number): string => {
        // Open-Meteo weather codes: https://open-meteo.com/en/docs
        if (code === 0) return "Clear";
        if (code === 1) return "Mainly Clear";
        if (code === 2) return "Partly Cloudy";
        if (code === 3) return "Overcast";
        if (code === 45 || code === 48) return "Fog";
        if (code === 51 || code === 53 || code === 55) return "Drizzle";
        if (code === 56 || code === 57) return "Freezing Drizzle";
        if (code === 61 || code === 63 || code === 65) return "Rain";
        if (code === 66 || code === 67) return "Freezing Rain";
        if (code === 71 || code === 73 || code === 75) return "Snow";
        if (code === 77) return "Snow Grains";
        if (code === 80 || code === 81 || code === 82) return "Rain Showers";
        if (code === 85 || code === 86) return "Snow Showers";
        if (code === 95) return "Thunderstorm";
        if (code === 96 || code === 99) return "Thunderstorm with Hail";
        return "Weather";
    };

    const mapWeatherCodeToType = (code: number, isDay: boolean): WeatherData["type"] => {
        // Storm
        if (code === 95 || code === 96 || code === 99) return "storm";

        // Rain (drizzle / rain / showers / freezing rain)
        if (
            (code >= 51 && code <= 67) ||
            (code >= 80 && code <= 82)
        ) return "rainy";

        // Cloud / fog / snow are treated as cloudy for the header animation
        if (
            code === 2 || code === 3 ||
            code === 45 || code === 48 ||
            (code >= 71 && code <= 77) ||
            (code >= 85 && code <= 86)
        ) return "cloudy";

        // Clear-ish
        if (!isDay) return "night";
        const hour = new Date().getHours();
        return hour < 8 ? "morning" : "sunny";
    };

    const fetchCityName = async (lat: number, lon: number): Promise<string> => {
        try {
            // Priority 1: OpenStreetMap Nominatim Reverse Geocoding (free, reliable)
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
                {
                    headers: {
                        'User-Agent': 'JanSahayak-FarmerApp/1.0'
                    }
                }
            );

            if (res.ok) {
                const json = await res.json();
                const address = json?.address;
                if (address) {
                    // Try to get city/town/village name
                    const cityName = address.city || address.town || address.village || address.county || address.state_district;
                    const state = address.state;
                    if (cityName && state) {
                        return `${cityName}, ${state}`;
                    } else if (cityName) {
                        return cityName;
                    } else if (state) {
                        return state;
                    }
                }
            }

            // Priority 2: Fallback based on timezone if possible
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz) {
                const city = tz.split('/').pop()?.replace(/_/g, ' ');
                if (city) return city;
            }

            return "Your Location";
        } catch (error) {
            console.error("Geocoding failed:", error);
            // Fallback to timezone
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (tz) {
                    const city = tz.split('/').pop()?.replace(/_/g, ' ');
                    if (city) return city;
                }
            } catch {
                // ignore
            }
            return "Your Location";
        }
    };

    const fetchWeather = useCallback(async (lat: number, lon: number) => {
        try {
            setLoading(true);
            setError(null);

            const [cityName, meteoRes] = await Promise.all([
                fetchCityName(lat, lon),
                fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,is_day,wind_speed_10m` +
                    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset` +
                    `&timezone=auto`
                ),
            ]);

            if (!meteoRes.ok) throw new Error("Weather API failed");
            const meteoJson = await meteoRes.json();

            const current = meteoJson.current;
            const daily = meteoJson.daily;
            const isDay = Boolean(current?.is_day);
            const code = Number(current?.weather_code ?? 0);
            const skyType = mapWeatherCodeToType(code, isDay);

            const sunriseMs = daily?.sunrise?.[0] ? Date.parse(daily.sunrise[0]) : Date.now() - 3600000 * 6;
            const sunsetMs = daily?.sunset?.[0] ? Date.parse(daily.sunset[0]) : Date.now() + 3600000 * 6;

            const currentObj: DetailedWeather["current"] = {
                type: skyType,
                temp: Math.round(Number(current?.temperature_2m ?? 28)),
                city: cityName || "Your Location",
                condition: mapWeatherCodeToCondition(code),
                windSpeed: Number(current?.wind_speed_10m ?? 12),
                humidity: Number(current?.relative_humidity_2m ?? 45),
                sunrise: sunriseMs,
                sunset: sunsetMs,
                soilTemp: Math.round(Number(current?.temperature_2m ?? 28)) - 2,
                precipitation: Number(current?.precipitation ?? 0),
            };

            const alerts: string[] = [];
            if (currentObj.type === "storm") alerts.push("⛈️ Thunderstorm warning: Seek shelter.");
            if (currentObj.type === "rainy" && currentObj.precipitation > 3) alerts.push("🌧️ Rain expected: Plan outdoor work carefully.");
            if (currentObj.windSpeed > 30) alerts.push("🌬️ Strong wind alert.");
            if (currentObj.temp > 38) alerts.push("🌡️ Extreme heat warning.");
            else if (currentObj.temp > 35) alerts.push("🌡️ High temperature alert.");
            if (currentObj.temp < 10) alerts.push("❄️ Cold warning.");
            if (currentObj.humidity > 85) alerts.push("💧 High humidity alert.");
            if (alerts.length === 0) alerts.push("🌾 Good weather for farming.");

            setWeatherData({
                current: currentObj,
                forecast: Array.from({ length: Math.min(7, daily?.time?.length || 0) }, (_, i) => {
                    const date = daily?.time?.[i] ? new Date(daily.time[i]) : new Date(Date.now() + i * 86400000);
                    const tempMin = Math.round(Number(daily?.temperature_2m_min?.[i] ?? currentObj.temp - 4));
                    const tempMax = Math.round(Number(daily?.temperature_2m_max?.[i] ?? currentObj.temp + 3));
                    const dCode = Number(daily?.weather_code?.[i] ?? code);
                    const rainProb = Math.round(Number(daily?.precipitation_probability_max?.[i] ?? 0));
                    return {
                        date,
                        tempMin,
                        tempMax,
                        condition: mapWeatherCodeToCondition(dCode),
                        rainProb,
                    };
                }),
                alerts
            });
            setLocationGranted(true);
        } catch (err) {
            console.error("Weather fetch failed:", err);
            setError("Failed to fetch weather");
            setWeatherData(getFallbackWeather());
        } finally {
            setLoading(false);
        }
    }, [getFallbackWeather]);

    const requestLocation = useCallback(() => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            console.error("Geolocation API not supported");
            setError("Geolocation not supported on this device");
            setWeatherData(getFallbackWeather());
            return;
        }

        // Check if we're on HTTPS (required for geolocation on mobile)
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            console.warn("Geolocation requires HTTPS. Current protocol:", window.location.protocol);
        }

        console.log("Requesting location...");
        setLoading(true);
        setError(null);

        // Helper function to try getting location with specific options
        const tryGetLocation = (highAccuracy: boolean, timeout: number): Promise<GeolocationPosition> => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: highAccuracy,
                        timeout: timeout,
                        maximumAge: highAccuracy ? 0 : 60000
                    }
                );
            });
        };

        // Try high accuracy first, fallback to low accuracy if it fails
        const attemptLocation = async () => {
            try {
                // First try: High accuracy with longer timeout (for GPS)
                console.log("Trying high accuracy location...");
                const position = await tryGetLocation(true, 30000);
                console.log("High accuracy location success:", position.coords.latitude, position.coords.longitude);
                return position;
            } catch (highAccuracyError: any) {
                console.warn("High accuracy failed:", highAccuracyError.message, "- Trying low accuracy...");

                // Second try: Low accuracy (uses network/WiFi, faster on mobile)
                try {
                    const position = await tryGetLocation(false, 20000);
                    console.log("Low accuracy location success:", position.coords.latitude, position.coords.longitude);
                    return position;
                } catch (lowAccuracyError: any) {
                    console.warn("Both location attempts failed:", lowAccuracyError.message);
                    return null;
                }
            }
        };

        attemptLocation()
            .then((position) => {
                if (!position) {
                    setError("Could not determine your location. Please check your settings.");
                    setWeatherData(getFallbackWeather());
                    setLocationGranted(false);
                    return;
                }
                const { latitude, longitude, accuracy } = position.coords;
                console.log("Location granted:", latitude, longitude, "Accuracy:", accuracy, "meters");
                fetchWeather(latitude, longitude);
            })
            .catch((err: GeolocationPositionError) => {
                console.error("Location error:", err.code, err.message);
                let errorMessage = "Location unavailable";

                switch (err.code) {
                    case 1: // PERMISSION_DENIED
                        errorMessage = "Location permission denied. Please enable location access in your browser/device settings.";
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        errorMessage = "Location information is unavailable. Please check your device's location settings.";
                        break;
                    case 3: // TIMEOUT
                        errorMessage = "Location request timed out. Please try again or check your GPS/network connection.";
                        break;
                }

                setError(errorMessage);
                setWeatherData(getFallbackWeather());
                setLocationGranted(false);
                setLoading(false);
            });
    }, [fetchWeather, getFallbackWeather]);

    // Initialize with fallback and attempt location fetch
    useEffect(() => {
        setWeatherData(getFallbackWeather());

        // Attempt silent fetching on mount
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("Location auto-granted:", position.coords.latitude, position.coords.longitude);
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    console.log("Auto-location failed (expected if not yet granted):", err.message);
                },
                { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 }
            );
        }
    }, [getFallbackWeather, fetchWeather]);

    return { weatherData, locationGranted, loading, error, requestLocation };
}
