const fs = require('fs');
const path = require('path');

const dir = "d:\\Code\\Path_Minded\\server\\uploads\\curriculum";
console.log("Checking directory:", dir);
console.log("Exists?", fs.existsSync(dir));
if (fs.existsSync(dir)) {
  console.log("Files:", fs.readdirSync(dir));
}
