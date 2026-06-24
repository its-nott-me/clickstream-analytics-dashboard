(function() {
  const BACKEND_URL = "http://localhost:5000/api/events";
  const SCREENSHOT_URL = "http://localhost:5000/api/screenshots";
  const HTML2CANVAS_URL = "/vendor/html2canvas.min.js";
  const BATCH_SIZE_LIMIT = 10;
  const FLUSH_INTERVAL_MS = 5000;
  
  let eventQueue = [];
  let currentUrl = normalizeUrl(window.location.href);
  let pageStartedAt = Date.now();
  let screenshotCaptureInFlight = false;
  const knownScreenshotRoutes = new Set();

  // Generate UUID v4 for session ID (naive implementation for browser without dependencies)
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Session Management
  let sessionId = localStorage.getItem("causal_funnel_session");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("causal_funnel_session", sessionId);
  }

  // Flush the queue to the backend
  function normalizeUrl(url) {
    return url.split("#")[0];
  }

  function shouldTrackUrl(url) {
    try {
      return !new URL(url).pathname.startsWith("/analytics");
    } catch {
      return true;
    }
  }

  function getPageMetrics() {
    const doc = document.documentElement;
    return {
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      document_width: Math.max(doc.scrollWidth, doc.clientWidth),
      document_height: Math.max(doc.scrollHeight, doc.clientHeight),
      scroll_x: window.scrollX || window.pageXOffset || 0,
      scroll_y: window.scrollY || window.pageYOffset || 0
    };
  }

  function loadHtml2Canvas() {
    if (window.html2canvas) {
      return Promise.resolve(window.html2canvas);
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector("script[data-cf-html2canvas]");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.html2canvas), { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = HTML2CANVAS_URL;
      script.async = true;
      script.defer = true;
      script.dataset.cfHtml2canvas = "true";
      script.onload = () => resolve(window.html2canvas);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function maybeCaptureRouteScreenshot(route = currentUrl) {
    if (!shouldTrackUrl(route) || screenshotCaptureInFlight) return;

    if (knownScreenshotRoutes.has(route)) return;

    screenshotCaptureInFlight = true;

    try {
      const existsResponse = await fetch(`${SCREENSHOT_URL}/exists?route=${encodeURIComponent(route)}`);
      if (existsResponse.ok) {
        const existsPayload = await existsResponse.json();
        if (existsPayload.exists) {
          knownScreenshotRoutes.add(route);
          return;
        }
      }

      const html2canvas = await loadHtml2Canvas();
      const metrics = getPageMetrics();

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (route !== currentUrl) return;

      const canvas = await html2canvas(document.documentElement, {
        backgroundColor: window.getComputedStyle(document.body).backgroundColor || "#ffffff",
        width: metrics.document_width,
        height: metrics.document_height,
        windowWidth: metrics.document_width,
        windowHeight: metrics.document_height,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: false,
        logging: false,
        scale: 1
      });

      const uploadResponse = await fetch(SCREENSHOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route,
          imageData: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height
        })
      });

      if (uploadResponse.ok) {
        knownScreenshotRoutes.add(route);
      }
    } catch (error) {
      console.warn("Screenshot capture skipped:", error);
    } finally {
      screenshotCaptureInFlight = false;
    }
  }

  function getSelector(el) {
    if (!el || !el.tagName) return "";
    if (el.id) return `#${el.id}`;
    const label = el.getAttribute("data-cf-cta") || el.getAttribute("aria-label") || el.textContent || "";
    return `${el.tagName.toLowerCase()}${label ? `[label="${label.trim().slice(0, 32)}"]` : ""}`;
  }

  const flushQueue = (isUnload = false) => {
    if (eventQueue.length === 0) return;

    const payload = JSON.stringify(eventQueue);
    
    // Clear queue immediately after serialization to prevent double-sending
    eventQueue = [];

    if (isUnload && navigator.sendBeacon) {
      // Use sendBeacon on exit for reliability
      const blob = new Blob([payload], { type: "text/plain" });
      navigator.sendBeacon(BACKEND_URL, blob);
    } else {
      // Standard fetch for periodic flushes
      fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      }).catch(err => console.error("Tracking Error:", err));
    }
  };

  // Queue an event
  const queueEvent = (eventType, metadata = {}) => {
    if (!shouldTrackUrl(currentUrl)) return;

    const event = {
      session_id: sessionId,
      event_type: eventType,
      url: currentUrl,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    eventQueue.push(event);

    // Size-based flush
    if (eventQueue.length >= BATCH_SIZE_LIMIT) {
      flushQueue();
    }
  };

  // 1. Time-based flush
  setInterval(() => {
    flushQueue();
  }, FLUSH_INTERVAL_MS);

  // 2. Event Listeners for tracking
  // Record a page view
  function recordTimeSpent() {
    if (!shouldTrackUrl(currentUrl)) return;

    const durationMs = Date.now() - pageStartedAt;
    if (durationMs >= 1000) {
      queueEvent("time_spent", { duration_ms: durationMs, ...getPageMetrics() });
    }
  }

  function recordPageView() {
    currentUrl = normalizeUrl(window.location.href);
    pageStartedAt = Date.now();
    if (shouldTrackUrl(currentUrl)) {
      queueEvent("page_view", getPageMetrics());
      const routeToCapture = currentUrl;
      window.setTimeout(() => maybeCaptureRouteScreenshot(routeToCapture), 1200);
    }
  }

  function trackUrlChange() {
    const nextUrl = normalizeUrl(window.location.href);
    if (nextUrl !== currentUrl) {
      recordTimeSpent();
      currentUrl = nextUrl;
      recordPageView();
    }
  }

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function() {
    originalPushState.apply(this, arguments);
    trackUrlChange();
  };

  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    trackUrlChange();
  };

  window.addEventListener("popstate", trackUrlChange);
  recordPageView();

  // Record document clicks
  document.addEventListener("click", (e) => {
    if (!shouldTrackUrl(currentUrl)) return;

    const rect = document.documentElement;
    // Calculate relative to the entire scrollable document size, not just viewport
    const totalWidth = Math.max(rect.scrollWidth, rect.clientWidth);
    const totalHeight = Math.max(rect.scrollHeight, rect.clientHeight);
    
    const x = e.pageX / totalWidth;
    const y = e.pageY / totalHeight;
    const coordinateMetadata = {
      x,
      y,
      absolute_x: e.pageX,
      absolute_y: e.pageY,
      viewport_x: e.clientX,
      viewport_y: e.clientY,
      ...getPageMetrics()
    };
    
    queueEvent("click", coordinateMetadata);

    const cta = e.target.closest("[data-cf-cta], button, a, [role='button']");
    if (cta) {
      const label = cta.getAttribute("data-cf-cta") || cta.getAttribute("aria-label") || cta.textContent || cta.href || "Untitled CTA";
      queueEvent("cta_click", {
        ...coordinateMetadata,
        label: label.trim().replace(/\s+/g, " ").slice(0, 80),
        selector: getSelector(cta)
      });
    }
  }, true); // Use capture phase to bypass elements that call stopPropagation

  // 3. Exit-based flush
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      recordTimeSpent();
      flushQueue(true);
    } else {
      pageStartedAt = Date.now();
    }
  });
})();
