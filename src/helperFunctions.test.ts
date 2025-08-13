import { describe, it, expect } from "vitest";
import { getNonRowspanIndices } from "./helperFunctions.js";
import * as cheerio from "cheerio";

describe("getNonRowspanIndices", () => {
  it("returns indices of td elements with rowspan <= 1", () => {
    const $ = cheerio.load(
      `<table>
        <tr>
          <td></td>
          <td rowspan='2'></td>
          <td></td>
        </tr>
      </table>`
    );
    const tds = $("td");
    const result = getNonRowspanIndices(tds);
    expect(result).toEqual([0, 2]);
  });
});
