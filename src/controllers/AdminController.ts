import { Request, Response } from "express";
import AdminRepository from "../repositories/AdminRepository";
import crypto from "crypto";

export default {
  async stats(req: Request, res: Response) {
    const [totalResult] = await AdminRepository.rawCount("u.type IN (1, 10)");
    const [adminsResult] = await AdminRepository.rawCount("u.type = 1");
    const [colabsResult] = await AdminRepository.rawCount("u.type = 10");
    res.json({
      total: Number(totalResult.total),
      administradores: Number(adminsResult.total),
      colaboradores: Number(colabsResult.total),
    });
  },
  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const search = req.query.search ? String(req.query.search) : undefined;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { admins, totalItems, totalAdmins, totalCollaborators } =
      await AdminRepository.listAdminsPaginated(skip, limit, search);
    const totalItemsNumber =
      typeof totalItems === "bigint" ? Number(totalItems) : totalItems;
    const totalAdminsNumber =
      typeof totalAdmins === "bigint" ? Number(totalAdmins) : totalAdmins;
    const totalCollaboratorsNumber =
      typeof totalCollaborators === "bigint"
        ? Number(totalCollaborators)
        : totalCollaborators;
    const totalPages = Math.ceil(totalItemsNumber / limit);

    res.json({
      page,
      limit,
      totalPages,
      totalItems: totalItemsNumber,
      totalAdmins: totalAdminsNumber,
      totalCollaborators: totalCollaboratorsNumber,
      admins,
    });
  },

  async create(req: Request, res: Response) {
    const { fullname, email, password } = req.body;
    if (!fullname || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nome, email e senha são obrigatórios." });
    }
    // Verifica se já existe admin com o mesmo email
    const existing = await AdminRepository.findByEmail(email);
    if (existing) {
      return res
        .status(409)
        .json({ error: "Já existe um usuário com esse email." });
    }
    const passwordMd5 = crypto.createHash("md5").update(password).digest("hex");
    const admin = await AdminRepository.createAdmin({
      fullname,
      email,
      password: passwordMd5,
    });
    res.status(201).json(admin);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { fullname, email, password } = req.body;
    if (!fullname || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios." });
    }
    let passwordMd5;
    if (password) {
      passwordMd5 = crypto.createHash("md5").update(password).digest("hex");
    }
    const admin = await AdminRepository.updateAdmin(Number(id), {
      fullname,
      email,
      password: passwordMd5,
    });
    res.json(admin);
  },
};
