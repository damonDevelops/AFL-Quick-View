import { initializeTheme } from "./theme.js";
import { getRound, fetchLadderData, fetchGameData, fetchSSE } from "./api.js";
import { renderLadder, renderGames, renderSSE } from "./rendering.js";

document.addEventListener("DOMContentLoaded", async () => {
  const roundDropdown = document.getElementById("roundDropdown");

  initializeTheme();

  let gamesData = [];
  let ladderData = [];
  let currentRound = 0;
  let liveGames = [];

  try {
    console.log("Fetching current round data...");
    currentRound = await getRound();
    if (!currentRound) {
      throw new Error("Failed to get current round.");
    }

    console.log("Fetching ladder and game data...");

    ladderData = await fetchLadderData("aflLadderData");
    if (!ladderData) {
      document.getElementById("output").innerHTML +=
        "<p>Error: Unable to fetch ladder data.</p>";
    } else {
      console.log("Ladder data loaded:", ladderData);
    }

    // Fetch and cache previous and future rounds but not the current round
    const previousRound = currentRound - 1;
    const nextRound = currentRound + 1;

    const previousGamesData = await fetchGameData(
      "aflPreviousRoundData",
      previousRound,
      currentRound
    );
    if (previousGamesData) {
      renderGames(previousGamesData, ladderData, previousRound, liveGames);
    }

    const futureGamesData = await fetchGameData(
      "aflFutureRoundData",
      nextRound,
      currentRound
    );
    if (futureGamesData) {
      renderGames(futureGamesData, ladderData, nextRound, liveGames);
    }

    // Fetch and render current round data separately (no caching)
    gamesData = await fetchGameData(
      "aflCurrentRoundData",
      currentRound,
      currentRound
    );
    if (gamesData) {
      setDefaultRound();
      renderGames(gamesData, ladderData, currentRound, liveGames);
    }

    // Set up SSE connection if games data is available
    if (gamesData) {
      fetchSSE((newLiveGames) => {
        console.log("Updating live games data...", newLiveGames);
        liveGames = newLiveGames;
        updateLiveGames(gamesData, liveGames);
        renderGames(gamesData, ladderData, currentRound, liveGames);
      });
    }
  } catch (error) {
    console.error("Error during initialization:", error);
    document.getElementById("output").textContent = `Error: ${error.message}`;
  }

  document.getElementById("viewGames").addEventListener("click", () => {
    if (gamesData) {
      renderGames(gamesData, ladderData, currentRound, liveGames);
    }
  });

  document.getElementById("viewLadder").addEventListener("click", () => {
    if (ladderData) {
      renderLadder(ladderData);
    }
  });

  function setDefaultRound() {
    console.log("Setting default round...");
    for (let game of gamesData) {
      if (game.complete !== 100) {
        currentRound = game.round;
        break;
      }
    }

    const rounds = [...new Set(gamesData.map((game) => game.round))];
    rounds.sort((a, b) => a - b);

    rounds.forEach((round) => {
      const option = document.createElement("option");
      const roundName =
        gamesData.find((game) => game.round === round).roundname ||
        `Round ${round}`;
      option.value = round;
      option.textContent = roundName;
      roundDropdown.appendChild(option);
    });

    roundDropdown.value = currentRound;

    roundDropdown.addEventListener("change", () => {
      currentRound = parseInt(roundDropdown.value, 10);
      renderGames(gamesData, ladderData, currentRound, liveGames);
    });
  }

  function updateLiveGames(allGames, liveGames) {
    console.log("Merging live games data with existing data...");
    // Merge live game data with existing games
    liveGames.forEach((liveGame) => {
      const gameIndex = allGames.findIndex((game) => game.id === liveGame.id);
      if (gameIndex !== -1) {
        allGames[gameIndex] = liveGame; // Update the game data with live data
      } else {
        allGames.push(liveGame); // Add new live game if it doesn't exist
      }
    });
  }
});
