import { Request, Response } from "express";
import AuthRepository from "../repositories/AuthRepository";
import jwt from "jsonwebtoken";

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
};
