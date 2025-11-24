import { Router } from "express";
import CityController from "../controllers/CityController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

// Buscar todas as cidades atendidas
router.get("/", authMiddleware, CityController.list);

export default router;
