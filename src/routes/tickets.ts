import { Router } from "express";
import TicketController from "../controllers/TicketController";
import authMiddleware from "../middlewares/authMiddleware";
import { upload } from "../config/multer";

const router = Router();

// Listagem e visualização
router.get("/recently", authMiddleware, TicketController.recently);
router.get("/today", authMiddleware, TicketController.today);
router.get("/late", authMiddleware, TicketController.late);
router.get("/dashboard", authMiddleware, TicketController.dashboard);
router.get("/", authMiddleware, TicketController.list);
router.get("/:id", authMiddleware, TicketController.getById);

// Relatórios
router.get("/reports/data", authMiddleware, TicketController.getReport);
router.get("/:id/pdf", authMiddleware, TicketController.generatePdf);

// Criação e atualização
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "own_rat", maxCount: 1 },
    { name: "rat", maxCount: 1 },
  ]),
  TicketController.create
);

router.put(
  "/:id",
  authMiddleware,
  upload.fields([
    { name: "own_rat", maxCount: 1 },
    { name: "rat", maxCount: 1 },
  ]),
  TicketController.update
);

// Finalização de ticket
router.post(
  "/:id/finish",
  authMiddleware,
  upload.fields([
    { name: "rat", maxCount: 1 },
    { name: "evidence1", maxCount: 1 },
    { name: "evidence2", maxCount: 1 },
    { name: "evidence3", maxCount: 1 },
  ]),
  TicketController.finish
);

// Ações sobre tickets
router.post("/:id/cancel", authMiddleware, TicketController.cancel);
router.post("/:id/reopen", authMiddleware, TicketController.reopen);
router.post("/:id/in-attendance", authMiddleware, TicketController.inAttendance);
router.delete("/:id/rat", authMiddleware, TicketController.removeRat);

// Aprovação de tickets
router.get("/approval/waiting", authMiddleware, TicketController.approvalWaiting);
router.get("/approval/reproved", authMiddleware, TicketController.approvalReproved);
router.get("/approval/done", authMiddleware, TicketController.approvalDone);
router.post("/approval/decision", authMiddleware, TicketController.approvalDecision);

export default router;
