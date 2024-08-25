// Function to get team name from ID (used only for SSE live games)
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

// Function to get a team's ladder position
function getTeamLadderPosition(teamName, ladderData) {
  const team = ladderData.find((team) => team.name === teamName);
  if (!team) return "-";

  const rank = team.rank;
  let suffix;

  if (rank % 10 === 1 && rank !== 11) {
    suffix = "st";
  } else if (rank % 10 === 2 && rank !== 12) {
    suffix = "nd";
  } else if (rank % 10 === 3 && rank !== 13) {
    suffix = "rd";
  } else {
    suffix = "th";
  }

  return `${rank}${suffix}`;
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
export function renderGames(gamesData, ladderData, round, liveGames = []) {
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

// Function to render live games (updated to handle SSE data directly)
function renderLiveGame(game, liveGameData) {
  const output = document.getElementById("output");

  const homeTeamName = getTeamName(liveGameData.hteam);
  const awayTeamName = getTeamName(liveGameData.ateam);
  const homeTeamLogo = `images/${homeTeamName.replace(/ /g, "")}.png`;
  const awayTeamLogo = `images/${awayTeamName.replace(/ /g, "")}.png`;
  const matchTime = liveGameData.timestr || "Live";
  const homeScore = liveGameData.hscore;
  const awayScore = liveGameData.ascore;

  const gameCard = document.createElement("div");
  gameCard.className = "game-card live"; // Mark as live

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
