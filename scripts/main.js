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

  try {
    showLoadingScreen(); // Show loading screen at the start

    console.log("Fetching current round data...");
    currentRound = await getCurrentRound();
    if (!currentRound) {
      throw new Error("Failed to get current round.");
    }

    console.log("Fetching ladder and game data...");

    ladderData = await fetchLadderData(ladderCacheKey);
    if (!ladderData) {
      document.getElementById("output").innerHTML +=
        "<p>Error: Unable to fetch ladder data.</p>";
    } else {
      console.log("Ladder data loaded:", ladderData);
    }

    // Fetch past games data
    const pastGamesData = await fetchPastGames(pastGamesCacheKey);
    const futureGamesData = await fetchFutureGames(futureGamesCacheKey);

    // Fetch and render current round data separately (no caching)
    gamesData = await fetchCurrentRoundData(currentRound);

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
    liveGames = await fetchLiveGames();
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
    document.getElementById("output").textContent = `Error: ${error.message}`;
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
        gamesData = await fetchCurrentRoundData(currentRound);
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
