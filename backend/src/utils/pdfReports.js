import PDFDocument from "pdfkit";

export function createAttendancePdf({
  title = "Attendance Report",
  course = "",
  batch = "",
  academicYear = "",
  threshold = 75,
  students = []
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: {
        top: 40,
        bottom: 40,
        left: 35,
        right: 35
      },
      bufferPages: true
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    const drawHeader = () => {
      doc.font("Helvetica-Bold")
        .fontSize(16)
        .text("NATIONAL INSTITUTE OF ELECTRONICS & INFORMATION TECHNOLOGY", {
          align: "center"
        });

      doc.moveDown(0.3);

      doc.fontSize(13).text(title, {
        align: "center"
      });

      doc.moveDown(0.5);

      doc.font("Helvetica")
        .fontSize(9)
        .text(`Course: ${course || "All courses"}`);

      doc.text(`Batch: ${batch || "All batches"}`);

      doc.text(`Academic year: ${academicYear || "Not specified"}`);

      doc.text(`Eligibility threshold: ${threshold}%`);

      doc.moveDown();

      doc.font("Helvetica-Bold").fontSize(9);

      doc.text(
        "Student ID",
        35,
        doc.y,
        { width: 90 }
      );

      doc.text(
        "Student Name",
        130,
        doc.y - 10,
        { width: 170 }
      );

      doc.text(
        "Classes",
        310,
        doc.y - 10,
        { width: 55 }
      );

      doc.text(
        "Present",
        370,
        doc.y - 10,
        { width: 55 }
      );

      doc.text(
        "Absent",
        430,
        doc.y - 10,
        { width: 55 }
      );

      doc.text(
        "Attendance %",
        490,
        doc.y - 10,
        { width: 80 }
      );

      doc.text(
        "Eligibility",
        575,
        doc.y - 10,
        { width: 100 }
      );

      doc.moveDown(0.6);
      doc.moveTo(35, doc.y).lineTo(805, doc.y).stroke();
      doc.moveDown(0.5);
    };

    drawHeader();

    for (const student of students) {
      if (doc.y > 520) {
        doc.addPage();
        drawHeader();
      }

      const classes = Number(student.classesConducted || 0);
      const present = Number(student.present || 0);
      const absent = Number(student.absent || 0);

      const percentage =
        classes > 0
          ? Number(((present / classes) * 100).toFixed(2))
          : 0;

      const eligible =
        classes > 0 && percentage >= Number(threshold);

      const rowY = doc.y;

      doc.font("Helvetica").fontSize(8);

      doc.text(String(student.studentCode || ""), 35, rowY, {
        width: 90
      });

      doc.text(String(student.fullName || ""), 130, rowY, {
        width: 170
      });

      doc.text(String(classes), 310, rowY, {
        width: 55
      });

      doc.text(String(present), 370, rowY, {
        width: 55
      });

      doc.text(String(absent), 430, rowY, {
        width: 55
      });

      doc.text(`${percentage}%`, 490, rowY, {
        width: 80
      });

      doc.text(
        classes === 0
          ? "No records"
          : eligible
            ? "Eligible"
            : "Below threshold",
        575,
        rowY,
        { width: 100 }
      );

      doc.moveDown(1.2);
    }

    doc.moveDown();

    doc.fontSize(8).text(
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      { align: "left" }
    );

    doc.text(
      "This report must be verified against approved attendance records and institutional policy.",
      { align: "left" }
    );

    doc.end();
  });
}