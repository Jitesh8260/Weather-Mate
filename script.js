const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherInfo = document.getElementById("weatherInfo");
const loader = document.getElementById("loader");

const API_KEY = "df5473f3170dd2e8dbe968a4ee9a82b9";
let currentUnit = localStorage.getItem("unit") || "metric";

function displayWeather(data) {
    // Jab weather load ho jaaye, tab ye message hata do
    document.getElementById("welcome-message").style.display = "none";

    if (data.cod === "404") {
        weatherInfo.innerHTML = `<p>❌ City not found!</p>`;
        loader.style.display = "none";
        return;
    }

    const toLocalTime = (utcSeconds) => {
        const localDate = new Date((utcSeconds) * 1000);
        return localDate.toLocaleTimeString("en-US", {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const sunrise = toLocalTime(data.sys.sunrise);
    const sunset = toLocalTime(data.sys.sunset);
    const localTime = toLocalTime(Math.floor(Date.now() / 1000));
    const lastUpdated = new Date().toLocaleTimeString("en-US", {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    weatherInfo.innerHTML = `
    <div class="top-section">
        <h2>${data.name}, ${data.sys.country}</h2>
        <p class="local-time">Local Time: ${localTime}</p>
    </div>

    <div class="main-highlight">
        <div class="temperature-block">
            <div class="temp-feel">
                <h1 class="temp">${data.main.temp}°${currentUnit === 'metric' ? 'C' : 'F'}</h1>
                <span class="feels-like">Feels like ${data.main.feels_like}°${currentUnit === 'metric' ? 'C' : 'F'}</span>
            </div>
        </div>

        <div class="icon-condition">
            <img class="weather-icon" src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="icon" />
            <p class="condition">${data.weather[0].description}</p>
        </div>
    </div>

    <div class="info-grid">
        <p>🌬️ Wind: ${data.wind.speed} ${currentUnit === 'metric' ? 'km/h' : 'mph'}</p>
        <p>🌫️ Visibility: ${data.visibility / 1000} km</p>
        <p>💧 Humidity: ${data.main.humidity}%</p>
        <p>🌡️ Pressure: ${data.main.pressure} hPa</p>
        <p>🌅 Sunrise: ${sunrise}</p>
        <p>🌇 Sunset: ${sunset}</p>
        <p>🔼 Max Temp: ${Math.round(data.main.temp_max)}°${currentUnit === 'metric' ? 'C' : 'F'}</p>
        <p>🔽 Min Temp: ${Math.round(data.main.temp_min)}°${currentUnit === 'metric' ? 'C' : 'F'}</p>
    </div>

    <p class="updated-time">Last updated: ${lastUpdated}</p>
    `;

    updateBackground(data.weather[0].main.toLowerCase());
    loader.style.display = "none";
}

function updateBackground(weatherMain) {
    let bgImage = "";

    if (weatherMain.includes("cloud")) bgImage = "images/cloud.jpg";
    else if (weatherMain.includes("rain")) bgImage = "images/rain.jpg";
    else if (weatherMain.includes("clear")) bgImage = "images/clear.jpg";
    else if (weatherMain.includes("snow")) bgImage = "images/snow.jpg";
    else if (weatherMain.includes("mist") || weatherMain.includes("haze")) bgImage = "images/mist.jpg";
    else bgImage = "images/default.jpg";

    document.body.style.backgroundImage = `url('${bgImage}')`;
}

function fetchWeatherByCity(city) {
    loader.style.display = "block";
    weatherInfo.innerHTML = "";

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`)
        .then(res => res.json())
        .then(data => {
            displayWeather(data);
            fetchForecast(city);
            saveToHistory(city);
            renderHistory();
        })
        .catch(err => {
            weatherInfo.innerHTML = `<p>❌ Network error. Please check your internet or try again later.</p>`;
            console.error(err);
            loader.style.display = "none";
        });
}

function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
    const index = history.indexOf(city);
    if (index !== -1) history.splice(index, 1);
    history.unshift(city);
    if (history.length > 5) history.pop();
    localStorage.setItem("weatherHistory", JSON.stringify(history));
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
    const historyList = document.getElementById("historyList");
    if (!historyList) return;
    historyList.innerHTML = "";

    history.forEach((city) => {
        const li = document.createElement("li");
        li.textContent = city;
        li.classList.add("history-item");
        li.addEventListener("click", () => {
            cityInput.value = city;
            fetchWeatherByCity(city);
        });
        historyList.appendChild(li);
    });
}

function fetchWeatherByCoords(lat, lon) {
    loader.style.display = "block";
    weatherInfo.innerHTML = "";

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`)
        .then(res => res.json())
        .then(data => {
            displayWeather(data);
            fetchForecast(data.name);
            saveToHistory(data.name);
            renderHistory();
        })
        .catch((err) => {
            weatherInfo.innerHTML = `<p>❌ Unable to fetch your location weather. Try searching manually.</p>`;
            console.error(err);
            loader.style.display = "none";
        });
}

window.addEventListener("load", () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            () => {
                weatherInfo.innerHTML = `<p>⚠️ Location access denied. Please search manually.</p>`;
                loader.style.display = "none";
            }
        );
    } else {
        weatherInfo.innerHTML = `<p>📵 Geolocation not supported by your browser.</p>`;
    }
});

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city !== "") fetchWeatherByCity(city);
});

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        searchBtn.click();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    renderHistory();
});

const suggestionList = document.getElementById("suggestionList");

cityInput.addEventListener("input", () => {
    const input = cityInput.value.trim();
    suggestionList.innerHTML = "";
    if (input.length < 2) {
        suggestionList.style.display = "none";
        return;
    }

    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=5&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                suggestionList.style.display = "none";
                return;
            }

            data.forEach(location => {
                const cityName = `${location.name}${location.state ? ", " + location.state : ""}, ${location.country}`;
                const li = document.createElement("li");
                li.textContent = cityName;
                li.classList.add("suggestion-item");
                li.addEventListener("click", () => {
                    cityInput.value = location.name;
                    suggestionList.style.display = "none";
                    fetchWeatherByCity(location.name);
                });
                suggestionList.appendChild(li);
            });

            suggestionList.style.display = "block";
        })
        .catch(err => {
            console.error("Suggestion API Error:", err);
            suggestionList.style.display = "none";
        });
});

document.addEventListener("click", (e) => {
    if (!document.querySelector(".search-box").contains(e.target)) {
        suggestionList.style.display = "none";
    }
});

function fetchForecast(city) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}`)
        .then(res => res.json())
        .then(data => displayForecast(data))
        .catch(err => {
            console.error("Forecast API Error:", err);
            document.getElementById("forecastSection").style.display = "none";
        });
}

function displayForecast(data) {
    const forecastCards = document.getElementById("forecastCards");
    const forecastSection = document.getElementById("forecastSection");

    if (!data || data.cod !== "200") {
        forecastSection.style.display = "none";
        return;
    }

    const dailyData = {};
    data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        const time = item.dt_txt.split(" ")[1];
        if (!dailyData[date] || time === "12:00:00") {
            dailyData[date] = item;
        }
    });

    forecastCards.innerHTML = "";

    Object.keys(dailyData).slice(0, 4).forEach(date => {
        const item = dailyData[date];
        const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
        const temp = Math.round(item.main.temp);
        const desc = item.weather[0].description;

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <p class="forecast-date">${new Date(date).toDateString().slice(0, 10)}</p>
            <img src="${iconUrl}" alt="icon" class="forecast-icon"/>
            <p class="forecast-temp">${temp}°${currentUnit === 'metric' ? 'C' : 'F'}</p>
            <p class="forecast-desc">${desc}</p>
        `;

        forecastCards.appendChild(card);
    });

    forecastSection.style.display = "block";
}

const unitSwitch = document.getElementById("unitSwitch");
const unitLabel = document.getElementById("unitLabel");

window.addEventListener("DOMContentLoaded", () => {
    const savedUnit = localStorage.getItem("unit");
    if (savedUnit === "imperial") {
        unitSwitch.checked = true;
        unitLabel.textContent = "°F";
        currentUnit = "imperial";
    } else {
        unitSwitch.checked = false;
        unitLabel.textContent = "°C";
        currentUnit = "metric";
    }
});

unitSwitch.addEventListener("change", () => {
    currentUnit = unitSwitch.checked ? "imperial" : "metric";
    unitLabel.textContent = unitSwitch.checked ? "°F" : "°C";
    localStorage.setItem("unit", currentUnit);

    if (cityInput.value.trim()) {
        fetchWeatherByCity(cityInput.value.trim());
    } else {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
            });
        }
    }
});

const themeSwitch = document.getElementById("themeSwitch");
const themeLabel = document.getElementById("themeLabel");

window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeSwitch.checked = true;
        themeLabel.textContent = "Light Mode";
    } else {
        document.body.classList.remove("dark-mode");
        themeSwitch.checked = false;
        themeLabel.textContent = "Dark Mode";
    }
});

themeSwitch.addEventListener("change", () => {
    if (themeSwitch.checked) {
        document.body.classList.add("dark-mode");
        themeLabel.textContent = "Light Mode";
        localStorage.setItem("theme", "dark");
    } else {
        document.body.classList.remove("dark-mode");
        themeLabel.textContent = "Dark Mode";
        localStorage.setItem("theme", "light");
    }
});
