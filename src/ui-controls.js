import { extractTaskInfoFromDOM } from "./utils/dom-utils.js";
import { createBranchName, createDefaultCommitMessage } from "./utils/format-utils.js";
import { loadBranchName, storeBranchName } from "./utils/storage-utils.js";
import { getSettings, updateSetting } from "./utils/settings-utils.js";

function getAzureDevOpsProjectBase() {
  const { origin, pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);

  if (origin.includes("dev.azure.com")) {
    const org = parts[0];
    const project = parts[1];
    if (!org || !project) return null;
    return `${origin}/${org}/${project}`;
  }

  const project = parts[0];
  if (!project) return null;
  return `${origin}/${project}`;
}

function buildPullRequestUrl(repoName, sourceRef, targetRef) {
  const base = getAzureDevOpsProjectBase();
  if (!base) return null;
  return `${base}/_git/${encodeURIComponent(repoName)}/pullrequestcreate?sourceRef=${encodeURIComponent(sourceRef)}&targetRef=${encodeURIComponent(targetRef)}`;
}

function resolveRepository(settings, repoName) {
  const repos = settings.repositories || [];
  if (!repos.length) return null;
  return repos.find((repo) => repo.name === repoName) || repos[0];
}

function formatRepoLabel(repo) {
  return `${repo.name} (${repo.targetRef || "develop"})`;
}

function removePrOverlays() {
  document.getElementById("pull-request-dropdown-menu")?.remove();
  document.getElementById("pull-request-repo-tooltip")?.remove();
}

async function openPullRequest(info, repo) {
  const branchName = loadBranchName(info.id)?.branch || "";
  const targetRef = repo.targetRef || "develop";
  const prUrl = buildPullRequestUrl(repo.name, branchName, targetRef);
  if (!prUrl) return;
  window.open(prUrl, "_blank");
  await updateSetting("lastUsedRepo", repo.name);
}

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
  const wrapper = document.createElement("div");
  wrapper.id = "pull-request-button";
  wrapper.style.cssText = "display: inline-flex; position: relative; margin-left: 10px; flex-shrink: 0; z-index: 20;";

  const createBtn = document.createElement("button");
  createBtn.className = "bolt-button bolt-default-button bolt-focus-treatment";
  createBtn.style.cssText = "padding: 0px 6px; font-size: 12px; border-top-right-radius: 0; border-bottom-right-radius: 0;";
  createBtn.innerText = "Create PR";

  const chevronBtn = document.createElement("button");
  chevronBtn.className = "bolt-button bolt-default-button bolt-icon-button bolt-focus-treatment";
  chevronBtn.setAttribute("aria-label", "Choose repository");
  chevronBtn.style.cssText = "padding: 0px 4px; font-size: 12px; border-top-left-radius: 0; border-bottom-left-radius: 0; border-left: 1px solid var(--palette-black-alpha-8, rgba(0, 0, 0, 0.08));";

  const chevronIcon = document.createElement("span");
  chevronIcon.className = "fabric-icon ms-Icon--ChevronDown medium";
  chevronIcon.setAttribute("aria-hidden", "true");
  chevronBtn.appendChild(chevronIcon);

  const overlayCss = `
    display: none;
    position: fixed;
    z-index: 2147483646;
    background: var(--callout-background-color, #fff);
    border: 1px solid var(--callout-border-color, #d1d1d1);
    border-radius: 4px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
  `;

  const menu = document.createElement("div");
  menu.id = "pull-request-dropdown-menu";
  menu.style.cssText = overlayCss + "min-width: 220px; padding: 4px 0;";

  const tooltip = document.createElement("div");
  tooltip.id = "pull-request-repo-tooltip";
  tooltip.style.cssText = overlayCss + `
    padding: 6px 10px;
    font-size: 12px;
    color: #fff;
    background: #323130;
    border: none;
    pointer-events: none;
    white-space: nowrap;
  `;

  const setEnabled = (enabled) => {
    createBtn.disabled = !enabled;
    chevronBtn.disabled = !enabled;
    wrapper.style.opacity = enabled ? "1" : "0.5";
    wrapper.style.pointerEvents = enabled ? "auto" : "none";
  };

  const isMenuOpen = () => menu.style.display === "block";

  const hideTooltip = () => {
    tooltip.style.display = "none";
    tooltip.remove();
  };

  const hideMenu = () => {
    menu.style.display = "none";
    menu.remove();
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("scroll", onViewportChange, true);
    window.removeEventListener("resize", onViewportChange);
  };

  const onViewportChange = () => {
    hideMenu();
    hideTooltip();
  };

  const onDocumentClick = (event) => {
    if (!wrapper.contains(event.target) && !menu.contains(event.target)) {
      hideMenu();
    }
  };

  const positionOverlay = (anchor, overlay, align = "left") => {
    const rect = anchor.getBoundingClientRect();
    overlay.style.top = `${rect.bottom + 4}px`;
    if (align === "right") {
      const width = overlay.offsetWidth;
      overlay.style.left = `${Math.max(8, rect.right - width)}px`;
    } else {
      overlay.style.left = `${rect.left}px`;
    }
  };

  const renderMenu = (settings) => {
    menu.innerHTML = "";
    const repos = settings.repositories || [];

    if (!repos.length) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding: 8px 12px; font-size: 12px; color: #888;";
      empty.textContent = "Add repositories in the extension popup";
      menu.appendChild(empty);
      return;
    }

    for (const repo of repos) {
      const item = document.createElement("button");
      item.type = "button";
      item.style.cssText = `
        display: block;
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        padding: 8px 12px;
        font-size: 12px;
        cursor: pointer;
      `;
      const isLastUsed = repo.name === settings.lastUsedRepo;
      item.textContent = `${formatRepoLabel(repo)}${isLastUsed ? " ✓" : ""}`;
      item.addEventListener("mouseenter", () => {
        item.style.background = "var(--palette-black-alpha-6, rgba(0, 0, 0, 0.06))";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "transparent";
      });
      item.onclick = async (event) => {
        event.stopPropagation();
        hideMenu();
        await openPullRequest(info, repo);
        await refreshSelectedRepo();
      };
      menu.appendChild(item);
    }
  };

  const showMenu = (settings) => {
    hideTooltip();
    renderMenu(settings);
    document.body.appendChild(menu);
    menu.style.display = "block";
    positionOverlay(wrapper, menu, "right");
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
  };

  const refreshSelectedRepo = async () => {
    const settings = await getSettings();
    const repo = resolveRepository(settings, settings.lastUsedRepo);
    const label = repo ? formatRepoLabel(repo) : "";
    createBtn.setAttribute("aria-label", label ? `Create PR to ${label}` : "Create PR");
    tooltip.textContent = label;
    return repo;
  };

  const showTooltip = async () => {
    if (isMenuOpen() || createBtn.disabled) return;
    const repo = await refreshSelectedRepo();
    if (!repo || !createBtn.matches(":hover") || isMenuOpen()) return;
    document.body.appendChild(tooltip);
    tooltip.style.display = "block";
    positionOverlay(createBtn, tooltip, "left");
  };

  createBtn.onclick = async (event) => {
    event.stopPropagation();
    hideMenu();
    hideTooltip();
    const settings = await getSettings();
    const repo = resolveRepository(settings, settings.lastUsedRepo);
    if (!repo) return;
    await openPullRequest(info, repo);
    await refreshSelectedRepo();
  };

  createBtn.addEventListener("mouseenter", showTooltip);
  createBtn.addEventListener("mouseleave", hideTooltip);

  chevronBtn.onclick = async (event) => {
    event.stopPropagation();
    hideTooltip();
    const settings = await getSettings();
    if (isMenuOpen()) {
      hideMenu();
      return;
    }
    showMenu(settings);
  };

  getSettings().then(async (settings) => {
    setEnabled((settings.repositories || []).length > 0);
    await refreshSelectedRepo();
  });

  wrapper.appendChild(createBtn);
  wrapper.appendChild(chevronBtn);
  return wrapper;
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
  removePrOverlays();

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
    overflow: visible;
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

