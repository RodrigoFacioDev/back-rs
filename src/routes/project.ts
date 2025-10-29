import { Router } from "express";
import ProjectController from "../controllers/ProjectController";
import authMiddleware from "../middlewares/authMiddleware";
import { upload } from "../config/multer";

const router = Router();

router.get("/", authMiddleware, ProjectController.list);
router.get("/all", authMiddleware, ProjectController.listAll);
router.get("/:id", authMiddleware, ProjectController.getById);
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "default_rat", maxCount: 1 },
    { name: "manual", maxCount: 1 },
    { name: "step", maxCount: 1 },
  ]),
  ProjectController.create
);
router.put(
  "/:id",
  authMiddleware,
  upload.fields([
    { name: "default_rat", maxCount: 1 },
    { name: "manual", maxCount: 1 },
    { name: "step", maxCount: 1 },
  ]),
  ProjectController.update
);
router.delete("/:id", authMiddleware, ProjectController.delete);

export default router;
