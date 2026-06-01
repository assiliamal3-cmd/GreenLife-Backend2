const User = require("../models/User");
const Releve = require("../models/Releve");
const os = require("os");

exports.getStats = async (req, res) => {
  try {
    const [users] = await Promise.all([
      User.countDocuments(),
      Releve.countDocuments(),
      Notification.countDocuments(),
    ]);

    res.json({
      users,
    
      cpuUsage: Math.round((os.loadavg()[0] / os.cpus().length) * 100),
      memoryUsage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
      uptime: Math.round(os.uptime() / 60),
      serverStatus: "online",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur stats" });
  }
};