import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { parseAttendanceWorkbook } from "../../utils/excelParser.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter(req, file, callback) {
    const name = file.originalname.toLowerCase();

    if (!/\.(xlsx|xls|csv)$/.test(name)) {
      return callback(new Error("Upload an XLSX, XLS, or CSV file."));
    }

    callback(null, true);
  }
});

router.use(authenticate);

router.post(
  "/preview",
  authorize("admin", "staff"),
  upload.single("file"),
  (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Choose an Excel or CSV file first."
        });
      }

      const sheets = parseAttendanceWorkbook(req.file.buffer);

      res.json({
        fileName: req.file.originalname,
        worksheetCount: sheets.length,
        valid: sheets.every((sheet) => sheet.valid),
        sheets
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;