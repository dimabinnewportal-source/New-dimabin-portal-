/**
 * DIVINE MANDATE BIBLE INSTITUTE (DIMABIN)
 * Master Client Script — Pure Vanilla JavaScript (Zero Framework Dependencies)
 */

import './firebase-test.js';

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

  // 2. Mobile Navigation Drawer Controls & Hamburger Morph
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileOverlay = document.getElementById('mobile-drawer-overlay');

  const openMobileMenu = () => {
    if (mobileDrawer && mobileOverlay) {
      mobileDrawer.classList.add('active');
      mobileOverlay.classList.add('active');
      document.body.classList.add('drawer-open');
      if (hamburgerBtn) {
        hamburgerBtn.classList.add('is-active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
      }
    }
  };

  const closeMobileMenu = () => {
    if (mobileDrawer && mobileOverlay) {
      mobileDrawer.classList.remove('active');
      mobileOverlay.classList.remove('active');
      document.body.classList.remove('drawer-open');
      if (hamburgerBtn) {
        hamburgerBtn.classList.remove('is-active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    }
  };

  const toggleMobileMenu = () => {
    if (mobileDrawer && mobileDrawer.classList.contains('active')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', toggleMobileMenu);
  }

  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeMobileMenu);
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMobileMenu);
  }

  // Close mobile drawer when a standard navigation link or action is clicked
  const mobileLinks = document.querySelectorAll(
    '.mobile-nav-link:not(.mobile-portal-toggle), .mobile-sublink, .mobile-drawer-apply-btn'
  );
  mobileLinks.forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  // 3. Mobile Portal Accordion / Expandable Dropdown
  const mobilePortalToggle = document.getElementById('mobile-portal-toggle');
  const mobilePortalDropdown = document.getElementById('mobile-portal-dropdown');

  if (mobilePortalToggle && mobilePortalDropdown) {
    mobilePortalToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = mobilePortalDropdown.classList.toggle('is-open');
      mobilePortalToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // 4. Desktop Portals Dropdown
  const desktopPortalToggle = document.getElementById('desktop-portal-toggle');
  const desktopPortalWrapper = document.getElementById('desktop-portal-wrapper');

  const toggleDesktopPortal = (e) => {
    e.stopPropagation();
    if (!desktopPortalWrapper) return;
    const isOpen = desktopPortalWrapper.classList.toggle('is-open');
    if (desktopPortalToggle) {
      desktopPortalToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  };

  const closeDesktopPortal = () => {
    if (desktopPortalWrapper) {
      desktopPortalWrapper.classList.remove('is-open');
      if (desktopPortalToggle) desktopPortalToggle.setAttribute('aria-expanded', 'false');
    }
  };

  if (desktopPortalToggle) {
    desktopPortalToggle.addEventListener('click', toggleDesktopPortal);
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (desktopPortalWrapper && !desktopPortalWrapper.contains(e.target)) {
      closeDesktopPortal();
    }
  });

  // Close both mobile drawer and desktop dropdown on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closeDesktopPortal();
    }
  });

  // 5. Automatic Active Page Detection & Highlighting
  const highlightActivePage = () => {
    const rawPath = window.location.pathname.toLowerCase();
    let currentFile = rawPath.substring(rawPath.lastIndexOf('/') + 1);
    if (!currentFile || currentFile === '') {
      currentFile = 'index.html';
    }

    // Clear any existing active states
    document.querySelectorAll('.desktop-nav .nav-link, .mobile-nav-link').forEach((link) => {
      link.classList.remove('active');
    });

    const isMatch = (href) => {
      if (!href) return false;
      const target = href.substring(href.lastIndexOf('/') + 1).split('#')[0].toLowerCase();
      if (currentFile === target) return true;
      if (currentFile === 'index.html' && (target === '' || target === 'index.html')) return true;
      return false;
    };

    // Apply active to desktop links
    document.querySelectorAll('.desktop-nav .nav-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (isMatch(href)) {
        link.classList.add('active');
      }
    });

    // Apply active to mobile links
    document.querySelectorAll('.mobile-drawer .mobile-nav-link:not(.mobile-portal-toggle)').forEach((link) => {
      const href = link.getAttribute('href');
      if (isMatch(href)) {
        link.classList.add('active');
      }
    });
  };

  highlightActivePage();

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

  // 6. Admissions Multi-Step Application Form Controller
  const fullAppForm = document.getElementById('full-admissions-form');
  if (fullAppForm) {
    let currentStep = 1;
    const totalSteps = 5;
    const formErrorPanel = document.getElementById('form-error-panel');
    const formErrorList = document.getElementById('form-error-list');
    const stepConnectorFill = document.getElementById('step-connector-fill');
    const successPane = document.getElementById('admission-success-pane');
    const formCard = document.querySelector('.admissions-form-card');

    const updateStepUI = (step) => {
      // Hide all step panes
      document.querySelectorAll('.form-step-pane').forEach((pane) => {
        pane.classList.remove('active');
      });
      const activePane = document.getElementById(`step-${step}-pane`);
      if (activePane) activePane.classList.add('active');

      // Update indicator tracker
      for (let i = 1; i <= totalSteps; i++) {
        const indicator = document.getElementById(`step-indicator-${i}`);
        const circle = indicator ? indicator.querySelector('.step-circle') : null;
        if (!indicator || !circle) continue;

        if (i < step) {
          indicator.classList.remove('active');
          indicator.classList.add('completed');
          circle.innerHTML = '✓';
        } else if (i === step) {
          indicator.classList.remove('completed');
          indicator.classList.add('active');
          circle.innerHTML = i.toString();
        } else {
          indicator.classList.remove('active', 'completed');
          circle.innerHTML = i.toString();
        }
      }

      // Update fill bar
      if (stepConnectorFill) {
        const progressPercent = ((step - 1) / (totalSteps - 1)) * 84;
        stepConnectorFill.style.width = `${progressPercent}%`;
      }

      // Smooth scroll to top of form card
      if (formCard) {
        const headerHeight = header ? header.offsetHeight : 70;
        const formTop = formCard.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        window.scrollTo({ top: formTop, behavior: 'smooth' });
      }
    };

    const validateStep1 = () => {
      const missing = [];
      const fields = [
        { id: 'app-fullname', name: 'Full Name' },
        { id: 'app-gender', name: 'Gender' },
        { id: 'app-dob', name: 'Date of Birth' },
        { id: 'app-marital', name: 'Marital Status' },
        { id: 'app-nationality', name: 'Nationality' },
        { id: 'app-state', name: 'State of Origin' },
        { id: 'app-lga', name: 'Local Government Area (LGA)' },
        { id: 'app-address', name: 'Residential Address' },
        { id: 'app-phone', name: 'Phone Number' },
        { id: 'app-whatsapp', name: 'WhatsApp Number' },
        { id: 'app-email', name: 'Email Address' },
      ];

      fields.forEach((field) => {
        const el = document.getElementById(field.id);
        if (!el || !el.value.trim() || el.value === 'default' || el.value === '') {
          missing.push(field.name);
          if (el) el.classList.add('input-error');
        } else {
          if (el) el.classList.remove('input-error');
        }
      });

      return missing;
    };

    // Remove input error state on typing or changing
    fullAppForm.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('input', () => el.classList.remove('input-error'));
      el.addEventListener('change', () => el.classList.remove('input-error'));
    });

    // Step 1 Next Button
    const step1Next = document.getElementById('step-1-next');
    if (step1Next) {
      step1Next.addEventListener('click', () => {
        const missing = validateStep1();
        if (missing.length > 0) {
          if (formErrorList) {
            formErrorList.innerHTML = missing.map((item) => `<li>${item}</li>`).join('');
          }
          if (formErrorPanel) formErrorPanel.classList.add('show');
          return;
        }
        if (formErrorPanel) formErrorPanel.classList.remove('show');
        currentStep = 2;
        updateStepUI(currentStep);
      });
    }

    // Step 2 Next & Back
    const step2Back = document.getElementById('step-2-back');
    const step2Next = document.getElementById('step-2-next');
    if (step2Back) {
      step2Back.addEventListener('click', () => {
        currentStep = 1;
        updateStepUI(currentStep);
      });
    }
    if (step2Next) {
      step2Next.addEventListener('click', () => {
        currentStep = 3;
        updateStepUI(currentStep);
      });
    }

    // Step 3 Next & Back
    const step3Back = document.getElementById('step-3-back');
    const step3Next = document.getElementById('step-3-next');
    if (step3Back) {
      step3Back.addEventListener('click', () => {
        currentStep = 2;
        updateStepUI(currentStep);
      });
    }
    if (step3Next) {
      step3Next.addEventListener('click', () => {
        currentStep = 4;
        updateStepUI(currentStep);
      });
    }

    // Step 4 Next & Back
    const step4Back = document.getElementById('step-4-back');
    const step4Next = document.getElementById('step-4-next');
    if (step4Back) {
      step4Back.addEventListener('click', () => {
        currentStep = 3;
        updateStepUI(currentStep);
      });
    }
    if (step4Next) {
      step4Next.addEventListener('click', () => {
        currentStep = 5;
        updateStepUI(currentStep);
      });
    }

    // Step 5 Back & Submit
    const step5Back = document.getElementById('step-5-back');
    if (step5Back) {
      step5Back.addEventListener('click', () => {
        currentStep = 4;
        updateStepUI(currentStep);
      });
    }

    fullAppForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const decCheckbox = document.getElementById('declaration-checkbox');
      if (decCheckbox && !decCheckbox.checked) {
        if (formErrorList) {
          formErrorList.innerHTML = '<li>You must accept and agree to the Declaration statement to complete your application.</li>';
        }
        if (formErrorPanel) formErrorPanel.classList.add('show');
        return;
      }
      if (formErrorPanel) formErrorPanel.classList.remove('show');

      // Collect candidate summary details
      const candidateName = document.getElementById('app-fullname')?.value || 'Candidate';
      const candidateEmail = document.getElementById('app-email')?.value || 'N/A';
      const candidatePhone = document.getElementById('app-phone')?.value || 'N/A';
      const candidateProgram = document.getElementById('app-intended-program')?.value || 'Diploma in Theology';

      const sumName = document.getElementById('summary-candidate-name');
      const sumEmail = document.getElementById('summary-candidate-email');
      const sumPhone = document.getElementById('summary-candidate-phone');
      const sumProgram = document.getElementById('summary-candidate-program');

      if (sumName) sumName.textContent = candidateName;
      if (sumEmail) sumEmail.textContent = candidateEmail;
      if (sumPhone) sumPhone.textContent = candidatePhone;
      if (sumProgram) sumProgram.textContent = candidateProgram;

      // Hide form steps and show success pane
      document.querySelectorAll('.form-step-pane').forEach((pane) => pane.classList.remove('active'));
      const tracker = document.querySelector('.step-progress-tracker');
      const intro = document.querySelector('.form-intro-header');
      if (tracker) tracker.style.display = 'none';
      if (intro) intro.style.display = 'none';
      if (successPane) successPane.classList.add('active');

      // Architectural hook for future Firebase / Firestore registry submission
      window.submitAdmissionToRegistry = function(formData) {
        console.log('[DIMABIN Registry Service Ready]: Candidate data compiled for future Firebase transmission.', formData);
      };
      window.submitAdmissionToRegistry({
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
        program: candidateProgram,
        timestamp: new Date().toISOString()
      });
    });

    // Reset button
    const restartBtn = document.getElementById('restart-application-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        fullAppForm.reset();
        currentStep = 1;
        const tracker = document.querySelector('.step-progress-tracker');
        const intro = document.querySelector('.form-intro-header');
        if (tracker) tracker.style.display = 'flex';
        if (intro) intro.style.display = 'block';
        if (successPane) successPane.classList.remove('active');
        updateStepUI(currentStep);
      });
    }
  }

  // 7. Contact Us Form Validation & Controller
  const contactForm = document.getElementById('contact-inquiry-form');
  if (contactForm) {
    const errorBox = document.getElementById('contact-error-box');
    const errorList = document.getElementById('contact-error-list');
    const successPane = document.getElementById('contact-success-pane');
    const resetContactBtn = document.getElementById('contact-reset-btn');

    // Remove red error highlight as user types
    contactForm.querySelectorAll('input, textarea, select').forEach((field) => {
      field.addEventListener('input', () => field.classList.remove('input-error'));
      field.addEventListener('change', () => field.classList.remove('input-error'));
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const phoneInput = document.getElementById('contact-phone');
      const subjectInput = document.getElementById('contact-subject');
      const messageInput = document.getElementById('contact-message');

      const errors = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneDigits = phoneInput ? phoneInput.value.replace(/[^0-9]/g, '') : '';

      if (!nameInput || !nameInput.value.trim()) {
        errors.push('Full Name is required.');
        if (nameInput) nameInput.classList.add('input-error');
      }

      if (!emailInput || !emailInput.value.trim()) {
        errors.push('Email Address is required.');
        if (emailInput) emailInput.classList.add('input-error');
      } else if (!emailRegex.test(emailInput.value.trim())) {
        errors.push('Please provide a valid email address (e.g. name@example.com).');
        emailInput.classList.add('input-error');
      }

      if (!phoneInput || !phoneInput.value.trim()) {
        errors.push('Phone Number is required.');
        if (phoneInput) phoneInput.classList.add('input-error');
      } else if (phoneDigits.length < 7) {
        errors.push('Please provide a valid phone number (at least 7 digits).');
        phoneInput.classList.add('input-error');
      }

      if (!subjectInput || !subjectInput.value.trim()) {
        errors.push('Subject is required.');
        if (subjectInput) subjectInput.classList.add('input-error');
      }

      if (!messageInput || !messageInput.value.trim()) {
        errors.push('Message cannot be empty.');
        if (messageInput) messageInput.classList.add('input-error');
      } else if (messageInput.value.trim().length < 5) {
        errors.push('Message is too short (minimum 5 characters).');
        messageInput.classList.add('input-error');
      }

      if (errors.length > 0) {
        if (errorList) {
          errorList.innerHTML = errors.map((err) => `<li>${err}</li>`).join('');
        }
        if (errorBox) {
          errorBox.classList.add('show');
          errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      // Valid: hide errors
      if (errorBox) errorBox.classList.remove('show');

      // Populate confirmation summary
      const sumName = document.getElementById('contact-sum-name');
      const sumEmail = document.getElementById('contact-sum-email');
      const sumSubject = document.getElementById('contact-sum-subject');

      if (sumName) sumName.textContent = nameInput.value.trim();
      if (sumEmail) sumEmail.textContent = emailInput.value.trim();
      if (sumSubject) sumSubject.textContent = subjectInput.value.trim();

      // Switch to success card
      contactForm.style.display = 'none';
      if (successPane) {
        successPane.classList.add('show');
        successPane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      console.log('[DIMABIN Contact Inquiry Logged]:', {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        subject: subjectInput.value.trim(),
        message: messageInput.value.trim(),
        timestamp: new Date().toISOString()
      });
    });

    if (resetContactBtn) {
      resetContactBtn.addEventListener('click', () => {
        contactForm.reset();
        contactForm.style.display = 'flex';
        if (successPane) successPane.classList.remove('show');
        if (errorBox) errorBox.classList.remove('show');
      });
    }
  }

  // 8. FAQ Accordion Controller
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length > 0) {
    faqItems.forEach((item) => {
      const btn = item.querySelector('.faq-question-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const isOpen = item.classList.contains('is-open');

          // Close all FAQ items (single-open policy)
          faqItems.forEach((other) => {
            other.classList.remove('is-open');
            const otherBtn = other.querySelector('.faq-question-btn');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          });

          // Toggle current
          if (!isOpen) {
            item.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      }
    });
  }

  // 9. Portal Login Forms Controller (Student, Lecturer, Administrator)
  // Password Show / Hide Toggle
  document.querySelectorAll('.password-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const input = this.closest('.portal-input-container')?.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      this.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');

      // Update SVG icon inside toggle button
      this.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
             <line x1="1" y1="1" x2="23" y2="23"></line>
           </svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
             <circle cx="12" cy="12" r="3"></circle>
           </svg>`;
    });
  });

  // Helper to show inline feedback inside portal cards
  const showPortalAlert = (box, type, message) => {
    if (!box) return;
    box.className = `portal-alert-box ${type} show`;
    const icon = type === 'error' ? '⚠️' : 'ℹ️';
    box.innerHTML = `<span class="portal-alert-icon" aria-hidden="true">${icon}</span><span>${message}</span>`;
  };

  // Portal Login Forms: Empty field validation & friendly notification (strictly no auth, no backend)
  document.querySelectorAll('.portal-login-form:not(#admin-login-form)').forEach((form) => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const alertBox = this.querySelector('.portal-alert-box');
      const userInput = this.querySelector('input[name="userId"], input[name="adminId"], input[type="text"]');
      const passInput = this.querySelector('input[name="password"], input[type="password"]');

      if (userInput) userInput.classList.remove('input-error');
      if (passInput) passInput.classList.remove('input-error');

      const userVal = userInput ? userInput.value.trim() : '';
      const passVal = passInput ? passInput.value.trim() : '';

      // Validation 1: Both fields empty
      if (!userVal && !passVal) {
        if (userInput) userInput.classList.add('input-error');
        if (passInput) passInput.classList.add('input-error');
        showPortalAlert(alertBox, 'error', 'Please enter your User ID and password.');
        if (userInput) userInput.focus();
        return;
      }

      // Validation 2: Empty User ID
      if (!userVal) {
        if (userInput) userInput.classList.add('input-error');
        showPortalAlert(alertBox, 'error', 'User ID is required.');
        if (userInput) userInput.focus();
        return;
      }

      // Validation 3: Empty Password
      if (!passVal) {
        if (passInput) passInput.classList.add('input-error');
        showPortalAlert(alertBox, 'error', 'Password is required.');
        if (passInput) passInput.focus();
        return;
      }

      // If fields are provided, display the friendly message:
      // "Login functionality will be available soon."
      showPortalAlert(alertBox, 'info', 'Login functionality will be available soon.');
    });

    // Clear error highlights as user types
    form.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => {
        input.classList.remove('input-error');
      });
    });
  });

  // "Forgot Password?" friendly click handler (UI only, no backend recovery)
  document.querySelectorAll('.forgot-password-link:not(#admin-forgot-pass)').forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const card = this.closest('.portal-login-card');
      const alertBox = card ? card.querySelector('.portal-alert-box') : null;
      if (alertBox) {
        showPortalAlert(alertBox, 'info', 'Password recovery will be available when portal services launch. Please contact the registry for assistance.');
      }
    });
  });
});
