const { Workbook } = require('@cj-tech-master/excelts');
const path = require('path');
const fs = require('fs');

async function main() {
  const dir = "d:\\Code\\Path_Minded\\server\\uploads\\curriculum";
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  const filePath = path.join(dir, files[files.length - 1]);
  const wb = new Workbook();
  await wb.xlsx.readFile(filePath);
  
  for (const ws of wb.worksheets) {
    console.log("\n========================================");
    console.log("Worksheet:", ws.name);
    console.log("Rows count:", ws.rowCount);
    console.log("========================================");
    
    // Print first 15 rows of the sheet
    for (let i = 1; i <= Math.min(ws.rowCount, 15); i++) {
      const row = ws.getRow(i);
      const vals = [];
      for (let c = 1; c <= 30; c++) {
        const cell = row.getCell(c);
        vals.push(cell.value !== undefined ? cell.value : null);
      }
      const mappedVals = vals.map(v => {
        if (v === null) return '';
        if (typeof v === 'object') {
          if (v.result !== undefined) return v.result;
          if (v.text !== undefined) return v.text;
          if (Array.isArray(v.richText)) return v.richText.map(rt => rt.text || '').join('');
          return JSON.stringify(v);
        }
        return v;
      });
      if (mappedVals.some(v => v !== '')) {
        console.log(`Row ${i}:`, mappedVals.slice(0, 24));
      }
    }
  }
}

main().catch(console.error);
