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
});
