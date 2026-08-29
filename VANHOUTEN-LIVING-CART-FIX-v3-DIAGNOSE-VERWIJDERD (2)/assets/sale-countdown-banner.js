class SaleCountdown {
  constructor(options) {
    this.selectors = {
      days: "#sale-countdown-days",
      hours: "#sale-countdown-hours",
      minutes: "#sale-countdown-minutes",
      seconds: "#sale-countdown-seconds",
      daysLabel: "#days-label",
      hoursLabel: "#hours-label",
      minutesLabel: "#minutes-label",
      secondsLabel: "#seconds-label",
    };
    this.options = options || {};
    this.isInThemeEditor =
      Shopify.designMode || (window.Shopify && window.Shopify.theme && window.Shopify.theme.role === "unpublished");
    this.init();
  }
  init() {
    this.daysElement = document.querySelector(this.selectors.days);
    this.hoursElement = document.querySelector(this.selectors.hours);
    this.minutesElement = document.querySelector(this.selectors.minutes);
    this.secondsElement = document.querySelector(this.selectors.seconds);
    this.initLabels();
    this.updateCountdown();
    setInterval(() => this.updateCountdown(), 1000);
  }
  initLabels() {
    const showDays = this.options.showDays;
    if (showDays) {
      const daysLabelElement = document.querySelector(this.selectors.daysLabel);
      if (!daysLabelElement) return;
      if (this.isInThemeEditor) {
        daysLabelElement.textContent = this.options.daysLabel;
        localStorage.setItem("countdown_days_label", this.options.daysLabel);
      } else {
        daysLabelElement.textContent = localStorage.getItem("countdown_days_label") || this.options.daysLabel;
        if (!localStorage.getItem("countdown_days_label")) {
          localStorage.setItem("countdown_days_label", this.options.daysLabel);
        }
      }
      if (!this.isInThemeEditor) {
        const observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.type === "childList" || mutation.type == "characterData") {
              localStorage.setItem("countdown_days_label", this.textContent);
            }
          });
        });
        observer.observe(daysLabelElement, { childList: !0, subtree: !0, characterData: !0 });
      }
    }
    const labels = [
      {
        selector: this.selectors.hoursLabel,
        storageKey: "countdown_hours_label",
        defaultValue: this.options.hoursLabel,
      },
      {
        selector: this.selectors.minutesLabel,
        storageKey: "countdown_minutes_label",
        defaultValue: this.options.minutesLabel,
      },
      {
        selector: this.selectors.secondsLabel,
        storageKey: "countdown_seconds_label",
        defaultValue: this.options.secondsLabel,
      },
    ];
    labels.forEach((label) => {
      const element = document.querySelector(label.selector);
      if (!element) return;
      if (this.isInThemeEditor) {
        element.textContent = label.defaultValue;
        localStorage.setItem(label.storageKey, label.defaultValue);
      } else {
        element.textContent = localStorage.getItem(label.storageKey) || label.defaultValue;
        if (!localStorage.getItem(label.storageKey)) {
          localStorage.setItem(label.storageKey, label.defaultValue);
        }
      }
      if (!this.isInThemeEditor) {
        const observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.type === "childList" || mutation.type == "characterData") {
              localStorage.setItem(label.storageKey, this.textContent);
            }
          });
        });
        observer.observe(element, { childList: !0, subtree: !0, characterData: !0 });
      }
    });
  }
  updateCountdown() {
    let timeDifference;
    if (this.options.customEndTime) {
      const endDate = new Date(
        this.options.endYear,
        this.options.endMonth - 1,
        this.options.endDay,
        this.options.endHour,
        this.options.endMinute,
        0,
      );
      const now = new Date();
      timeDifference = endDate - now;
      if (timeDifference <= 0) {
        this.setZeroValues();
        return;
      }
    } else {
      const now = new Date();
      const estMidnight = new Date();
      const isDST = function () {
        const jan = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
        const jul = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
        return Math.max(jan, jul) !== now.getTimezoneOffset();
      };
      estMidnight.setUTCHours(isDST() ? 4 : 5, 0, 0, 0);
      estMidnight.setUTCDate(estMidnight.getUTCDate() + 1);
      timeDifference = estMidnight - now;
      if (timeDifference <= 0) {
        estMidnight.setUTCDate(estMidnight.getUTCDate() + 1);
        timeDifference = estMidnight - now;
      }
    }
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
    this.displayTimeValues(days, hours, minutes, seconds);
  }
  setZeroValues() {
    if (this.options.showDays && this.daysElement) {
      this.daysElement.textContent = this.options.zeroValue;
    }
    if (this.hoursElement) this.hoursElement.textContent = this.options.zeroValue;
    if (this.minutesElement) this.minutesElement.textContent = this.options.zeroValue;
    if (this.secondsElement) this.secondsElement.textContent = this.options.zeroValue;
  }
  displayTimeValues(days, hours, minutes, seconds) {
    const formatDigits = (num) => {
      return num < 10 ? this.options.timeFormatSingleDigit + num : num.toString();
    };
    if (this.options.showDays && this.daysElement) {
      this.daysElement.textContent = formatDigits(days);
    }
    if (this.hoursElement) this.hoursElement.textContent = formatDigits(hours);
    if (this.minutesElement) this.minutesElement.textContent = formatDigits(minutes);
    if (this.secondsElement) this.secondsElement.textContent = formatDigits(seconds);
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const countdownOptions = window.saleCountdownOptions || {};
  new SaleCountdown(countdownOptions);
});
