(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");

  if (menuButton && navigation) {
    const closeMenu = () => {
      navigation.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    };

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      navigation.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("menu-open", !isOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const formatRupees = (value) => "₹" + Math.round(value).toLocaleString("en-IN");
  const calculator = document.querySelector("#roi-calculator");

  if (calculator) {
    const fields = {
      active: document.querySelector("#active-members"),
      fee: document.querySelector("#membership-fee"),
      expiry: document.querySelector("#expiry-rate"),
      renewal: document.querySelector("#renewal-rate"),
    };
    const outputs = {
      potential: document.querySelector("#potential-value"),
      current: document.querySelector("#current-value"),
      additional: document.querySelector("#five-renewals-value"),
    };

    const getValue = (field) => Math.max(0, Number.parseFloat(field.value) || 0);
    const updateCalculator = () => {
      const activeMembers = getValue(fields.active);
      const membershipFee = getValue(fields.fee);
      const expiryRate = Math.min(100, getValue(fields.expiry));
      const renewalRate = Math.min(100, getValue(fields.renewal));
      const potentialValue = activeMembers * (expiryRate / 100) * membershipFee;
      const currentValue = potentialValue * (renewalRate / 100);
      const fiveRenewalsValue = Math.min(5, activeMembers * (expiryRate / 100)) * membershipFee;

      outputs.potential.textContent = formatRupees(potentialValue);
      outputs.current.textContent = formatRupees(currentValue);
      outputs.additional.textContent = formatRupees(fiveRenewalsValue);
    };

    calculator.addEventListener("input", updateCalculator);
    updateCalculator();
  }

  const countElement = document.querySelector("[data-count]");
  if (countElement && !reducedMotion) {
    const target = Number(countElement.dataset.count);
    const animateCount = () => {
      const duration = 650;
      const startTime = performance.now();
      const update = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        countElement.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))).toLocaleString("en-IN");
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };

    const metricObserver = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      animateCount();
      observer.disconnect();
    }, { threshold: 0.8 });
    metricObserver.observe(countElement);
  }
})();
