//---------------------------------------
// MAIN WEATHER FUNCTION (SAFE)
//---------------------------------------

async function getWeather(city) {
  document.getElementById("cityName").textContent = city;

  try {
    const res = await fetch(
      `https://yahoo-weather5.p.rapidapi.com/weather?location=${city}&format=json&u=c`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key":
            "1e81441857msha2b16464ace6b6dp1aa199jsncc3c78553fed",
          "x-rapidapi-host": "yahoo-weather5.p.rapidapi.com",
        },
      }
    );

    const data = await res.json();

    // SAFE EXTRACT
    const obs = data.current_observation || {};
    const atm = obs.atmosphere || {};
    const wind = obs.wind || {};
    const cond = obs.condition || {};

    document.getElementById("humidity").textContent =
      (atm.humidity ?? "N/A") + "%";
    document.getElementById("cloud_pct").textContent =
      (atm.visibility ?? "N/A") + " km";
    document.getElementById("cloud_cover").textContent = cond.text ?? "N/A";
    document.getElementById("feelslike_c").textContent =
      (wind.chill ?? "N/A") + "°C";
    document.getElementById("wind_kph").textContent =
      (wind.speed ?? "N/A") + " kph";
    document.getElementById("wind_dir").textContent = wind.direction ?? "N/A";
    document.getElementById("windchill_c").textContent =
      (wind.chill ?? "N/A") + "°C";
    document.getElementById("heatindex_c").textContent =
      (cond.temperature ?? "N/A") + "°C";
    document.getElementById("gust_kph").textContent =
      (wind.speed ?? "N/A") + " kph";

    loadCityWeatherTable();
  } catch (err) {
    console.error("Main weather error:", err);
  }
}

//---------------------------------------
// SEARCH BUTTON
//---------------------------------------

document.getElementById("submit").addEventListener("click", (e) => {
  e.preventDefault();
  getWeather(document.getElementById("city").value.trim());
});

// Default city on load
getWeather("London");

//---------------------------------------
// TABLE FUNCTIONS
//---------------------------------------

const tableBody = document.getElementById("weatherTable");
const cities = ["Delhi", "Mumbai", "Goa", "Dehradun", "Manali"];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCityWeather(city) {
  try {
    const response = await fetch(
      `https://yahoo-weather5.p.rapidapi.com/weather?location=${city}&format=json&u=c`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key":
            "1e81441857msha2b16464ace6b6dp1aa199jsncc3c78553fed",
          "x-rapidapi-host": "yahoo-weather5.p.rapidapi.com",
        },
      }
    );

    return await response.json();
  } catch {
    return null;
  }
}

async function loadCityWeatherTable() {
  tableBody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  let rows = "";

  for (let city of cities) {
    await delay(300);

    const data = await getCityWeather(city);

    const obs = data?.current_observation || {};
    const atm = obs.atmosphere || {};
    const wind = obs.wind || {};
    const astro = obs.astronomy || {};
    const forecast = data?.forecasts?.[0] || {};

    rows += `
      <tr>
        <td>${city}</td>
        <td>${wind.chill ?? "N/A"}°C</td>
        <td>${atm.humidity ?? "N/A"}%</td>
        <td>${forecast.high ?? "N/A"}°C</td>
        <td>${forecast.low ?? "N/A"}°C</td>
        <td>${astro.sunrise ?? "N/A"}</td>
        <td>${astro.sunset ?? "N/A"}</td>
      </tr>
    `;
  }

  tableBody.innerHTML = rows;
}
