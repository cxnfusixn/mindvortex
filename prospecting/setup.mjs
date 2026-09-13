import { randomBytes } from "node:crypto";
import { writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { hashPassword } from "./lib/auth.mjs";
const file = resolve(".env.prospecting.local");
try {
  await access(file);
  throw Error("Konfiguracja już istnieje. Nie nadpisano haseł ani ustawień.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const password = randomBytes(24).toString("base64url");
const index = process.argv.indexOf("--origin");
const origin = new URL(
  index >= 0 ? process.argv[index + 1] : "http://localhost:3000",
).origin;
await writeFile(
  file,
  `PROSPECTING_PASSWORD_HASH=${await hashPassword(password)}\nPROSPECTING_PUBLIC_URL=${origin}\nPROSPECTING_DATA_DIR=.prospecting-data\nPROSPECTING_OPENAI_API_KEY=\nPROSPECTING_MODEL=gpt-5.4\nPROSPECTING_SEND_ENABLED=false\n`,
  { mode: 0o600, flag: "wx" },
);
await writeFile(
  resolve(".prospecting-credentials.txt"),
  `Prywatny moduł MindVortex\nAdres: ${origin}/prospecting\nHasło: ${password}\n\nPrzenieś hasło do menedżera haseł i usuń ten plik.\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Utworzono .env.prospecting.local oraz prywatny plik .prospecting-credentials.txt. Wysyłka pozostaje wyłączona.",
);
