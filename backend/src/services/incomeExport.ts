import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Types } from "mongoose";
import { Payment } from "../models/Payment";

type PaidRow = {
  paidAt: Date;
  amount: number;
  currency: string;
  studentName: string;
  courseName: string;
};

export async function fetchPaidPaymentsInRange(
  centerId: Types.ObjectId,
  from: Date,
  to: Date
): Promise<PaidRow[]> {
  const list = await Payment.find({
    centerId,
    status: "PAID",
    paidAt: { $gte: from, $lte: to },
  })
    .sort({ paidAt: 1 })
    .populate("studentId", "fullName")
    .populate("courseId", "name")
    .lean();

  return list.map((p) => ({
    paidAt: p.paidAt!,
    amount: p.amount,
    currency: p.currency || "UZS",
    studentName: (p.studentId as { fullName?: string })?.fullName ?? "—",
    courseName: (p.courseId as { name?: string })?.name ?? "—",
  }));
}

export async function buildIncomeXlsx(
  centerId: Types.ObjectId,
  from: Date,
  to: Date
): Promise<Buffer> {
  const rows = await fetchPaidPaymentsInRange(centerId, from, to);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Income");
  ws.columns = [
    { header: "Paid at", key: "paidAt", width: 22 },
    { header: "Student", key: "student", width: 28 },
    { header: "Course", key: "course", width: 24 },
    { header: "Amount", key: "amount", width: 14 },
    { header: "Currency", key: "currency", width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  let total = 0;
  for (const r of rows) {
    total += r.amount;
    ws.addRow({
      paidAt: r.paidAt.toISOString(),
      student: r.studentName,
      course: r.courseName,
      amount: r.amount,
      currency: r.currency,
    });
  }
  ws.addRow({});
  ws.addRow({ paidAt: "", student: "Total", course: "", amount: total, currency: rows[0]?.currency ?? "UZS" });
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function buildIncomePdf(
  centerName: string,
  from: Date,
  to: Date,
  rows: PaidRow[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text("Income report", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#444").text(centerName, { align: "center" });
    doc.fillColor("#000");
    doc.fontSize(10).text(`${from.toISOString().slice(0, 10)} — ${to.toISOString().slice(0, 10)}`, {
      align: "center",
    });
    doc.moveDown(1);

    doc.fontSize(9);
    const tableTop = doc.y;
    let y = tableTop;
    const col = [40, 130, 260, 360, 420];
    doc.text("Date", col[0], y);
    doc.text("Student", col[1], y);
    doc.text("Course", col[2], y);
    doc.text("Amount", col[3], y);
    y += 14;
    doc.moveTo(40, y).lineTo(520, y).stroke();
    y += 6;

    let total = 0;
    for (const r of rows) {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      doc.text(r.paidAt.toISOString().slice(0, 16).replace("T", " "), col[0], y, { width: 85 });
      doc.text(r.studentName.slice(0, 28), col[1], y, { width: 120 });
      doc.text(r.courseName.slice(0, 22), col[2], y, { width: 95 });
      doc.text(String(r.amount), col[3], y);
      doc.text(r.currency, col[4], y);
      total += r.amount;
      y += 16;
    }
    y += 8;
    doc.fontSize(10).text(`Total: ${total} ${rows[0]?.currency ?? "UZS"}`, 40, y);
    doc.end();
  });
}
