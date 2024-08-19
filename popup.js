document.addEventListener("DOMContentLoaded", async () => {
  const output = document.getElementById("output");
  const content = document.getElementById("content");
  const roundDropdown = document.getElementById("roundDropdown");
  const themeSwitcher = document.getElementById("themeSwitcher");
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");
  const cacheKey = "aflGameData";
  const ladderCacheKey = "aflLadderData";
  const cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds
  let gamesData = [];
  let ladderData = [];
  let currentRound = 0; // Initialize with a default round

  // Check for user's theme preference and set the initial theme
  const userPrefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentTheme =
    localStorage.getItem("theme") || (userPrefersDark ? "dark" : "light");
  setTheme(currentTheme);

  // Event listener for theme switcher
  themeSwitcher.addEventListener("click", () => {
    const newTheme =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  });

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  }

  // Fetch ladder data
  const cachedLadderData = getCachedData(ladderCacheKey);
  if (cachedLadderData) {
    ladderData = cachedLadderData;
  } else {
    try {
      const response = await fetch("https://api.squiggle.com.au/?q=standings");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      ladderData = data.standings;

      // Cache the ladder data
      cacheData(ladderData, ladderCacheKey);
    } catch (error) {
      content.style.display = "block";
      output.textContent = `Error: ${error.message}`;
      return;
    }
  }

  // Fetch game data
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    gamesData = cachedData;
    setDefaultRound(); // Set the default round
    displayData();
  } else {
    try {
      const response = await fetch(
        "https://api.squiggle.com.au/?q=games;year=2024;completed=100"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      gamesData = data.games;

      // Cache the data
      cacheData(gamesData, cacheKey);

      setDefaultRound(); // Set the default round
      displayData();
    } catch (error) {
      content.style.display = "block";
      output.textContent = `Error: ${error.message}`;
    }
  }

  function setDefaultRound() {
    // Find the first game that is not complete and set the round
    for (let game of gamesData) {
      if (game.complete !== 100) {
        currentRound = game.round;
        break;
      }
    }

    // Populate the round dropdown with round numbers and names
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

    // Set the dropdown to the current round
    roundDropdown.value = currentRound;
  }

  function getTeamLadderPosition(teamName) {
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

  function displayLadder() {
    // Show content directly
    content.style.display = "block";

    // Clear previous output and set up ladder display
    output.innerHTML = "<h2>AFL Ladder 2024</h2>";
    const ladderTable = document.createElement("table");
    ladderTable.className = "ladder-table";

    // Create table headers
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

    // Populate table rows with ladder data, sorted by rank
    ladderData.sort((a, b) => a.rank - b.rank);
    ladderData.forEach((team) => {
      const row = document.createElement("tr");
      const teamLogo = `images/${team.name.replace(/ /g, "")}.png`; // Assuming logo files are named after team names

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

  function displayData() {
    // Show content directly
    content.style.display = "block";

    // Display games for the current round
    filterGamesByRound(currentRound);

    // Handle round change
    roundDropdown.addEventListener("change", () => {
      const selectedRound = parseInt(roundDropdown.value, 10);
      filterGamesByRound(selectedRound);
    });
  }

  function filterGamesByRound(round) {
    // Filter games by the selected round
    const filteredGames = gamesData.filter((game) => game.round === round);

    // Display the filtered games
    output.innerHTML = ""; // Clear the current content
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
        game.complete === 100 ? game.hscore : getTeamLadderPosition(game.hteam);
      const awayScore =
        game.complete === 100 ? game.ascore : getTeamLadderPosition(game.ateam);

      // Create a date element
      const dateElement = document.createElement("div");
      dateElement.className = "game-date";
      dateElement.textContent = gameDate;

      // Create a game card
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

      // Append the date element and game card to the output
      output.appendChild(dateElement);
      output.appendChild(gameCard);
    });
  }

  // Function to format date to "Friday August 23"
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: "long", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  // Function to format localtime to 12-hour format
  function formatTime(localtime) {
    const date = new Date(localtime);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    const strMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${strMinutes} ${ampm}`;
  }

  // Utility functions for caching
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

  // Toggle between games and ladder view
  document.getElementById("viewGames").addEventListener("click", () => {
    displayData();
  });

  document.getElementById("viewLadder").addEventListener("click", () => {
    displayLadder();
  });
});
