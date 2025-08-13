import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import app from "./server.js";

let server: any;
let port: number;

beforeAll(() => {
  server = app.listen(0); // Start server on a random port
  // @ts-ignore
  port = server.address().port;
});

afterAll(() => {
  server.close(); // Stop server after tests
});

describe("GET /api/monarchs", () => {
  it("should return monarchs.json data as JSON", async () => {
    const filePath = path.join(__dirname, "data", "monarchs.json");
    const expectedData = JSON.parse(await fs.readFile(filePath, "utf-8"));
    const res = await fetch(`http://localhost:${port}/api/monarchs`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(expectedData);
  });
});
