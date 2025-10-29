import { PrismaClient } from "../generated/prisma";
const prisma = new PrismaClient();

export default {
  async getEquipment(filters: any) {
    let whereConditions: string[] = ["t.equip_factory <> ''"];
    let params: any[] = [];

    // Filtro por nome de fabricante (no equipamento principal ou nos trocados)
    if (filters.filter_factory_name) {
      const factoryName = filters.filter_factory_name;
      whereConditions.push(
        "(t.equip_factory LIKE ? OR LOWER(JSON_EXTRACT(t.exchanged_equip, '$.equip_factory')) LIKE ?)"
      );
      params.push(`%${factoryName}%`, `%${factoryName.toLowerCase()}%`);
    }

    // Filtro por modelo (no equipamento principal ou nos trocados)
    if (filters.filter_model_name) {
      const modelName = filters.filter_model_name;
      whereConditions.push(
        "(t.equip_model LIKE ? OR LOWER(JSON_EXTRACT(t.exchanged_equip, '$.equip_model')) LIKE ?)"
      );
      params.push(`%${modelName}%`, `%${modelName.toLowerCase()}%`);
    }

    // Filtro por número de série (no equipamento principal ou nos trocados)
    if (filters.filter_serial_number_name) {
      const serialNumber = filters.filter_serial_number_name;
      whereConditions.push(
        "(t.equip_serialnumber LIKE ? OR LOWER(JSON_EXTRACT(t.exchanged_equip, '$.equip_serialnumber')) LIKE ?)"
      );
      params.push(`%${serialNumber}%`, `%${serialNumber.toLowerCase()}%`);
    }

    // Filtro por patrimônio (no equipamento principal ou nos trocados)
    if (filters.filter_patrimony_name) {
      const patrimony = filters.filter_patrimony_name;
      whereConditions.push(
        "(t.equip_patrimony LIKE ? OR LOWER(JSON_EXTRACT(t.exchanged_equip, '$.equip_patrimony')) LIKE ?)"
      );
      params.push(`%${patrimony}%`, `%${patrimony.toLowerCase()}%`);
    }

    // Filtro por descrição (no equipamento principal ou nos trocados)
    if (filters.filter_description_name) {
      const description = filters.filter_description_name;
      whereConditions.push(
        "(t.equip_description LIKE ? OR LOWER(JSON_EXTRACT(t.exchanged_equip, '$.equip_description')) LIKE ?)"
      );
      params.push(`%${description}%`, `%${description.toLowerCase()}%`);
    }

    // Filtro por tipo de equipamento (apenas trocados, apenas não trocados, ou todos)
    if (filters.filter_equipment === "only_exchanged") {
      whereConditions.push("t.exchanged_equip IS NOT NULL");
    } else if (filters.filter_equipment === "just_not_exchanged") {
      whereConditions.push("t.exchanged_equip IS NULL");
    }

    // Filtro por nome do cliente
    if (filters.filter_client_name) {
      whereConditions.push("t.client_name LIKE ?");
      params.push(`%${filters.filter_client_name}%`);
    }

    // Filtro por ID do parceiro
    if (filters.filter_partner_id) {
      whereConditions.push("t.partner_id = ?");
      params.push(filters.filter_partner_id);
    }

    // Filtro por número do ticket
    if (filters.filter_ticket_number) {
      whereConditions.push("t.code = ?");
      params.push(filters.filter_ticket_number);
    }

    // Filtros adicionais gerais
    if (filters.filter_code) {
      whereConditions.push("t.code LIKE ?");
      params.push(`%${filters.filter_code}%`);
    }

    if (filters.filter_project) {
      whereConditions.push("t.project_id = ?");
      params.push(filters.filter_project);
    }

    if (filters.filter_partner) {
      whereConditions.push("t.partner_id = ?");
      params.push(filters.filter_partner);
    }

    if (filters.filter_address_city) {
      whereConditions.push("t.address_city = ?");
      params.push(filters.filter_address_city);
    }

    if (filters.filter_attendance_date) {
      whereConditions.push("t.attendance_date = ?");
      params.push(filters.filter_attendance_date);
    }

    // Filtro por status
    if (filters.filter_status) {
      if (filters.filter_status === "late") {
        whereConditions.push("t.status NOT IN (0, 4) AND t.attendance_date < ?");
        params.push(new Date().toISOString().split("T")[0] + " 00:00:00");
      } else {
        const statusMap: any = {
          canceled: 0,
          waiting_tecnical: 1,
          waiting_attendance: 2,
          in_attendance: 3,
          finalized: 4,
        };
        whereConditions.push("t.status = ?");
        params.push(statusMap[filters.filter_status]);
      }
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const query = `
      SELECT
        t.equip_factory,
        t.equip_model,
        t.equip_serialnumber,
        t.equip_patrimony,
        t.equip_description,
        t.id,
        t.code,
        t.client_name,
        pt.fantasy_name,
        t.exchanged_equip
      FROM tickets t
      JOIN partners pt ON pt.id = t.partner_id
      ${whereClause}
      ORDER BY t.equip_factory
    `;

    const equipment = await prisma.$queryRawUnsafe<any[]>(query, ...params);
    return equipment;
  },

};
