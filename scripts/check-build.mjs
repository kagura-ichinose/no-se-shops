import { access } from "node:fs/promises";

const requiredFiles = ["index.html", "styles.css", "app.js", "api/cards.js"];

await Promise.all(requiredFiles.map((file) => access(file)));
console.log("Build check complete.");
