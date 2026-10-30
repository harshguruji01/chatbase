/**
 * ============================================================================
 * HarshGuruJi Universal Loading Lines Engine (@ruhith369 / 21st.dev)
 * ============================================================================
 * High-performance, zero-dependency loading animation and overlay engine.
 * Renders oscillating rainbow spectrum bars with luminous letter-wave text.
 * ============================================================================
 */
(function(window, document) {
  'use strict';

  if (!window || !document) return;
  if (window.__HARSH_LOADING_LINES_ACTIVE__) return;
  window.__HARSH_LOADING_LINES_ACTIVE__ = true;

  // 17-bar circular spectrum palette & curve
  var BAR_COLORS = [
    '#f87171', '#fb923c', '#f59e0b', '#eab308', '#ca8a04',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
    '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899'
  ];

  var BAR_HEIGHTS = [28, 59, 70, 78, 83, 87, 90, 91, 92, 91, 90, 87, 83, 78, 70, 59, 28];

  var BTN_COLORS = ['#f87171', '#f59e0b', '#22c55e', '#10b981', '#06b6d4', '#6366f1', '#ec4899'];
  var BTN_HEIGHTS = [8, 12, 16, 18, 16, 12, 8];

  /**
   * Escape HTML entities to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Render HTML for the Loading Lines component
   * @param {string} text Primary heading word (e.g. "Loading", "Authenticating")
   * @param {string} subtext Contextual message (optional)
   * @param {string} variant CSS modifier ('', 'compact', etc.)
   */
  function renderHarshLoader(text, subtext, variant) {
    text = text || 'Loading';
    subtext = subtext || '';
    variant = variant || '';

    var bars = '';
    for (var i = 0; i < BAR_COLORS.length; i++) {
      var barDelay = (i * 0.075).toFixed(3);
      bars += '<span class="hg-ll-bar" style="--bar-c:' + BAR_COLORS[i] + '; --bar-h:' + BAR_HEIGHTS[i] + 'px; --bar-d:-' + barDelay + 's;"></span>';
    }

    var chars = '';
    var letters = text.split('');
    for (var j = 0; j < letters.length; j++) {
      var charDelay = (j * 0.1).toFixed(2);
      var displayChar = letters[j] === ' ' ? '&nbsp;' : escapeHtml(letters[j]);
      chars += '<span class="hg-ll-char" style="--char-d:' + charDelay + 's;">' + displayChar + '</span>';
    }

    var subHtml = subtext ? '<div class="hg-loading-subtitle">' + escapeHtml(subtext) + '</div>' : '';

    return (
      '<div class="hg-loading-lines-wrapper ' + variant + '">' +
        '<div class="hg-loading-lines-cluster">' + bars + '</div>' +
        '<div class="hg-loading-lines-label">' + chars + '</div>' +
        subHtml +
      '</div>'
    );
  }

  /**
   * Render micro spectrum bars for buttons and inline badges
   */
  function renderHarshBtnSpinner() {
    var bars = '';
    for (var i = 0; i < BTN_COLORS.length; i++) {
      var delay = (i * 0.1).toFixed(2);
      bars += '<span class="hg-btn-bar" style="background:' + BTN_COLORS[i] + '; height:' + BTN_HEIGHTS[i] + 'px; --bar-d:-' + delay + 's;"></span>';
    }
    return '<span class="hg-btn-loading-lines">' + bars + '</span>';
  }

  /**
   * Ensure Global Overlay container exists in DOM
   */
  function getOrCreateOverlay() {
    var overlay = document.getElementById('hg-global-loader');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'hg-global-loader';
      overlay.className = 'hg-loader-overlay';
      overlay.setAttribute('aria-live', 'polite');
      overlay.setAttribute('role', 'status');
      if (document.body) {
        document.body.appendChild(overlay);
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          if (!document.getElementById('hg-global-loader')) {
            document.body.appendChild(overlay);
          }
        });
      }
    }
    return overlay;
  }

  /**
   * Show Fullscreen Global Loading Overlay
   */
  function showHarshLoader(text, subtext) {
    var overlay = getOrCreateOverlay();
    if (overlay) {
      overlay.innerHTML = renderHarshLoader(text || 'Loading', subtext || '');
      void overlay.offsetWidth;
      overlay.classList.add('active');
    }
  }

  /**
   * Hide Fullscreen Global Loading Overlay
   */
  function hideHarshLoader() {
    var overlay = document.getElementById('hg-global-loader');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Auto-upgrade any legacy .spinner elements on the page
   */
  function upgradeLegacySpinners() {
    try {
      var spinners = document.querySelectorAll('.spinner:not(.hg-spectrum-spinner), .btn-spinner:not(.hg-spectrum-spinner)');
      for (var i = 0; i < spinners.length; i++) {
        var sp = spinners[i];
        sp.classList.add('hg-spectrum-spinner');
        if (!sp.innerHTML.trim() || sp.innerHTML.indexOf('hg-btn-loading-lines') === -1) {
          sp.innerHTML = renderHarshBtnSpinner();
        }
      }
    } catch(e) {}
  }

  /**
   * Auto-upgrade container loading states (#loading-state, #initialLoader, etc.)
   */
  function upgradeLoadingContainers() {
    try {
      var containerSelectors = [
        '#loading-state:not(.hg-upgraded-container)',
        '#initialLoader:not(.hg-upgraded-container)',
        '#settings-loading:not(.hg-upgraded-container)',
        '.loading-spinner:not(.hg-upgraded-container)',
        '.thought-loading:not(.hg-upgraded-container)',
        '.news-loading:not(.hg-upgraded-container)',
        '.wiki-loading:not(.hg-upgraded-container)'
      ];
      var containers = document.querySelectorAll(containerSelectors.join(', '));
      for (var i = 0; i < containers.length; i++) {
        var el = containers[i];
        el.classList.add('hg-upgraded-container');
        var subText = '';
        var heading = el.querySelector('h1, h2, h3, h4, p');
        if (heading) {
          subText = heading.textContent.trim();
        }
        if (!subText && el.getAttribute('data-loading-text')) {
          subText = el.getAttribute('data-loading-text');
        }
        el.innerHTML = renderHarshLoader('Loading...', subText || 'Please wait while resources are securely loaded...', 'compact');
      }
    } catch(e) {}
  }

  // Export functions to window
  window.renderHarshLoader = renderHarshLoader;
  window.renderHarshBtnSpinner = renderHarshBtnSpinner;
  window.showHarshLoader = showHarshLoader;
  window.hideHarshLoader = hideHarshLoader;

  // Also alias common helpers
  window.showLoader = showHarshLoader;
  window.hideLoader = hideHarshLoader;
  window.showLoading = showHarshLoader;
  window.hideLoading = hideHarshLoader;

  // Event Listeners for global signals
  window.addEventListener('harsh:show-loader', function(e) {
    var detail = (e && e.detail) || {};
    showHarshLoader(detail.text || 'Loading', detail.subtext || '');
  });

  window.addEventListener('harsh:hide-loader', function() {
    hideHarshLoader();
  });

  function runAllUpgrades() {
    getOrCreateOverlay();
    upgradeLegacySpinners();
    upgradeLoadingContainers();
  }

  // Run DOM upgrade on load and periodically for dynamic elements
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllUpgrades);
  } else {
    runAllUpgrades();
  }

  // Observe dynamically added spinners or loaders
  try {
    if (window.MutationObserver && document.documentElement) {
      var observer = new MutationObserver(function(mutations) {
        var needsUpgrade = false;
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes && mutations[i].addedNodes.length > 0) {
            needsUpgrade = true;
            break;
          }
        }
        if (needsUpgrade) {
          upgradeLegacySpinners();
          upgradeLoadingContainers();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  } catch (e) {}

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
