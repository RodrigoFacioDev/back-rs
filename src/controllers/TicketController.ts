import { Request, Response } from "express";
import TicketRepository from "../repositories/TicketRepository";
import fs from "fs";
import path from "path";

// Status dos chamados
const STATUS = {
  0: "CANCELADO",
  1: "AGUARDANDO TÉCNICO",
  2: "AGUARDANDO ATENDIMENTO",
  3: "EM ATENDIMENTO",
  4: "FINALIZADO",
};

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

// Função para calcular horas de atendimento
const calculateHours = (startHour: string, finishHour: string): number => {
  const start = startHour.split(":");
  const end = finishHour.split(":");

  let hours = parseInt(end[0]) - parseInt(start[0]);

  // Se os minutos do término forem maiores que os do início, adiciona +1 hora
  if (parseInt(start[1]) < parseInt(end[1])) {
    hours++;
  }

  return hours;
};

// Função para calcular valores adicionais por hora
const calculateAdditionalHours = (
  hoursInAttendance: number,
  maxHours: number,
  pricePerHour: number
): number => {
  if (maxHours > 0 && hoursInAttendance > maxHours) {
    return (hoursInAttendance - maxHours) * pricePerHour;
  }
  return 0;
};

export default {
  // Listar tickets recentes
  async recently(_req: Request, res: Response) {
    try {
      const tickets = await TicketRepository.getRecently();
      res.json({ success: true, tickets });
    } catch (error) {
      console.error("Erro ao buscar tickets recentes:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar tickets recentes" });
    }
  },

  // Listar tickets de hoje
  async today(_req: Request, res: Response) {
    try {
      const tickets = await TicketRepository.getToday();
      res.json({ success: true, tickets });
    } catch (error) {
      console.error("Erro ao buscar tickets de hoje:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar tickets de hoje" });
    }
  },

  // Listar tickets atrasados
  async late(_req: Request, res: Response) {
    try {
      const tickets = await TicketRepository.getLate();
      res.json({ success: true, tickets });
    } catch (error) {
      console.error("Erro ao buscar tickets atrasados:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar tickets atrasados" });
    }
  },

  // Dashboard
  async dashboard(_req: Request, res: Response) {
    try {
      const dashboard = await TicketRepository.getDashboard();
      res.json({ success: true, dashboard });
    } catch (error) {
      console.error("Erro ao buscar dashboard:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar dashboard" });
    }
  },

  // Listar tickets com paginação
  async list(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const filters = req.query;

      const { tickets, totalItems } = await TicketRepository.listTickets(filters, skip, limit);

      const counts = await TicketRepository.getCounts(filters);

      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        success: true,
        page,
        limit,
        totalPages,
        totalItems,
        counts,
        tickets,
      });
    } catch (error) {
      console.error("Erro ao listar tickets:", error);
      res.status(500).json({ success: false, message: "Erro ao listar tickets" });
    }
  },

  // Buscar ticket por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ticket = await TicketRepository.getTicketById(Number(id));

      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket não encontrado" });
      }

      // Parse do exchanged_equip se necessário
      if (ticket.exchanged_equip) {
        try {
          ticket.exchanged_equip = JSON.parse(ticket.exchanged_equip as string);
        } catch (e) {
          // Se já estiver parseado ou erro, mantém como está
        }
      }

      res.json({ success: true, ticket });
    } catch (error) {
      console.error("Erro ao buscar ticket:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar ticket" });
    }
  },

  // Criar ticket
  async create(req: Request, res: Response) {
    try {
      const data = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validações básicas
      if (!data.project_id) {
        return res.status(400).json({ success: false, message: "Projeto é obrigatório" });
      }

      if (!data.partner_id) {
        return res.status(400).json({ success: false, message: "Parceiro é obrigatório" });
      }

      if (!data.specialty_id) {
        return res.status(400).json({ success: false, message: "Especialidade é obrigatória" });
      }

      // Preparar dados do ticket
      const ticketData: any = {
        project_id: Number(data.project_id),
        partner_id: Number(data.partner_id),
        specialty_id: Number(data.specialty_id),
        code: data.code,
        client_name: data.client_name,
        address_zipcode: data.address_zipcode,
        address_street: data.address_street,
        address_number: data.address_number,
        address_complement: data.address_complement,
        address_district: data.address_district,
        address_city: data.address_city,
        address_state: data.address_state,
        attendance_description: data.attendance_description,
        attendance_period: data.attendance_period,
        attendance_date: data.attendance_date ? new Date(data.attendance_date) : null,
        status: 1, // Aguardando técnico
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Adicionar arquivos se foram enviados
      if (files?.own_rat?.[0]) {
        ticketData.own_rat = files.own_rat[0].filename;
      }

      if (files?.rat?.[0]) {
        ticketData.rat = files.rat[0].filename;
      }

      // Adicionar equipamentos trocados
      if (data.exchanged_equip) {
        ticketData.exchanged_equip =
          typeof data.exchanged_equip === "string"
            ? data.exchanged_equip
            : JSON.stringify(data.exchanged_equip);
      }

      const ticket = await TicketRepository.createTicket(ticketData);

      res.status(201).json({
        success: true,
        message: "Ticket criado com sucesso",
        ticket,
      });
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
      res.status(500).json({ success: false, message: "Erro ao criar ticket" });
    }
  },

  // Atualizar ticket
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Buscar ticket existente
      const existingTicket = await TicketRepository.getTicketById(Number(id));
      if (!existingTicket) {
        return res.status(404).json({ success: false, message: "Ticket não encontrado" });
      }

      // Preparar dados de atualização
      const updateData: any = {
        project_id: data.project_id ? Number(data.project_id) : existingTicket.project_id,
        partner_id: data.partner_id ? Number(data.partner_id) : existingTicket.partner_id,
        specialty_id: data.specialty_id ? Number(data.specialty_id) : existingTicket.specialty_id,
        client_name: data.client_name || existingTicket.client_name,
        address_zipcode: data.address_zipcode || existingTicket.address_zipcode,
        address_street: data.address_street || existingTicket.address_street,
        address_number: data.address_number || existingTicket.address_number,
        address_complement: data.address_complement || existingTicket.address_complement,
        address_district: data.address_district || existingTicket.address_district,
        address_city: data.address_city || existingTicket.address_city,
        address_state: data.address_state || existingTicket.address_state,
        attendance_description: data.attendance_description || existingTicket.attendance_description,
        attendance_period: data.attendance_period || existingTicket.attendance_period,
        attendance_date: data.attendance_date
          ? new Date(data.attendance_date)
          : existingTicket.attendance_date,
        updated_at: new Date(),
      };

      // Atualizar arquivos se foram enviados
      if (files?.own_rat?.[0]) {
        deleteFileIfExists(existingTicket.own_rat, "default_rats/rat_avulsa");
        updateData.own_rat = files.own_rat[0].filename;
      }

      if (files?.rat?.[0]) {
        deleteFileIfExists(existingTicket.rat, "rats");
        updateData.rat = files.rat[0].filename;
      }

      // Atualizar equipamentos trocados
      if (data.exchanged_equip) {
        updateData.exchanged_equip =
          typeof data.exchanged_equip === "string"
            ? data.exchanged_equip
            : JSON.stringify(data.exchanged_equip);
      }

      const ticket = await TicketRepository.updateTicket(Number(id), updateData);

      res.json({
        success: true,
        message: "Ticket atualizado com sucesso",
        ticket,
      });
    } catch (error) {
      console.error("Erro ao atualizar ticket:", error);
      res.status(500).json({ success: false, message: "Erro ao atualizar ticket" });
    }
  },

  // Finalizar ticket
  async finish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Buscar ticket
      const ticket = await TicketRepository.getTicketById(Number(id));
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket não encontrado" });
      }

      // Validar se o RAT foi enviado
      if (!files?.rat?.[0]) {
        return res.status(400).json({
          success: false,
          message: "Arquivo RAT é obrigatório para finalizar o ticket",
        });
      }

      // Calcular horas de atendimento
      const hoursInAttendance = calculateHours(data.start_hour, data.finish_hour);

      // Preparar dados de finalização
      const finishData: any = {
        rat: files.rat[0].filename,
        start_hour: data.start_hour,
        finish_hour: data.finish_hour,
        finish_description: data.finish_description,
        hours_in_attendance: hoursInAttendance,
        finalized_at: data.finalized_at ? new Date(data.finalized_at) : new Date(),
      };

      // Adicionar evidências
      if (files?.evidence1?.[0]) finishData.evidence1 = files.evidence1[0].filename;
      if (files?.evidence2?.[0]) finishData.evidence2 = files.evidence2[0].filename;
      if (files?.evidence3?.[0]) finishData.evidence3 = files.evidence3[0].filename;

      // Adicionar equipamentos trocados
      if (data.exchanged_equip) {
        finishData.exchanged_equip =
          typeof data.exchanged_equip === "string"
            ? data.exchanged_equip
            : JSON.stringify(data.exchanged_equip);
      }

      // Calcular valores adicionais (se aplicável)
      if (ticket.partners && data.start_hour && data.finish_hour) {
        const partner = ticket.partners;
        if (partner.default_max_hour_ticket && partner.default_add_hour_price) {
          const additionalHourValue = calculateAdditionalHours(
            hoursInAttendance,
            partner.default_max_hour_ticket,
            Number(partner.default_add_hour_price)
          );

          if (additionalHourValue > 0) {
            finishData.value_paid_add_hour = additionalHourValue;
            finishData.value_total_paid = Number(ticket.value_total_paid || 0) + additionalHourValue;
          }
        }
      }

      // Finalizar ticket
      const updatedTicket = await TicketRepository.finishTicket(Number(id), finishData);

      res.json({
        success: true,
        message: `Ticket ${ticket.code} finalizado com sucesso`,
        ticket: updatedTicket,
      });
    } catch (error) {
      console.error("Erro ao finalizar ticket:", error);
      res.status(500).json({ success: false, message: "Erro ao finalizar ticket" });
    }
  },

  // Cancelar ticket
  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const ticket = await TicketRepository.getTicketById(Number(id));
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket não encontrado" });
      }

      if (ticket.status === 0) {
        return res.status(400).json({
          success: false,
          message: "Este ticket já está cancelado",
        });
      }

      await TicketRepository.cancelTicket(Number(id));

      res.json({
        success: true,
        message: `Ticket ${ticket.code} cancelado com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao cancelar ticket:", error);
      res.status(500).json({ success: false, message: "Erro ao cancelar ticket" });
    }
  },

  // Reabrir ticket
  async reopen(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const ticket = await TicketRepository.getTicketById(Number(id));
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket não encontrado" });
      }

      if (ticket.status !== 0) {
        return res.status(400).json({
          success: false,
          message: "Este ticket não pode ser reaberto",
        });
      }

      await TicketRepository.reopenTicket(Number(id));

      res.json({
        success: true,
        message: `Ticket ${ticket.code} reaberto com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao reabrir ticket:", error);
      res.status(500).json({ success: false, message: "Erro ao reabrir ticket" });
    }
  },

  // Colocar em atendimento
  async inAttendance(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const ticket = await TicketRepository.getTicketById(Number(id));
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket não encontrado" });
      }

      if (ticket.status !== 1 && ticket.status !== 2) {
        return res.status(400).json({
          success: false,
          message: "Este ticket não pode ser colocado em atendimento",
        });
      }

      await TicketRepository.setInAttendance(Number(id));

      res.json({
        success: true,
        message: `Ticket ${ticket.code} colocado em atendimento`,
      });
    } catch (error) {
      console.error("Erro ao colocar ticket em atendimento:", error);
      res.status(500).json({ success: false, message: "Erro ao colocar ticket em atendimento" });
    }
  },

  // Remover RAT
  async removeRat(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const ticket = await TicketRepository.getTicketById(Number(id));
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket não encontrado" });
      }

      if (ticket.own_rat) {
        deleteFileIfExists(ticket.own_rat, "default_rats/rat_avulsa");
      }

      await TicketRepository.removeRat(Number(id));

      res.json({
        success: true,
        message: `RAT do ticket ${ticket.code} removido com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao remover RAT:", error);
      res.status(500).json({ success: false, message: "Erro ao remover RAT" });
    }
  },

  // Tickets aguardando aprovação
  async approvalWaiting(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const filters = req.query;

      const { tickets, totalItems } = await TicketRepository.getApprovalWaiting(filters, skip, limit);

      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        success: true,
        page,
        limit,
        totalPages,
        totalItems,
        tickets,
      });
    } catch (error) {
      console.error("Erro ao buscar tickets aguardando aprovação:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar tickets aguardando aprovação" });
    }
  },

  // Tickets reprovados
  async approvalReproved(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const filters = req.query;

      const { tickets, totalItems } = await TicketRepository.getApprovalReproved(filters, skip, limit);

      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        success: true,
        page,
        limit,
        totalPages,
        totalItems,
        tickets,
      });
    } catch (error) {
      console.error("Erro ao buscar tickets reprovados:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar tickets reprovados" });
    }
  },

  // Tickets aprovados
  async approvalDone(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const filters = req.query;

      const { tickets, totalItems } = await TicketRepository.getApprovalDone(filters, skip, limit);

      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        success: true,
        page,
        limit,
        totalPages,
        totalItems,
        tickets,
      });
    } catch (error) {
      console.error("Erro ao buscar tickets aprovados:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar tickets aprovados" });
    }
  },

  // Aprovar/reprovar ticket
  async approvalDecision(req: Request, res: Response) {
    try {
      const { ticket_id, approvement_status, email } = req.body;

      if (!ticket_id || approvement_status === undefined) {
        return res.status(400).json({
          success: false,
          message: "ID do ticket e status de aprovação são obrigatórios",
        });
      }

      const ticket = await TicketRepository.getTicketById(Number(ticket_id));
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket não encontrado" });
      }

      if (ticket.approved_status !== null) {
        return res.status(400).json({
          success: false,
          message: "Este ticket já foi avaliado",
        });
      }

      await TicketRepository.setApprovalStatus(Number(ticket_id), Number(approvement_status));

      const message =
        Number(approvement_status) === 1
          ? "Ticket aprovado com sucesso"
          : "Ticket reprovado com sucesso";

      res.json({ success: true, message });
    } catch (error) {
      console.error("Erro ao processar decisão de aprovação:", error);
      res.status(500).json({ success: false, message: "Erro ao processar decisão de aprovação" });
    }
  },

  // Gerar relatório
  async getReport(req: Request, res: Response) {
    try {
      const filters = req.query;
      const tickets = await TicketRepository.getReport(filters);

      res.json({
        success: true,
        totalItems: tickets.length,
        tickets,
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      res.status(500).json({ success: false, message: "Erro ao gerar relatório" });
    }
  },

  // Gerar PDF (placeholder - implementação futura)
  async generatePdf(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const ticket = await TicketRepository.getTicketById(Number(id));
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket não encontrado" });
      }

      // TODO: Implementar geração de PDF com biblioteca adequada (pdfkit, puppeteer, etc)
      res.json({
        success: false,
        message: "Geração de PDF ainda não implementada",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      res.status(500).json({ success: false, message: "Erro ao gerar PDF" });
    }
  },
};
