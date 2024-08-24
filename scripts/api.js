const cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds

function getCachedData(key) {
  const cached = localStorage.getItem(key);
  if (cached) {
    const parsedCache = JSON.parse(cached);
    const now = new Date().getTime();

    if (now - parsedCache.timestamp < cacheDuration) {
      return parsedCache.data;
    } else {
      localStorage.removeItem(key); // Cache is stale, remove it
    }
  }
  return null;
}

function cacheData(data, key) {
  const cacheObject = {
    data: data,
    timestamp: new Date().getTime(),
  };
  localStorage.setItem(key, JSON.stringify(cacheObject));
}

// Function to get the current round
export async function getCurrentRound() {
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

export async function fetchLadderData(ladderCacheKey) {
  let ladderData = getCachedData(ladderCacheKey);

  if (!ladderData) {
    const response = await fetch("https://api.squiggle.com.au/?q=standings");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    ladderData = data.standings;
    cacheData(ladderData, ladderCacheKey);
  }

  return ladderData;
}

export async function fetchGameData(cacheKey, round, currentRound) {
  let gamesData = round !== currentRound ? getCachedData(cacheKey) : null;

  if (!gamesData) {
    const response = await fetch(
      `https://api.squiggle.com.au/?q=games;year=2024;completed=100;round=${round}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    gamesData = data.games;

    if (round !== currentRound) {
      cacheData(gamesData, cacheKey);
    }
  }

  return gamesData;
}

export function fetchSSE(onScoreEventCallback) {
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
