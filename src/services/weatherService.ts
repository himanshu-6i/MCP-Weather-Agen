import axios from "axios";

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  condition: string;
  location: string;
}

export async function getWeather(location: string): Promise<WeatherData> {
  // Input Validation
  if (!location || typeof location !== "string") {
    throw new Error("Invalid location: Location must be a string.");
  }

  const trimmedLocation = location.trim();
  if (trimmedLocation.length < 2) {
    throw new Error("Invalid location: Location name is too short.");
  }

  if (trimmedLocation.length > 100) {
    throw new Error("Invalid location: Location name is too long.");
  }

  // Basic check for invalid characters (e.g., just numbers or symbols)
  // We allow letters, numbers (for some zip codes/districts), spaces, commas, hyphens, and dots.
  const locationRegex = /^[a-zA-Z0-9\s,.-]+$/;
  if (!locationRegex.test(trimmedLocation)) {
    throw new Error("Invalid location: Contains unsupported characters.");
  }

  const fetchGeocoding = async (query: string) => {
    return await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=1&language=en&format=json`
    );
  };

  try {
    // 1. Geocode the location to get lat/lon using Open-Meteo's geocoding API
    let geoResponse = await fetchGeocoding(location);

    // If full location fails, try the first part (e.g., "London" from "London, UK")
    if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
      const firstPart = location.split(",")[0].trim();
      if (firstPart !== location) {
        geoResponse = await fetchGeocoding(firstPart);
      }
    }

    if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
      throw new Error(`Location not found: ${location}`);
    }

    const { latitude, longitude, name, country } = geoResponse.data.results[0];

    // 2. Fetch weather data for the lat/lon
    const weatherResponse = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );

    const current = weatherResponse.data.current_weather;

    return {
      temperature: current.temperature,
      windSpeed: current.windspeed,
      condition: getWeatherCondition(current.weathercode),
      location: `${name}, ${country}`,
    };
  } catch (error: any) {
    console.error("Error fetching weather:", error);
    if (error.message && error.message.startsWith("Location not found")) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Location not found: ${location}`);
      }
      throw new Error(`Weather service error: ${error.message}`);
    }
    throw new Error("Failed to fetch weather data.");
  }
}

function getWeatherCondition(code: number): string {
  const conditions: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
  };
  return conditions[code] || "Unknown";
}
