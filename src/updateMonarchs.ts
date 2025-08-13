import fetch from "node-fetch";
import * as cheerio from "cheerio";
import type { WikipediaParseResponse } from "./types.js";
import {
  buildDenormalisedRow,
  getNonRowspanIndices,
  prependWikipediaBaseUrl,
} from "./helperFunctions.js";
import type { Element } from "domhandler";
import type { Cheerio } from "cheerio";
import { writeFile } from "fs/promises";

type TextAndUrl = {
  text: string;
  url: string | undefined;
};
type MonarchRow = {
  country: TextAndUrl;
  title: TextAndUrl;
  monarchs: TextAndUrl[];
};
let titleColIndex = 0;
let monarchColIndex = 1;
let countryColIndex = 4;

async function fetchMonarchs() {
  const url =
    "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_current_monarchs_of_sovereign_states&format=json&origin=*";

  const res = await fetch(url);
  const data = (await res.json()) as WikipediaParseResponse;
  const html = data.parse.text["*"];
  const $ = cheerio.load(html);

  const denormalisedResults: Cheerio<Element>[] = [];

  // simple way to determine spanrow: the row immediately after a single instance of spanrow will be shorter
  let previousCells: Cheerio<Element> | null = null;

  $("table.wikitable.sortable")
    .first()
    .find("tbody > tr")
    .each((rowIndex, row) => {
      if (rowIndex === 0) {
        // Header row: find the columns
        $(row)
          .find("th")
          .each((i, th) => {
            const text = $(th).text().trim();
            if (text === "Monarch") monarchColIndex = i;
            else if (text === "Sovereign state(s)") countryColIndex = i;
            else if (text === "Title") titleColIndex = i;
          });
        return;
      }
      const cells = $(row).find("td");

      if (!previousCells || cells.length === previousCells.length) {
        previousCells = cells;
      } else {
        const translatedCurrCellsIndices = getNonRowspanIndices(previousCells);
        const denormalisedRow = buildDenormalisedRow(
          cells,
          translatedCurrCellsIndices,
          previousCells
        );
        previousCells = denormalisedRow;
      }
      denormalisedResults.push(previousCells);
    });

  return denormalisedResults;
}

function processMonarchs(denormalisedResults: Cheerio<Element>[]) {
  const $ = cheerio.load("");
  const textAndUrlResults: TextAndUrl[][] = denormalisedResults.map(
    (row, index) => {
      return row.toArray().map((el) => {
        $(el).find("sup").remove();
        const anchorTag = $(el).find("a");
        const text = $(el).text().trim();
        const url = anchorTag.attr("href");
        return {
          text,
          url: url ? prependWikipediaBaseUrl(url) : undefined,
        } as TextAndUrl;
      });
    }
  );

  const monarchRows = textAndUrlResults.map((row) => {
    const country = row[countryColIndex];
    const title = row[titleColIndex];
    const monarchs = [row[monarchColIndex]];
    return { country, title, monarchs } as MonarchRow;
  });

  return mergeMonarchs(monarchRows);
}

function mergeMonarchs(monarchRows: MonarchRow[]) {
  let lastCountry = "";
  let lastTitle = "";

  const mergedMonarchs: MonarchRow[] = [];
  for (const row of monarchRows) {
    if (row.country.text === lastCountry && row.title.text === lastTitle) {
      // Merge monarchs if country and title are the same
      const lastRow = mergedMonarchs[mergedMonarchs.length - 1] as MonarchRow;
      lastRow.monarchs.push(...row.monarchs);
    } else {
      // Add new row
      mergedMonarchs.push({ ...row });
      lastCountry = row.country.text;
      lastTitle = row.title.text;
    }
  }
  return mergedMonarchs;
}

const denormalisedResults = await fetchMonarchs();
const processedMonarchRows = processMonarchs(denormalisedResults);

try {
  await writeFile(
    "src/data/monarchs.json",
    JSON.stringify(processedMonarchRows, null, 2),
    "utf-8"
  );
  console.log("Monarchs data written to src/data/monarchs.json");
} catch (error) {
  console.error("Error writing monarchs.json:", error);
}

// small "bug" because Vatican City (Holy See) has 2 links, but this only supports 1
// it still links to vatican city anyway
