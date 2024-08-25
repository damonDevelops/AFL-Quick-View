document.addEventListener("DOMContentLoaded", () => {
  const settingsIcon = document.getElementById("settingsIcon");
  const settingsDropdown = document.getElementById("settingsDropdown");
  const repairExtensionButton = document.getElementById(
    "repairExtensionButton"
  );

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
});
