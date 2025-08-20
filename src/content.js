import { injectMain, injectGenerateButton } from "./ui-controls.js";
import { loadBranchName } from "./utils/storage-utils.js";
import { setupObserver } from "./utils/observer.js";
import { isEnabled } from "./utils/settings-utils.js";

export function runWhenLoaded(retries = 0) {
  // Check if the generator is enabled
  if (!isEnabled()) return;

  const titleInput = document.querySelector('input[aria-label="Title field"]');
  const typeLink = document.querySelector('.work-item-form-header a');

  if (titleInput && typeLink) {
    const idMatch = typeLink.textContent.match(/(\d+)/);
    const id = idMatch ? idMatch[1] : null;
    if (!id) return;

    const stored = loadBranchName(id);
    if (stored?.branch && stored?.savedAt) {
      injectMain(stored.branch, id, stored.savedAt);
    } else {
      injectGenerateButton(id);
    }
  } else if (retries < 10) {
    setTimeout(() => runWhenLoaded(retries + 1), 500);
  }
}

setupObserver();
runWhenLoaded();
