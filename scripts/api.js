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

// Fetch past games (completed games)
async function fetchPastGames(cacheKey) {
  console.log("Fetching past games...");
  let gamesData = getCachedData(cacheKey);

  if (!gamesData) {
    try {
      const response = await fetch(
        `https://api.squiggle.com.au/?q=games;year=2024;complete=100`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      gamesData = data.games;
      cacheData(gamesData, cacheKey);
      console.log("Fetched and cached past games data.");
    } catch (error) {
      console.error("Failed to fetch past games data:", error);
      return null;
    }
  } else {
    console.log("Using cached past games data.");
  }

  return gamesData;
}

// Fetch completed games from the current round
async function fetchCompletedGamesCurrentRound(currentRound) {
  console.log("Fetching completed games from the current round...");
  try {
    const response = await fetch(
      `https://api.squiggle.com.au/?q=games;year=2024;complete=100;round=${currentRound}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched completed games from current round data:", data.games);
    return data.games;
  } catch (error) {
    console.error("Failed to fetch completed games from current round:", error);
    return null;
  }
}

// Fetch future games
async function fetchFutureGames() {
  console.log("Fetching future games data...");
  try {
    const response = await fetch(
      `https://api.squiggle.com.au/?q=games;complete=!100`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched future games data:", data.games);
    return data.games;
  } catch (error) {
    console.error("Failed to fetch future games data:", error);
    return null;
  }
}

// Fetch current round (combining completed, live, and future)
async function fetchCurrentRoundData(currentRound) {
  console.log("Fetching data for the current round...");
  try {
    const completedGames = await fetchCompletedGamesCurrentRound(currentRound);
    const futureGames = await fetchFutureGames();
    return [...(completedGames || []), ...(futureGames || [])];
  } catch (error) {
    console.error("Failed to fetch current round data:", error);
    return null;
  }
}

// Function to get the current round
async function getCurrentRound() {
  const url = `https://aflapi.afl.com.au/afl/v2/matches?competitionId=1&compSeasonId=62&pageSize=1`;

  console.log("Sending round request to URL: " + url);

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
    return currentRoundNumber; // Return the current round number
  } catch (error) {
    console.error("Failed to fetch round data:", error);
    return null; // Return null if fetching fails
  }
}

function fetchSSE(onScoreEventCallback) {
  console.log("Setting up SSE connection...");
  const eventSource = new EventSource("https://api.squiggle.com.au/sse/games");

  eventSource.addEventListener("games", (event) => {
    const parsedData = JSON.parse(event.data);
    console.log("Live game data received:", parsedData);
    onScoreEventCallback(parsedData);
  });

  eventSource.onerror = (error) => {
    console.error("SSE error:", error);
    eventSource.close();
  };
}

async function fetchLadderData(ladderCacheKey) {
  let ladderData = getCachedData(ladderCacheKey);

  if (!ladderData) {
    console.log("Fetching fresh ladder data from API...");
    const response = await fetch("https://api.squiggle.com.au/?q=standings");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    ladderData = data.standings;
    cacheData(ladderData, ladderCacheKey);
  } else {
    console.log("Using cached ladder data.");
  }

  return ladderData;
}

// Fetch live games
async function fetchLiveGames() {
  console.log("Fetching live games data...");
  try {
    const response = await fetch(`https://api.squiggle.com.au/?q=games;live=1`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched live games data:", data.games);
    return data.games;
  } catch (error) {
    console.error("Failed to fetch live games data:", error);
    return null;
  }
}

// Setup SSE for a specific game ID
function setupSSEForGame(gameId, onEventCallback) {
  console.log(`Setting up SSE connection for game ID: ${gameId}`);
  const eventSource = new EventSource(
    `https://api.squiggle.com.au/sse/events/${gameId}`
  );

  eventSource.addEventListener("score", (event) => {
    const parsedData = JSON.parse(event.data);
    console.log(`Score event received for game ${gameId}:`, parsedData);
    onEventCallback(gameId, "score", parsedData);
  });

  eventSource.addEventListener("timestr", (event) => {
    const parsedData = JSON.parse(event.data);
    console.log(`Timestr event received for game ${gameId}:`, parsedData);
    onEventCallback(gameId, "timestr", parsedData);
  });

  eventSource.onerror = (error) => {
    console.error(`SSE error for game ID ${gameId}:`, error);
    eventSource.close();
  };

  return eventSource;
}

export {
  getCurrentRound,
  fetchLadderData,
  fetchPastGames,
  fetchCompletedGamesCurrentRound,
  fetchFutureGames,
  fetchCurrentRoundData,
  fetchLiveGames,
  setupSSEForGame,
};
