import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET, // Click 'View API Keys' above to copy your API secret
  secure: true,
});

const uploadTOCloudinary = async (filepath) => {
  try {
    if (!filepath) {
      throw new Error("file path is required");
    }

    const uploadResult = await cloudinary.uploader
      .upload(filepath, { resource_type: "auto" })
      .catch((error) => {
        console.log(error);
      });

    fs.unlinkSync(filepath);

    return uploadResult;
  } catch (error) {
    console.log(error.message);
  }
}; // Upload an image

export { uploadTOCloudinary };
