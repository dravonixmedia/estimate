import { customAlphabet } from "nanoid";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const generate = customAlphabet(ALPHABET, 8);

export function generateEstimateReference(): string {
  return `DRX-${generate()}`;
}
