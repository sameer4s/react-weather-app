import { WiDaySunny, WiRain, WiSnow, WiCloudy, WiDayCloudyGusts, WiNightClear } from 'react-icons/wi';

export const isDayTime = (weather) => {
  if (!weather) return true;
  const now = Date.now() / 1000;
  return now > weather.sys.sunrise && now < weather.sys.sunset;
};

export const backgroundGradient = (weather, darkMode) => {
  if (darkMode) return 'bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-800';
  return weather && !isDayTime(weather) ? 
    'bg-gradient-to-br from-indigo-100 via-blue-200 to-indigo-50' : 
    'bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-50';
};

export const getWeatherIcon = (condition, darkMode, isDay) => {
  const iconStyle = "text-6xl animate-pulse";
  
  const icons = {
    clear: isDay ? 
      <WiDaySunny className={`${iconStyle} text-amber-400`} /> : 
      <WiNightClear className={`${iconStyle} text-indigo-300`} />,
    rain: <WiRain className={`${iconStyle} ${darkMode ? 'text-blue-300' : 'text-sky-600'}`} />,
    snow: <WiSnow className={`${iconStyle} text-blue-200`} />,
    clouds: <WiCloudy className={`${iconStyle} ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />,
    mist: <WiDayCloudyGusts className={`${iconStyle} text-gray-400`} />
  };

  return icons[condition.toLowerCase()] || icons.clear;
};