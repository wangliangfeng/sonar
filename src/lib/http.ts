// 外部 HTTP GET 统一走 curl：本机网络对 Node TLS 冷连接偶发 RST，curl 稳定可靠
// curl 内置重试(--retry-all-errors)，并用 -w 回传 HTTP 状态码
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
export const UA = "SonarMusicJournal/1.0 (local music experiment)";

const CURL = process.platform === "win32" ? "curl.exe" : "curl";

export async function httpsGet(
  url: string,
  timeoutMs: number,
  ua: string = UA,
  headers?: Record<string, string>,
  retries = 3,
): Promise<{ status: number; buf: Buffer }> {
  const secs = Math.max(6, Math.ceil(timeoutMs / 1000));
  const args = ["-sS", "-L", "--connect-timeout", "6", "--max-time", String(secs)];
  if (retries > 0) {
    args.push("--retry", String(retries), "--retry-delay", "1", "--retry-all-errors");
  }
  args.push("-A", ua);
  if (headers) {
    for (const [k, v] of Object.entries(headers)) args.push("-H", `${k}: ${v}`);
  }
  args.push("-w", "\n__STATUS__%{http_code}", url);
  const { stdout } = await execFileP(CURL, args, {
    encoding: "buffer",
    maxBuffer: 300 * 1024 * 1024,
    windowsHide: true,
  });
  const marker = Buffer.from("\n__STATUS__");
  const idx = stdout.lastIndexOf(marker);
  let body = stdout;
  let status = 0;
  if (idx !== -1) {
    body = stdout.subarray(0, idx);
    status = Number(stdout.subarray(idx + marker.length).toString().trim());
  }
  if (status === 0 && body.length === 0) {
    throw new Error("外部请求失败");
  }
  return { status, buf: body };
}
