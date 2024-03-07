export const explainExternalLinks = () => {
  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const ariaLabel = link.getAttribute("aria-label");
    if (!ariaLabel) {
      link.setAttribute("aria-label", link.textContent + " (nouvelle fenêtre)");
    }
  });
};
