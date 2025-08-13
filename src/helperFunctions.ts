import type { Cheerio } from "cheerio";
import { Element } from "domhandler";
import * as cheerio from "cheerio";
export const getNonRowspanIndices = (fullTdArray: Cheerio<Element>) => {
  const nonRowspanIndice: number[] = [];

  fullTdArray.each((index, td) => {
    if (td.tagName !== "td") {
      console.warn(`Element at index ${index} is not a <td>:`, td);
    }

    const tdRowspan = parseInt(td.attribs["rowspan"] ?? "1");
    if (tdRowspan <= 1) {
      nonRowspanIndice.push(index);
    }
  });

  return nonRowspanIndice;
};

export const buildDenormalisedRow = (
  subTdArray: Cheerio<Element>,
  nonRowspanIndices: number[],
  fullTdArray: Cheerio<Element>
): Cheerio<Element> => {
  const resultElements: Element[] = [];

  fullTdArray.each((index, td) => {
    if (nonRowspanIndices.includes(index)) {
      const replacementIndex = nonRowspanIndices.indexOf(index);
      const replacement = subTdArray.eq(replacementIndex).get(0);
      if (replacement) {
        resultElements.push(replacement);
      } else {
        resultElements.push(td);
      }
    } else {
      resultElements.push(td);
    }
  });

  // Wrap the array of Elements back into Cheerio and return
  const $ = cheerio.load("");
  return $(resultElements);
};
