export function extractTaskInfoFromDOM() {
  const title = document.querySelector('input[aria-label="Title field"]')?.value?.trim() || "untitled-task";
  const typeLink = document.querySelector('.work-item-form-header a');
  const typeText = typeLink?.textContent?.trim().toLowerCase() || "task";
  const idMatch = typeText.match(/(\d+)/);
  const id = idMatch ? idMatch[1] : "0000";

  let type = "task";
  if (typeText.includes("bug")) type = "bug";
  else if (typeText.includes("feature")) type = "feature";
  else if (typeText.includes("epic")) type = "epic";
  else if (typeText.includes("suggestion")) type = "suggestion";
  else if (typeText.includes("product")) type = "product";

  return { type, id, title };
}
