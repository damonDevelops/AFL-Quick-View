document.addEventListener("DOMContentLoaded", () => {
  const settingsIcon = document.getElementById("settingsIcon");
  const settingsDropdown = document.getElementById("settingsDropdown");

  const repairExtensionButton = document.getElementById(
    "repairExtensionButton"
  );
  const contactMeButton = document.getElementById("contactMeButton");
  const previewLiveGameButton = document.getElementById(
    "previewLiveGameButton"
  );

  let isFakeLiveGameActive = false; // State to track if fake live game is active
  let fakeGameSSEConnection = null; // To store the SSE connection

  const themeSwitcher = document.getElementById("themeSwitcher");
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");

  // Toggle between dark and light mode
  themeSwitcher.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains("dark-mode");

    sunIcon.style.display = isDarkMode ? "none" : "block";
    moonIcon.style.display = isDarkMode ? "block" : "none";

    // Optionally, save the user's theme preference
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  });

  // Initialize theme based on saved preference
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
  } else {
    sunIcon.style.display = "block";
    moonIcon.style.display = "none";
  }

  contactMeButton.addEventListener("click", () => {
    // Trigger mailto link for contacting
    window.location.href = "mailto:damon.oneil2.newsletter@gmail.com";
  });

  previewLiveGameButton.addEventListener("click", () => {
    isFakeLiveGameActive = !isFakeLiveGameActive; // Toggle the state

    if (isFakeLiveGameActive) {
      previewLiveGameButton.textContent = "Stop Preview Live Match (fake)";
      activateFakeLiveGame(); // Activate fake live game preview
    } else {
      previewLiveGameButton.textContent = "Preview Live Match (fake)";
      deactivateFakeLiveGame(); // Deactivate fake live game preview
    }
  });

  settingsIcon.addEventListener("click", () => {
    settingsDropdown.classList.toggle("show");
  });

  repairExtensionButton.addEventListener("click", () => {
    const userConfirmed = confirm(
      "Repairing the extension will remove all cached data, including past results and future fixtures. This may reduce efficiency on the next load. Do you want to continue?"
    );

    if (userConfirmed) {
      localStorage.clear();
      location.reload();
    }
  });

  // Close the dropdown if the user clicks outside of it
  window.addEventListener("click", (event) => {
    if (
      !event.target.matches("#settingsIcon") &&
      !event.target.closest(".dropdown-menu")
    ) {
      if (settingsDropdown.classList.contains("show")) {
        settingsDropdown.classList.remove("show");
      }
    }
  });

  function activateFakeLiveGame() {
    console.log("Activating fake live game preview...");

    renderFakeGame(); // Render the initial fake game

    // Establish SSE connection for the fake game
    fakeGameSSEConnection = new EventSource(
      "https://api.squiggle.com.au/sse/test"
    );

    fakeGameSSEConnection.addEventListener("score", (event) => {
      const parsedData = JSON.parse(event.data);
      console.log("Received SSE data for fake game:", parsedData);

      // Update the fake game's score based on SSE data
      updateFakeGameScores(parsedData);
    });

    fakeGameSSEConnection.onerror = (error) => {
      console.error("Error with fake game SSE connection:", error);
      fakeGameSSEConnection.close();
    };
  }

  function deactivateFakeLiveGame() {
    console.log("Deactivating fake live game preview...");

    // Close SSE connection if active
    if (fakeGameSSEConnection) {
      fakeGameSSEConnection.close();
      fakeGameSSEConnection = null;
    }

    // Remove the fake game from the display
    const fakeGameCard = document.getElementById("fake-live-game");
    if (fakeGameCard) {
      fakeGameCard.remove();
    }
  }

  function renderFakeGame() {
    const output = document.getElementById("output");

    // Remove existing fake game if already rendered
    const existingFakeGame = document.getElementById("fake-live-game");
    if (existingFakeGame) {
      existingFakeGame.remove();
    }

    // Fake game data
    const homeTeamName = "West Coast";
    const awayTeamName = "Essendon";
    const homeTeamLogo = `images/${homeTeamName.replace(/ /g, "")}.png`;
    const awayTeamLogo = `images/${awayTeamName.replace(/ /g, "")}.png`;
    const matchTime = "Live"; // Initial state for a live game
    const venue = "Optus Stadium";
    const homeScore = 45; // Initial fake score
    const awayScore = 32; // Initial fake score

    // Create a date element for consistency with other games
    const dateElement = document.createElement("div");

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

  function updateFakeGameScores(parsedData) {
    const fakeGameCard = document.getElementById("fake-live-game");
    if (!fakeGameCard) {
      console.error("Fake game card not found for updating scores.");
      return;
    }

    const homeScoreElement = fakeGameCard.querySelector(".home .score");
    const awayScoreElement = fakeGameCard.querySelector(".away .score");
    const bannerElement = fakeGameCard.querySelector(".banner");

    if (homeScoreElement && awayScoreElement && bannerElement) {
      homeScoreElement.textContent = parsedData.score.hscore;
      awayScoreElement.textContent = parsedData.score.ascore;
      bannerElement.textContent = parsedData.timestr; // Update time
    }
  }
});
