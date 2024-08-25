import { initializeTheme } from "./theme.js";
import {
  getCurrentRound,
  fetchLadderData,
  fetchPastGames,
  fetchCurrentRoundData,
  fetchFutureGames,
  fetchLiveGames,
  setupSSEForGame,
  getCachedData,
  roundsCacheKey,
  cacheData,
} from "./api.js";
import { renderLadder, renderGames, updateLiveGamePanel } from "./rendering.js";

document.addEventListener("DOMContentLoaded", async () => {
  const roundDropdown = document.getElementById("roundDropdown");
  const ladderCacheKey = "aflLadderData";
  const pastGamesCacheKey = "aflPastGamesData";
  const futureGamesCacheKey = "aflFutureGamesData";
  const loadingScreen = document.getElementById("loadingScreen");
  let sseConnections = {};
  let updateCounter = 0;

  initializeTheme();

  let gamesData = [];
  let ladderData = [];
  let currentRound = 0;
  let liveGames = [];

  function showLoadingScreen() {
    loadingScreen.style.display = "flex"; // Show loading screen
  }

  function hideLoadingScreen() {
    loadingScreen.style.display = "none"; // Hide loading screen
  }

  // Function to add timeout to any fetch request
  async function fetchWithTimeout(fetchPromise, timeout = 15000) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeout)
    );
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  try {
    showLoadingScreen(); // Show loading screen at the start

    console.log("Fetching current round data...");
    currentRound = await fetchWithTimeout(getCurrentRound());
    if (!currentRound) {
      throw new Error("Failed to get current round.");
    }

    console.log("Fetching ladder and game data...");

    ladderData = await fetchWithTimeout(fetchLadderData(ladderCacheKey));
    if (!ladderData) {
      document.getElementById("output").innerHTML +=
        "<p>Error: Unable to fetch ladder data. Please try again later.</p>";
    } else {
      console.log("Ladder data loaded:", ladderData);
    }

    // Fetch past games data
    const pastGamesData = await fetchWithTimeout(
      fetchPastGames(pastGamesCacheKey)
    );
    const futureGamesData = await fetchWithTimeout(
      fetchFutureGames(futureGamesCacheKey)
    );

    // Fetch and render current round data separately (no caching)
    gamesData = await fetchWithTimeout(fetchCurrentRoundData(currentRound));

    if (gamesData) {
      populateRoundDropdown(
        currentRound,
        gamesData,
        pastGamesData,
        futureGamesData
      );
      renderGames(gamesData, ladderData, currentRound, liveGames);
    }

    // Fetch live games and set up SSE for each live game
    liveGames = await fetchWithTimeout(fetchLiveGames());
    if (liveGames) {
      renderGames(gamesData, ladderData, currentRound, liveGames); // Render initial live games
      liveGames.forEach((game) => {
        const gameId = game.id;
        sseConnections[gameId] = setupSSEForGame(
          gameId,
          (gameId, eventType, eventData) => {
            console.log(
              `Received SSE update for game ${gameId}: ${eventType}`,
              eventData
            );
            updateLiveGamePanel(gameId, eventData, eventType);
          }
        );
      });
    }
  } catch (error) {
    console.error("Error during initialization:", error);
    document.getElementById(
      "output"
    ).textContent = `Error: ${error.message}. Please try again later.`;
  } finally {
    hideLoadingScreen(); // Hide loading screen after all actions are complete
  }

  document.getElementById("viewGames").addEventListener("click", () => {
    showLoadingScreen();
    setTimeout(() => {
      if (gamesData) {
        renderGames(gamesData, ladderData, currentRound, liveGames);
      }
      hideLoadingScreen();
    }, 100);
  });

  document.getElementById("viewLadder").addEventListener("click", () => {
    showLoadingScreen();
    setTimeout(() => {
      if (ladderData) {
        renderLadder(ladderData);
      }
      hideLoadingScreen();
    }, 100);
  });

  function populateRoundDropdown(
    currentRound,
    gamesData,
    pastGamesData,
    futureGamesData
  ) {
    console.log("Populating round dropdown...");

    let cachedRounds = getCachedData(roundsCacheKey);

    if (!cachedRounds) {
      console.log("No cached rounds data, generating new data.");
      const allGamesData = [...gamesData, ...pastGamesData, ...futureGamesData];
      const rounds = [...new Set(allGamesData.map((game) => game.round))];
      rounds.sort((a, b) => a - b);

      // Cache the rounds indefinitely
      cacheData(rounds, roundsCacheKey);
      cachedRounds = rounds;
    } else {
      console.log("Using cached rounds data for dropdown.");
    }

    cachedRounds.forEach((round) => {
      const option = document.createElement("option");
      const roundName =
        gamesData.find((game) => game.round === round)?.roundname ||
        `Round ${round}`;
      option.value = round;
      option.textContent = roundName;
      roundDropdown.appendChild(option);
    });

    roundDropdown.value = currentRound;

    roundDropdown.addEventListener("change", async () => {
      showLoadingScreen();
      const selectedRound = parseInt(roundDropdown.value, 10);
      if (selectedRound === currentRound) {
        try {
          gamesData = await fetchWithTimeout(
            fetchCurrentRoundData(currentRound)
          );
        } catch (error) {
          console.error("Error fetching current round data:", error);
          alert("Unable to fetch current round data. Please try again later.");
        }
        renderGames(gamesData, ladderData, currentRound, liveGames);
        closeSSEConnections();
        liveGames.forEach((game) => {
          const gameId = game.id;
          sseConnections[gameId] = setupSSEForGame(
            gameId,
            (gameId, eventType, eventData) => {
              console.log(
                `Received SSE update for game ${gameId}: ${eventType}`,
                eventData
              );
              updateLiveGamePanel(gameId, eventData, eventType);
            }
          );
        });
      } else {
        const cachedGames = pastGamesData.concat(futureGamesData);
        renderGames(cachedGames, ladderData, selectedRound);
        closeSSEConnections();
      }
      hideLoadingScreen();
    });
  }

  function closeSSEConnections() {
    Object.keys(sseConnections).forEach((gameId) => {
      console.log(`Closing SSE connection for game ID: ${gameId}...`);
      sseConnections[gameId].close();
      delete sseConnections[gameId];
    });
  }
});
