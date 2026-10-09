import { num, money, age, pctFormatted } from "./helpers";

export { num, money, age, pctFormatted };

export function escSymbol(s: string): string {
  return String(s || "?").replace(/^\$+/, "");
}
