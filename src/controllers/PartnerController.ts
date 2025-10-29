import { Request, Response } from "express";
import PartnerRepository from "../repositories/PartnerRepository";

export default {
  async create(req: Request, res: Response) {
    try {
      const data = req.body;

      // Validações básicas
      if (data.type === "J" && !data.social_name) {
        return res.status(400).json({
          success: false,
          message: "Razão Social é obrigatória para pessoa jurídica.",
        });
      }

      // Determina o documento baseado no tipo
      const document =
        data.type === "J" || data.type === "j"
          ? data.cnpj
          : data.cpf_partner || data.document;

      if (!document) {
        return res.status(400).json({
          success: false,
          message:
            data.type === "J"
              ? "CNPJ é obrigatório"
              : "CPF é obrigatório",
        });
      }

      // Verifica se documento já existe
      const existingPartner = await PartnerRepository.checkDocumentExists(
        document
      );
      if (existingPartner) {
        return res.status(400).json({
          success: false,
          message: "Parceiro já cadastrado",
        });
      }

      // Verifica se email já existe (se fornecido)
      if (data.email) {
        const existingUser = await PartnerRepository.checkEmailExists(
          data.email
        );
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Já existe usuário cadastrado com este e-mail",
          });
        }
      }

      // Prepara dados do admin se fornecidos
      let adminData;
      if (data.email && data.fullname) {
        adminData = {
          email: data.email,
          fullname: data.fullname,
          whatsapp: data.whatsapp,
          cpf: data.cpf,
          rg: data.rg,
        };
      }

      // Converte especialidades para números se fornecidas
      let specialties: number[] | undefined;
      if (data.specialties) {
        specialties = Array.isArray(data.specialties)
          ? data.specialties.map((s: any) => Number(s))
          : [];
      }

      // Cria o parceiro
      const partner = await PartnerRepository.createPartner({
        type: data.type.toUpperCase(),
        document,
        social_name: data.social_name,
        fantasy_name: data.fantasy_name,
        open_date: data.open_date,
        address_zipcode: data.address_zipcode,
        address_street: data.address_street,
        address_number: data.address_number,
        address_complement: data.address_complement,
        address_district: data.address_district,
        address_city: data.address_city,
        address_state: data.address_state,
        default_km_price: data.default_km_price,
        default_max_hour_ticket: data.default_max_hour_ticket,
        default_add_hour_price: data.default_add_hour_price,
        status: data.status,
        info: data.info,
        specialties,
        admin: adminData,
      });

      res.status(201).json({
        success: true,
        message: "Parceiro criado com sucesso",
        partner,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao realizar ação",
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      // Validações básicas
      if (data.type === "J" && !data.social_name) {
        return res.status(400).json({
          success: false,
          message: "Razão Social é obrigatória para pessoa jurídica.",
        });
      }

      // Determina o documento baseado no tipo
      const document =
        data.type === "J" || data.type === "j"
          ? data.cnpj
          : data.cpf_partner || data.document;

      // Verifica se documento já existe em outro parceiro
      if (document) {
        const existingPartner = await PartnerRepository.checkDocumentExists(
          document,
          Number(id)
        );
        if (existingPartner) {
          return res.status(400).json({
            success: false,
            message: "Já existe outro parceiro com este CNPJ",
          });
        }
      }

      // Prepara dados do admin se fornecidos
      let adminData;
      if (data.email && data.fullname) {
        adminData = {
          id: data.user_id,
          email: data.email,
          fullname: data.fullname,
          whatsapp: data.whatsapp,
          cpf: data.cpf,
          rg: data.rg,
        };
      }

      // Prepara dados da conta bancária se fornecidos
      let bankAccountData;
      if (data.account_bank_code || data.account_custom_bank) {
        const agency = data.account_agency
          ? `${data.account_agency}${data.account_agency_digit ? "-" + data.account_agency_digit : ""}`
          : undefined;
        const account = data.account_account
          ? `${data.account_account}${data.account_digit ? "-" + data.account_digit : ""}`
          : undefined;

        bankAccountData = {
          id: data.account_id,
          code: data.account_bank_code,
          custom_bank: data.account_custom_bank,
          person: data.account_person,
          type: data.account_type,
          agency,
          account,
          variable: data.account_variable,
          favored: data.account_favored,
          document: data.account_document,
          pix_type: data.account_pix_type,
          pix_key: data.account_pix_key,
        };
      }

      // Converte especialidades para números se fornecidas
      let specialties: number[] | undefined;
      if (data.specialties !== undefined) {
        specialties = Array.isArray(data.specialties)
          ? data.specialties.map((s: any) => Number(s))
          : [];
      }

      // Atualiza o parceiro
      const partner = await PartnerRepository.updatePartner(Number(id), {
        type: data.type?.toUpperCase(),
        document,
        social_name: data.social_name,
        fantasy_name: data.fantasy_name,
        open_date: data.open_date,
        address_zipcode: data.address_zipcode,
        address_street: data.address_street,
        address_number: data.address_number,
        address_complement: data.address_complement,
        address_district: data.address_district,
        address_city: data.address_city,
        address_state: data.address_state,
        default_km_price: data.default_km_price,
        default_max_hour_ticket: data.default_max_hour_ticket,
        default_add_hour_price: data.default_add_hour_price,
        status: data.status,
        info: data.info,
        specialties,
        admin: adminData,
        bank_account: bankAccountData,
      });

      res.json({
        success: true,
        message: "Parceiro atualizado com sucesso",
        partner,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao realizar ação",
      });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const search = req.query.search ? String(req.query.search) : undefined;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const { partners, totalItems } =
        await PartnerRepository.listPartnersPaginated(skip, limit, search);
      const totalItemsNumber =
        typeof totalItems === "bigint" ? Number(totalItems) : totalItems;
      const totalPages = Math.ceil(totalItemsNumber / limit);

      res.json({
        page,
        limit,
        totalPages,
        totalItems: totalItemsNumber,
        partners,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao listar parceiros",
      });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const partner = await PartnerRepository.getPartnerById(Number(id));

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Parceiro não encontrado",
        });
      }

      res.json(partner);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar parceiro",
      });
    }
  },

  async activate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await PartnerRepository.activatePartner(Number(id));

      res.json({
        success: true,
        message: "Parceiro ativado com sucesso",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao realizar ação",
      });
    }
  },

  async deactivate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await PartnerRepository.deactivatePartner(Number(id));

      res.json({
        success: true,
        message: "Parceiro inativado com sucesso",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao realizar ação",
      });
    }
  },

  async setInfoAndInactive(req: Request, res: Response) {
    try {
      const { id, message } = req.body;
      await PartnerRepository.deactivatePartner(Number(id), message);

      res.json({
        success: true,
        message: "Informação inserida com sucesso.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao realizar ação",
      });
    }
  },

  async getCities(_req: Request, res: Response) {
    try {
      const cities = await PartnerRepository.getCities();
      res.json(cities);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar cidades",
      });
    }
  },

  async getSpecialties(_req: Request, res: Response) {
    try {
      const specialties = await PartnerRepository.getActiveSpecialties();
      res.json(specialties);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar especialidades",
      });
    }
  },

  // Rota para o próprio admin do parceiro atualizar seus dados
  async updateOwnData(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.partner_id) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
        });
      }

      const data = req.body;

      // Verifica se email já existe em outro usuário
      if (data.email) {
        const existingUser = await PartnerRepository.checkEmailExists(
          data.email,
          data.user_id
        );
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Já existe outro usuário cadastrado com este e-mail",
          });
        }
      }

      // Converte especialidades para números se fornecidas
      let specialties: number[] | undefined;
      if (data.specialties !== undefined) {
        specialties = Array.isArray(data.specialties)
          ? data.specialties.map((s: any) => Number(s))
          : [];
      }

      // Atualiza apenas os dados permitidos
      const partner = await PartnerRepository.updatePartner(user.partner_id, {
        address_zipcode: data.address_zipcode,
        address_street: data.address_street,
        address_number: data.address_number,
        address_complement: data.address_complement,
        address_district: data.address_district,
        address_city: data.address_city,
        address_state: data.address_state,
        specialties,
        admin: data.email && data.fullname ? {
          id: data.user_id,
          email: data.email,
          fullname: data.fullname,
          whatsapp: data.whatsapp,
          cpf: data.cpf,
          rg: data.rg,
        } : undefined,
      });

      res.json({
        success: true,
        message: "Parceiro atualizado com sucesso",
        partner,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao realizar ação",
      });
    }
  },

  // Rota para o admin do parceiro ver seus próprios dados
  async getOwnData(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.partner_id) {
        return res.status(403).json({
          success: false,
          message: "Acesso negado",
        });
      }

      const partner = await PartnerRepository.getPartnerById(user.partner_id);

      if (!partner) {
        return res.status(404).json({
          success: false,
          message: "Parceiro não encontrado",
        });
      }

      res.json(partner);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Erro ao buscar dados",
      });
    }
  },
};
