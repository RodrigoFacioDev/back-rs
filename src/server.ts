import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();
app.use(cors());
app.use(express.json());
console.log('Rotas carregadas:', routes);
app.use("/api", routes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
