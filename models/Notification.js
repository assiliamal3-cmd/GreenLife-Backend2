const mongoose =
  require("mongoose");

const notificationSchema =
  new mongoose.Schema(
    {
      title: String,

      message: String,

      type: {
        type: String,
        enum: [
          "info",
          "success",
          "warning",
          "error",
        ],
        default: "info",
      },

      read: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Notification",
    notificationSchema
  );