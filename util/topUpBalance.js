const axios = require("axios");

exports.topUpCaptchaBalance = async (key, balance) => {
  try {
    let data = JSON.stringify({
      key,
      balance, // usd
    });

    let config = {
      method: "options", // Keeping as 'options' since that's part of the client requirement
      maxBodyLength: Infinity,
      url: "http://api.captchasolver.ai/admin/api/topupBalance",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};
