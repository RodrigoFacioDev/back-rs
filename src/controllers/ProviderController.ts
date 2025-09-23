import { Request, Response } from "express";
import ProviderRepository from "../repositories/ProviderRepository";

export default {
  async create(req: Request, res: Response) {
    const data = req.body;
    // Razão social só é obrigatória para pessoa jurídica (type === 'J')
    if (data.type === "J" && !data.social_name) {
      return res
        .status(400)
        .json({ error: "Razão Social é obrigatória para pessoa jurídica." });
    }
    const provider = await ProviderRepository.createProvider(data);
    res.status(201).json(provider);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;
    // Razão social só é obrigatória para pessoa jurídica (type === 'J')
    if (data.type === "J" && !data.social_name) {
      return res
        .status(400)
        .json({ error: "Razão Social é obrigatória para pessoa jurídica." });
    }
    const provider = await ProviderRepository.updateProvider(Number(id), data);
    res.json(provider);
  },
  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const search = req.query.search ? String(req.query.search) : undefined;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { providers, totalItems } =
      await ProviderRepository.listProvidersPaginated(skip, limit, search);
    const totalItemsNumber =
      typeof totalItems === "bigint" ? Number(totalItems) : totalItems;
    const totalPages = Math.ceil(totalItemsNumber / limit);

    res.json({
      page,
      limit,
      totalPages,
      totalItems: totalItemsNumber,
      providers,
    });
  },
};
