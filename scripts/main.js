import { initializeTheme } from "./theme.js";
import { fetchLadderData, fetchGameData, fetchSSE } from "./api.js";
import { renderLadder, renderGames, renderSSE } from "./rendering.js";

document.addEventListener("DOMContentLoaded", async () => {
  const roundDropdown = document.getElementById("roundDropdown");
  const ladderCacheKey = "aflLadderData";
  const cacheKey = "aflGameData";

  initializeTheme();

  let gamesData = [];
  let ladderData = [];
  let currentRound = 0;

  try {
    ladderData = await fetchLadderData(ladderCacheKey);
    gamesData = await fetchGameData(cacheKey);

    setDefaultRound();
    renderGames(gamesData, ladderData, currentRound);
  } catch (error) {
    document.getElementById("output").textContent = `Error: ${error.message}`;
  }

  document.getElementById("viewGames").addEventListener("click", () => {
    renderGames(gamesData, ladderData, currentRound);
  });

  document.getElementById("viewLadder").addEventListener("click", () => {
    renderLadder(ladderData);
  });

  document.getElementById("sseTest").addEventListener("click", () => {
    fetchSSE((data) => {
      renderSSE(data);
    });
  });

  function setDefaultRound() {
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
      renderGames(gamesData, ladderData, currentRound);
    });
  }
});
