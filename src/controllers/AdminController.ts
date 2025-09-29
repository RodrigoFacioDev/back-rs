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
    const { fullname, email, password, type } = req.body;
    if (!fullname || !email || !password || typeof type === "undefined") {
      return res
        .status(400)
        .json({ error: "Nome, email, senha e tipo são obrigatórios." });
    }
    if (![1, 10].includes(Number(type))) {
      return res.status(400).json({
        error: "Tipo deve ser 1 (administrador) ou 10 (colaborador).",
      });
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
      type: Number(type),
    });
    res.status(201).json(admin);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { fullname, email, password, type } = req.body;
    if (!fullname || !email || typeof type === "undefined") {
      return res
        .status(400)
        .json({ error: "Nome, email e tipo são obrigatórios." });
    }
    if (![1, 10].includes(Number(type))) {
      return res.status(400).json({
        error: "Tipo deve ser 1 (administrador) ou 10 (colaborador).",
      });
    }
    let passwordMd5;
    if (password) {
      passwordMd5 = crypto.createHash("md5").update(password).digest("hex");
    }
    const admin = await AdminRepository.updateAdmin(Number(id), {
      fullname,
      email,
      password: passwordMd5,
      type: Number(type),
    });
    res.json(admin);
  },

  async updatePermissions(req: Request, res: Response) {
    const { user_id } = req.params;
    const { menus } = req.body;
    const updatedBy = (req as any).user?.id || 1; // ID do usuário logado

    if (!menus || !Array.isArray(menus)) {
      return res.status(400).json({
        error: "Campo 'menus' é obrigatório e deve ser um array.",
      });
    }

    // Converte array para string separada por vírgulas
    const menusString = menus.join(",");

    try {
      const updatedMenu = await AdminRepository.updateUserMenus(
        Number(user_id),
        menusString,
        updatedBy
      );

      res.json({
        success: true,
        message: "Permissões atualizadas com sucesso.",
        menu: updatedMenu,
      });
    } catch (error) {
      res.status(500).json({
        error: "Erro ao atualizar permissões.",
      });
    }
  },
};
