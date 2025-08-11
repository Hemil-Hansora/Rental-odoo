import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const uploadOnCloudinary = async (localFilePath: string) => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Automatically detect the file type
        });

        // File has been uploaded successfully
        // console.log("File is uploaded on Cloudinary:", response.url);
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file as the upload operation failed
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
}

export { uploadOnCloudinary }