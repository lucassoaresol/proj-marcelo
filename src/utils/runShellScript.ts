import { exec } from "node:child_process";

export function runShellScript(scriptPath: string) {
  exec(scriptPath, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar '${scriptPath}': ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}
