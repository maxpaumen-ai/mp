(function () {
  document.addEventListener("DOMContentLoaded", function () {
    function animateStatCircles() {
      const circles = document.querySelectorAll(".statistic-circle");
      circles.forEach((circle) => {
        const percentage = parseInt(circle.getAttribute("data-percentage"));
        const circumference = 2 * Math.PI * 50;
        const progressCircle = circle.querySelector(".circle-progress");
        const offset = circumference - (percentage / 100) * circumference;
        setTimeout(() => {
          progressCircle.style.strokeDasharray = circumference;
          progressCircle.style.strokeDashoffset = offset;
        }, 100);
      });
    }
    animateStatCircles();
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateStatCircles();
            }
          });
        },
        { threshold: 0.1 },
      );
      document.querySelectorAll(".statistics-section").forEach((section) => {
        observer.observe(section);
      });
    }
  });
})();
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    function animateStatCircles() {
      const circles = document.querySelectorAll(".statistic-circle");
      circles.forEach((circle) => {
        const percentage = parseInt(circle.getAttribute("data-percentage"));
        const circumference = 2 * Math.PI * 50;
        const progressCircle = circle.querySelector(".circle-progress");
        const offset = circumference - (percentage / 100) * circumference;
        setTimeout(() => {
          progressCircle.style.strokeDasharray = circumference;
          progressCircle.style.strokeDashoffset = offset;
        }, 100);
      });
    }
    animateStatCircles();
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateStatCircles();
            }
          });
        },
        { threshold: 0.1 },
      );
      document.querySelectorAll(".statistics-section").forEach((section) => {
        observer.observe(section);
      });
    }
  });
})();
