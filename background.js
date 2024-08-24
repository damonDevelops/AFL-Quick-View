chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchRoundData") {
    fetch(request.url)
      .then((response) => response.json())
      .then((data) => sendResponse(data))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Keep the message channel open for asynchronous response
  }
});
