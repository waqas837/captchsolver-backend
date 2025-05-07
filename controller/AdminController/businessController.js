const BusinessInfo = require("./businessModel"); // Adjust path as needed

class BusinessInfoController {
  // Get business information
  async getBusinessInfo(req, res) {
    try {
      const businessInfo = await BusinessInfo.getBusinessInfo();

      res.status(200).json(businessInfo);
    } catch (error) {
      console.error("Error fetching business info:", error);
      res.status(500).json({
        message: "Error retrieving business information",
        error: error.message,
      });
    }
  }

  // Update business information
  async updateBusinessInfo(req, res) {
    try {
      // Prepare image filenames
      const images = {};
      // Process banner image if uploaded
      if (req.files && req.files["banner_image"]) {
        const bannerFile = req.files["banner_image"][0];
        images.banner_image = bannerFile.filename;
      }

      // Process logo image if uploaded
      if (req.files && req.files["logo_image"]) {
        const logoFile = req.files["logo_image"][0];
        images.logo_image = logoFile.filename;
      }

      // Update business information
      const updatedBusinessInfo = await BusinessInfo.updateBusinessInfo(
        req.body,
        images
      );

      res.status(200).json({
        message: "Business information updated successfully",
        businessInfo: updatedBusinessInfo,
      });
    } catch (error) {
      console.error("Error updating business info:", error);
      res.status(500).json({
        message: "Error updating business information",
        error: error.message,
      });
    }
  }
}

module.exports = new BusinessInfoController();
