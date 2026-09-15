// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.thepitchstp.com',
  output: 'static',

  // The live site serves extensionless URLs (/amenities), with /amenities.html
  // 307-redirecting to them. `format: 'file'` emits amenities.html at the root,
  // exactly the flat layout the host already serves, so the URLs don't move.
  build: { format: 'file' },
  trailingSlash: 'never',

  // The vault is in iCloud Drive so it syncs across two Macs. Astro wipes and
  // rewrites its output folder on every build, which iCloud reads as a conflict
  // and resolves by keeping both copies. The .nosync suffix is iCloud's opt-out.
  // Any deploy config must point at this same folder. See the vault CLAUDE.md.
  outDir: './dist.nosync',

  devToolbar: { enabled: false },
});
