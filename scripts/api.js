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

export async function fetchGameData(cacheKey) {
  let gamesData = getCachedData(cacheKey);

  if (!gamesData) {
    const response = await fetch(
      "https://api.squiggle.com.au/?q=games;year=2024;completed=100"
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    gamesData = data.games;
    cacheData(gamesData, cacheKey);
  }

  return gamesData;
}

export function fetchSSE(onScoreEventCallback) {
  const eventSource = new EventSource("https://api.squiggle.com.au/sse/test");

  eventSource.addEventListener("message", (event) => {
    console.log("Message event received:", event);
  });

  eventSource.addEventListener("score", (event) => {
    console.log("Score event received:", event);
    const parsedData = JSON.parse(event.data);
    onScoreEventCallback(parsedData);
  });

  eventSource.onerror = (error) => {
    console.error("SSE error:", error);
    eventSource.close();
  };
}
