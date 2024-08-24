export async function fetchLadderData() {
  console.log("Attempting to fetch ladder data...");

  try {
    console.log("Fetching fresh ladder data from API...");
    const response = await fetchWithTimeout(
      "https://api.squiggle.com.au/?q=standings",
      {},
      10000
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ladder data response received:", data);
    return data.standings; // Directly return the fetched data
  } catch (error) {
    console.error("Failed to fetch ladder data:", error);
    document.getElementById("output").innerHTML +=
      "<p>Error: Unable to fetch ladder data.</p>";
    return null; // Return null if fetching fails
  }
}

const cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds

function getCachedData(key) {
  console.log(`Fetching cached data for key: ${key}`);
  const cached = localStorage.getItem(key);
  if (cached) {
    const parsedCache = JSON.parse(cached);
    const now = new Date().getTime();

    if (now - parsedCache.timestamp < cacheDuration) {
      console.log(`Cache hit for key: ${key}`);
      return parsedCache.data;
    } else {
      console.log(`Cache stale for key: ${key}. Removing cache.`);
      localStorage.removeItem(key); // Cache is stale, remove it
    }
  }
  console.log(`No cached data for key: ${key}`);
  return null;
}

function cacheData(data, key) {
  console.log(`Caching data for key: ${key}`);
  const cacheObject = {
    data: data,
    timestamp: new Date().getTime(),
  };
  localStorage.setItem(key, JSON.stringify(cacheObject));
}

// Function to get the current round (compSeasonId is hardcoded to 62)
export async function getRound() {
  const url = `https://aflapi.afl.com.au/afl/v2/matches?competitionId=1&compSeasonId=62&pageSize=1`;

  console.log("---------------------------------------");
  console.log("Sending round request to URL: " + url);
  console.log("---------------------------------------");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received round data:", data);

    // Extract the current round number from the response
    const currentRoundNumber = data.matches[0].compSeason.currentRoundNumber;
    console.log("Current Round Number:", currentRoundNumber);
    return currentRoundNumber; // Return the current round number for further processing
  } catch (error) {
    console.error("Failed to fetch round data:", error);
    return null; // Return null if fetching fails
  }
}

// Fetch and cache data based on the round
export async function fetchGameData(cacheKey, round, currentRound) {
  console.log("Attempting to fetch game data...");

  // Cache only if it's not the current round
  const shouldCache = round !== currentRound;
  let gamesData = shouldCache ? getCachedData(cacheKey) : null;

  if (!gamesData) {
    try {
      console.log("Fetching fresh game data from API...");
      const response = await fetchWithTimeout(
        `https://api.squiggle.com.au/?q=games;year=2024;completed=100;round=${round}`,
        {},
        5000
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Games data response received:", data);
      gamesData = data.games;

      // Cache data only if it's not the current round
      if (shouldCache) {
        cacheData(gamesData, cacheKey);
        console.log("Game data fetched and cached successfully.");
      }
    } catch (error) {
      console.error("Failed to fetch game data:", error);
      document.getElementById("output").innerHTML +=
        "<p>Error: Unable to fetch game data.</p>";
      return null; // Return null if fetching fails
    }
  } else {
    console.log("Using cached game data.");
  }

  return gamesData;
}

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const { signal } = controller;
  const fetchOptions = { ...options, signal };

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.error(`Fetch request for ${url} timed out.`);
    } else {
      console.error(`Fetch request failed: ${error.message}`);
    }
    throw error;
  }
}

export function fetchSSE(onScoreEventCallback) {
  console.log("Setting up SSE connection...");
  const eventSource = new EventSource("https://api.squiggle.com.au/sse/games");
  let retryCount = 0;

  eventSource.addEventListener("games", (event) => {
    const parsedData = JSON.parse(event.data);
    console.log("Live game data received:", parsedData);
    onScoreEventCallback(parsedData);
  });

  eventSource.onerror = (error) => {
    console.error("SSE error:", error);
    retryCount += 1;

    if (retryCount <= 3) {
      console.log(`Attempting to reconnect... (${retryCount}/3)`);
    } else {
      console.error("SSE connection failed after 3 attempts.");
      eventSource.close();
      document.getElementById("output").textContent =
        "Error: Unable to update live scores. Please try refreshing the page.";
    }
  };
}
