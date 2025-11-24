import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export default {
  // Listar todos os tickets com paginação e filtros
  async listTickets(filters: any, skip: number, limit: number) {
    const where: any = {};

    // Busca genérica (search) - busca em múltiplos campos
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { client_name: { contains: filters.search } },
        { address_city: { contains: filters.search } },
        { address_street: { contains: filters.search } },
        { attendance_description: { contains: filters.search } },
      ];
    }

    // Filtros específicos
    if (filters.status !== undefined) {
      where.status = Number(filters.status);
    }

    if (filters.project_id) {
      where.project_id = Number(filters.project_id);
    }

    if (filters.partner_id) {
      where.partner_id = Number(filters.partner_id);
    }

    if (filters.specialty_id) {
      where.specialty_id = Number(filters.specialty_id);
    }

    // Filtros individuais (só aplicam se 'search' não estiver presente)
    if (!filters.search) {
      if (filters.code) {
        where.code = { contains: filters.code };
      }

      if (filters.client_name) {
        where.client_name = { contains: filters.client_name };
      }

      if (filters.address_city) {
        where.address_city = { contains: filters.address_city };
      }
    }

    if (filters.date_start && filters.date_end) {
      where.attendance_date = {
        gte: new Date(filters.date_start),
        lte: new Date(filters.date_end),
      };
    }

    const [tickets, totalItems] = await Promise.all([
      prisma.tickets.findMany({
        where,
        skip,
        take: limit,
        include: {
          projects: {
            select: {
              id: true,
              name: true,
            },
          },
          partners: {
            select: {
              id: true,
              fantasy_name: true,
              document: true,
            },
          },
          specialties: {
            select: {
              id: true,
              nm_speciality: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.tickets.count({ where }),
    ]);

    return { tickets, totalItems };
  },

  // Buscar ticket por ID
  async getTicketById(id: number) {
    return prisma.tickets.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            providers: true,
          },
        },
        partners: true,
        specialties: true,
        tickets_add_values: true,
        equipamentos_ticket: {
          orderBy: {
            ordem: "asc",
          },
        },
        payable: true,
        receipt: true,
      },
    });
  },

  // Tickets recentes
  async getRecently() {
    return prisma.tickets.findMany({
      where: {
        status: 1, // Aguardando técnico
      },
      include: {
        projects: true,
        partners: true,
        specialties: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 50,
    });
  },

  // Tickets de hoje
  async getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.tickets.findMany({
      where: {
        attendance_date: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: [1, 2, 3], // Aguardando técnico, Aguardando atendimento, Em atendimento
        },
      },
      include: {
        projects: true,
        partners: true,
        specialties: true,
      },
      orderBy: {
        attendance_date: "asc",
      },
    });
  },

  // Tickets atrasados
  async getLate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.tickets.findMany({
      where: {
        attendance_date: {
          lt: today,
        },
        status: {
          in: [1, 2, 3], // Aguardando técnico, Aguardando atendimento, Em atendimento
        },
      },
      include: {
        projects: true,
        partners: true,
        specialties: true,
      },
      orderBy: {
        attendance_date: "asc",
      },
    });
  },

  // Dashboard - contadores
  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, aguardando, atendimento, finalizados, cancelados, hoje, atrasados] = await Promise.all([
      prisma.tickets.count(),
      prisma.tickets.count({ where: { status: 1 } }),
      prisma.tickets.count({ where: { status: { in: [2, 3] } } }),
      prisma.tickets.count({ where: { status: 4 } }),
      prisma.tickets.count({ where: { status: 0 } }),
      prisma.tickets.count({
        where: {
          attendance_date: { gte: today, lt: tomorrow },
          status: { in: [1, 2, 3] },
        },
      }),
      prisma.tickets.count({
        where: {
          attendance_date: { lt: today },
          status: { in: [1, 2, 3] },
        },
      }),
    ]);

    return {
      total,
      aguardando,
      atendimento,
      finalizados,
      cancelados,
      hoje,
      atrasados,
    };
  },

  // Contar tickets por status
  async getCounts(filters: any) {
    const where: any = {};

    if (filters.project_id) where.project_id = Number(filters.project_id);
    if (filters.partner_id) where.partner_id = Number(filters.partner_id);

    const [total, cancelados, aguardando, aguardandoAtendimento, emAtendimento, finalizados] =
      await Promise.all([
        prisma.tickets.count({ where }),
        prisma.tickets.count({ where: { ...where, status: 0 } }),
        prisma.tickets.count({ where: { ...where, status: 1 } }),
        prisma.tickets.count({ where: { ...where, status: 2 } }),
        prisma.tickets.count({ where: { ...where, status: 3 } }),
        prisma.tickets.count({ where: { ...where, status: 4 } }),
      ]);

    return {
      total,
      cancelados,
      aguardando,
      aguardandoAtendimento,
      emAtendimento,
      finalizados,
    };
  },

  // Criar ticket
  async createTicket(data: any) {
    return prisma.tickets.create({
      data,
    });
  },

  // Atualizar ticket
  async updateTicket(id: number, data: any) {
    return prisma.tickets.update({
      where: { id },
      data,
    });
  },

  // Cancelar ticket
  async cancelTicket(id: number) {
    return prisma.tickets.update({
      where: { id },
      data: {
        status: 0,
        canceled_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  // Reabrir ticket
  async reopenTicket(id: number) {
    return prisma.tickets.update({
      where: { id },
      data: {
        status: 1,
        updated_at: new Date(),
      },
    });
  },

  // Colocar em atendimento
  async setInAttendance(id: number) {
    return prisma.tickets.update({
      where: { id },
      data: {
        status: 3,
        updated_at: new Date(),
      },
    });
  },

  // Finalizar ticket
  async finishTicket(id: number, data: any) {
    return prisma.tickets.update({
      where: { id },
      data: {
        ...data,
        status: 4,
        finalized_at: data.finalized_at || new Date(),
        updated_at: new Date(),
      },
    });
  },

  // Remover RAT
  async removeRat(id: number) {
    return prisma.tickets.update({
      where: { id },
      data: {
        own_rat: null,
        updated_at: new Date(),
      },
    });
  },

  // Tickets aguardando aprovação
  async getApprovalWaiting(filters: any, skip: number, limit: number) {
    const where: any = {
      approved_status: null,
      status: 4,
      created_at: {
        gte: new Date("2020-09-29"),
      },
    };

    // Busca genérica (search) - busca em múltiplos campos
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { client_name: { contains: filters.search } },
        { address_city: { contains: filters.search } },
        { address_street: { contains: filters.search } },
        { attendance_description: { contains: filters.search } },
      ];
    }

    // Adicionar filtros adicionais se existirem
    if (filters.project_id) {
      where.project_id = Number(filters.project_id);
    }

    if (filters.partner_id) {
      where.partner_id = Number(filters.partner_id);
    }

    if (filters.specialty_id) {
      where.specialty_id = Number(filters.specialty_id);
    }

    const [tickets, totalItems] = await Promise.all([
      prisma.tickets.findMany({
        where,
        skip,
        take: limit,
        include: {
          partners: {
            select: {
              fantasy_name: true,
            },
          },
          projects: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.tickets.count({ where }),
    ]);

    return { tickets, totalItems };
  },

  // Tickets reprovados
  async getApprovalReproved(filters: any, skip: number, limit: number) {
    const where: any = {
      approved_status: 0,
      status: 4,
    };

    // Busca genérica (search) - busca em múltiplos campos
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { client_name: { contains: filters.search } },
        { address_city: { contains: filters.search } },
        { address_street: { contains: filters.search } },
        { attendance_description: { contains: filters.search } },
      ];
    }

    // Adicionar filtros adicionais se existirem
    if (filters.project_id) {
      where.project_id = Number(filters.project_id);
    }

    if (filters.partner_id) {
      where.partner_id = Number(filters.partner_id);
    }

    if (filters.specialty_id) {
      where.specialty_id = Number(filters.specialty_id);
    }

    const [tickets, totalItems] = await Promise.all([
      prisma.tickets.findMany({
        where,
        skip,
        take: limit,
        include: {
          partners: {
            select: {
              fantasy_name: true,
            },
          },
          projects: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.tickets.count({ where }),
    ]);

    return { tickets, totalItems };
  },

  // Tickets aprovados
  async getApprovalDone(filters: any, skip: number, limit: number) {
    const where: any = {
      approved_status: 1,
      status: 4,
    };

    // Busca genérica (search) - busca em múltiplos campos
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { client_name: { contains: filters.search } },
        { address_city: { contains: filters.search } },
        { address_street: { contains: filters.search } },
        { attendance_description: { contains: filters.search } },
      ];
    }

    // Adicionar filtros adicionais se existirem
    if (filters.project_id) {
      where.project_id = Number(filters.project_id);
    }

    if (filters.partner_id) {
      where.partner_id = Number(filters.partner_id);
    }

    if (filters.specialty_id) {
      where.specialty_id = Number(filters.specialty_id);
    }

    const [tickets, totalItems] = await Promise.all([
      prisma.tickets.findMany({
        where,
        skip,
        take: limit,
        include: {
          partners: {
            select: {
              fantasy_name: true,
            },
          },
          projects: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.tickets.count({ where }),
    ]);

    return { tickets, totalItems };
  },

  // Aprovar/reprovar ticket
  async setApprovalStatus(id: number, status: number) {
    return prisma.tickets.update({
      where: { id },
      data: {
        approved_status: status,
        approved_at: new Date(),
      },
    });
  },

  // Relatórios
  async getReport(filters: any) {
    const where: any = { status: { gte: 0 } };

    if (filters.date_start && filters.date_end) {
      where.attendance_date = {
        gte: new Date(filters.date_start),
        lte: new Date(filters.date_end),
      };
    }

    if (filters.project_id) {
      where.project_id = Number(filters.project_id);
    }

    if (filters.partner_id) {
      where.partner_id = Number(filters.partner_id);
    }

    if (filters.provider_id) {
      where.projects = {
        provider_id: Number(filters.provider_id),
      };
    }

    return prisma.tickets.findMany({
      where,
      include: {
        projects: {
          include: {
            providers: true,
          },
        },
        partners: true,
      },
      orderBy: {
        attendance_date: "asc",
      },
    });
  },

  // Adicionar valores adicionais
  async addTicketValues(ticketId: number, values: any[]) {
    return prisma.tickets_add_values.createMany({
      data: values.map((v) => ({
        ticket_id: ticketId,
        description: v.description,
        value: v.value,
        value_paid: v.value_paid,
      })),
    });
  },

  // Remover valores adicionais
  async removeTicketValues(ticketId: number) {
    return prisma.tickets_add_values.deleteMany({
      where: { ticket_id: ticketId },
    });
  },
};
