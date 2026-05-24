const Notification =
  require("../models/Notification");

// ================= GET =================
exports.getNotifications =
async (req, res) => {
  try {

    const notifications =
      await Notification.find()
        .sort({
          createdAt: -1,
        });

    res.json(
      notifications
    );

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Erreur notifications",
    });
  }
};

// ================= CREATE =================
exports.createNotification =
async (
  title,
  message,
  type = "info"
) => {
  try {

    await Notification.create({
      title,
      message,
      type,
    });

  } catch (err) {
    console.error(err);
  }
};

// ================= READ =================
exports.markAsRead =
async (req, res) => {
  try {

    await Notification.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
      }
    );

    res.json({
      success: true,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Erreur lecture",
    });
  }
};

// ================= READ ALL =================
exports.markAllAsRead =
async (req, res) => {
  try {

    await Notification.updateMany(
      {},
      {
        read: true,
      }
    );

    res.json({
      success: true,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Erreur lecture all",
    });
  }
};

// ================= DELETE =================
exports.deleteNotification =
async (req, res) => {
  try {

    await Notification.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Erreur suppression",
    });
  }
};