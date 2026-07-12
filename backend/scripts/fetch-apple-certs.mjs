/**
 * Download the Apple Root CA certificates required to verify StoreKit signed
 * data (@apple/app-store-server-library). Public certificates; runs during the
 * deploy build (see package.json "build") so ./certs is always populated.
 * Node-native (fetch) so it works on any platform — no curl dependency.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const certsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "certs");
mkdirSync(certsDir, { recursive: true });

const CERTS = ["AppleRootCA-G3", "AppleRootCA-G2"];

for (const name of CERTS) {
  const url = `https://www.apple.com/certificateauthority/${name}.cer`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to fetch ${name}: HTTP ${res.status}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(certsDir, `${name}.cer`), buf);
  console.log(`✓ ${name}.cer (${buf.length} bytes)`);
}
console.log(`Apple root certs ready in ${certsDir}`);
