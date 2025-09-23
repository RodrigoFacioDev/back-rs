import { Router } from "express";
import SpecialtyController from "../controllers/SpecialtyController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, SpecialtyController.list);
router.get("/all", authMiddleware, SpecialtyController.listAll);
router.get("/:id", authMiddleware, SpecialtyController.getById);
router.post("/", authMiddleware, SpecialtyController.create);
router.put("/:id", authMiddleware, SpecialtyController.update);
router.delete("/:id", authMiddleware, SpecialtyController.delete);

export default router;
