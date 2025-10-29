import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export default {
  // Verifica se documento já existe
  async checkDocumentExists(document: string, excludeId?: number) {
    const where: any = { document };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return await prisma.partners.findFirst({ where });
  },

  // Verifica se email já existe
  async checkEmailExists(email: string, excludeId?: number) {
    const where: any = { email };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return await prisma.users.findFirst({ where });
  },

  // Recupera parceiro por ID
  async getPartnerById(id: number) {
    return await prisma.partners.findUnique({
      where: { id },
      include: {
        partners_specialties: {
          include: {
            specialties: true,
          },
        },
        partners_bank_accounts: true,
        users: {
          where: { type: 2 }, // Admin do parceiro
        },
      },
    });
  },

  // Recupera todas as especialidades ativas
  async getActiveSpecialties() {
    return await prisma.specialties.findMany({
      where: { st_speciality: 1 },
      orderBy: { nm_speciality: "asc" },
    });
  },

  async createPartner(data: {
    type: string;
    document?: string;
    social_name: string;
    fantasy_name?: string;
    open_date?: string;
    address_zipcode?: string;
    address_street?: string;
    address_number?: string;
    address_complement?: string;
    address_district?: string;
    address_city?: string;
    address_state?: string;
    default_km_price?: number;
    default_max_hour_ticket?: number;
    default_add_hour_price?: number;
    info?: string;
    status?: boolean;
    specialties?: number[];
    admin?: {
      email: string;
      fullname: string;
      whatsapp?: string;
      cpf?: string;
      rg?: string;
    };
  }) {
    const { specialties, admin, ...partnerData } = data;

    // Converte valores monetários para Decimal
    if (partnerData.default_km_price !== undefined) {
      partnerData.default_km_price = Number(partnerData.default_km_price);
    }
    if (partnerData.default_add_hour_price !== undefined) {
      partnerData.default_add_hour_price = Number(
        partnerData.default_add_hour_price
      );
    }

    const partner = await prisma.partners.create({
      data: {
        ...partnerData,
        created_at: new Date(),
      },
    });

    // Cria especialidades se fornecidas
    if (specialties && specialties.length > 0) {
      await prisma.partners_specialties.createMany({
        data: specialties.map((specialty_id) => ({
          partner_id: partner.id,
          specialty_id,
        })),
      });
    }

    // Cria usuário admin se fornecido
    if (admin) {
      await prisma.users.create({
        data: {
          partner_id: partner.id,
          email: admin.email,
          password: require("crypto")
            .createHash("md5")
            .update("resinformatica")
            .digest("hex"),
          fullname: admin.fullname,
          whatsapp: admin.whatsapp,
          cpf: admin.cpf,
          rg: admin.rg,
          type: 2, // Admin do parceiro
          created_at: new Date(),
        },
      });
    }

    return partner;
  },

  async updatePartner(
    id: number,
    data: {
      type?: string;
      document?: string;
      social_name?: string;
      fantasy_name?: string;
      open_date?: string;
      address_zipcode?: string;
      address_street?: string;
      address_number?: string;
      address_complement?: string;
      address_district?: string;
      address_city?: string;
      address_state?: string;
      default_km_price?: number;
      default_max_hour_ticket?: number;
      default_add_hour_price?: number;
      info?: string;
      status?: boolean;
      specialties?: number[];
      admin?: {
        id?: number;
        email: string;
        fullname: string;
        whatsapp?: string;
        cpf?: string;
        rg?: string;
      };
      bank_account?: {
        id?: number;
        code?: string;
        custom_bank?: string;
        person?: string;
        type?: string;
        agency?: string;
        account?: string;
        variable?: string;
        favored?: string;
        document?: string;
        pix_type?: string;
        pix_key?: string;
      };
    }
  ) {
    const { specialties, admin, bank_account, ...partnerData } = data;

    // Converte valores monetários para Decimal
    if (partnerData.default_km_price !== undefined) {
      partnerData.default_km_price = Number(partnerData.default_km_price);
    }
    if (partnerData.default_add_hour_price !== undefined) {
      partnerData.default_add_hour_price = Number(
        partnerData.default_add_hour_price
      );
    }

    const partner = await prisma.partners.update({
      where: { id },
      data: {
        ...partnerData,
        updated_at: new Date(),
      },
    });

    // Atualiza especialidades se fornecidas
    if (specialties !== undefined) {
      // Remove especialidades não selecionadas
      await prisma.partners_specialties.deleteMany({
        where: {
          partner_id: id,
          specialty_id: { notIn: specialties },
        },
      });

      // Adiciona novas especialidades
      if (specialties.length > 0) {
        for (const specialty_id of specialties) {
          const exists = await prisma.partners_specialties.findFirst({
            where: { partner_id: id, specialty_id },
          });

          if (!exists) {
            await prisma.partners_specialties.create({
              data: { partner_id: id, specialty_id },
            });
          }
        }
      } else {
        // Remove todas se array vazio
        await prisma.partners_specialties.deleteMany({
          where: { partner_id: id },
        });
      }
    }

    // Atualiza ou cria usuário admin
    if (admin) {
      if (admin.id) {
        await prisma.users.update({
          where: { id: admin.id },
          data: {
            email: admin.email,
            fullname: admin.fullname,
            whatsapp: admin.whatsapp,
            cpf: admin.cpf,
            rg: admin.rg,
          },
        });
      } else {
        await prisma.users.create({
          data: {
            partner_id: id,
            email: admin.email,
            password: require("crypto")
              .createHash("md5")
              .update("resinformatica")
              .digest("hex"),
            fullname: admin.fullname,
            whatsapp: admin.whatsapp,
            cpf: admin.cpf,
            rg: admin.rg,
            type: 2,
            created_at: new Date(),
          },
        });
      }
    }

    // Atualiza ou cria conta bancária
    if (bank_account) {
      if (bank_account.id) {
        await prisma.partners_bank_accounts.update({
          where: { id: bank_account.id },
          data: {
            code: bank_account.code,
            custom_bank: bank_account.custom_bank,
            person: bank_account.person,
            type: bank_account.type,
            agency: bank_account.agency,
            account: bank_account.account,
            variable: bank_account.variable,
            favored: bank_account.favored,
            document: bank_account.document,
            pix_type: bank_account.pix_type as any,
            pix_key: bank_account.pix_key,
          },
        });
      } else {
        await prisma.partners_bank_accounts.create({
          data: {
            partner_id: id,
            code: bank_account.code,
            custom_bank: bank_account.custom_bank,
            person: bank_account.person,
            type: bank_account.type,
            agency: bank_account.agency,
            account: bank_account.account,
            variable: bank_account.variable,
            favored: bank_account.favored,
            document: bank_account.document,
            pix_type: bank_account.pix_type as any,
            pix_key: bank_account.pix_key,
          },
        });
      }
    }

    return partner;
  },

  async activatePartner(id: number) {
    return await prisma.partners.update({
      where: { id },
      data: { status: true },
    });
  },

  async deactivatePartner(id: number, info?: string) {
    return await prisma.partners.update({
      where: { id },
      data: {
        status: false,
        info: info || null,
      },
    });
  },

  async listPartnersPaginated(skip: number, limit: number, search?: string) {
    let searchCondition = "";
    let searchParams: any[] = [];
    if (search) {
      searchCondition = `WHERE (social_name LIKE ? OR fantasy_name LIKE ? OR address_city LIKE ?)`;
      searchParams = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    const partners = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM partners ${searchCondition} ORDER BY social_name ASC LIMIT ? OFFSET ?`,
      ...searchParams,
      limit,
      skip
    );
    const [{ total }] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM partners ${searchCondition}`,
      ...searchParams
    );
    return { partners, totalItems: total };
  },

  async getCities() {
    return await prisma.$queryRaw<any[]>`
      SELECT DISTINCT address_city, address_state
      FROM partners
      WHERE address_city IS NOT NULL
      ORDER BY address_city ASC
    `;
  },
};
