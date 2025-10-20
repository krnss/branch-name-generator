import { extractTaskInfoFromDOM } from "./utils/dom-utils.js";
import { createBranchName, createDefaultCommitMessage } from "./utils/format-utils.js";
import { storeBranchName } from "./utils/storage-utils.js";

export function createIconButton(id, iconClass, ariaLabel, onClick) {
  const btn = document.createElement("button");
  btn.id = id;
  btn.className = "bolt-button bolt-icon-button enabled bolt-focus-treatment";
  btn.setAttribute("role", "button");
  btn.setAttribute("aria-label", ariaLabel);
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    padding: 0px;
    font-size: 12px;
    background-color: transparent;
    width: min-content;
    transition: background-color 0.3s ease;
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.backgroundColor = "var(--palette-black-alpha-6,rgba(0, 0, 0, 0.06))";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.backgroundColor = "transparent";
  });

  const outerSpan = document.createElement("span");
  outerSpan.className = "fluent-icons-enabled";

  const iconSpan = document.createElement("span");
  iconSpan.className = `left-icon flex-noshrink fabric-icon ${iconClass} medium`;
  iconSpan.setAttribute("aria-hidden", "true");
  iconSpan.style.padding = "0";

  outerSpan.appendChild(iconSpan);
  btn.appendChild(outerSpan);

  btn.onclick = onClick;

  return btn;
}

export function createCommitCopyButton(info) {
  const btn = document.createElement("button");
  btn.id = "commit-copy-button";
  btn.className = "bolt-button bolt-default-button bolt-focus-treatment";
  btn.style.cssText = "margin-left: 10px; padding: 0px 6px; font-size: 12px;";
  btn.innerText = "Copy Commit Msg";

  btn.onclick = () => {
    const commitMsg = createDefaultCommitMessage(info);
    navigator.clipboard.writeText(commitMsg).then(() => {
      const originalText = btn.innerText;
      btn.innerText = "✓";
      setTimeout(() => {
        btn.innerText = originalText;
      }, 5000);
    });
  };

  return btn;
}

function createPullRequestButton(info) {
  const btn = document.createElement("button");
  btn.id = "pull-request-button";
  btn.className = "bolt-button bolt-default-button bolt-focus-treatment";
  btn.style.cssText = "margin-left: 10px; padding: 0px 6px; font-size: 12px;";
  btn.innerText = "Create PR";

  btn.onclick = () => {
    //navigate to pull request creation page with prefilled info
    // https://timepoint-vsts.visualstudio.com/eTimePlus/_git/timepoint-etimeplus/pullrequestcreate?sourceRef=feat/TP-9470-system-notifications-update&targetRef=develop
    // sourceRef is branch name
    // targetRef is usually develop or main
    const branchName = loadBranchName(info.id)?.branch || "";
    const targetRef = "develop";
    const prUrl = `https://timepoint-vsts.visualstudio.com/eTimePlus/_git/timepoint-etimeplus/pullrequestcreate?sourceRef=${encodeURIComponent(branchName)}&targetRef=${encodeURIComponent(targetRef)}`;
    window.open(prUrl, "_blank");
    
  };

  return btn;
}

export function relativeTimeFromDate(dateString) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const date = new Date(dateString);

  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);

  const thresholds = [
    { limit: 60, divisor: 1, unit: 'second' },
    { limit: 3600, divisor: 60, unit: 'minute' },
    { limit: 86400, divisor: 3600, unit: 'hour' },
    { limit: 604800, divisor: 86400, unit: 'day' },
    { limit: 2419200, divisor: 604800, unit: 'week' },
    { limit: 29030400, divisor: 2419200, unit: 'month' },
    { limit: Infinity, divisor: 29030400, unit: 'year' },
  ];

  const absDiff = Math.abs(diffSeconds);

  for (const t of thresholds) {
    if (absDiff < t.limit) {
      const val = Math.round(diffSeconds / t.divisor);
      return rtf.format(val, t.unit);
    }
  }

  return '';
}

export function injectMain(branchName, id, savedAt) {
  const existing = document.querySelector("#branch-name-inline");
  if (existing) existing.remove();

  const linkEl = document.querySelector('.work-item-form-header a');
  if (!linkEl) return;

  const info = extractTaskInfoFromDOM();

  const container = renderInlineControls(branchName, id, savedAt);
  const commitCopyBtn = createCommitCopyButton(info);
  container.appendChild(commitCopyBtn);
  const pullRequestBth  = createPullRequestButton(info);
  container.appendChild(pullRequestBth);

  linkEl.parentElement.appendChild(container);
}

export function renderInlineControls(branchName, id, savedAt) {
  const container = document.createElement("div");
  container.id = "branch-name-inline";
  container.style.cssText = `
    margin-left: 10px;
    font-family: monospace;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const code = document.createElement("code");
  code.style.cssText = `
    height: 100%;
  `;
  code.textContent = branchName;

  const copyBtn = createIconButton("copy-branch-name-btn" ,"ms-Icon--Copy", "Copy branch name", () => {
    navigator.clipboard.writeText(branchName).then(() => {
      setCopyBtnAsCheck();
    });
  });

  const regenerateBtn = createIconButton("regenerate-branch-name-btn", "ms-Icon--Refresh", "Regenerate branch name", () => {
    const info = extractTaskInfoFromDOM();
    const newBranch = createBranchName(info);
    storeBranchName(id, newBranch);
    container.remove();
    injectMain(newBranch, id, new Date().toISOString());
    navigator.clipboard.writeText(newBranch).then(() => {
      setCopyBtnAsCheck();
    });
  });

  const deleteBtn = createIconButton("delete-branch-name-btn" ,"ms-Icon--Delete", "Delete branch name", () => {
    localStorage.removeItem(`branchName-${id}`);
    container.remove();
    injectGenerateButton(id);
  });

  const savedAtSpan = document.createElement("span");
  savedAtSpan.style.cssText = "font-size: 11px; color: #888;";
  savedAtSpan.textContent = `saved ${relativeTimeFromDate(savedAt)}`;

  container.appendChild(code);
  container.appendChild(copyBtn);
  container.appendChild(regenerateBtn);
  container.appendChild(deleteBtn);
  container.appendChild(savedAtSpan);

  return container;
}

export function injectGenerateButton(id) {
  const linkEl = document.querySelector('.work-item-form-header a');
  if (!linkEl) return;

  if (document.querySelector("#branch-name-generate")) return;

  const btn = document.createElement("button");
  btn.id = "branch-name-generate";
  btn.className = "bolt-button bolt-default-button bolt-focus-treatment";
  btn.style.cssText = "margin-left: 10px; padding: 0px 6px; font-size: 12px;";
  btn.innerText = "Generate Branch Name";

  btn.onclick = () => {
    const info = extractTaskInfoFromDOM();
    const branchName = createBranchName(info);
    const savedAt = new Date().toISOString();
    storeBranchName(id, branchName);
    injectMain(branchName, id, savedAt);

    navigator.clipboard.writeText(branchName).then(() => {
      setCopyBtnAsCheck();
    });

    btn.remove();
  };

  linkEl.parentElement.appendChild(btn);
}

export function setCopyBtnAsCheck(time = 1500) {
  const copyBtn = document.querySelector("#copy-branch-name-btn");
  if (!copyBtn) return;
  
  const icon = copyBtn.querySelector(".ms-Icon--Copy");
  if (!icon) return;
  
  icon.classList.replace("ms-Icon--Copy", "ms-Icon--CheckMark");
  
  setTimeout(() => {
    icon.classList.replace("ms-Icon--CheckMark", "ms-Icon--Copy");
  }, time);
}

