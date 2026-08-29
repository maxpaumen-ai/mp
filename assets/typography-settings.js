document.addEventListener("DOMContentLoaded", function () {
  applyTypographySettings();
  applyColorSettings();
});
function applyTypographySettings() {
  let headingFont = document.documentElement.style.getPropertyValue("--font-heading-family") || "'Inter', sans-serif";
  let bodyFont = document.documentElement.style.getPropertyValue("--font-body-family") || "'Inter', sans-serif";
  headingFont = cleanFontFamily(headingFont);
  bodyFont = cleanFontFamily(bodyFont);
  const headingScale = parseInt(document.documentElement.getAttribute("data-heading-scale") || 100) / 100;
  const bodyScale = parseInt(document.documentElement.getAttribute("data-body-scale") || 100) / 100;
  const headingLetterSpacing = document.documentElement.getAttribute("data-heading-letter-spacing") || "-0.3";
  const bodyLetterSpacing = document.documentElement.getAttribute("data-body-letter-spacing") || "-0.3";
  const buttonTextCase = document.documentElement.getAttribute("data-button-text-case") || "uppercase";
  const fontWeightRegular = document.documentElement.getAttribute("data-font-weight-regular") || "400";
  const fontWeightSemibold = document.documentElement.getAttribute("data-font-weight-semibold") || "600";
  const fontWeightBold = document.documentElement.getAttribute("data-font-weight-bold") || "700";
  document.documentElement.style.setProperty("--font-body", bodyFont);
  document.documentElement.style.setProperty("--font-heading", headingFont);
  const headingLetterSpacingValue = `${headingLetterSpacing}px`;
  const bodyLetterSpacingValue = `${bodyLetterSpacing}px`;
  document.documentElement.style.setProperty("--letter-spacing-heading", headingLetterSpacingValue);
  document.documentElement.style.setProperty("--letter-spacing-body", bodyLetterSpacingValue);
  document.documentElement.style.setProperty("--font-weight-regular", fontWeightRegular);
  document.documentElement.style.setProperty("--font-weight-semibold", fontWeightSemibold);
  document.documentElement.style.setProperty("--font-weight-bold", fontWeightBold);
  const fontSizeBases = {
    h1: { min: 32, max: 48 },
    h2: { min: 28, max: 40 },
    h3: { min: 24, max: 32 },
    h4: { min: 20, max: 24 },
    h5: { min: 18, max: 20 },
    h6: { min: 16, max: 18 },
    bodyLarge: { min: 18, max: 20 },
    body: { min: 16, max: 16 },
    bodySmall: { min: 14, max: 14 },
    caption: { min: 12, max: 12 },
  };
  Object.keys(fontSizeBases).forEach((key) => {
    if (key.startsWith("h")) {
      const base = fontSizeBases[key];
      const minSize = Math.round(base.min * headingScale);
      const maxSize = Math.round(base.max * headingScale);
      document.documentElement.style.setProperty(`--min-font-size-${key}`, `${minSize}px`);
      document.documentElement.style.setProperty(`--max-font-size-${key}`, `${maxSize}px`);
      document.documentElement.style.setProperty(
        `--font-size-${key}`,
        `calc(${minSize}px + (${maxSize} - ${minSize}) * ((100vw - 375px) / (1440 - 375)))`,
      );
    }
  });
  ["bodyLarge", "body", "bodySmall", "caption"].forEach((key) => {
    const base = fontSizeBases[key];
    const minSize = Math.round(base.min * bodyScale);
    const maxSize = Math.round(base.max * bodyScale);
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    document.documentElement.style.setProperty(`--font-size-${cssKey}`, `${minSize}px`);
  });
  document.documentElement.style.setProperty("--button-text-transform", buttonTextCase);
  document.body.classList.add("typography-settings-applied");
  applyFontWeightOverrides();
}
function cleanFontFamily(fontFamily) {
  return fontFamily.replace(/_n\d+/g, "");
}
function applyFontWeightOverrides() {
  const existingStyle = document.getElementById("font-weight-overrides");
  if (existingStyle) {
    existingStyle.remove();
  }
  const style = document.createElement("style");
  style.id = "font-weight-overrides";
  style.textContent = `
    /* Regular weight elements */
    body, p, div, input, textarea, select {
      font-weight: var(--font-weight-regular) !important;
    }
    
    /* Semi-bold elements */
    h3, h4, h5, h6, th, .semi-bold {
      font-weight: var(--font-weight-semibold) !important;
    }
    
    /* Bold elements */
    h1, h2, strong, b, .bold, .heading, .btn--primary, .btn--secondary {
      font-weight: var(--font-weight-bold) !important;
    }
  `;
  document.head.appendChild(style);
}
function applyColorSettings() {
  const textColor = document.documentElement.getAttribute("data-global-text-color") || "#000000";
  const mainAccent = document.documentElement.getAttribute("data-global-main-accent") || "#ef4a65";
  const lightAccent = document.documentElement.getAttribute("data-global-light-accent") || "#ffeaee";
  document.documentElement.style.setProperty("--color-text", textColor);
  document.documentElement.style.setProperty("--color-main-accent", mainAccent);
  document.documentElement.style.setProperty("--color-light-accent", lightAccent);
  document.body.classList.add("global-colors-applied");
}
function updateTypographySetting(settingName, value) {
  document.documentElement.setAttribute(`data-${settingName}`, value);
  applyTypographySettings();
}
function updateColorSetting(settingName, value) {
  document.documentElement.setAttribute(`data-${settingName}`, value);
  applyColorSettings();
}
