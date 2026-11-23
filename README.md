# ubuntu-service-detect

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/ubuntu-service-detect)
[![Docs](https://img.shields.io/badge/docs-GitHub_Pages-sky.svg)](https://keshavsoft.github.io/ubuntu-service-docs/detect/)
[![Suite](https://img.shields.io/badge/suite-ubuntu--service-orange.svg)](https://keshavsoft.github.io/ubuntu-service-docs/)
[![GitHub](https://img.shields.io/badge/github-keshavsoft%2Fubuntu--service--detect-181717.svg)](https://github.com/keshavsoft/ubuntu-service-detect)

> Context-aware detection of systemd services matching the current or specified working directory on an Ubuntu VPS.

---

## 🌐 Documentation & Links

- **Dedicated Documentation:** [https://keshavsoft.github.io/ubuntu-service-docs/detect/](https://keshavsoft.github.io/ubuntu-service-docs/detect/)
- **Full Suite Hub:** [https://keshavsoft.github.io/ubuntu-service-docs/](https://keshavsoft.github.io/ubuntu-service-docs/)
- **All 8 Repositories in Family:** [https://keshavsoft.github.io/ubuntu-service-docs/repos/](https://keshavsoft.github.io/ubuntu-service-docs/repos/)
- **npm Package:** [https://www.npmjs.com/package/ubuntu-service-detect](https://www.npmjs.com/package/ubuntu-service-detect)
- **Sister Packages:**
  - `ubuntu-service`: [npm](https://www.npmjs.com/package/ubuntu-service) | [docs](https://keshavsoft.github.io/ubuntu-service-docs/service/)
  - `ubuntu-service-restart`: [npm](https://www.npmjs.com/package/ubuntu-service-restart) | [docs](https://keshavsoft.github.io/ubuntu-service-docs/restart/)

---

## 🎯 Purpose

Given `process.cwd()` (or any target folder path), `ubuntu-service-detect` scans `/etc/systemd/system/` (and fallback directories) to find the exact `.service` file responsible for running that directory.

### Key Capabilities:
- **Zero side-effects:** Pure read/query operation; never triggers `systemctl restart` or modifies files.
- **Robust INI parsing:** Safely handles single-string or multiple `ExecStart=` entries (arrays).
- **Multi-strategy matching:**
  1. `WorkingDirectory` exact match (100 score)
  2. Subpath match (80 score)
  3. `ExecStart` path containment (70 score)
  4. Package name / directory basename heuristic (50/40 score)
- **Automatic Port Extraction:** Detects internal ports assigned via `Environment="PORT=..."`, `--port`, or local `.env`.

---

## 🚀 Installation & Usage

```bash
npm install ubuntu-service-detect
```

```javascript
import { findServiceForDirectory } from "ubuntu-service-detect";

const result = findServiceForDirectory(process.cwd());

if (result.found) {
  console.log(`Matched Unit: ${result.unitName}`);
  console.log(`Assigned Port: ${result.port}`);
  console.log(`Working Directory: ${result.workingDirectory}`);
}
```

---

## 🧩 Architecture

```
ubuntu-service-detect/
├── src/
│   ├── index.js                  # Root exports
│   └── v1/
│       ├── index.js              # v1 entry point
│       └── inspectors/
│           ├── detector.js       # Directory matching algorithms
│           └── parser.js         # Safe systemd INI & port parsing
├── test/
│   └── detect.test.js            # Node native test runner (100% passing)
├── README.md
└── package.json
```

---

## 🧪 Tests

```bash
npm test
```
