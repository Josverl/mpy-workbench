"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPythonInterpreterPath = getPythonInterpreterPath;
exports.getPythonFallbacks = getPythonFallbacks;
const vscode = require("vscode");
/**
 * Gets the Python interpreter path using VSCode's Python extension API when available,
 * with fallbacks for when the Python extension isn't available or active.
 *
 * This addresses the issue where hardcoded 'python3' doesn't respect the user's
 * selected Python environment, causing import errors for dependencies like pyserial.
 */
async function getPythonInterpreterPath() {
    // Method 1: Try to use Python extension API (Recommended)
    try {
        const pythonExtension = vscode.extensions.getExtension('ms-python.python');
        if (pythonExtension) {
            if (!pythonExtension.isActive) {
                await pythonExtension.activate();
            }
            const pythonApi = pythonExtension.exports;
            // Get the active environment for the current workspace
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder && pythonApi?.environments) {
                try {
                    const activeEnvPath = pythonApi.environments.getActiveEnvironmentPath(workspaceFolder.uri);
                    if (activeEnvPath) {
                        const environment = await pythonApi.environments.resolveEnvironment(activeEnvPath);
                        const interpreterPath = environment?.executable?.uri?.fsPath;
                        if (interpreterPath) {
                            return interpreterPath;
                        }
                    }
                }
                catch (error) {
                    // If the new API fails, continue to fallbacks
                    console.warn('Failed to get Python interpreter from extension API:', error);
                }
            }
        }
    }
    catch (error) {
        // If Python extension API fails, continue to fallbacks
        console.warn('Failed to access Python extension:', error);
    }
    // Method 2: Fallback using workspace configuration
    try {
        const pythonConfig = vscode.workspace.getConfiguration('python');
        const pythonPath = pythonConfig.get('defaultInterpreterPath');
        if (pythonPath && pythonPath !== 'python') {
            return pythonPath;
        }
    }
    catch (error) {
        console.warn('Failed to get Python path from configuration:', error);
    }
    // Method 3: Platform-specific fallbacks
    return getPlatformDefaultPython();
}
/**
 * Returns platform-appropriate Python executable names to try.
 * Handles differences between Windows (python.exe, py.exe) and Unix (python3, python).
 */
function getPlatformDefaultPython() {
    const platform = process.platform;
    if (platform === 'win32') {
        // On Windows, prefer 'python' over 'python3' as it's more common
        // and py launcher can handle version selection
        return 'python';
    }
    else {
        // On Unix-like systems, prefer 'python3' to avoid Python 2
        return 'python3';
    }
}
/**
 * Gets alternative Python command names to try if the primary one fails.
 * This provides a list of common Python executable names for fallback attempts.
 */
function getPythonFallbacks() {
    const platform = process.platform;
    if (platform === 'win32') {
        return ['python', 'py', 'python3', 'python.exe', 'py.exe'];
    }
    else {
        return ['python3', 'python', '/usr/bin/python3', '/usr/local/bin/python3'];
    }
}
//# sourceMappingURL=pythonUtils.js.map