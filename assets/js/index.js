// API configuration
const NASA_API_KEY = "anxyNHsVJsLuTwtIovk33oVnMb68fB34NVfWjnSh";
const APOD_URL = "https://api.nasa.gov/planetary/apod";
const SPACEDEVS_URL = "https://lldev.thespacedevs.com/2.2.0/launch/upcoming/";
const PLANETS_URL =
  "https://solar-system-opendata-proxy.vercel.app/api/planets";

let currentPlanet = "earth";

// Helper functions
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "flex";
  }
}

function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "none";
  }
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatLargeNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num;
}

// Today in space
async function fetchAPOD(date = null) {
  try {
    showLoading("apod-loading");

    let url = `${APOD_URL}?api_key=${NASA_API_KEY}`;
    if (date) {
      url += `&date=${date}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch APOD");

    const data = await response.json();

    document.getElementById("apod-image").src =
      data.url || data.hdurl || "./assets/images/placeholder.webp";
    document.getElementById("apod-image").alt =
      data.title || "Astronomy Picture of the Day";
    document.getElementById("apod-title").textContent =
      data.title || "Astronomy Picture of the Day";
    document.getElementById("apod-explanation").textContent =
      data.explanation || "No description available.";
    document.getElementById("apod-copyright").textContent = data.copyright
      ? `© ${data.copyright}`
      : "© NASA";

    const apodDate = new Date(data.date);
    const formattedDate = apodDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    document.getElementById(
      "apod-date"
    ).textContent = `Astronomy Picture of the Day - ${formattedDate}`;
    document.getElementById(
      "apod-date-detail"
    ).innerHTML = `<i class="far fa-calendar mr-2"></i>${data.date}`;
    document.getElementById("apod-date-info").textContent = data.date;
    document.getElementById("apod-media-type").textContent =
      data.media_type || "image";

    document.getElementById("apod-date-input").value = data.date;
    document.getElementById("apod-date-input").max = formatDate(new Date());

    hideLoading("apod-loading");
  } catch (error) {
    console.error("Error fetching APOD:", error);
    hideLoading("apod-loading");

    const container = document.getElementById("apod-image-container");
    container.innerHTML = `
            <div class="text-center p-8">
                <i class="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
                <p class="text-slate-300">Failed to load today's space image.</p>
                <p class="text-slate-400 text-sm mt-2">${error.message}</p>
                <button onclick="fetchAPOD()" class="mt-4 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                    Try Again
                </button>
            </div>
        `;
  }
}

// Upcoming launches
async function fetchUpcomingLaunches() {
  try {
    const response = await fetch(SPACEDEVS_URL);
    if (!response.ok) throw new Error("Failed to fetch launches");

    const data = await response.json();

    const launchesCount = data.results ? data.results.length : 0;
    document.getElementById(
      "launches-count"
    ).textContent = `${launchesCount} Launches`;
    document.getElementById("launches-count-mobile").textContent =
      launchesCount;

    const launchesGrid = document.getElementById("launches-grid");
    const featuredLaunch = document.getElementById("featured-launch");

    if (data.results && data.results.length > 0) {
      const featured = data.results[0];
      updateFeaturedLaunch(featured);
    }

    const staticCards = launchesGrid.querySelectorAll(".bg-slate-800\\/50");
    if (staticCards.length > 3) {
      for (let i = 3; i < staticCards.length; i++) {
        staticCards[i].remove();
      }
    }

    if (data.results && data.results.length > 3) {
      const launchesToShow = data.results.slice(3, 9);
      launchesToShow.forEach((launch) => {
        const launchCard = createLaunchCard(launch);
        launchesGrid.appendChild(launchCard);
      });
    }
  } catch (error) {
    console.error("Error fetching launches:", error);

    const launchesGrid = document.getElementById("launches-grid");
    const errorDiv = document.createElement("div");
    errorDiv.className = "col-span-full text-center p-8";
    errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle text-2xl text-yellow-400 mb-4"></i>
            <p class="text-slate-300">Failed to load upcoming launches.</p>
            <p class="text-slate-400 text-sm mt-2">${error.message}</p>
        `;
    launchesGrid.appendChild(errorDiv);
  }
}

function updateFeaturedLaunch(launch) {
  const launchDate = new Date(launch.window_start);
  const today = new Date();
  const daysUntilLaunch = Math.ceil(
    (launchDate - today) / (1000 * 60 * 60 * 24)
  );

  document.querySelector("#featured-launch h3").textContent =
    launch.name || "Upcoming Launch";
  document.querySelector(
    "#featured-launch .text-slate-400:nth-child(2) span"
  ).textContent = launch.launch_service_provider?.name || "Unknown";
  document.querySelector(
    "#featured-launch .text-slate-300.leading-relaxed"
  ).textContent = launch.mission?.description || "No description available.";

  document.querySelectorAll("#featured-launch .font-semibold")[0].textContent =
    launchDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  document.querySelectorAll("#featured-launch .font-semibold")[1].textContent =
    launchDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

  document.querySelectorAll("#featured-launch .font-semibold")[2].textContent =
    launch.pad?.location?.name || "Unknown";
  document.querySelectorAll("#featured-launch .font-semibold")[3].textContent =
    launch.pad?.location?.country_code || "Unknown";

  document.querySelector("#featured-launch .text-2xl.font-bold").textContent =
    daysUntilLaunch > 0 ? daysUntilLaunch : "0";
}

function createLaunchCard(launch) {
  const launchDate = new Date(launch.window_start);
  const today = new Date();
  const daysUntilLaunch = Math.ceil(
    (launchDate - today) / (1000 * 60 * 60 * 24)
  );

  let badgeColor = "bg-blue-500/90";
  let badgeText = "TBD";

  if (launch.status?.name === "Go") {
    badgeColor = "bg-green-500/90";
    badgeText = "Go";
  } else if (daysUntilLaunch < 0) {
    badgeColor = "bg-red-500/90";
    badgeText = "Past";
  }

  const card = document.createElement("div");
  card.className =
    "bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer";
  card.innerHTML = `
        <div class="relative h-48 bg-slate-900/50 flex items-center justify-center">
            <i class="fas fa-rocket text-5xl text-slate-700"></i>
            <div class="absolute top-3 right-3">
                <span class="px-3 py-1 ${badgeColor} text-white backdrop-blur-sm rounded-full text-xs font-semibold">
                    ${badgeText}
                </span>
            </div>
        </div>
        <div class="p-5">
            <div class="mb-3">
                <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    ${launch.name || "Upcoming Launch"}
                </h4>
                <p class="text-sm text-slate-400 flex items-center gap-2">
                    <i class="fas fa-building text-xs"></i>
                    ${launch.launch_service_provider?.name || "Unknown"}
                </p>
            </div>
            <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2 text-sm">
                    <i class="fas fa-calendar text-slate-500 w-4"></i>
                    <span class="text-slate-300">${launchDate.toLocaleDateString()}</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <i class="fas fa-clock text-slate-500 w-4"></i>
                    <span class="text-slate-300">${launchDate.toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )}</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <i class="fas fa-rocket text-slate-500 w-4"></i>
                    <span class="text-slate-300">${
                      launch.rocket?.configuration?.name || "Unknown"
                    }</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <i class="fas fa-map-marker-alt text-slate-500 w-4"></i>
                    <span class="text-slate-300 line-clamp-1">${
                      launch.pad?.location?.name || "Unknown"
                    }</span>
                </div>
            </div>
            <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
                <button class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold">
                    Details
                </button>
                <button class="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </div>
    `;

  return card;
}

// Planets data
async function fetchPlanets() {
  try {
    const response = await fetch(PLANETS_URL);
    if (!response.ok) throw new Error("Failed to fetch planets");

    const planets = await response.json();

    const mainPlanets = planets.filter(
      (planet) =>
        planet.name.toLowerCase() !== "sun" &&
        !planet.name.toLowerCase().includes("moon") &&
        planet.isPlanet !== false
    );

    updatePlanetDetails(
      mainPlanets.find((p) => p.name.toLowerCase() === currentPlanet) ||
        mainPlanets[0]
    );
  } catch (error) {
    console.error("Error fetching planets:", error);

    const detailsDiv = document.querySelector(".xl\\:col-span-2");
    if (detailsDiv) {
      detailsDiv.innerHTML += `
                <div class="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p class="text-red-400 text-sm">Failed to load planet details: ${error.message}</p>
                </div>
            `;
    }
  }
}

function updatePlanetDetails(planet) {
  if (!planet) return;

  document.getElementById("planet-detail-name").textContent =
    planet.englishName || planet.name;
  document.getElementById("planet-detail-description").textContent =
    planet.description || `No description available for ${planet.name}.`;

  document.getElementById("planet-distance").textContent =
    formatLargeNumber(planet.semimajorAxis * 149597871) + " km"; // Convert AU to km

  document.getElementById("planet-radius").textContent =
    formatLargeNumber(planet.meanRadius) + " km";

  document.getElementById("planet-mass").textContent = planet.mass
    ? formatLargeNumber(planet.mass.massValue) +
      " × 10^" +
      planet.mass.massExponent +
      " kg"
    : "N/A";

  document.getElementById("planet-density").textContent = planet.density
    ? planet.density.toFixed(2) + " g/cm³"
    : "N/A";

  document.getElementById("planet-orbital-period").textContent =
    planet.sideralOrbit ? planet.sideralOrbit.toFixed(1) + " days" : "N/A";

  document.getElementById("planet-rotation").textContent =
    planet.sideralRotation
      ? planet.sideralRotation.toFixed(1) + " hours"
      : "N/A";

  document.getElementById("planet-moons").textContent = planet.moons
    ? planet.moons.length
    : "0";

  document.getElementById("planet-gravity").textContent = planet.gravity
    ? planet.gravity.toFixed(1) + " m/s²"
    : "N/A";

  document.getElementById("planet-discoverer").textContent =
    planet.discoveredBy || "Known since antiquity";

  document.getElementById("planet-discovery-date").textContent =
    planet.discoveryDate || "Ancient";

  document.getElementById("planet-body-type").textContent =
    planet.bodyType || "Planet";

  document.getElementById("planet-volume").textContent = planet.vol
    ? formatLargeNumber(planet.vol.volValue) +
      " × 10^" +
      planet.vol.volExponent +
      " km³"
    : "N/A";

  document.getElementById("planet-perihelion").textContent = planet.perihelion
    ? formatLargeNumber(planet.perihelion) + " km"
    : "N/A";

  document.getElementById("planet-aphelion").textContent = planet.aphelion
    ? formatLargeNumber(planet.aphelion) + " km"
    : "N/A";

  document.getElementById("planet-eccentricity").textContent =
    planet.eccentricity ? planet.eccentricity.toFixed(4) : "N/A";

  document.getElementById("planet-inclination").textContent = planet.inclination
    ? planet.inclination.toFixed(2) + "°"
    : "N/A";

  document.getElementById("planet-axial-tilt").textContent = planet.axialTilt
    ? planet.axialTilt.toFixed(2) + "°"
    : "N/A";

  document.getElementById("planet-temp").textContent = planet.avgTemp
    ? planet.avgTemp.toFixed(1) + "°C"
    : "N/A";

  document.getElementById("planet-escape").textContent = planet.escapeVelocity
    ? planet.escapeVelocity.toFixed(1) + " km/s"
    : "N/A";

  const planetImage = document.getElementById("planet-detail-image");
  const imagePath = `./assets/images/${planet.name.toLowerCase()}.png`;
  planetImage.src = imagePath;
  planetImage.alt = `${planet.name} planet`;

  const factsList = document.getElementById("planet-facts");
  factsList.innerHTML = "";

  const facts = [
    planet.fact1 ||
      `Orbits the Sun in ${
        planet.sideralOrbit ? planet.sideralOrbit.toFixed(0) : "unknown"
      } days`,
    planet.fact2 ||
      `Has ${planet.moons ? planet.moons.length : "0"} known moons`,
    planet.fact3 ||
      `Surface gravity is ${
        planet.gravity ? planet.gravity.toFixed(1) : "unknown"
      } m/s²`,
    planet.fact4 ||
      `Discovered by ${planet.discoveredBy || "ancient astronomers"}`,
  ].slice(0, 4);

  facts.forEach((fact) => {
    const li = document.createElement("li");
    li.className = "flex items-start";
    li.innerHTML = `
            <i class="fas fa-check text-green-400 mt-1 mr-2"></i>
            <span class="text-slate-300">${fact}</span>
        `;
    factsList.appendChild(li);
  });
}

// Navigation
function setupNavigation() {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("sidebar-open");
    });
  }

  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".app-section");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const targetSection = link.getAttribute("data-section");

      sections.forEach((section) => {
        section.classList.add("hidden");
      });

      const targetElement = document.getElementById(targetSection);
      if (targetElement) {
        targetElement.classList.remove("hidden");
      }

      navLinks.forEach((navLink) => {
        navLink.classList.remove("bg-blue-500/10", "text-blue-400");
        navLink.classList.add("text-slate-300", "hover:bg-slate-800");
      });

      link.classList.remove("text-slate-300", "hover:bg-slate-800");
      link.classList.add("bg-blue-500/10", "text-blue-400");
    });
  });

  const loadDateBtn = document.getElementById("load-date-btn");
  const todayApodBtn = document.getElementById("today-apod-btn");
  const apodDateInput = document.getElementById("apod-date-input");

  if (loadDateBtn) {
    loadDateBtn.addEventListener("click", () => {
      const selectedDate = apodDateInput.value;
      if (selectedDate) {
        fetchAPOD(selectedDate);
      }
    });
  }

  if (todayApodBtn) {
    todayApodBtn.addEventListener("click", () => {
      fetchAPOD();
    });
  }

  const planetCards = document.querySelectorAll(".planet-card");
  planetCards.forEach((card) => {
    card.addEventListener("click", () => {
      const planetId = card.getAttribute("data-planet-id");
      if (planetId) {
        currentPlanet = planetId;

        planetCards.forEach((pc) => {
          pc.style.borderColor = "#334155";
        });
        card.style.borderColor =
          card
            .getAttribute("style")
            .match(/--planet-color:(#[0-9a-fA-F]+)/)?.[1] + "80";

        fetch(PLANETS_URL)
          .then((response) => response.json())
          .then((planets) => {
            const planet = planets.find(
              (p) => p.name.toLowerCase() === planetId
            );
            if (planet) {
              updatePlanetDetails(planet);
            }
          })
          .catch(console.error);
      }
    });
  });
}

// Initialization
function initializeApp() {
  const today = new Date();
  document.getElementById("apod-date-input").max = formatDate(today);
  document.getElementById("apod-date-input").value = formatDate(today);

  setupNavigation();

  fetchAPOD();
  fetchUpcomingLaunches();
  fetchPlanets();

  setInterval(fetchUpcomingLaunches, 5 * 60 * 1000);

  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0
  );
  const timeUntilMidnight = midnight - now;

  setTimeout(() => {
    fetchAPOD();
    setInterval(fetchAPOD, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
}

document.addEventListener("DOMContentLoaded", initializeApp);
