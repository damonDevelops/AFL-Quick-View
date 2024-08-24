// TODO: use this api: https://api.squiggle.com.au/?q=games;year=2024;complete=100;
//to get all previous games. Cache these with an expiry of ~ a month

// populate the dropdown with these options

// append the remaining by fetching the current round

// implement the sse so it shows live games

// don't cache the future games for now, we'll do that last

import { initializeTheme } from "./theme.js";
import {
  getCurrentRound,
  fetchLadderData,
  fetchGameData,
  fetchSSE,
} from "./api.js";
import { renderLadder, renderGames, renderSSE } from "./rendering.js";

document.addEventListener("DOMContentLoaded", async () => {
  const roundDropdown = document.getElementById("roundDropdown");
  const ladderCacheKey = "aflLadderData";
  const currentRoundCacheKey = "aflCurrentRoundData";
  const previousRoundCacheKey = "aflPreviousRoundData";
  const futureRoundCacheKey = "aflFutureRoundData";

  initializeTheme();

  let gamesData = [];
  let ladderData = [];
  let currentRound = 0;
  let liveGames = [];

  try {
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

    // Fetch and cache previous and future rounds but not the current round
    const previousRound = currentRound - 1;
    const nextRound = currentRound + 1;

    const previousGamesData = await fetchGameData(
      previousRoundCacheKey,
      previousRound,
      currentRound
    );
    const futureGamesData = await fetchGameData(
      futureRoundCacheKey,
      nextRound,
      currentRound
    );

    // Fetch and render current round data separately (no caching)
    gamesData = await fetchGameData(
      currentRoundCacheKey,
      currentRound,
      currentRound
    );

    if (gamesData) {
      populateRoundDropdown(
        currentRound,
        gamesData,
        previousGamesData,
        futureGamesData
      );
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

  function populateRoundDropdown(
    currentRound,
    gamesData,
    previousGamesData,
    futureGamesData
  ) {
    console.log("Populating round dropdown...");

    const allGamesData = [
      ...gamesData,
      ...previousGamesData,
      ...futureGamesData,
    ];
    const rounds = [...new Set(allGamesData.map((game) => game.round))];
    rounds.sort((a, b) => a - b);

    rounds.forEach((round) => {
      const option = document.createElement("option");
      const roundName =
        allGamesData.find((game) => game.round === round).roundname ||
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
