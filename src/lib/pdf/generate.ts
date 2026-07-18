import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ResultPageData } from "@/lib/estimator/fetch-estimate";
import { formatCurrencyRange, formatDate } from "@/lib/format";
import { publicEnv } from "@/lib/env";

const BRAND_PRIMARY = rgb(0x25 / 255, 0x63 / 255, 0xeb / 255);
const BRAND_TEXT = rgb(0x0b / 255, 0x12 / 255, 0x20 / 255);
const BRAND_MUTED = rgb(0x33 / 255, 0x41 / 255, 0x55 / 255);
const BRAND_BORDER = rgb(0xe2 / 255, 0xe8 / 255, 0xf0 / 255);

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

type Cursor = { page: PDFPage; y: number };

export async function generateEstimatePdf(data: ResultPageData, reference: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Dravonix Media Estimate ${reference}`);
  doc.setProducer("Dravonix Project Estimator");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let cursor: Cursor = { page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN };

  const mark = await embedBrandMark(doc);
  if (mark) {
    const markHeight = 26;
    const markWidth = (mark.width / mark.height) * markHeight;
    cursor.page.drawImage(mark, { x: MARGIN, y: cursor.y - markHeight, width: markWidth, height: markHeight });
    cursor.page.drawText("Dravonix", {
      x: MARGIN + markWidth + 10,
      y: cursor.y - markHeight + 5,
      size: 20,
      font: bold,
      color: BRAND_TEXT,
    });
    cursor = { page: cursor.page, y: cursor.y - markHeight - 8 };
  } else {
    cursor = drawHeading(doc, cursor, bold, "Dravonix Media", 20, BRAND_PRIMARY);
  }

  cursor = drawText(cursor, regular, "Preliminary Project Estimate", 11, BRAND_MUTED);
  cursor = spacer(cursor, 16);

  cursor = drawLabelValue(cursor, bold, regular, "Reference", reference);
  cursor = drawLabelValue(cursor, bold, regular, "Prepared for", data.lead.full_name);
  if (data.lead.business_name) cursor = drawLabelValue(cursor, bold, regular, "Business", data.lead.business_name);
  cursor = drawLabelValue(cursor, bold, regular, "Date", formatDate(data.estimate.created_at));
  cursor = spacer(cursor, 10);
  cursor = drawDivider(cursor);

  cursor = drawHeading(doc, cursor, bold, "Investment Summary", 14, BRAND_TEXT);
  cursor = drawLabelValue(
    cursor,
    bold,
    regular,
    "One-time",
    formatCurrencyRange(data.estimate.one_time_min, data.estimate.one_time_max)
  );
  if (data.estimate.monthly_min > 0) {
    cursor = drawLabelValue(
      cursor,
      bold,
      regular,
      "Monthly",
      `${formatCurrencyRange(data.estimate.monthly_min, data.estimate.monthly_max)} / month`
    );
  }
  cursor = drawLabelValue(cursor, bold, regular, "Estimated timeline", data.estimate.estimated_timeline_label);
  cursor = spacer(cursor, 10);
  cursor = drawDivider(cursor);

  cursor = drawHeading(doc, cursor, bold, "Service Breakdown", 14, BRAND_TEXT);
  for (const item of data.items) {
    const priceText = `${formatCurrencyRange(item.price_min, item.price_max)}${item.unit === "monthly" ? " /mo" : ""}`;
    cursor = drawRow(doc, cursor, regular, bold, item.name, priceText);
  }
  cursor = spacer(cursor, 10);
  cursor = drawDivider(cursor);

  const assumptions = data.estimate.assumptions as string[];
  if (assumptions.length > 0) {
    cursor = drawHeading(doc, cursor, bold, "Main Assumptions", 14, BRAND_TEXT);
    for (const a of assumptions) cursor = drawBullet(doc, cursor, regular, a);
    cursor = spacer(cursor, 10);
  }

  const exclusions = data.estimate.exclusions as string[];
  if (exclusions.length > 0) {
    cursor = drawHeading(doc, cursor, bold, "Main Exclusions", 14, BRAND_TEXT);
    for (const e of exclusions) cursor = drawBullet(doc, cursor, regular, e);
    cursor = spacer(cursor, 14);
  }

  cursor = drawParagraph(
    doc,
    cursor,
    regular,
    "This is a preliminary estimate based on the information provided. The final quotation will be prepared after a detailed project discussion. Domain, hosting, premium software, paid plugins, advertising budgets, payment-gateway fees, taxes, and other third-party expenses may be charged separately.",
    9,
    BRAND_MUTED
  );

  cursor = spacer(cursor, 20);
  cursor = drawText(cursor, regular, publicEnv.NEXT_PUBLIC_ESTIMATOR_URL, 9, BRAND_MUTED);
  cursor = drawText(cursor, regular, publicEnv.NEXT_PUBLIC_CONTACT_EMAIL, 9, BRAND_MUTED);

  return doc.save();
}

/**
 * Loads the brand mark over HTTP rather than `node:fs` — this module also
 * runs on Cloudflare Workers (via OpenNext), which have no filesystem
 * access to `public/`. Falls back to a plain text wordmark if the fetch
 * fails for any reason, so PDF generation never breaks on this.
 */
async function embedBrandMark(doc: PDFDocument) {
  try {
    const response = await fetch(new URL("/brand/icon.png", publicEnv.NEXT_PUBLIC_ESTIMATOR_URL));
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    return await doc.embedPng(bytes);
  } catch (error) {
    console.error("[pdf] Failed to embed brand mark:", error);
    return null;
  }
}

function ensureSpace(doc: PDFDocument, cursor: Cursor, needed: number): Cursor {
  if (cursor.y - needed > MARGIN) return cursor;
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { page, y: PAGE_HEIGHT - MARGIN };
}

function drawHeading(doc: PDFDocument, cursor: Cursor, font: PDFFont, text: string, size: number, color: ReturnType<typeof rgb>): Cursor {
  const c = ensureSpace(doc, cursor, size + 12);
  c.page.drawText(text, { x: MARGIN, y: c.y - size, size, font, color });
  return { page: c.page, y: c.y - size - 10 };
}

function drawText(cursor: Cursor, font: PDFFont, text: string, size: number, color: ReturnType<typeof rgb>): Cursor {
  cursor.page.drawText(text, { x: MARGIN, y: cursor.y - size, size, font, color });
  return { page: cursor.page, y: cursor.y - size - 6 };
}

function drawParagraph(doc: PDFDocument, cursor: Cursor, font: PDFFont, text: string, size: number, color: ReturnType<typeof rgb>): Cursor {
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  const words = text.split(" ");
  let line = "";
  let c = cursor;
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth) {
      c = ensureSpace(doc, c, size + 4);
      c.page.drawText(line, { x: MARGIN, y: c.y - size, size, font, color });
      c = { page: c.page, y: c.y - size - 4 };
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) {
    c = ensureSpace(doc, c, size + 4);
    c.page.drawText(line, { x: MARGIN, y: c.y - size, size, font, color });
    c = { page: c.page, y: c.y - size - 4 };
  }
  return c;
}

function drawLabelValue(cursor: Cursor, boldFont: PDFFont, regularFont: PDFFont, label: string, value: string): Cursor {
  const size = 10;
  cursor.page.drawText(`${label}:`, { x: MARGIN, y: cursor.y - size, size, font: boldFont, color: BRAND_TEXT });
  cursor.page.drawText(value, { x: MARGIN + 130, y: cursor.y - size, size, font: regularFont, color: BRAND_TEXT });
  return { page: cursor.page, y: cursor.y - size - 8 };
}

function drawRow(doc: PDFDocument, cursor: Cursor, regularFont: PDFFont, boldFont: PDFFont, label: string, value: string): Cursor {
  const c = ensureSpace(doc, cursor, 20);
  const size = 10;
  c.page.drawText(label, { x: MARGIN, y: c.y - size, size, font: regularFont, color: BRAND_TEXT });
  const valueWidth = boldFont.widthOfTextAtSize(value, size);
  c.page.drawText(value, { x: PAGE_WIDTH - MARGIN - valueWidth, y: c.y - size, size, font: boldFont, color: BRAND_TEXT });
  return { page: c.page, y: c.y - size - 10 };
}

function drawBullet(doc: PDFDocument, cursor: Cursor, font: PDFFont, text: string): Cursor {
  const size = 9.5;
  const maxWidth = PAGE_WIDTH - MARGIN * 2 - 12;
  const words = text.split(" ");
  let line = "";
  let c = ensureSpace(doc, cursor, size + 6);
  let first = true;
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) > maxWidth) {
      c = ensureSpace(doc, c, size + 4);
      if (first) c.page.drawText("•", { x: MARGIN, y: c.y - size, size, font, color: BRAND_MUTED });
      c.page.drawText(line, { x: MARGIN + 12, y: c.y - size, size, font, color: BRAND_MUTED });
      c = { page: c.page, y: c.y - size - 4 };
      line = word;
      first = false;
    } else {
      line = trial;
    }
  }
  if (line) {
    c = ensureSpace(doc, c, size + 4);
    if (first) c.page.drawText("•", { x: MARGIN, y: c.y - size, size, font, color: BRAND_MUTED });
    c.page.drawText(line, { x: MARGIN + 12, y: c.y - size, size, font, color: BRAND_MUTED });
    c = { page: c.page, y: c.y - size - 4 };
  }
  return { page: c.page, y: c.y - 4 };
}

function drawDivider(cursor: Cursor): Cursor {
  cursor.page.drawLine({
    start: { x: MARGIN, y: cursor.y },
    end: { x: PAGE_WIDTH - MARGIN, y: cursor.y },
    thickness: 0.5,
    color: BRAND_BORDER,
  });
  return { page: cursor.page, y: cursor.y - 14 };
}

function spacer(cursor: Cursor, amount: number): Cursor {
  return { page: cursor.page, y: cursor.y - amount };
}
