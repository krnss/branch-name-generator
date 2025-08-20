export function getBranchPrefix(type) {
  switch (type.toLowerCase()) {
    case "epic": return "epic";
    case "feature": return "feat";
    case "suggestion": return "suggestion";
    case "bug": return "fix";
    case "product": return "item";
    case "task": return "task";
    default: return "misc";
  }
}

export function kebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

import { getBranchNameStructure } from './settings-utils.js';

export function createBranchName({ type, id, title }) {
  const prefix = getBranchPrefix(type);
  const slug = kebabCase(title);
  
  const structure = getBranchNameStructure();
  return structure
    .replace(/\$\{prefix\}/g, prefix)
    .replace(/\$\{id\}/g, id)
    .replace(/\$\{slug\}/g, slug);
}

export function createDefaultCommitMessage({ type, id, title }) {
  const typePrefix = getBranchPrefix(type);
  const slug = kebabCase(title).replace(/-/g, " ");
  const header = `${typePrefix}: ${slug}`;
  const footer = `${typePrefix === 'fix' ? 'Fixes' : 'Implements'}: #${id}`;
  return `${header}\n\n${footer}`;
}
