import { Router } from "express";
import ProjectController from "../controllers/ProjectController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, ProjectController.list);
router.get("/all", authMiddleware, ProjectController.listAll);
router.get("/:id", authMiddleware, ProjectController.getById);
router.post("/", authMiddleware, ProjectController.create);
router.put("/:id", authMiddleware, ProjectController.update);

export default router;
