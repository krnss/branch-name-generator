import { runWhenLoaded } from "../content.js";

export function setupObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node.nodeType === 1 &&
          node.querySelector?.('input[aria-label="Title field"]') &&
          node.querySelector?.('.work-item-form-header a')
        ) {
          runWhenLoaded(0);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
