import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      enum: ["page_view", "click", "cta_click", "time_spent"],
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    timestamp: {
      type: Date,
      required: true,
    },

    metadata: {
      x: Number,
      y: Number,
      absoluteX: Number,
      absoluteY: Number,
      viewportX: Number,
      viewportY: Number,
      viewportWidth: Number,
      viewportHeight: Number,
      documentWidth: Number,
      documentHeight: Number,
      scrollX: Number,
      scrollY: Number,
      durationMs: Number,
      label: String,
      selector: String,
    },
  },
  {
    versionKey: false,
  }
);

EventSchema.index({
  url: 1,
  eventType: 1,
});

export default mongoose.model("Event", EventSchema);
