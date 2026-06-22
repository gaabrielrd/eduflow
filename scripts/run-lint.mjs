import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const tasks = [
  {
    args: ["-e", "console.log('eslint config package ready')"],
    cwd: path.join(rootDir, "packages", "eslint-config"),
    label: "@eduflow/eslint-config"
  },
  {
    args: ["-e", "console.log('lint placeholder for @eduflow/config')"],
    cwd: path.join(rootDir, "packages", "config"),
    label: "@eduflow/config"
  },
  {
    args: ["-e", "console.log('lint placeholder for @eduflow/types')"],
    cwd: path.join(rootDir, "packages", "types"),
    label: "@eduflow/types"
  },
  {
    args: ["-e", "console.log('lint placeholder for @eduflow/ui')"],
    cwd: path.join(rootDir, "packages", "ui"),
    label: "@eduflow/ui"
  },
  {
    args: [path.join(rootDir, "node_modules", "eslint", "bin", "eslint.js"), "."],
    cwd: path.join(rootDir, "apps", "api"),
    label: "@eduflow/api"
  },
  {
    args: [path.join(rootDir, "node_modules", "eslint", "bin", "eslint.js"), "."],
    cwd: path.join(rootDir, "apps", "web"),
    label: "@eduflow/web"
  }
];

function runTask(task) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`\n> ${task.label}\n`);

    const child = spawn(process.execPath, task.args, {
      cwd: task.cwd,
      shell: false,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${task.label} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

for (const task of tasks) {
  // Sequential execution keeps the root lint deterministic on Windows.
  await runTask(task);
}
