"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDirPyRaw = listDirPyRaw;
const node_child_process_1 = require("node:child_process");
const path = require("node:path");
const vscode = require("vscode");
const pythonUtils_1 = require("./pythonUtils");
async function listDirPyRaw(dirPath) {
    const cfg = vscode.workspace.getConfiguration();
    const connect = cfg.get("mpyWorkbench.connect", "auto") || "auto";
    if (!connect || connect === "auto")
        throw new Error("No fixed serial port selected");
    const device = connect.replace(/^serial:\/\//, "").replace(/^serial:\//, "");
    // Use the actual publisher.name from package.json
    const script = path.join(vscode.extensions.getExtension("DanielBucam.mpy-workbench").extensionPath, "scripts", "raw_list_files.py");
    // Get Python interpreter path dynamically
    let pythonPath;
    try {
        pythonPath = await (0, pythonUtils_1.getPythonInterpreterPath)();
    }
    catch (error) {
        console.warn('Failed to get Python interpreter path for pyraw, using fallback:', error);
        pythonPath = 'python3'; // fallback to original behavior
    }
    return new Promise((resolve, reject) => {
        (0, node_child_process_1.execFile)(pythonPath, [script, "--port", device, "--baudrate", "115200", "--path", dirPath], { timeout: 10000 }, (err, stdout, stderr) => {
            if (err)
                return reject(new Error(stderr || err.message));
            try {
                const data = JSON.parse(String(stdout || "[]"));
                if (Array.isArray(data))
                    return resolve(data);
            }
            catch (e) {
                // fallthrough
            }
            resolve([]);
        });
    });
}
//# sourceMappingURL=pyraw.js.map