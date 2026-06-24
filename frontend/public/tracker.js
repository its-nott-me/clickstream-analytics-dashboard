(function() {
  const BACKEND_URL = "http://localhost:5000/api/events";
  const BATCH_SIZE_LIMIT = 10;
  const FLUSH_INTERVAL_MS = 5000;

  let eventQueue = [];
  let currentUrl = normalizeUrl(window.location.href);
  let pageStartedAt = Date.now();
  let trackingStarted = false;
  let sessionId = localStorage.getItem("causal_funnel_session");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("causal_funnel_session", sessionId);
  }

  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

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

  // function getPageContainer() {
  //   return document.getElementById("page-container");
  // }

  function getSelector(el) {
    if (!el || !el.tagName) return "";
    if (el.id) return `#${el.id}`;
    const label = el.getAttribute("data-cf-cta") || el.getAttribute("aria-label") || el.textContent || "";
    return `${el.tagName.toLowerCase()}${label ? `[label="${label.trim().slice(0, 32)}"]` : ""}`;
  }

  function flushQueue(isUnload = false) {
    if (!eventQueue.length) return;

    const payload = JSON.stringify(eventQueue);
    eventQueue = [];

    if (isUnload && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "text/plain" });
      navigator.sendBeacon(BACKEND_URL, blob);
      return;
    }

    fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    }).catch(function(err) {
      console.error("Tracking Error:", err);
    });
  }

  function queueEvent(eventType, metadata) {
    if (!shouldTrackUrl(currentUrl)) return;

    eventQueue.push({
      session_id: sessionId,
      event_type: eventType,
      url: currentUrl,
      timestamp: new Date().toISOString(),
      ...(metadata || {})
    });

    if (eventQueue.length >= BATCH_SIZE_LIMIT) {
      flushQueue();
    }
  }

  function recordTimeSpent() {
    if (!shouldTrackUrl(currentUrl)) return;

    var durationMs = Date.now() - pageStartedAt;
    if (durationMs >= 1000) {
      queueEvent("time_spent", { duration_ms: durationMs });
    }
  }

  function recordPageView() {
    currentUrl = normalizeUrl(window.location.href);
    pageStartedAt = Date.now();
    if (shouldTrackUrl(currentUrl)) {
      queueEvent("page_view");
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

  // function trackContainerClick(e) {
  //   if (!shouldTrackUrl(currentUrl)) return;

  //   const container = getPageContainer();
  //   if (!container) return;
  //   if (!container.contains(e.target)) return;

  //   const rect = container.getBoundingClientRect();
  //   if (!rect.width || !rect.height) return;

  //   const absoluteX = e.clientX - rect.left;
  //   const absoluteY = e.clientY - rect.top;
  //   const x = Math.min(1, Math.max(0, absoluteX / rect.width));
  //   const y = Math.min(1, Math.max(0, absoluteY / rect.height));

  //   const basePayload = {
  //     x,
  //     y,
  //     absolute_x: absoluteX,
  //     absolute_y: absoluteY,
  //     container_width: rect.width,
  //     container_height: rect.height
  //   };

  //   queueEvent("click", basePayload);

  //   const cta = e.target.closest("[data-cf-cta], button, a, [role='button']");
  //   if (cta) {
  //     const label = cta.getAttribute("data-cf-cta") || cta.getAttribute("aria-label") || cta.textContent || cta.href || "Untitled CTA";
  //     queueEvent("cta_click", {
  //       ...basePayload,
  //       label: label.trim().replace(/\s+/g, " ").slice(0, 80),
  //       selector: getSelector(cta)
  //     });
  //   }
  // }

function trackClick(e) {
  if (!shouldTrackUrl(currentUrl)) return;

  const doc = document.documentElement;

  const x = e.pageX / doc.scrollWidth;
  const y = e.pageY / doc.scrollHeight;

  const basePayload = {
    x,
    y,
    absolute_x: e.pageX,
    absolute_y: e.pageY,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight
  };

  queueEvent("click", basePayload);

  const cta = e.target.closest("[data-cf-cta], button, a, [role='button']");
  if (cta) {
    const label =
      cta.getAttribute("data-cf-cta") ||
      cta.getAttribute("aria-label") ||
      cta.textContent ||
      cta.href ||
      "Untitled CTA";

    queueEvent("cta_click", {
      ...basePayload,
      label: label.trim().replace(/\s+/g, " ").slice(0, 80),
      selector: getSelector(cta)
    });
  }
}

  function startTracking() {
    if (trackingStarted) return;

    // const container = getPageContainer();
    // if (!container) {
    //   window.requestAnimationFrame(startTracking);
    //   return;
    // }

    trackingStarted = true;

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function() {
      const result = originalPushState.apply(this, arguments);
      trackUrlChange();
      return result;
    };
    history.replaceState = function() {
      const result = originalReplaceState.apply(this, arguments);
      trackUrlChange();
      return result;
    };
    window.addEventListener("popstate", trackUrlChange);

    document.addEventListener("click", trackClick, true);
    document.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "hidden") {
        recordTimeSpent();
        flushQueue(true);
      } else {
        pageStartedAt = Date.now();
      }
    });

    setInterval(function() {
      flushQueue();
    }, FLUSH_INTERVAL_MS);

    recordPageView();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTracking, { once: true });
  } else {
    startTracking();
  }
})();
