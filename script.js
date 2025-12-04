function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

function formatTimeFromApi(isoString) {
  if (!isoString) return "N/A";

  const timePart = isoString.split("T")[1] || "";

  const cleaned = timePart.replace(/([+-]\d{2}:?\d{2}|Z)$/, "");

  const noFraction = cleaned.split(".")[0];
  const pieces = noFraction.split(":");
  if (pieces.length < 2) return "N/A";
  return `${pad(Number(pieces[0]))}:${pad(Number(pieces[1]))}`;
}

function findClosestHourIndex(hourlyTimes, targetIso) {
  if (!hourlyTimes || hourlyTimes.length === 0) return -1;

  const exact = hourlyTimes.indexOf(targetIso);
  if (exact !== -1) return exact;

  try {
    const targetMs = Date.parse(targetIso);
    let bestIdx = 0;
    let bestDiff = Math.abs(Date.parse(hourlyTimes[0]) - targetMs);
    for (let i = 1; i < hourlyTimes.length; i++) {
      const diff = Math.abs(Date.parse(hourlyTimes[i]) - targetMs);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  } catch {
    return -1;
  }
}

async function getCoordinates(city) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1`;

  const res = await fetch(geoUrl);
  const data = await res.json();

  if (!data.results || data.results.length === 0) return null;

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
  };
}

async function getWeather(city) {
  document.getElementById("cityName").textContent = city;

  try {
    const coords = await getCoordinates(city);
    if (!coords) {
      alert("City not found!");
      return;
    }

    const { lat, lon } = coords;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;

    const res = await fetch(url);
    const data = await res.json();

    const current = data.current_weather || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    let humidityValue = "N/A";
    if (hourly.time && hourly.relative_humidity_2m) {
      const idx = findClosestHourIndex(hourly.time, current.time);
      if (idx !== -1 && hourly.relative_humidity_2m[idx] != null) {
        humidityValue = hourly.relative_humidity_2m[idx] + "%";
      }
    }

    document.getElementById("humidity").textContent = humidityValue;

    document.getElementById("cloud_pct").textContent =
      data.hourly && data.hourly.cloudcover
        ? data.hourly.cloudcover[0] + "%"
        : "N/A";
    document.getElementById("cloud_cover").textContent =
      current.weathercode ?? "N/A";

    document.getElementById("feelslike_c").textContent =
      (current.temperature ?? "N/A") + "°C";
    document.getElementById("wind_kph").textContent =
      (current.windspeed ?? "N/A") + " km/h";
    document.getElementById("wind_dir").textContent =
      current.winddirection ?? "N/A";
    document.getElementById("windchill_c").textContent =
      (current.temperature ?? "N/A") + "°C";
    document.getElementById("heatindex_c").textContent =
      (current.temperature ?? "N/A") + "°C";
    document.getElementById("gust_kph").textContent =
      (current.windspeed ?? "N/A") + " km/h";

    window.__lastFetchedDaily = daily;

    loadCityWeatherTable();
  } catch (err) {
    console.error("Main weather error:", err);
  }
}

document.getElementById("submit").addEventListener("click", (e) => {
  e.preventDefault();
  const cityVal = document.getElementById("city").value.trim();
  if (cityVal) getWeather(cityVal);
});

getWeather("London");

const tableBody = document.getElementById("weatherTable");
const cities = ["Delhi", "Mumbai", "Goa", "Dehradun", "Manali"];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCityWeather(city) {
  try {
    const coords = await getCoordinates(city);
    if (!coords) return null;
    const { lat, lon } = coords;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;

    const res = await fetch(url);
    return await res.json();
  } catch {
    return null;
  }
}

async function loadCityWeatherTable() {
  tableBody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  let rows = "";

  for (let city of cities) {
    await delay(200);

    const data = await getCityWeather(city);
    if (!data) {
      rows += `
        <tr>
          <td>${city}</td>
          <td>N/A</td>
          <td>N/A</td>
          <td>N/A</td>
          <td>N/A</td>
          <td>N/A</td>
          <td>N/A</td>
        </tr>
      `;
      continue;
    }

    const current = data.current_weather || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    let humidityVal = "N/A";
    if (hourly.time && hourly.relative_humidity_2m && current.time) {
      const idx = findClosestHourIndex(hourly.time, current.time);
      if (idx !== -1 && hourly.relative_humidity_2m[idx] != null) {
        humidityVal = hourly.relative_humidity_2m[idx] + "%";
      }
    }

    const sunriseTime = Array.isArray(daily.sunrise)
      ? formatTimeFromApi(daily.sunrise[0])
      : "N/A";
    const sunsetTime = Array.isArray(daily.sunset)
      ? formatTimeFromApi(daily.sunset[0])
      : "N/A";

    rows += `
      <tr>
        <td>${city}</td>
        <td>${current.temperature ?? "N/A"}°C</td>
        <td>${humidityVal}</td>
        <td>${daily.temperature_2m_max?.[0] ?? "N/A"}°C</td>
        <td>${daily.temperature_2m_min?.[0] ?? "N/A"}°C</td>
        <td>${sunriseTime}</td>
        <td>${sunsetTime}</td>
      </tr>
    `;
  }

  tableBody.innerHTML = rows;
}

