interface SearchEntry {
  title: string;
  text: string;
  href: string;
  kind: string;
}
let searchIndex: Promise<SearchEntry[]> | undefined;

function elements() {
  return {
    dialog: document.querySelector<HTMLDialogElement>(
      "[data-docs-command-dialog]",
    ),
    input: document.querySelector<HTMLInputElement>(
      "[data-docs-command-filter]",
    ),
    status: document.querySelector<HTMLElement>("[data-docs-search-status]"),
    results: document.querySelector<HTMLElement>("[data-docs-search-results]"),
  };
}

async function filterSearch() {
  const { dialog, input, status, results } = elements();
  if (!dialog || !input || !status || !results) return;
  const query = input.value.trim().toLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  status.textContent = "Loading search…";
  try {
    searchIndex ??= fetch(dialog.dataset.searchUrl!).then((response) => {
      if (!response.ok) throw new Error("Search index unavailable");
      return response.json();
    });
    const index = await searchIndex;
    if (!dialog.isConnected || input.value.trim().toLowerCase() !== query)
      return;
    const matches = index
      .filter((entry) => {
        const haystack = `${entry.title} ${entry.text}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
      })
      .sort((a, b) => {
        const component = query.match(/^\.pl-c-([a-z0-9-]+)(?:__|$)/)?.[1];
        const rank = (entry: SearchEntry) => {
          if (
            entry.title.toLowerCase() === query ||
            (component && entry.href.endsWith(`/components/${component}`))
          )
            return 0;
          if (component && entry.href.includes(`/components/${component}#`))
            return 1;
          return words.every((word) => entry.title.toLowerCase().includes(word))
            ? 1
            : 2;
        };
        return rank(a) - rank(b) || a.title.localeCompare(b.title);
      });
    results.replaceChildren();
    for (const entry of matches.slice(0, 30)) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = entry.href;
      link.setAttribute("aria-label", entry.title);
      link.dataset.docsCommandLink = "";
      const title = document.createElement("span");
      title.textContent = entry.title;
      const detail = document.createElement("small");
      detail.id = `docs-search-detail-${results.childElementCount}`;
      link.setAttribute("aria-describedby", detail.id);
      detail.textContent = entry.title.includes(" — ")
        ? `${entry.kind} section`
        : entry.text.replace(/<[^>]+>|[`#*]/g, "").slice(0, 140);
      link.append(title, detail);
      link.addEventListener("click", () => dialog.close());
      item.append(link);
      results.append(item);
    }
    status.textContent =
      matches.length === 0
        ? "No docs pages match that search."
        : `${matches.length} results${matches.length > 30 ? "; showing the first 30" : ""}`;
  } catch {
    searchIndex = undefined;
    status.textContent =
      "Search could not load. Use Browse docs to find a page.";
  }
}

function openSearch() {
  const { dialog, input } = elements();
  if (!dialog || !input) return;
  if (!dialog.open) dialog.showModal();
  input.value = "";
  input.focus();
  void filterSearch();
}

function bindDocs() {
  document
    .querySelectorAll<HTMLElement>("[data-docs-command-open]")
    .forEach((button) => {
      if (button.dataset.searchBound) return;
      button.dataset.searchBound = "true";
      button.addEventListener("click", openSearch);
    });
  const { dialog, input } = elements();
  if (dialog && !dialog.dataset.searchBound) {
    dialog.dataset.searchBound = "true";
    dialog
      .querySelector("[data-docs-command-close]")
      ?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    });
    input?.addEventListener("input", () => void filterSearch());
  }
  for (const table of document.querySelectorAll<HTMLTableElement>(
    ".prose table",
  )) {
    if (table.scrollWidth > table.clientWidth) {
      table.tabIndex = 0;
      table.setAttribute(
        "aria-label",
        table.caption?.textContent?.trim() || "Scrollable table",
      );
    } else {
      table.removeAttribute("tabindex");
      table.removeAttribute("aria-label");
    }
  }
}

bindDocs();
document.addEventListener("astro:page-load", bindDocs);
window.addEventListener("resize", bindDocs);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements().dialog?.open) {
    event.preventDefault();
    elements().dialog?.close();
    return;
  }
  if (
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === "k" &&
    elements().dialog
  ) {
    event.preventDefault();
    openSearch();
  }
});
