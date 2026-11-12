import XLSX from "xlsx";

const ID_HEADERS = [
  "emp id",
  "student id",
  "student code",
  "roll no",
  "roll number"
];

const NAME_HEADERS = [
  "name",
  "student name"
];

const VALID_MARKS = new Set([
  "P",
  "A",
  "L",
  "H",
  "W",
  "-"
]);

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function parseAttendanceWorkbook(buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true
  });

  return workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: ""
    });

    const headerIndex = rows.findIndex((row) => {
      const headers = row.map(normalize);

      return (
        headers.some((header) => ID_HEADERS.includes(header)) &&
        headers.some((header) => NAME_HEADERS.includes(header))
      );
    });

    if (headerIndex === -1) {
      return {
        sheetName,
        rows: [],
        errors: [
          "No valid header row found. Expected a student ID column and a name column."
        ],
        valid: false
      };
    }

    const headers = rows[headerIndex].map(normalize);

    const idIndex = headers.findIndex((h) =>
      ID_HEADERS.includes(h)
    );

    const nameIndex = headers.findIndex((h) =>
      NAME_HEADERS.includes(h)
    );

    const dayColumns = headers
      .map((header, index) => ({
        header,
        index
      }))
      .filter(({ header }) => {
        return (
          /^\d{1,2}$/.test(header) &&
          Number(header) >= 1 &&
          Number(header) <= 31
        );
      });

    const seenIds = new Set();
    const records = [];
    const sheetErrors = [];

    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];

      const studentCode = String(row[idIndex] ?? "").trim();
      const fullName = String(row[nameIndex] ?? "").trim();

      if (!studentCode && !fullName) {
        continue;
      }

      const errors = [];

      if (!studentCode) {
        errors.push("Student ID is missing.");
      }

      if (!fullName) {
        errors.push("Student name is missing.");
      }

      if (studentCode && seenIds.has(studentCode)) {
        errors.push("Duplicate student ID in this worksheet.");
      }

      if (studentCode) {
        seenIds.add(studentCode);
      }

      const attendance = {};

      for (const column of dayColumns) {
        const day = Number(column.header);
        const mark = String(row[column.index] ?? "")
          .trim()
          .toUpperCase();

        attendance[day] = mark;

        if (mark && !VALID_MARKS.has(mark)) {
          errors.push(`Invalid mark "${mark}" on day ${day}.`);
        }
      }

      const record = {
        rowNumber: i + 1,
        studentCode,
        fullName,
        attendance,
        errors
      };

      records.push(record);

      if (errors.length) {
        sheetErrors.push({
          rowNumber: i + 1,
          studentCode,
          errors
        });
      }
    }

    return {
      sheetName,
      valid: sheetErrors.length === 0,
      recordCount: records.length,
      records,
      errors: sheetErrors
    };
  });
}