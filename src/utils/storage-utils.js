export function storeBranchName(id, name) {
  const data = {
    branch: name,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(`branchName-${id}`, JSON.stringify(data));
}

export function loadBranchName(id) {
  try {
    return JSON.parse(localStorage.getItem(`branchName-${id}`));
  } catch {
    return null;
  }
}
