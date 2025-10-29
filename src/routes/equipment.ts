import { Router } from "express";
import EquipmentController from "../controllers/EquipmentController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

// Rota para listar equipamentos
router.get("/", authMiddleware, EquipmentController.list);

export default router;
