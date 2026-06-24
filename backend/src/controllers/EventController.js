import Event from "../models/Event.js";
const API_URL = process.env.API_URL;

// @desc    Ingest batched events
// @route   POST /api/events
// @access  Public
export const recordEventBatch = async (req, res) => {
  try {
    const events = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid payload, expected array of events" });
    }

    const batchedEvents = events
      .filter(event => event.session_id && event.event_type && event.url)
      .map(event => ({
      sessionId: event.session_id,
      eventType: event.event_type,
      url: event.url,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      metadata: {
        x: event.x,
        y: event.y,
        containerWidth: event.container_width,
        containerHeight: event.container_height,
        absoluteX: event.absolute_x,
        absoluteY: event.absolute_y,
        viewportX: event.viewport_x,
        viewportY: event.viewport_y,
        viewportWidth: event.viewport_width,
        viewportHeight: event.viewport_height,
        documentWidth: event.document_width,
        documentHeight: event.document_height,
        scrollX: event.scroll_x,
        scrollY: event.scroll_y,
        durationMs: event.duration_ms,
        label: event.label,
        selector: event.selector
      }
    }));

    if (batchedEvents.length === 0) {
      return res.status(400).json({ success: false, message: "No valid events to save" });
    }

    await Event.insertMany(batchedEvents);
    return res.status(201).json({ success: true, count: batchedEvents.length });
  } catch (error) {
    console.error("Error saving batched events:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all unique sessions and event counts
// @route   GET /api/sessions
// @access  Public
export const getSessions = async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: "$sessionId",
          totalEvents: { $sum: 1 },
          lastActive: { $max: "$timestamp" },
          pageViews: {
            $sum: { $cond: [{ $eq: ["$eventType", "page_view"] }, 1, 0] }
          },
          clicks: {
            $sum: { $cond: [{ $eq: ["$eventType", "click"] }, 1, 0] }
          },
          ctaClicks: {
            $sum: { $cond: [{ $eq: ["$eventType", "cta_click"] }, 1, 0] }
          },
          timeSpentMs: {
            $sum: { $ifNull: ["$metadata.durationMs", 0] }
          }
        }
      },
      { $sort: { lastActive: -1 } },
      { 
        $project: {
          sessionId: "$_id",
          totalEvents: 1,
          lastActive: 1,
          pageViews: 1,
          clicks: 1,
          ctaClicks: 1,
          timeSpentMs: 1,
          _id: 0
        }
      }
    ]);

    return res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get chronological user journey for a session
// @route   GET /api/sessions/:sessionId/events
// @access  Public
export const getSessionEvents = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const events = await Event.find({ sessionId }).sort({ timestamp: 1 });
    
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching session events:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get aggregated heatmap data for a specific URL
// @route   GET /api/heatmaps
// @access  Public
export const getHeatmaps = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }

    const clickEvents = await Event.find({ url, eventType: "click" }).select("metadata -_id");
    const clicks = clickEvents.map(e => ({
      x: e.metadata.x,
      y: e.metadata.y,
      containerWidth: e.metadata.containerWidth,
      containerHeight: e.metadata.containerHeight,
      absoluteX: e.metadata.absoluteX,
      absoluteY: e.metadata.absoluteY,
      viewportX: e.metadata.viewportX,
      viewportY: e.metadata.viewportY,
      viewportWidth: e.metadata.viewportWidth,
      viewportHeight: e.metadata.viewportHeight,
      documentWidth: e.metadata.documentWidth,
      documentHeight: e.metadata.documentHeight,
      scrollX: e.metadata.scrollX,
      scrollY: e.metadata.scrollY,
      selector: e.metadata.selector
    }));

    const meta = { clickCount: clicks.length };

    return res.status(200).json({ success: true, data: clicks, meta });
  } catch (error) {
    console.error("Error fetching heatmap stats:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get executive analytics summary for dashboard cards and insights
// @route   GET /api/events/summary
// @access  Public
export const getAnalyticsSummary = async (req, res) => {
  try {
    const [totals = {}] = await Event.aggregate([
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          sessions: { $addToSet: "$sessionId" },
          pageViews: { $sum: { $cond: [{ $eq: ["$eventType", "page_view"] }, 1, 0] } },
          clicks: { $sum: { $cond: [{ $eq: ["$eventType", "click"] }, 1, 0] } },
          ctaClicks: { $sum: { $cond: [{ $eq: ["$eventType", "cta_click"] }, 1, 0] } },
          totalTimeMs: { $sum: { $ifNull: ["$metadata.durationMs", 0] } },
          lastActive: { $max: "$timestamp" }
        }
      },
      {
        $project: {
          _id: 0,
          totalEvents: 1,
          totalSessions: { $size: "$sessions" },
          pageViews: 1,
          clicks: 1,
          ctaClicks: 1,
          totalTimeMs: 1,
          lastActive: 1
        }
      }
    ]);

    const topPages = await Event.aggregate([
      { $match: { eventType: "page_view" } },
      { $group: { _id: "$url", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, url: "$_id", views: 1 } }
    ]);

    const topCtas = await Event.aggregate([
      { $match: { eventType: "cta_click" } },
      { $group: { _id: { label: "$metadata.label", url: "$url" }, clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, label: "$_id.label", url: "$_id.url", clicks: 1 } }
    ]);

    const engagementByPage = await Event.aggregate([
      { $match: { eventType: "time_spent", "metadata.durationMs": { $gt: 0 } } },
      {
        $group: {
          _id: "$url",
          totalTimeMs: { $sum: "$metadata.durationMs" },
          samples: { $sum: 1 }
        }
      },
      { $sort: { totalTimeMs: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          url: "$_id",
          totalTimeMs: 1,
          avgTimeMs: { $round: [{ $divide: ["$totalTimeMs", "$samples"] }, 0] }
        }
      }
    ]);

    const response = {
      totalEvents: totals.totalEvents || 0,
      totalSessions: totals.totalSessions || 0,
      pageViews: totals.pageViews || 0,
      clicks: totals.clicks || 0,
      ctaClicks: totals.ctaClicks || 0,
      totalTimeMs: totals.totalTimeMs || 0,
      lastActive: totals.lastActive || null,
      avgTimePerSessionMs: totals.totalSessions ? Math.round((totals.totalTimeMs || 0) / totals.totalSessions) : 0,
      ctaRate: totals.clicks ? Number(((totals.ctaClicks || 0) / totals.clicks * 100).toFixed(1)) : 0,
      eventBreakdown: [
        { label: "Page views", value: totals.pageViews || 0 },
        { label: "Clicks", value: totals.clicks || 0 },
        { label: "CTA clicks", value: totals.ctaClicks || 0 }
      ],
      funnel: [
        { label: "Viewed", value: totals.pageViews || 0 },
        { label: "Clicked", value: totals.clicks || 0 },
        { label: "CTA", value: totals.ctaClicks || 0 }
      ],
      topPages,
      topCtas,
      engagementByPage
    };

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


// @desc    Get page-assets like url to screenshots, and metadata
// @route   GET /api/heatmaps/page-assets
// @access  Public
export const getPageAssets = async (req, res) => {
  try {
    // store in mongo to avoid redeployment
    const PAGE_ASSETS = {
      // "/": { src: `${API_URL}/uploads/home.png`, width: 2474, height: 2970, label: "Home" },
      // "/features": { src: `${API_URL}/uploads/features.png`, width: 2474, height: 2366, label: "Features" },
      // "/pricing": { src: `${API_URL}/uploads/pricing.png`, width: 2474, height: 1346, label: "Pricing" },
      // "/contact": { src: `${API_URL}/uploads/contact.png`, width: 2474, height: 1620, label: "Contact" },
      "/": {
        label: "Home",
        src: `${API_URL}/uploads/home-desktop.png`,
        images: {
          desktop: { src: `${API_URL}/uploads/home-desktop.png` },
          tablet: { src: `${API_URL}/uploads/home-tablet.png` },
          mobile: { src: `${API_URL}/uploads/home-mobile.png` }
        }
      },
      "/features": {
        label: "Features",
        src: `${API_URL}/uploads/features-desktop.png`,
        images: {
          desktop: { src: `${API_URL}/uploads/features-desktop.png` },
          tablet: { src: `${API_URL}/uploads/features-tablet.png` },
          mobile: { src: `${API_URL}/uploads/features-mobile.png` }
        }
      },
      "/pricing": {
        label: "Pricing",
        src: `${API_URL}/uploads/home-desktop.png`,
        images: {
          desktop: { src: `${API_URL}/uploads/pricing-desktop.png` },
          tablet: { src: `${API_URL}/uploads/pricing-tablet.png` },
          mobile: { src: `${API_URL}/uploads/pricing-mobile.png` }
        }
      },
      "/contact": {
        label: "Contact",
        src: `${API_URL}/uploads/contact-desktop.png`,
        images: {
          desktop: { src: `${API_URL}/uploads/contact-desktop.png` },
          tablet: { src: `${API_URL}/uploads/contact-tablet.png` },
          mobile: { src: `${API_URL}/uploads/contact-mobile.png` }
        }
      }
    };
    return res.status(200).json({ success: true, data: PAGE_ASSETS});
  } catch (error) {
    console.error("Error fetching page assets: ", error);
    return res.status(500).json({success: false, message: "Server Error"});
  }
}
