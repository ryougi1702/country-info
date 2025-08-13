import "dotenv/config";

import express from "express";
import type { Request, Response } from "express";
import { readFile } from "fs/promises";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/monarchs", async (req: Request, res: Response) => {
  try {
    const filePath = path.join(__dirname, "data", "monarchs.json");
    const data = await readFile(filePath, "utf-8");
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Failed to read monarchs.json" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
export default app;
