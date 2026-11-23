import fs from "node:fs";
import path from "node:path";

export function parseServiceFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    const result = {
        Unit: {},
        Service: {},
        Install: {},
        raw: content
    };

    let currentSection = null;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || line.startsWith(";")) {
            continue;
        }

        const sectionMatch = line.match(/^\[(.*?)\]$/);
        if (sectionMatch) {
            currentSection = sectionMatch[1];
            if (!result[currentSection]) {
                result[currentSection] = {};
            }
            continue;
        }

        const eqIdx = line.indexOf("=");
        if (eqIdx !== -1 && currentSection) {
            const key = line.slice(0, eqIdx).trim();
            let value = line.slice(eqIdx + 1).trim();

            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            if (result[currentSection][key] !== undefined) {
                if (Array.isArray(result[currentSection][key])) {
                    result[currentSection][key].push(value);
                } else {
                    result[currentSection][key] = [result[currentSection][key], value];
                }
            } else {
                result[currentSection][key] = value;
            }
        }
    }

    return result;
}

export function detectPort(parsedService, targetDir) {
    if (!parsedService) return null;

    const envValue = parsedService.Service?.Environment;
    if (envValue) {
        const envList = Array.isArray(envValue) ? envValue : [envValue];
        for (const env of envList) {
            const match = String(env).match(/PORT\s*=\s*(\d+)/i);
            if (match) {
                return parseInt(match[1], 10);
            }
        }
    }

    const execStart = parsedService.Service?.ExecStart;
    if (execStart) {
        const execList = Array.isArray(execStart) ? execStart : [execStart];
        for (const exec of execList) {
            const portFlagMatch = String(exec).match(/(?:--port|-p)\s+(\d+)/i);
            if (portFlagMatch) {
                return parseInt(portFlagMatch[1], 10);
            }
            const portAssignMatch = String(exec).match(/PORT\s*=\s*(\d+)/i);
            if (portAssignMatch) {
                return parseInt(portAssignMatch[1], 10);
            }
        }
    }

    if (targetDir && fs.existsSync(targetDir)) {
        const envPath = path.join(targetDir, ".env");
        if (fs.existsSync(envPath)) {
            try {
                const envContent = fs.readFileSync(envPath, "utf-8");
                const match = envContent.match(/^PORT\s*=\s*(\d+)/m);
                if (match) {
                    return parseInt(match[1], 10);
                }
            } catch {
                // Ignore unreadable .env
            }
        }
    }

    return null;
}
