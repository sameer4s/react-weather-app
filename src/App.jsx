import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiHome,
  FiMoon,
  FiSun
} from 'react-icons/fi';
import {
  WiDaySunny,
  WiRain,
  WiSnow,
  WiCloudy,
  WiDayCloudyGusts,
  WiNightClear
} from 'react-icons/wi';

const App = () => {
  const [cityInput, setCityInput] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [autoSuggestions, setAutoSuggestions] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [coords, setCoords] = useState({ lat: null, lon: null });

  const API_KEY = process.env.REACT_APP_API_KEY;

  // Just toggles the theme manually; storing in localStorage so it sticks
  const toggleDarkMode = () => {
    const newTheme = !darkTheme;
    setDarkTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Quick reset of app state (probably needs confirmation later?)
  const resetEverything = () => {
    setCityInput('');
    setWeatherData(null);
    setErrorMsg('');
    setSearchHistory([]);
    setCoords({ lat: null, lon: null });
  };

  // Typing debounce – don't fire off suggestions every keystroke
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (cityInput.trim()) {
        tryFetchSuggestions();
      }
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [cityInput]);

  const tryFetchSuggestions = async () => {
    const ctrl = new AbortController();
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=5&appid=${API_KEY}`,
        { signal: ctrl.signal }
      );
      setAutoSuggestions(res.data);
      setIsSuggesting(true);
    } catch (err) {
      // It's okay to silently fail here, just reset
      setAutoSuggestions([]);
    }
  };

  const isDaylight = () => {
    if (!weatherData) return true;
    const nowInSeconds = Date.now() / 1000;
    return (
      nowInSeconds > weatherData.sys.sunrise &&
      nowInSeconds < weatherData.sys.sunset
    );
  };

  const getGradientBackground = () => {
    if (darkTheme) return 'bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-800';
    if (weatherData && !isDaylight()) {
      return 'bg-gradient-to-br from-indigo-100 via-blue-200 to-indigo-50';
    }
    return 'bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-50';
  };

  const renderWeatherIcon = (condition) => {
    const iconSizeClass = 'text-6xl animate-pulse';
    const isDay = isDaylight();

    const iconMap = {
      clear: isDay ?
        <WiDaySunny className={`${iconSizeClass} text-amber-400`} /> :
        <WiNightClear className={`${iconSizeClass} text-indigo-300`} />,
      rain: <WiRain className={`${iconSizeClass} ${darkTheme ? 'text-blue-300' : 'text-sky-600'}`} />,
      snow: <WiSnow className={`${iconSizeClass} text-blue-200`} />,
      clouds: <WiCloudy className={`${iconSizeClass} ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`} />,
      mist: <WiDayCloudyGusts className={`${iconSizeClass} text-gray-400`} />
    };

    return iconMap[condition.toLowerCase()] || iconMap.clear;
  };

  const searchWeather = async (e) => {
    if (e) e.preventDefault();
    setIsSuggesting(false);
    setIsFetching(true);
    setErrorMsg('');

    let lat = coords.lat;
    let lon = coords.lon;

    try {
      if (cityInput.trim()) {
        const geoRes = await axios.get(
          `https://api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=1&appid=${API_KEY}`
        );

        if (!geoRes.data.length) throw new Error('Could not locate that city.');

        lat = geoRes.data[0].lat;
        lon = geoRes.data[0].lon;

        setCoords({ lat, lon });
      }

      const weatherRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      setWeatherData(weatherRes.data);

      // Deduplicate history (latest first), keep only 5
      setSearchHistory(prev => [...new Set([cityInput, ...prev])].slice(0, 5));
      setCityInput('');
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Something went wrong...'
      );
      setWeatherData(null);
    } finally {
      setIsFetching(false);
    }
  };

  const handleKeyNav = (e) => {
    if (!isSuggesting || !autoSuggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion((prev) => Math.min(prev + 1, autoSuggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        if (activeSuggestion >= 0) {
          e.preventDefault();
          const selected = autoSuggestions[activeSuggestion];
          setCityInput(selected.name);
          setCoords({ lat: selected.lat, lon: selected.lon });
          searchWeather();
        }
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={`min-h-screen ${getGradientBackground()} transition-all duration-300 p-4 md:p-8 ${
        darkTheme ? 'dark:text-gray-100' : 'text-gray-800'
      }`}
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Controls at the top */}
        <div className="flex justify-between items-center">
          <button
            onClick={resetEverything}
            className={`p-3 rounded-lg ${
              darkTheme
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-white hover:bg-gray-50 text-sky-600 shadow-sm'
            }`}
          >
            <FiHome className="text-xl" />
          </button>
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-lg ${
              darkTheme
                ? 'bg-gray-800 hover:bg-gray-700 text-amber-400'
                : 'bg-white hover:bg-gray-50 text-sky-600 shadow-sm'
            }`}
          >
            {darkTheme ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
          </button>
        </div>

        {/* Input form */}
        <form onSubmit={searchWeather} className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Enter city name"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onFocus={() => setIsSuggesting(true)}
                onBlur={() => setTimeout(() => setIsSuggesting(false), 200)}
                onKeyDown={handleKeyNav}
                className={`w-full p-3 rounded-xl border ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-indigo-400'
                    : 'bg-white border-gray-200 text-gray-800 focus:border-sky-400 shadow-sm'
                } focus:ring-2 focus:ring-opacity-30 ${darkTheme ? 'focus:ring-indigo-400' : 'focus:ring-sky-300'}`}
              />

              {/* Maybe extract this part later */}
              {isSuggesting && autoSuggestions.length > 0 && (
                <div
                  className={`absolute z-10 w-full mt-2 rounded-xl shadow-lg ${
                    darkTheme ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  {autoSuggestions.map((item, idx) => (
                    <button
                      key={`${item.lat}-${item.lon}`}
                      onClick={() => {
                        setCityInput(item.name);
                        setCoords({ lat: item.lat, lon: item.lon });
                        searchWeather();
                      }}
                      onMouseEnter={() => setActiveSuggestion(idx)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-2 ${
                        darkTheme
                          ? `hover:bg-gray-700 ${activeSuggestion === idx ? 'bg-gray-700' : 'bg-gray-800'} text-gray-200`
                          : `hover:bg-sky-50 ${activeSuggestion === idx ? 'bg-sky-100' : 'bg-white'} text-gray-700`
                      }`}
                    >
                      <FiSearch className={`${darkTheme ? 'text-indigo-400' : 'text-sky-500'}`} />
                      <span className="truncate">
                        {item.name}, {item.country}
                        {item.state && `, ${item.state}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isFetching}
              className={`p-3 rounded-xl flex items-center gap-2 ${
                darkTheme
                  ? 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700'
                  : 'bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white shadow-sm'
              }`}
            >
              <FiSearch className="text-lg" />
              <span className="hidden md:inline">Search</span>
            </button>
          </div>
        </form>

        {/* Feedback states */}
        {isFetching && (
          <div className="text-center py-8 space-y-4">
            <FiRefreshCw className="animate-spin text-4xl mx-auto text-sky-500" />
            <p className="font-medium">Fetching weather info...</p>
          </div>
        )}

        {errorMsg && (
          <div
            className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
              darkTheme ? 'bg-red-900/80 text-red-200' : 'bg-red-100 text-red-700'
            }`}
          >
            <FiAlertCircle className="flex-shrink-0" />
            <p className="font-medium">⚠️ {errorMsg}</p>
          </div>
        )}

        {/* Weather card */}
        {weatherData && (
          <div
            className={`rounded-2xl p-6 space-y-4 animate-fadeIn ${
              darkTheme ? 'bg-gray-800/80 backdrop-blur-lg shadow-xl' : 'bg-white/95 backdrop-blur shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{weatherData.name}, {weatherData.sys.country}</h2>
                <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {renderWeatherIcon(weatherData.weather[0].main)}
            </div>

            <div className="space-y-4">
              <p className="text-5xl font-bold">{Math.round(weatherData.main.temp)}°C</p>
              <p className={`text-lg capitalize ${darkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                {weatherData.weather[0].description}
              </p>

              {/* Could be a loop, but doing this manually for now */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Humidity', value: `${weatherData.main.humidity}%` },
                  { label: 'Wind Speed', value: `${(weatherData.wind.speed * 3.6).toFixed(1)} km/h` },
                  { label: 'Pressure', value: `${weatherData.main.pressure} hPa` },
                  { label: 'Feels Like', value: `${Math.round(weatherData.main.feels_like)}°C` },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl transition-all ${
                      darkTheme ? 'bg-gray-700 hover:bg-gray-600' : 'bg-sky-50 hover:bg-sky-100'
                    }`}
                  >
                    <p className={`text-sm mb-1 ${darkTheme ? 'text-gray-400' : 'text-sky-600'}`}>{item.label}</p>
                    <p className="text-xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recently searched items */}
        {searchHistory.length > 0 && (
          <div
            className={`rounded-2xl p-4 ${
              darkTheme ? 'bg-gray-800/80 backdrop-blur-lg shadow-xl' : 'bg-white/95 backdrop-blur shadow-lg'
            }`}
          >
            <h3 className={`text-sm font-semibold mb-3 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Recent Searches:
            </h3>
            <div className="flex gap-2 flex-wrap">
              {searchHistory.map((item) => (
                <button
                  key={item}
                  onClick={() => setCityInput(item)}
                  className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 ${
                    darkTheme
                      ? 'bg-gray-700 hover:bg-gray-600 text-indigo-300'
                      : 'bg-sky-100 hover:bg-sky-200 text-sky-600'
                  }`}
                >
                  <FiSearch className="text-sm" />
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
