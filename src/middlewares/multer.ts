// Import the multer library, which helps in handling file uploads in Express
import multer from "multer";

// Configure storage to be in memory, meaning the uploaded files are stored in memory temporarily
const storage = multer.memoryStorage();

// Set up multer with the specified storage configuration and a file size limit
const upload = multer({
  storage: storage, // Store files in memory
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5 MB (5 * 1024 * 1024 bytes)
  },
});

// Export the `upload` middleware so it can be used in other parts of the app
export default upload;
