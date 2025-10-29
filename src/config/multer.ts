import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {

    let folder = "uploads";

    if (file.fieldname === "default_rat") {
      folder = "default_rats";
    } else if (file.fieldname === "manual") {
      folder = "manuals";
    } else if (file.fieldname === "step") {
      folder = "steps";
    }

    cb(null, path.resolve(process.cwd(), folder));
  },
  filename: (_req, file, cb) => {
    const hash = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname);
    const filename = `${hash}${ext}`;

    cb(null, filename);
  },
});


const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo inv�lido. Apenas PDF, JPG, JPEG e PNG s�o permitidos."));
  }
};

// Exporta a configura��o do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
