import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(root, "apps", "web");
const apiRoot = path.join(root, "apps", "api", "app");
const appRoot = path.join(webRoot, "src", "app");
const srcRoot = path.join(webRoot, "src");

const requiredRoutes = [
  "/",
  "/projects/new",
  "/source/upload",
  "/prompt-studio",
  "/video-studio",
  "/audio-studio",
  "/export",
  "/settings",
  "/projects/[id]"
];

const requiredEnvKeys = [
  "NEXT_PUBLIC_BASE_PATH",
  "NEXT_PUBLIC_API_BASE_URL",
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_REASONING_EFFORT",
  "OPENAI_AUTO_ANALYZE_ON_UPLOAD"
];

const requiredApiMarkers = [
  "response_model=ProjectRead",
  '"/projects/{project_id}/upload"',
  '"/projects/{project_id}/pipeline-state"',
  '"/projects/{project_id}/generate-story-bible"',
  '"/projects/{project_id}/generate-characters"',
  '"/projects/{project_id}/generate-storyboard"',
  '"/shots/{shot_id}/generate-prompt"',
  '"/shots/{shot_id}/generate-video"',
  '"/projects/{project_id}/render"'
];

const skipDirs = new Set([
  ".git",
  ".next",
  ".turbo",
  ".venv",
  "node_modules",
  "__pycache__",
  "uploads"
]);

const findings = [];

function fail(message) {
  findings.push(message);
}

function listFiles(dir, predicate = () => true) {
  const output = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (!skipDirs.has(entry)) output.push(...listFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      output.push(fullPath);
    }
  }
  return output;
}

function read(file) {
  return readFileSync(file, "utf8");
}

function routeFromPage(file) {
  const relative = path.relative(appRoot, file).replaceAll(path.sep, "/");
  const route = relative.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  return route ? `/${route}` : "/";
}

function routePatternToRegExp(route) {
  const escaped = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\[.+?\\\]/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
}

function normalizeInternalPath(value) {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("/api/") || value.startsWith("/_next/")) return null;
  if (value.includes("${")) return null;
  return value.split(/[?#]/)[0].replace(/\/$/, "") || "/";
}

function collectInternalPaths(file, content) {
  const candidates = [];
  const patterns = [
    /href=["']([^"']+)["']/g,
    /href:\s*["']([^"']+)["']/g,
    /router\.push\(\s*["']([^"']+)["']/g
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const normalized = normalizeInternalPath(match[1]);
      if (normalized) candidates.push({ file, path: normalized });
    }
  }
  return candidates;
}

function assertContains(file, markers, label) {
  const content = read(file);
  for (const marker of markers) {
    if (!content.includes(marker)) fail(`${label}: missing "${marker}" in ${path.relative(root, file)}`);
  }
}

const pageFiles = listFiles(appRoot, (file) => file.endsWith("page.tsx"));
const routes = new Set(pageFiles.map(routeFromPage));
const routeMatchers = [...routes].map((route) => ({ route, re: routePatternToRegExp(route) }));

for (const route of requiredRoutes) {
  if (!routes.has(route)) fail(`route missing: ${route}`);
}

const sourceFiles = listFiles(srcRoot, (file) => /\.(tsx?|css)$/.test(file));
const internalPaths = sourceFiles.flatMap((file) => collectInternalPaths(file, read(file)));
for (const item of internalPaths) {
  const exists = routeMatchers.some(({ re }) => re.test(item.path));
  if (!exists) fail(`broken internal route: ${item.path} in ${path.relative(root, item.file)}`);
}

assertContains(path.join(webRoot, "src", "components", "critical-studio-style.tsx"), [
  "toon2film-critical-style",
  ".studio-shell",
  ".studio-panel",
  ".brand-logo-red"
], "critical CSS");

assertContains(path.join(appRoot, "projects", "new", "page.tsx"), [
  'data-testid="source-file-input"',
  'data-testid="source-dropzone"',
  'data-testid="next-pipeline-step"',
  "pendingPipelineAfterUploadRef",
  "업로드 후 스토리 분석",
  "rightsSource",
  "rightsLikeness",
  "rightsCommercial",
  "generate-story-bible",
  "generate-characters",
  "generate-storyboard"
], "new project workflow");

assertContains(path.join(appRoot, "source", "upload", "page.tsx"), [
  "auto_analyze",
  "rights_confirmed",
  "Project ID",
  "AI 제작 파이프라인",
  'data-testid="source-next-pipeline-step"',
  "generate-story-bible",
  "generate-characters",
  "generate-storyboard"
], "source upload workflow");

assertContains(path.join(root, ".env.example"), requiredEnvKeys, "env example");

const apiText = listFiles(apiRoot, (file) => file.endsWith(".py"))
  .map((file) => read(file))
  .join("\n");
for (const marker of requiredApiMarkers) {
  if (!apiText.includes(marker)) fail(`API marker missing: ${marker}`);
}

const scannableFiles = listFiles(root, (file) =>
  /\.(env|example|json|mjs|ts|tsx|py|md|sh|cjs|css|toml)$/.test(file)
);
const secretPatterns = [
  /sk-proj-[A-Za-z0-9_-]{20,}/,
  /AIza[0-9A-Za-z_-]{20,}/,
  /xai-[A-Za-z0-9_-]{20,}/
];
for (const file of scannableFiles) {
  const content = read(file);
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) fail(`possible secret committed: ${path.relative(root, file)}`);
  }
}

const packageJson = JSON.parse(read(path.join(root, "package.json")));
for (const scriptName of ["build:web", "typecheck:web", "qa:web", "smoke:web"]) {
  if (!packageJson.scripts?.[scriptName]) fail(`package script missing: ${scriptName}`);
}

if (findings.length > 0) {
  console.error("Toon2Film static QA failed:");
  for (const item of findings) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`OK routes=${routes.size} internalLinks=${internalPaths.length} filesScanned=${scannableFiles.length}`);
console.log("OK upload workflow, AI pipeline API, critical CSS, env contract, secret scan");
