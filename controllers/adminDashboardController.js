const User =
  require("../models/User");

const Releve =
  require("../models/Releve");

exports.getAdminStats =
  async (req, res) => {
    try {
      const users =
        await User.countDocuments();


      res.json({
        users,


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