import "server-only";
import { Workbook } from "exceljs";
import {
  categorySelectValues,
  PRODUCT_IMPORT_COLUMNS,
  PRODUCT_IMPORT_MAX_ROWS,
  sampleImportRows,
} from "@/lib/product-import";
import type { Category } from "@/types";

export async function buildSampleXlsxBuffer(categories: Category[]) {
  const workbook = new Workbook();
  const products = workbook.addWorksheet("Products");
  const categorySheet = workbook.addWorksheet("Categories");
  categorySheet.state = "veryHidden";

  const labels = categorySelectValues(categories);
  if (labels.length) {
    labels.forEach((label, index) => {
      categorySheet.getCell(index + 1, 1).value = label;
    });
  } else {
    categorySheet.getCell(1, 1).value = "";
  }

  products.addRow([...PRODUCT_IMPORT_COLUMNS]);
  products.getRow(1).font = { bold: true };
  for (const row of sampleImportRows(categories)) {
    products.addRow(PRODUCT_IMPORT_COLUMNS.map((key) => row[key]));
  }

  const categoryCol = PRODUCT_IMPORT_COLUMNS.indexOf("category") + 1;
  const lastOption = Math.max(labels.length, 1);
  const categoryValidation = {
    type: "list" as const,
    allowBlank: true,
    formulae: [`Categories!$A$1:$A$${lastOption}`],
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Category",
    error: "Choose a category from the list",
  };
  for (let row = 2; row <= PRODUCT_IMPORT_MAX_ROWS + 1; row += 1) {
    products.getCell(row, categoryCol).dataValidation = categoryValidation;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
