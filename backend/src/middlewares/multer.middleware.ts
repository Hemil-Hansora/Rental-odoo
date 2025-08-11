import multer from 'multer';

// Configure multer to use disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Set the destination folder for temporary file storage
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      // Use the original filename. In a real app, you might want to add a unique prefix.
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ storage: storage })