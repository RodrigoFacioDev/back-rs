import { Request, Response } from "express";
import ClientRepository from "../repositories/ClientRepository";

export default {
  async create(req: Request, res: Response) {
    const data = req.body;
    if (!data.name) {
      return res.status(400).json({ error: "Nome do cliente é obrigatório." });
    }
    const client = await ClientRepository.createClient(data);
    res.status(201).json(client);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;
    if (!data.name) {
      return res.status(400).json({ error: "Nome do cliente é obrigatório." });
    }
    const client = await ClientRepository.updateClient(Number(id), data);
    res.json(client);
  },
  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const search = req.query.search ? String(req.query.search) : undefined;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { clients, totalItems } = await ClientRepository.listClientsPaginated(
      skip,
      limit,
      search
    );
    const totalItemsNumber =
      typeof totalItems === "bigint" ? Number(totalItems) : totalItems;
    const totalPages = Math.ceil(totalItemsNumber / limit);

    res.json({
      page,
      limit,
      totalPages,
      totalItems: totalItemsNumber,
      clients,
    });
  },
};
