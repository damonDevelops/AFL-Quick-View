// Function to get team name from ID (used only for SSE live games)
import { setupFakeSSE, closeFakeSSE } from "./api.js";

function getTeamName(teamId) {
  const teamMapping = {
    1: "Adelaide",
    2: "Brisbane Lions",
    3: "Carlton",
    4: "Collingwood",
    5: "Essendon",
    6: "Fremantle",
    7: "Geelong",
    8: "Gold Coast",
    9: "Greater Western Sydney",
    10: "Hawthorn",
    11: "Melbourne",
    12: "North Melbourne",
    13: "Port Adelaide",
    14: "Richmond",
    15: "St Kilda",
    16: "Sydney",
    17: "West Coast",
    18: "Western Bulldogs",
  };
  return teamMapping[teamId] || "Unknown Team";
}

// Function to render the AFL ladder
export function renderLadder(ladderData) {
  const output = document.getElementById("output");
  output.innerHTML = "<h2>AFL Ladder 2024</h2>";
  const ladderTable = document.createElement("table");
  ladderTable.className = "ladder-table";

  const headers = [
    "Position",
    "Club",
    "Team Name",
    "Played",
    "Points",
    "Percentage",
    "Won",
    "Lost",
    "Drawn",
  ];
  const headerRow = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  ladderTable.appendChild(headerRow);

  ladderData.sort((a, b) => a.rank - b.rank);
  ladderData.forEach((team) => {
    const row = document.createElement("tr");
    const teamLogo = `images/${team.name.replace(/ /g, "")}.png`;

    row.innerHTML = `
              <td>${team.rank}</td>
              <td><img src="${teamLogo}" alt="${
      team.name
    }" class="team-logo" /></td>
              <td>${team.name}</td>
              <td>${team.played}</td>
              <td>${team.pts}</td>
              <td>${team.percentage.toFixed(2)}</td>
              <td>${team.wins}</td>
              <td>${team.losses}</td>
              <td>${team.draws}</td>
            `;
    ladderTable.appendChild(row);
  });

  output.appendChild(ladderTable);
}

// Function to render games (entry point)
export function renderGames(
  gamesData,
  ladderData,
  round,
  liveGames = [],
  isFakeLiveGameEnabled = false
) {
  const output = document.getElementById("output");
  output.innerHTML = "";

  // Filter games for the selected round
  const filteredGames = gamesData.filter((game) => game.round === round) || [];

  if (filteredGames.length === 0 && round !== 0) {
    output.textContent = "No games available for this round.";
    return;
  }

  const liveGamesMap = new Map(liveGames.map((game) => [game.id, game]));

  filteredGames.forEach((game) => {
    if (liveGamesMap.has(game.id)) {
      renderLiveGame(game, liveGamesMap.get(game.id));
    } else if (game.complete === 100) {
      renderCompletedGame(game, ladderData);
    } else {
      renderFutureGame(game);
    }
  });

  // Prevent re-rendering live games if they already exist
  liveGames.forEach((liveGame) => {
    const existingGameCard = document.getElementById(
      `live-game-${liveGame.id}`
    );
    if (!existingGameCard) {
      renderLiveGame(liveGame);
    }
  });

  // Check if fake live game setting is enabled
  if (isFakeLiveGameEnabled) {
    renderFakeGame();
    setupFakeSSE(updateFakeGamePanel); // Set up SSE connection for fake game
  } else {
    closeFakeSSE(); // Close SSE connection if the setting is off
  }
}

function renderLiveGame(liveGameData) {
  console.log("Rendering live game data:", liveGameData);

  const existingGameCard = document.getElementById(
    `live-game-${liveGameData.id}`
  );

  // Only render if the game card doesn't already exist
  if (!existingGameCard) {
    console.log("Game card does not exist, creating a new one.");

    const output = document.getElementById("output");

    // Assuming getTeamName should handle string input directly
    const homeTeamName = liveGameData.hteam; // directly using team names from API response
    const awayTeamName = liveGameData.ateam;
    console.log("Home Team Name:", homeTeamName);
    console.log("Away Team Name:", awayTeamName);

    const homeTeamLogo = `images/${homeTeamName.replace(/ /g, "")}.png`;
    const awayTeamLogo = `images/${awayTeamName.replace(/ /g, "")}.png`;
    console.log("Home Team Logo Path:", homeTeamLogo);
    console.log("Away Team Logo Path:", awayTeamLogo);

    const matchTime = liveGameData.timestr || "Live";
    console.log("Match Time:", matchTime);

    const homeScore =
      liveGameData.hscore !== undefined ? liveGameData.hscore : "-";
    const awayScore =
      liveGameData.ascore !== undefined ? liveGameData.ascore : "-";
    console.log("Home Score:", homeScore);
    console.log("Away Score:", awayScore);

    const gameCard = document.createElement("div");
    gameCard.className = "game-card live"; // Mark as live
    gameCard.id = `live-game-${liveGameData.id}`; // Assign a unique ID

    gameCard.innerHTML = `
      <div class="team-container home">
        <div class="team">
          <span class="team-name">${homeTeamName}</span>
          <img src="${homeTeamLogo}" alt="${homeTeamName}" class="team-logo">
        </div>
        <div class="score">${homeScore}</div>
      </div>
      <div class="live-banner-container">
        <div class="banner">${matchTime}</div>
        <div class="sse-venue">${liveGameData.venue}</div>
      </div>
      <div class="team-container away">
        <div class="score">${awayScore}</div>
        <div class="team">
          <img src="${awayTeamLogo}" alt="${awayTeamName}" class="team-logo">
          <span class="team-name">${awayTeamName}</span>
        </div>
      </div>
    `;

    output.appendChild(gameCard);
    console.log("Game card appended to output.");
  } else {
    console.log("Game card already exists, not rendering again.");
  }
}

// Function to render completed games
function renderCompletedGame(game, ladderData) {
  const output = document.getElementById("output");

  const homeTeamName = game.hteam;
  const awayTeamName = game.ateam;
  const homeTeamLogo = `images/${homeTeamName.replace(/ /g, "")}.png`;
  const awayTeamLogo = `images/${awayTeamName.replace(/ /g, "")}.png`;
  const matchTime = game.timestr;
  const homeScore = game.hscore;
  const awayScore = game.ascore;

  const gameDate = formatDate(game.date);

  const dateElement = document.createElement("div");
  dateElement.className = "game-date";
  dateElement.textContent = gameDate;

  const gameCard = document.createElement("div");
  gameCard.className = "game-card";

  gameCard.innerHTML = `
    <div class="team-container home">
      <div class="team">
        <span class="team-name">${homeTeamName}</span>
        <img src="${homeTeamLogo}" alt="${homeTeamName}" class="team-logo">
      </div>
      <div class="score">${homeScore}</div>
    </div>
    <div class="match-info">
      <div>${matchTime}</div>
      <div>${game.venue}</div>
    </div>
    <div class="team-container away">
      <div class="score">${awayScore}</div>
      <div class="team">
        <img src="${awayTeamLogo}" alt="${awayTeamName}" class="team-logo">
        <span class="team-name">${awayTeamName}</span>
      </div>
    </div>
  `;

  output.appendChild(dateElement);
  output.appendChild(gameCard);
}

// Function to render future games
function renderFutureGame(game) {
  const output = document.getElementById("output");

  const homeTeamName = game.hteam;
  const awayTeamName = game.ateam;
  const homeTeamLogo = `images/${homeTeamName.replace(/ /g, "")}.png`;
  const awayTeamLogo = `images/${awayTeamName.replace(/ /g, "")}.png`;
  const matchTime = formatTime(game.localtime);

  const gameDate = formatDate(game.date);

  const dateElement = document.createElement("div");
  dateElement.className = "game-date";
  dateElement.textContent = gameDate;

  const gameCard = document.createElement("div");
  gameCard.className = "game-card";

  gameCard.innerHTML = `
    <div class="team-container home">
      <div class="team">
        <span class="team-name">${homeTeamName}</span>
        <img src="${homeTeamLogo}" alt="${homeTeamName}" class="team-logo">
      </div>
      <div class="score">-</div>
    </div>
    <div class="match-info">
      <div>${matchTime}</div>
      <div>${game.venue}</div>
    </div>
    <div class="team-container away">
      <div class="score">-</div>
      <div class="team">
        <img src="${awayTeamLogo}" alt="${awayTeamName}" class="team-logo">
        <span class="team-name">${awayTeamName}</span>
      </div>
    </div>
  `;

  output.appendChild(dateElement);
  output.appendChild(gameCard);
}

// Function to update live game panel with SSE data
export function updateLiveGamePanel(gameId, eventData, eventType) {
  const gameCard = document.getElementById(`live-game-${gameId}`);

  if (!gameCard) {
    console.error(`Live game card not found for game ID: ${gameId}`);
    return;
  }

  // Update the time string or score based on SSE event type
  if (eventType === "timestr") {
    const banner = gameCard.querySelector(".banner");
    if (banner) banner.textContent = eventData.timestr;
  } else if (eventType === "score") {
    const homeScore = gameCard.querySelector(".home .score");
    const awayScore = gameCard.querySelector(".away .score");
    if (homeScore && awayScore) {
      homeScore.textContent = eventData.score.hscore;
      awayScore.textContent = eventData.score.ascore;
    }
    const banner = gameCard.querySelector(".banner");
    if (banner) banner.textContent = eventData.timestr;
  }
}

// Function to render a fake live game
function renderFakeGame() {
  const output = document.getElementById("output");

  // Fake game data
  const homeTeamName = "West Coast";
  const awayTeamName = "Essendon";
  const homeTeamLogo = `images/${homeTeamName.replace(/ /g, "")}.png`;
  const awayTeamLogo = `images/${awayTeamName.replace(/ /g, "")}.png`;
  const matchTime = "Q2 15:23"; // Fake live match time
  const venue = "Optus Stadium";
  const homeScore = 45; // Fake score
  const awayScore = 32; // Fake score

  // Create a date element for consistency with other games
  const dateElement = document.createElement("div");
  dateElement.className = "game-date";
  dateElement.textContent = "Monday, August 26"; // Fake date

  const gameCard = document.createElement("div");
  gameCard.className = "game-card live"; // Mark as live
  gameCard.id = `fake-live-game`; // Assign a unique ID for the fake game

  gameCard.innerHTML = `
    <div class="team-container home">
      <div class="team">
        <span class="team-name">${homeTeamName}</span>
        <img src="${homeTeamLogo}" alt="${homeTeamName}" class="team-logo">
      </div>
      <div class="score">${homeScore}</div>
    </div>
    <div class="live-banner-container">
      <div class="banner">${matchTime}</div>
      <div class="sse-venue">${venue}</div>
    </div>
    <div class="team-container away">
      <div class="score">${awayScore}</div>
      <div class="team">
        <img src="${awayTeamLogo}" alt="${awayTeamName}" class="team-logo">
        <span class="team-name">${awayTeamName}</span>
      </div>
    </div>
  `;

  output.appendChild(dateElement);
  output.appendChild(gameCard);
  console.log("Fake game card appended to output.");
}

// Function to update the fake game panel with SSE data
function updateFakeGamePanel(eventData) {
  const fakeGameCard = document.getElementById("fake-live-game");

  if (!fakeGameCard) {
    console.error("Fake live game card not found!");
    return;
  }

  const homeScoreElement = fakeGameCard.querySelector(".home .score");
  const awayScoreElement = fakeGameCard.querySelector(".away .score");

  if (homeScoreElement && awayScoreElement) {
    homeScoreElement.textContent = eventData.score.hscore;
    awayScoreElement.textContent = eventData.score.ascore;
  }

  const banner = fakeGameCard.querySelector(".banner");
  if (banner) banner.textContent = eventData.timestr;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { weekday: "long", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function formatTime(localtime) {
  const date = new Date(localtime);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${strMinutes} ${ampm}`;
}
