import sheetCsv from "./sheet-fallback.csv?raw";
import { rowsFromSheetText } from "@/lib/parse-sheet";

/** Last full read baked into the app. Live poll replaces this when the Sheet opens. */
export const FALLBACK_ROWS = rowsFromSheetText(sheetCsv);
export const FALLBACK_READ_AT = "2 Nov, 16:16";
