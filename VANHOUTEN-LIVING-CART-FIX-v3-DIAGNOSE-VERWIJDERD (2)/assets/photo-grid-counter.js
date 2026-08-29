document.addEventListener("DOMContentLoaded", () => {
  const counters = document.querySelectorAll(".photo-grid-social-counter");
  counters.forEach((counter) => {
    if (counter) {
      const finalValue = parseFloat(counter.textContent);
      let currentValue = 0;
      const duration = 2000;
      const framesPerSecond = 60;
      const totalFrames = (duration / 1000) * framesPerSecond;
      const increment = finalValue / totalFrames;
      const animation = setInterval(() => {
        currentValue += increment;
        if (currentValue >= finalValue) {
          currentValue = finalValue;
          clearInterval(animation);
        }
        counter.textContent = Math.round(currentValue);
      }, 1000 / framesPerSecond);
    }
  });
});
