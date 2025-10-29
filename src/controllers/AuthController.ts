import { Request, Response } from "express";
import AuthRepository from "../repositories/AuthRepository";
import AdminRepository from "../repositories/AdminRepository";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export default {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }
    const user = await AuthRepository.login(email, password);
    if (!user) return res.status(401).json({ error: "Credenciais inválidas." });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        type: user.type,
      },
      token,
    });
  },

  async setup(req: Request, res: Response) {
    // Rota temporária para criar o primeiro usuário admin
    // Verifica se já existe algum admin
    // const [adminsResult] = await AdminRepository.rawCount("u.type = 1");
    // const totalAdmins = Number(adminsResult.total);

    // if (totalAdmins > 0) {
    //   return res.status(403).json({
    //     error: "Já existe um administrador cadastrado. Use a rota normal de criação.",
    //   });
    // }

    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({
        error: "Nome, email e senha são obrigatórios.",
      });
    }

    // Cria o primeiro admin
    const passwordMd5 = crypto.createHash("md5").update(password).digest("hex");
    const admin = await AdminRepository.createAdmin({
      fullname,
      email,
      password: passwordMd5,
      type: 1, // Admin
    });

    // Gera token automaticamente
    const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      message: "Primeiro administrador criado com sucesso!",
      user: {
        id: admin.id,
        email: admin.email,
        fullname: admin.fullname,
        type: admin.type,
      },
      token,
    });
  },
};
