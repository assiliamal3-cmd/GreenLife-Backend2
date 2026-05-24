const User =
  require("../models/User");

const Notification =
  require("../models/Notification");

const Releve =
  require("../models/Releve");

exports.getAdminStats =
  async (req, res) => {
    try {
      const users =
        await User.countDocuments();

      const notifications =
        await Notification.countDocuments();

      const releves =
        await Releve.countDocuments();

      res.json({
        users,
        notifications,
        releves,

        cpu: 35,
        storage: 12,

        serverStatus:
          "Online",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Erreur dashboard admin",
      });
    }
  };