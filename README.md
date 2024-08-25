
# AFL Quick View Chrome Extension

AFL Quick View is a Chrome extension that allows you to quickly view the current AFL games and the league ladder, all within a single, easy-to-use popup. This extension helps you stay updated with AFL scores, upcoming games, and the latest standings.

![AFL Quick View Extension Screenshot](images/readme/extension_screenshot.png)

## Features

- **View Current Games**: Displays the current round of AFL games with team logos, match times, and scores (or ladder positions for future games).
- **Ladder View**: Quickly switch to view the current AFL ladder, complete with team logos, positions, and statistics.
- **Dark/Light Mode**: Toggle between dark and light themes based on your preference or system settings.


## Installation

### Prerequisites

- [Google Chrome](https://www.google.com/chrome/)
- Basic knowledge of Chrome extensions and unpacking them

### Steps to Load the Extension Unpacked

1. Clone or download this repository to your local machine.

```bash
git clone https://github.com/yourusername/afl-quick-view.git
```

2. Open Google Chrome and navigate to `chrome://extensions/`.

3. Enable **Developer mode** by toggling the switch in the top-right corner.

4. Click on **Load unpacked** and select the directory where you cloned this repository.

![Load Unpacked](images/readme/load_unpacked.png)

5. The AFL Quick View extension should now be installed and visible in your Chrome extensions list.

6. Pin the extension to your Chrome toolbar for easy access.

![Extension Toolbar](images/readme/toolbar.png)

## Usage

- **View Games**: Click on the extension icon to open the popup. By default, the extension displays the current round of games. Use the dropdown to select different rounds.
  
- **View Ladder**: Switch between viewing games and the ladder by clicking the "View Ladder" button.

![Game View](images/readme/game_view.png)
![Ladder View](images/readme/ladder_view.png)

- **Theme Toggle**: Toggle between dark and light themes using the sun/moon icon at the top-right corner of the popup.

## Development

### Caching

The extension caches game and ladder data for one hour to reduce the number of API requests and provide quicker access to data. If you want to clear the cache, you can do so by reloading the extension via the `chrome://extensions/` page.

### API Usage

This extension utilizes the [Squiggle API](https://api.squiggle.com.au/) to fetch AFL game data and standings.


## Contributing

We welcome contributions to the AFL Quick View Chrome Extension! To contribute, please follow these steps:

1. **Fork the Repository**: Click the "Fork" button on the top right of the repository page to create a copy of the repository on your GitHub account.

2. **Clone the Forked Repository**: Clone your forked repository to your local machine.

   ```bash
   git clone https://github.com/damonDevelops/afl-quick-view.git
   ```

3. **Create a New Branch**: It's good practice to create a new branch for each feature or bug fix you work on.

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**: Implement your changes or improvements.

5. **Commit Your Changes**: Make sure to write meaningful commit messages.

   ```bash
   git add .
   git commit -m "Add meaningful commit message here"
   ```

6. **Push to Your Forked Repository**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**: Go to the original repository on GitHub, click on the "Pull Requests" tab, and then click the "New Pull Request" button. Choose your forked repository and the branch you created to submit your pull request.

8. **Review and Merge**: After submitting your pull request, one of the maintainers will review it. If there are no issues, your pull request will be merged into the main repository.

We encourage you to discuss any major changes or ideas through GitHub Issues before starting work. This helps us to coordinate development efforts and avoid duplication of work.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
