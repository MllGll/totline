import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

function findMsvcLinkDir() {
  if (platform() !== "win32") return null;

  const base =
    "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Tools\\MSVC";
  if (!existsSync(base)) return null;

  const versions = readdirSync(base).sort().reverse();
  for (const version of versions) {
    const linkDir = join(base, version, "bin", "Hostx64", "x64");
    if (existsSync(join(linkDir, "link.exe"))) return linkDir;
  }

  return null;
}

const cargoBin = join(homedir(), ".cargo", "bin");
const pathParts = [];

if (existsSync(cargoBin)) {
  pathParts.push(cargoBin);
}

const msvcLinkDir = findMsvcLinkDir();
if (msvcLinkDir) {
  pathParts.push(msvcLinkDir);
}

const pathSeparator = platform() === "win32" ? ";" : ":";
const env = {
  ...process.env,
  PATH: [...pathParts, process.env.PATH].filter(Boolean).join(pathSeparator),
};

if (!existsSync(join(cargoBin, platform() === "win32" ? "cargo.exe" : "cargo"))) {
  console.error(
    "Rust/Cargo não encontrado. Instale em https://rustup.rs e reinicie o terminal.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const subcommand = args[0] ?? "dev";

const result = spawnSync("npx", ["tauri", subcommand, ...args.slice(1)], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 1);
