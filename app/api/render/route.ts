/**
 * app/api/render/route.ts
 *
 * Optional server-side step. The MVP records webm entirely client-side —
 * this route exists for people who want a "real" MP4 (for platforms with
 * poor webm support) without shipping ffmpeg.wasm to the browser.
 *
 * Requires the `ffmpeg` binary on PATH (or install `ffmpeg-static` and
 * point FFMPEG_PATH at it — see the commented alternative below), plus a
 * writable /tmp directory, so this needs a Node.js server runtime
 * (not the Edge runtime).
 */

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export const runtime = "nodejs";

// If you'd rather not depend on a system ffmpeg install:
//   npm install ffmpeg-static
//   import ffmpegPath from "ffmpeg-static";
// then use `ffmpegPath` instead of the string "ffmpeg" below.
const FFMPEG_BIN = process.env.FFMPEG_PATH ?? "ffmpeg";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const clip = form.get("clip");

  if (!(clip instanceof Blob)) {
    return NextResponse.json(
      { error: "Expected multipart field 'clip' containing a webm Blob." },
      { status: 400 }
    );
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "fake-swear-cam-"));
  const inputPath = path.join(workDir, "input.webm");
  const outputPath = path.join(workDir, "output.mp4");

  try {
    const bytes = Buffer.from(await clip.arrayBuffer());
    await writeFile(inputPath, bytes);

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    const mp4 = await readFile(outputPath);
    return new NextResponse(mp4, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="fake-swear-cam.mp4"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `ffmpeg transcode failed: ${(err as Error).message}` },
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, args);
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}
