/* ============================================
   RENEWAL DESK — Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // --- Header scroll effect ---
  const header = document.getElementById('site-header');
  let lastScroll = 0;

  const onScroll = () => {
    const scrollY = window.scrollY;
    if (scrollY > 40) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    lastScroll = scrollY;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Mobile nav toggle ---
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileClose = document.getElementById('mobile-nav-close');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });

    const closeMobile = () => {
      mobileNav.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    if (mobileClose) {
      mobileClose.addEventListener('click', closeMobile);
    }

    // Close on nav link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobile);
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Close all
      faqItems.forEach(other => other.classList.remove('is-open'));

      // Toggle current
      if (!isOpen) {
        item.classList.add('is-open');
      }
    });
  });

  // --- Scroll reveal (IntersectionObserver) ---
  const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback: just show everything
    revealElements.forEach(el => el.classList.add('is-visible'));
  }

  // --- Typing animation for WhatsApp mockup ---
  const typingDots = document.getElementById('wa-typing');
  if (typingDots) {
    let dotCount = 0;
    setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      typingDots.textContent = '.'.repeat(dotCount);
    }, 500);
  }
});
