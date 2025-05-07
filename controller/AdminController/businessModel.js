const { pool } = require("../../Database/databaseConnection/DbConnect");

class BusinessInfo {
  // Method to get business info with default creation
  static async getBusinessInfo() {
    try {
      // First, try to fetch existing record
      const [rows] = await pool.query(
        "SELECT * FROM business_info ORDER BY id LIMIT 1"
      );

      // If no record exists, create a default record
      if (rows.length === 0) {
        return await this.createDefaultBusinessInfo();
      }

      return rows[0];
    } catch (error) {
      // If query fails (potentially due to table not existing),
      // we'll attempt to create the default record
      console.error("Error fetching business info:", error);
      return await this.createDefaultBusinessInfo();
    }
  }

  // Create a default business info record with minimal values
  static async createDefaultBusinessInfo() {
    // Prepare default values that provide a minimal starting point
    const defaultValues = {
      brand_name: "Your Brand",
      business_name: "Your Business",
      business_slogan: "Your Slogan Here",
      simple_description: "A brief description of your business.",
      website_link: "#",
      call_us: "N/A",
      email_us: "contact@yourbusiness.com",
      icon_colors: "#000000", // Default black
      page_colors: "#FFFFFF", // Default white
    };

    try {
      // Insert default record
      const [insertResult] = await pool.query(
        `INSERT INTO business_info 
        (brand_name, business_name, business_slogan, simple_description, 
        website_link, call_us, email_us, icon_colors, page_colors) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          defaultValues.brand_name,
          defaultValues.business_name,
          defaultValues.business_slogan,
          defaultValues.simple_description,
          defaultValues.website_link,
          defaultValues.call_us,
          defaultValues.email_us,
          defaultValues.icon_colors,
          defaultValues.page_colors,
        ]
      );

      // Fetch and return the newly created record
      const [newRows] = await pool.query(
        "SELECT * FROM business_info WHERE id = ?",
        [insertResult.insertId]
      );

      return newRows[0];
    } catch (error) {
      console.error("Error creating default business info:", error);
      throw error;
    }
  }

  // Method to update business info
  static async updateBusinessInfo(data, images = {}) {
    // Prepare fields to update
    const updateFields = {};
    // List of all possible updateable fields
    const allowedFields = [
      "banner_image",
      "logo_image",
      "brand_name",
      "business_name",
      "business_slogan",
      "simple_description",
      "website_link",
      "google_reviews_link",
      "tripadvisor_reviews_link",
      "follow_on_x",
      "follow_on_instagram",
      "follow_on_linkedin",
      "like_on_facebook",
      "follow_on_youtube",
      "iframe",
      "call_us",
      "map_link",
      "email_us",
      "icon_colors",
      "page_colors",
    ];

    // Process image updates first
    if (images.banner_image) {
      updateFields.banner_image = images.banner_image;
    }
    if (images.logo_image) {
      updateFields.logo_image = images.logo_image;
    }

    // Process other text fields
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateFields[field] = data[field];
      }
    });

    // Ensure we have at least one field to update
    if (Object.keys(updateFields).length === 0) {
      // If no fields to update, fetch existing record
      const [existingRows] = await pool.query(
        "SELECT * FROM business_info ORDER BY id LIMIT 1"
      );

      // If no record exists, create default
      if (existingRows.length === 0) {
        return await this.createDefaultBusinessInfo();
      }

      return existingRows[0];
    }
    console.log("updateFields.logo_imag", updateFields.logo_image);
    console.log("updateFields.logo_imag", updateFields.banner_image);
    try {
      // Use a direct query with named parameters
      const [result] = await pool.query(
        `UPDATE business_info SET 
          banner_image = COALESCE(?, banner_image),
          logo_image = COALESCE(?, logo_image),
          brand_name = COALESCE(?, brand_name),
          business_name = COALESCE(?, business_name),
          business_slogan = COALESCE(?, business_slogan),
          simple_description = COALESCE(?, simple_description),
          website_link = COALESCE(?, website_link),
          google_reviews_link = COALESCE(?, google_reviews_link),
          tripadvisor_reviews_link = COALESCE(?, tripadvisor_reviews_link),
          follow_on_x = COALESCE(?, follow_on_x),
          follow_on_instagram = COALESCE(?, follow_on_instagram),
          follow_on_linkedin = COALESCE(?, follow_on_linkedin),
          like_on_facebook = COALESCE(?, like_on_facebook),
          follow_on_youtube = COALESCE(?, follow_on_youtube),
          iframe = COALESCE(?, iframe),
          call_us = COALESCE(?, call_us),
          map_link = COALESCE(?, map_link),
          email_us = COALESCE(?, email_us),
          icon_colors = COALESCE(?, icon_colors),
          page_colors = COALESCE(?, page_colors)
        WHERE id = 1`,
        [
          images.banner_image || null,
          images.logo_image || null,
          updateFields.brand_name || null,
          updateFields.business_name || null,
          updateFields.business_slogan || null,
          updateFields.simple_description || null,
          updateFields.website_link || null,
          updateFields.google_reviews_link || null,
          updateFields.tripadvisor_reviews_link || null,
          updateFields.follow_on_x || null,
          updateFields.follow_on_instagram || null,
          updateFields.follow_on_linkedin || null,
          updateFields.like_on_facebook || null,
          updateFields.follow_on_youtube || null,
          updateFields.iframe || null,
          updateFields.call_us || null,
          updateFields.map_link || null,
          updateFields.email_us || null,
          updateFields.icon_colors || null,
          updateFields.page_colors || null,
        ]
      );

      // Fetch and return the updated record
      const [updatedRows] = await pool.query(
        "SELECT * FROM business_info WHERE id = 1"
      );

      return updatedRows[0];
    } catch (error) {
      console.error("Error updating business info:", error);
      throw error;
    }
  }
}

module.exports = BusinessInfo;
