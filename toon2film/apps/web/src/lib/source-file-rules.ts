export const allowedSourceExtensions = new Set(["pdf", "jpg", "jpeg", "png", "zip"]);
export const maxSourceFileBytes = 200 * 1024 * 1024;

export function createSourceFileId(file: File) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${file.name}-${file.size}-${file.lastModified}-${randomPart}`;
}

export function sourceFileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

export function sourceFileSizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function sourceFileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function validateSourceFiles(incomingFiles: File[], existingFiles: File[] = []) {
  const existingKeys = new Set(existingFiles.map(sourceFileKey));
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of incomingFiles) {
    const extension = sourceFileExtension(file);
    const key = sourceFileKey(file);

    if (existingKeys.has(key) || accepted.some((acceptedFile) => sourceFileKey(acceptedFile) === key)) {
      errors.push(`${file.name}: 이미 선택된 파일입니다.`);
      continue;
    }

    if (!allowedSourceExtensions.has(extension)) {
      errors.push(`${file.name}: PDF, JPG, PNG, ZIP만 업로드할 수 있습니다.`);
      continue;
    }

    if (file.size <= 0) {
      errors.push(`${file.name}: 빈 파일은 업로드할 수 없습니다.`);
      continue;
    }

    if (file.size > maxSourceFileBytes) {
      errors.push(`${file.name}: 파일 크기가 200MB를 초과했습니다.`);
      continue;
    }

    accepted.push(file);
  }

  return { accepted, errors };
}

export function readableSourceStatus(status?: string) {
  if (!status) return "대기 중";
  return (
    {
      analyzing: "AI 분석 중",
      analyzed: "AI 분석 완료",
      processed: "AI 분석 필요",
      analysis_failed: "AI 분석 실패",
      uploaded: "업로드 완료"
    }[status] ?? status
  );
}

export function isSourceAnalysisComplete(status: string) {
  return status === "analyzed";
}
