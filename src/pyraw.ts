import { execFile } from "node:child_process";
import * as path from "node:path";
import * as vscode from "vscode";
import { getPythonInterpreterPath } from "./pythonUtils";

export async function listDirPyRaw(dirPath: string): Promise<{ name: string; isDir: boolean }[]> {
  const cfg = vscode.workspace.getConfiguration();
  const connect = cfg.get<string>("mpyWorkbench.connect", "auto") || "auto";
  if (!connect || connect === "auto") throw new Error("No fixed serial port selected");
  const device = connect.replace(/^serial:\/\//, "").replace(/^serial:\//, "");
  
  // Use the actual publisher.name from package.json
  const script = path.join(vscode.extensions.getExtension("DanielBucam.mpy-workbench")!.extensionPath, "scripts", "raw_list_files.py");
  
  // Get Python interpreter path dynamically
  let pythonPath: string;
  try {
    pythonPath = await getPythonInterpreterPath();
  } catch (error) {
    console.warn('Failed to get Python interpreter path for pyraw, using fallback:', error);
    pythonPath = 'python3'; // fallback to original behavior
  }
  
  return new Promise((resolve, reject) => {
    execFile(pythonPath, [script, "--port", device, "--baudrate", "115200", "--path", dirPath], { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      try {
        const data = JSON.parse(String(stdout || "[]"));
        if (Array.isArray(data)) return resolve(data);
      } catch (e) {
        // fallthrough
      }
      resolve([]);
    });
  });
}
