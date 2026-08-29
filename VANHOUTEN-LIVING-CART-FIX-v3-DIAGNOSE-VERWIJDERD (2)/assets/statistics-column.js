class StatisticsColumn {
  constructor(container) {
    this.container = container;
    this.statisticItems = container.querySelectorAll(".statistic-item");
    this.init();
  }
  init() {
    this.setupObserver();
  }
  setupObserver() {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.animateStatistics();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
      );
      observer.observe(this.container);
    }
  }
  animateStatistics() {
    this.statisticItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add("animate-in");
      }, index * 100);
    });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const statisticsColumns = document.querySelectorAll(".statistics-column-section");
  statisticsColumns.forEach((section) => {
    new StatisticsColumn(section);
  });
});
document.addEventListener("shopify:section:load", (event) => {
  if (event.target.classList.contains("statistics-column-section")) {
    new StatisticsColumn(event.target);
  }
});
