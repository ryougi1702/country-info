import * as cheerio from "cheerio";
import type { Cheerio } from "cheerio";
import { Element } from "domhandler";
import {
  buildDenormalisedRow,
  getNonRowspanIndices,
} from "./helperFunctions.js";

// Helper to make Cheerio<Element> from HTML string
const loadTds = (html: string): Cheerio<Element> => {
  const $ = cheerio.load(html);
  return $("td"); // Cheerio<Element>
};

// Test for getNonRowspanIndices
const test_getNonRowspanIndices = () => {
  console.log("=== test_getNonRowspanIndices ===");

  const html = `
    <table>
      <tr>
        <td rowspan="2">A</td>
        <td>B</td>
        <td rowspan="3">C</td>
      </tr>
    </table>
  `;

  const tdArray = loadTds(html);
  console.log("Loaded tds:", tdArray.length);
  const indices = getNonRowspanIndices(tdArray);

  console.log("Returned indices:", indices);
  console.assert(
    JSON.stringify(indices) === JSON.stringify([0, 2]),
    `Expected [1], got ${JSON.stringify(indices)}`
  );
};

// Test for buildOverriddenRow
const test_buildOverriddenRow = () => {
  console.log("=== test_buildOverriddenRow ===");

  // Original HTML row (full row)
  const fullHtml = `<table>
    <tr>
      <td rowspan="2">A</td>
      <td>B</td>
      <td rowspan="3">C</td>
    </tr>
    </table>
  `;

  // Sub row with replacement <td>s for the non-rowspan positions
  // Here we want to replace the 0th and 2nd <td>s (the rowspan ones)
  const subHtml = `<table>
    <tr>
      <td>B row 2 </td>
    </tr>
    </table>
  `;

  // Load the tds
  const fullTdArray = loadTds(fullHtml);
  const subTdArray = loadTds(subHtml);

  console.log("Full row tds:", fullTdArray.length);
  console.log("Sub row tds:", subTdArray.length);

  // Get indices that need replacement (e.g. where rowspan > 1)
  const nonRowspanIndices = getNonRowspanIndices(fullTdArray);

  // Run your buildOverriddenRow function
  const overridden = buildDenormalisedRow(
    subTdArray,
    nonRowspanIndices,
    fullTdArray
  );

  // Print out the resulting replaced row's HTML
  console.log("Resulting overridden row HTML:");
  overridden.each((i, el) => {
    const $el = cheerio.load(el);
    console.log(i, $el.text());
  });
};

// Run tests
test_getNonRowspanIndices();
test_buildOverriddenRow();
