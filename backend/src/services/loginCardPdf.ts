import PDFDocument from "pdfkit";

export interface LoginCardCredentials {
  studentName: string;
  studentLogin: string;
  studentPassword: string;
  parent1Login: string;
  parent1Password: string;
  parent2Login: string;
  parent2Password: string;
  centerName: string;
}

export function buildLoginCardPdf(data: LoginCardCredentials): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Study Center CRM — Login Card", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#444").text(data.centerName, { align: "center" });
    doc.fillColor("#000");
    doc.moveDown(1.5);

    doc.fontSize(12).text(`Student: ${data.studentName}`, { continued: false });
    doc.moveDown(0.8);
    doc.fontSize(11);
    doc.text("Student account");
    doc.text(`Login: ${data.studentLogin}`);
    doc.text(`Password: ${data.studentPassword}`);
    doc.moveDown(1);

    doc.text("Parent 1");
    doc.text(`Login: ${data.parent1Login}`);
    doc.text(`Password: ${data.parent1Password}`);
    doc.moveDown(0.8);

    doc.text("Parent 2");
    doc.text(`Login: ${data.parent2Login}`);
    doc.text(`Password: ${data.parent2Password}`);
    doc.moveDown(1.2);

    doc.fontSize(9).fillColor("#a00").text(
      "Keep this document secure. Passwords are shown only once at creation.",
      { align: "left" }
    );

    doc.end();
  });
}
