const fs = require('fs');
// Use the internal path to avoid pdf-parse v1's test-file side-effect on require
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text.trim();
}

module.exports = { extractTextFromPDF };
