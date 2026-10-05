/**
 * DIVINE MANDATE BIBLE INSTITUTE (DIMABIN)
 * Master Client Script — Pure Vanilla JavaScript (Zero Framework Dependencies)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Header Sticky / Scrolled State Handler
  const header = document.querySelector('.site-header');

  const updateHeaderScroll = () => {
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  };

  window.addEventListener('scroll', updateHeaderScroll, { passive: true });
  updateHeaderScroll(); // Run immediately on load

  // 2. Mobile Navigation Drawer Controls
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileOverlay = document.getElementById('mobile-drawer-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link, .mobile-portal-item');

  const openMobileMenu = () => {
    if (mobileDrawer && mobileOverlay) {
      mobileDrawer.classList.add('active');
      mobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'true');
    }
  };

  const closeMobileMenu = () => {
    if (mobileDrawer && mobileOverlay) {
      mobileDrawer.classList.remove('active');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
  };

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openMobileMenu);
  }

  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeMobileMenu);
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMobileMenu);
  }

  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closePortalDropdown();
    }
  });

  // 3. Desktop Portals Dropdown
  const portalToggleBtn = document.getElementById('portal-toggle-btn');
  const portalMenu = document.getElementById('portal-menu');

  const togglePortalDropdown = (e) => {
    e.stopPropagation();
    if (!portalMenu) return;
    const isShowing = portalMenu.classList.contains('show');
    if (isShowing) {
      closePortalDropdown();
    } else {
      portalMenu.classList.add('show');
      if (portalToggleBtn) portalToggleBtn.setAttribute('aria-expanded', 'true');
    }
  };

  const closePortalDropdown = () => {
    if (portalMenu) {
      portalMenu.classList.remove('show');
      if (portalToggleBtn) portalToggleBtn.setAttribute('aria-expanded', 'false');
    }
  };

  if (portalToggleBtn) {
    portalToggleBtn.addEventListener('click', togglePortalDropdown);
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (portalMenu && !portalMenu.contains(e.target) && e.target !== portalToggleBtn) {
      closePortalDropdown();
    }
  });

  // 4. Quick Admissions Inquiry Form Toggle
  const openInquiryBtn = document.getElementById('open-inquiry-btn');
  const closeInquiryBtn = document.getElementById('close-inquiry-btn');
  const inquiryBox = document.getElementById('admission-inquiry-box');
  const inquiryForm = document.getElementById('admission-inquiry-form');
  const inquirySuccess = document.getElementById('inquiry-success-msg');
  const resetInquiryBtn = document.getElementById('reset-inquiry-btn');

  if (openInquiryBtn && inquiryBox) {
    openInquiryBtn.addEventListener('click', () => {
      inquiryBox.classList.toggle('show');
      if (inquiryBox.classList.contains('show')) {
        inquiryBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (closeInquiryBtn && inquiryBox) {
    closeInquiryBtn.addEventListener('click', () => {
      inquiryBox.classList.remove('show');
    });
  }

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (inquirySuccess) {
        inquiryForm.style.display = 'none';
        inquirySuccess.style.display = 'block';
      }
    });
  }

  if (resetInquiryBtn && inquiryForm && inquirySuccess) {
    resetInquiryBtn.addEventListener('click', () => {
      inquiryForm.reset();
      inquiryForm.style.display = 'block';
      inquirySuccess.style.display = 'none';
      if (inquiryBox) inquiryBox.classList.remove('show');
    });
  }

  // 5. Smooth Scroll for internal hash links with header offset
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetElem = document.querySelector(targetId);
      if (targetElem) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 70;
        const targetPosition = targetElem.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
});
