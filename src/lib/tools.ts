import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import type { ToolStatus } from '@/types';

const execFileAsync = promisify(execFile);

// Local bin directory (relative to project root)
const BIN_DIR = path.join(process.cwd(), 'bin');

// Tool executable names (Windows adds .exe, other platforms don't)
const isWindows = process.platform === 'win32';
const EXE = isWindows ? '.exe' : '';

const TOOLS = {
  ytdlp: [`yt-dlp${EXE}`, 'yt-dlp'],
  ffmpeg: [`ffmpeg${EXE}`, 'ffmpeg'],
  aria2c: [`aria2c${EXE}`, 'aria2c'],
} as const;

async function findTool(
  names: readonly string[],
  versionFlag: string
): Promise<{ found: boolean; path: string; version: string }> {
  // 1. Check local ./bin directory first
  for (const name of names) {
    const localPath = path.join(BIN_DIR, name);
    if (fs.existsSync(localPath)) {
      try {
        const { stdout } = await execFileAsync(localPath, [versionFlag]);
        const version = stdout.split('\n')[0].trim();
        return { found: true, path: localPath, version };
      } catch {
        // try next
      }
    }
  }

  // 2. Check system PATH
  for (const name of names) {
    try {
      const { stdout } = await execFileAsync(name, [versionFlag]);
      const version = stdout.split('\n')[0].trim();
      let resolvedPath = name;
      try {
        const lookupCmd = isWindows ? 'where.exe' : 'which';
        const { stdout: whereOut } = await execFileAsync(lookupCmd, [name]);
        const firstLine = whereOut.split(/\r?\n/)[0].trim();
        if (firstLine && fs.existsSync(firstLine)) {
          resolvedPath = firstLine;
        }
      } catch {
        // fallback to name
      }
      return { found: true, path: resolvedPath, version };
    } catch {
      // try next
    }
  }

  return { found: false, path: '', version: '' };
}

export async function detectTools(): Promise<ToolStatus> {
  const [ytdlp, ffmpeg, aria2c] = await Promise.all([
    findTool(TOOLS.ytdlp, '--version'),
    findTool(TOOLS.ffmpeg, '-version'),
    findTool(TOOLS.aria2c, '--version'),
  ]);

  return { ytdlp, ffmpeg, aria2c };
}

// Cached version for API routes
let cachedTools: ToolStatus | null = null;
export async function getTools(): Promise<ToolStatus> {
  if (!cachedTools) {
    cachedTools = await detectTools();
  }
  return cachedTools;
}

export function getToolPath(tools: ToolStatus, tool: 'ytdlp' | 'ffmpeg' | 'aria2c'): string {
  const t = tools[tool];
  if (!t.found) throw new Error(`Tool not found: ${tool}. Please install it or place it in ./bin/`);
  return t.path;
}
