import { Request, Response } from "express";
import ProjectRepository from "../repositories/ProjectRepository";
import fs from "fs";
import path from "path";

// Função auxiliar para deletar arquivo se existir
const deleteFileIfExists = (filename: string | null, folder: string) => {
  if (!filename) return;

  const filePath = path.resolve(process.cwd(), folder, filename);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Arquivo deletado: ${filePath}`);
    } catch (error) {
      console.error(`Erro ao deletar arquivo ${filePath}:`, error);
    }
  }
};

// Função auxiliar para preparar dados do projeto
const prepareProjectData = (data: any, files: { [fieldname: string]: Express.Multer.File[] }) => {
  const projectData: any = {
    name: data.name,
    provider_id: Number(data.provider_id),
    default_km_price: data.default_km_price ? parseFloat(data.default_km_price) : null,
    default_max_hour_ticket: data.default_max_hour_ticket ? Number(data.default_max_hour_ticket) : null,
    default_add_hour_price: data.default_add_hour_price ? parseFloat(data.default_add_hour_price) : null,
    rat_resinfo: data.rat_resinfo ? 1 : 0,
    json_specialties: data.json_specialties
      ? typeof data.json_specialties === "string"
        ? data.json_specialties
        : JSON.stringify(data.json_specialties)
      : null,
    status: 1,
  };

  // Adicionar arquivos se foram enviados
  if (files?.default_rat?.[0]) {
    projectData.default_rat = files.default_rat[0].filename;
  }
  if (files?.manual?.[0]) {
    projectData.manual = files.manual[0].filename;
  }
  if (files?.step?.[0]) {
    projectData.step = files.step[0].filename;
  }

  return projectData;
};

export default {
  async listAll(_req: Request, res: Response) {
    const projects = await ProjectRepository.listAllProjects();
    res.json(projects);
  },

  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validações
      if (!data.name) {
        return res.status(400).json({
          success: false,
          message: "Nome do projeto é obrigatório.",
        });
      }

      if (!data.provider_id) {
        return res.status(400).json({
          success: false,
          message: "Provider é obrigatório.",
        });
      }

      // default_rat é obrigatório na criação
      if (!files?.default_rat?.[0]) {
        return res.status(400).json({
          success: false,
          message: "Arquivo RAT padrão é obrigatório na criação do projeto.",
        });
      }

      const projectData = prepareProjectData(data, files);
      const project = await ProjectRepository.createProject(projectData);

      res.status(201).json({
        success: true,
        message: "Projeto criado com sucesso.",
        project,
      });
    } catch (error: any) {
      console.error("Erro ao criar projeto:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao criar projeto",
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validações
      if (!data.name) {
        return res.status(400).json({
          success: false,
          message: "Nome do projeto é obrigatório.",
        });
      }

      if (!data.provider_id) {
        return res.status(400).json({
          success: false,
          message: "Provider é obrigatório.",
        });
      }

      const projectData = prepareProjectData(data, files);
      const project = await ProjectRepository.updateProject(Number(id), projectData);

      res.json({
        success: true,
        message: "Projeto alterado com sucesso.",
        project,
      });
    } catch (error: any) {
      console.error("Erro ao atualizar projeto:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao atualizar projeto",
      });
    }
  },

  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const search = req.query.search ? String(req.query.search) : undefined;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { projects, totalItems } =
      await ProjectRepository.listProjectsPaginated(skip, limit, search);
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
      page,
      limit,
      totalPages,
      totalItems,
      projects,
    });
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const project = await ProjectRepository.getProjectById(Number(id));
    if (!project)
      return res.status(404).json({ error: "Projeto não encontrado." });
    res.json(project);
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Busca o projeto para obter os nomes dos arquivos
      const project = await ProjectRepository.getProjectById(Number(id));

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Projeto não encontrado.",
        });
      }

      // Deleta os arquivos associados ao projeto
      deleteFileIfExists(project.default_rat, "default_rats");
      deleteFileIfExists(project.manual, "manuals");
      deleteFileIfExists(project.step, "steps");

      // Deleta o projeto do banco de dados
      await ProjectRepository.deleteProject(Number(id));

      res.json({
        success: true,
        message: "Projeto deletado com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao deletar projeto:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao deletar projeto",
      });
    }
  },
};
