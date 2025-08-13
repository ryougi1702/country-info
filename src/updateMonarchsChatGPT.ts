import fetch from "node-fetch";
import * as cheerio from "cheerio";
import type { WikipediaParseResponse } from "./types.js";

async function fetchMonarchs() {
  const url =
    "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_current_monarchs_of_sovereign_states&format=json&origin=*";

  const res = await fetch(url);
  const data = (await res.json()) as WikipediaParseResponse;
  const html = data.parse.text["*"];
  const $ = cheerio.load(html);

  let titleColIndex = 0; // default
  let monarchColIndex = 1;
  let countryColIndex = 4;

  type CompleteMonarchy = {
    country: string;
    title: string;
    monarchs: string[];
  };

  // To track active rowspan counts for each column to keep cells aligned
  const rowspanCounters: { [colIndex: number]: number } = {};

  // To store parsed results
  let previousCompleteMonarchy: CompleteMonarchy = {
    country: "",
    title: "",
    monarchs: [],
  };
  const results: CompleteMonarchy[] = [];

  $("table.wikitable.sortable")
    .first()
    .find("tbody > tr")
    .each((rowIndex, row) => {
      console.log(`Processing row ${rowIndex + 1}`);
      if (rowIndex === 0) {
        // Find header indices
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

      console.log(
        `cells content:`,
        cells.map((i, cell) => $(cell).text().trim()).get()
      );

      const currRowInfo: any[] = [];
      // eg. ["King"", "Charles", null, "Malta"]

      // STEP 1: Check for rowspans in previous rows and fill in nulls
      let currCellIndex = 0;
      let actualTdIndex = 0;
      // Decrement existing rowspans from previous rows, and fill null placeholders

      while (
        currCellIndex <=
        Math.max(titleColIndex, monarchColIndex, countryColIndex)
      ) {
        let currRowspanCount = rowspanCounters[currCellIndex];

        if (currRowspanCount && currRowspanCount > 0) {
          // This column is covered by a rowspan from a previous row, so push null to indicate no new cell here
          currRowInfo[currCellIndex] = null;
          rowspanCounters[currCellIndex] = currRowspanCount--;
        } else {
          currRowInfo[currCellIndex] = cells[actualTdIndex];
          const rowspanValue = parseInt(
            $(cells[actualTdIndex]).attr("rowspan") ?? "1",
            10
          );
          if (rowspanValue > 1) {
            rowspanCounters[currCellIndex] = rowspanValue - 1; // current row counts as 1
          }
          actualTdIndex++;
        }
        // This column is not covered by a rowspan, so we can fill it with the current cellj
        currCellIndex++;
      }

      console.log(
        "filled in RowInfo:",
        currRowInfo.map((cellEle) => $(cellEle).text().trim())
      );

      // STEP 2: Traverse current row cells (the list can be shorter based on rowspan)
      // and also check for rowspans in each <td> in the current row
      //   while (actualTdIndex < cells.length) {
      //     // Skip columns covered by rowspan (nulls)
      //     while (currRowInfo[currCellIndex] === null) {
      //       currCellIndex++;
      //     }

      //     const cell = cells[actualTdIndex];
      //     console.log("cell at actualTdIndex:" + $(cell).text().trim());
      //     currRowInfo[currCellIndex] = cell;

      //     // Handle rowspan as before
      //     const rowspanAttr = $(cell).attr("rowspan");
      //     if (rowspanAttr) {
      //       const rowspan = parseInt(rowspanAttr, 10);
      //       if (rowspan > 1) {
      //         rowspanCounters[currCellIndex] = rowspan - 1;
      //       }
      //     }

      //     actualTdIndex++;
      //     currCellIndex++;
      //   }
      // Now extract text from currentRowCells by column
      const getText = (col: number): string | null => {
        const cell = currRowInfo[col];
        console.log(`cell at index ${col}:`, $(cell).text().trim());
        if (!cell) return null;
        return $(cell).text().trim() || null;
      };

      let country = getText(countryColIndex);
      let title = getText(titleColIndex);
      let monarch = getText(monarchColIndex);
      console.log(
        `Row ${
          rowIndex + 1
        } - Country: ${country}, Title: ${title}, Monarch: ${monarch}`
      );

      if (country && title && monarch) {
        console.log(`Complete row: ${country}, ${title}, ${monarch}`);
        if (previousCompleteMonarchy.monarchs.length > 0)
          results.push(previousCompleteMonarchy);
        console.log(
          `Pushed previousCompleteMonarchy: ${previousCompleteMonarchy.country}, ${previousCompleteMonarchy.title}, ${previousCompleteMonarchy.monarchs}`
        );

        previousCompleteMonarchy = {
          country,
          title,
          monarchs: [monarch],
        };
        console.log(
          `New previousCompleteMonarchy: ${previousCompleteMonarchy.country}, ${previousCompleteMonarchy.title}, ${previousCompleteMonarchy.monarchs}`
        );
        return;
      }

      if (country === null) {
        // Partial row: merge into previousCompleteMonarchy
        if (title) previousCompleteMonarchy.title = title;
        if (monarch) previousCompleteMonarchy.monarchs.push(monarch);
      } else {
        // Complete row: push old entry and start a new one
        results.push(previousCompleteMonarchy);
        previousCompleteMonarchy = {
          country,
          title: previousCompleteMonarchy.title,
          monarchs: [
            ...previousCompleteMonarchy.monarchs,
            // ...(monarch ? [monarch] : []),
          ],
        };
      }
    });

  results.push(previousCompleteMonarchy); // Push the last entry

  //   console.log(JSON.stringify(results, null, 2));
}

fetchMonarchs();
