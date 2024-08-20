export function setTheme(theme) {
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");

  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") {
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
  } else {
    sunIcon.style.display = "block";
    moonIcon.style.display = "none";
  }
}

export function initializeTheme() {
  const userPrefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentTheme =
    localStorage.getItem("theme") || (userPrefersDark ? "dark" : "light");

  setTheme(currentTheme);

  document.getElementById("themeSwitcher").addEventListener("click", () => {
    const newTheme =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  });
}
