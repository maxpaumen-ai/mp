document.addEventListener("DOMContentLoaded", function () {
  const comparisonSections = document.querySelectorAll(".comparison-section");
  comparisonSections.forEach((section) => {
    if (!section) return;
    const highlightedHeaders = section.querySelectorAll(".product-header.highlighted");
    highlightedHeaders.forEach((header) => {
      const columnIndex = header.getAttribute("data-column");
      if (!columnIndex) return;
      const columnCells = section.querySelectorAll(`.value-cell[data-column="${columnIndex}"]`);
      columnCells.forEach((cell) => {
        cell.classList.add("highlighted");
      });
    });
  });
});
