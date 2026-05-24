function buildUserProfile(data) {
  if (!data || data.length === 0) {
    return {
      avgEnergie: 0,
      avgEau: 0,
      avgDechets: 0,
      profile: "normal",
    };
  }

  let totalEnergie = 0;
  let totalEau = 0;
  let totalDechets = 0;

  data.forEach((item) => {
    totalEnergie += item.energie || 0;
    totalEau += item.eau || 0;
    totalDechets += item.dechets || 0;
  });

  const avgEnergie = totalEnergie / data.length;
  const avgEau = totalEau / data.length;
  const avgDechets = totalDechets / data.length;

  let profile = "normal";

  if (avgEnergie > 70) profile = "high-consumption";
  else if (avgEnergie < 30) profile = "eco-user";

  return {
    avgEnergie,
    avgEau,
    avgDechets,
    profile,
  };
}

module.exports = { buildUserProfile };