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

export function renderGames(gamesData, ladderData, round) {
  const output = document.getElementById("output");
  output.innerHTML = "";

  const filteredGames = gamesData.filter((game) => game.round === round);

  if (filteredGames.length === 0) {
    output.textContent = "No games available for this round.";
    return;
  }

  filteredGames.forEach((game) => {
    const homeTeamLogo = `images/${game.hteam.replace(/ /g, "")}.png`;
    const awayTeamLogo = `images/${game.ateam.replace(/ /g, "")}.png`;
    const matchTime =
      game.complete === 100 ? game.timestr : formatTime(game.localtime);
    const gameDate = formatDate(game.date);

    const homeScore =
      game.complete === 100
        ? game.hscore
        : getTeamLadderPosition(game.hteam, ladderData);
    const awayScore =
      game.complete === 100
        ? game.ascore
        : getTeamLadderPosition(game.ateam, ladderData);

    const dateElement = document.createElement("div");
    dateElement.className = "game-date";
    dateElement.textContent = gameDate;

    const gameCard = document.createElement("div");
    gameCard.className = "game-card";

    gameCard.innerHTML = `
              <div class="team-container home">
                <div class="team">
                  <span class="team-name">${game.hteam}</span>
                  <img src="${homeTeamLogo}" alt="${game.hteam}" class="team-logo">
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
                  <img src="${awayTeamLogo}" alt="${game.ateam}" class="team-logo">
                  <span class="team-name">${game.ateam}</span>
                </div>
              </div>
            `;

    output.appendChild(dateElement);
    output.appendChild(gameCard);
  });
}

export function renderSSE(scoreData) {
  const output = document.getElementById("output");

  const scoreContainer = document.createElement("div");
  scoreContainer.className = "score-container";

  const scoreEventElement = document.createElement("div");
  scoreEventElement.className = "score-event";

  // Create elements for the match details and score details
  const matchDetails = document.createElement("div");
  matchDetails.className = "match-info";
  matchDetails.innerHTML = `
    <p>Game ID: ${scoreData.gameid}</p>
    <p>Type: ${scoreData.type}</p>
    <p>Time: ${scoreData.timestr}</p>
  `;

  const scoreDetails = document.createElement("div");
  scoreDetails.className = "score-details";
  scoreDetails.innerHTML = `
    <p>Score: ${scoreData.score.hscore} - ${scoreData.score.ascore} (Home vs Away)</p>
    <p>Home: ${scoreData.score.hgoals}.${scoreData.score.hbehinds} - Away: ${scoreData.score.agoals}.${scoreData.score.abehinds}</p>
  `;

  // Append match details and score details to the score event element
  scoreEventElement.appendChild(matchDetails);
  scoreEventElement.appendChild(scoreDetails);

  // Append the score event element to the score container
  scoreContainer.appendChild(scoreEventElement);

  // Append the score container to the output
  output.appendChild(scoreContainer);
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
