import { Router } from "express";
import PartnerController from "../controllers/PartnerController";
import authMiddleware from "../middlewares/authMiddleware";

const router = Router();

router.get("/cities", authMiddleware, PartnerController.getCities);
router.get("/specialties", authMiddleware, PartnerController.getSpecialties);


router.get("/data", authMiddleware, PartnerController.getOwnData);
router.post("/att", authMiddleware, PartnerController.updateOwnData);


router.get("/", authMiddleware, PartnerController.list);
router.get("/:id", authMiddleware, PartnerController.get);
router.post("/", authMiddleware, PartnerController.create);
router.put("/:id", authMiddleware, PartnerController.update);
router.post("/active/:id", authMiddleware, PartnerController.activate);
router.post("/inactive/:id", authMiddleware, PartnerController.deactivate);
router.post("/setInfoAndInactive", authMiddleware, PartnerController.setInfoAndInactive);

export default router;
