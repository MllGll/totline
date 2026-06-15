import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const VERSION_PATTERN =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const args = process.argv.slice(2);
const requestedVersion = args.find((arg) => !arg.startsWith("--"));
const dryRun = args.includes("--dry-run");

if (!requestedVersion || !VERSION_PATTERN.test(requestedVersion)) {
  fail(
    [
      "Usage: npm run release:tag -- v0.1.1",
      "Dry run: npm run release:tag -- v0.1.1 --dry-run",
      "",
      "The version must follow semantic versioning.",
    ].join("\n"),
  );
}

const version = requestedVersion.replace(/^v/, "");
const tag = `v${version}`;
const filesToStage = [
  "package.json",
  "package-lock.json",
  "src-tauri/tauri.conf.json",
].filter((path) => existsSync(path));

run("git", ["rev-parse", "--is-inside-work-tree"]);

if (!dryRun) {
  const branch = run("git", ["branch", "--show-current"]).trim();

  if (branch !== "main") {
    fail(`Release tags must be created from main. Current branch: ${branch}`);
  }

  const status = run("git", ["status", "--porcelain"]).trim();

  if (status) {
    fail(
      [
        "The working tree must be clean before creating a release tag.",
        "Commit or stash the current changes, then run this command again.",
      ].join("\n"),
    );
  }

  const existingTag = run("git", [
    "tag",
    "--list",
    tag,
  ]).trim();

  if (existingTag) {
    fail(`Tag ${tag} already exists locally.`);
  }
}

updateJson("package.json", (json) => {
  json.version = version;
});

if (existsSync("package-lock.json")) {
  updateJson("package-lock.json", (json) => {
    json.version = version;

    if (json.packages?.[""]) {
      json.packages[""].version = version;
    }
  });
}

updateJson("src-tauri/tauri.conf.json", (json) => {
  json.version = version;
});

if (dryRun) {
  console.log(`[dry-run] Would update release version to ${version}.`);
  console.log(`[dry-run] Would create and push tag ${tag}.`);
  process.exit(0);
}

run("git", ["add", ...filesToStage], { stdio: "inherit" });
run("git", ["commit", "-m", `chore: release ${tag}`], { stdio: "inherit" });
run("git", ["tag", "-a", tag, "-m", `Release ${tag}`], {
  stdio: "inherit",
});
run("git", ["push", "origin", "main"], { stdio: "inherit" });
run("git", ["push", "origin", tag], { stdio: "inherit" });

console.log(`Release tag ${tag} pushed successfully.`);

function updateJson(path, update) {
  const json = JSON.parse(readFileSync(path, "utf8"));
  update(json);

  if (!dryRun) {
    writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
  }
}

function run(command, commandArgs, options = {}) {
  try {
    return execFileSync(command, commandArgs, {
      encoding: "utf8",
      ...options,
    });
  } catch (error) {
    if (error.stdout) {
      process.stdout.write(error.stdout);
    }

    if (error.stderr) {
      process.stderr.write(error.stderr);
    }

    process.exit(error.status || 1);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
