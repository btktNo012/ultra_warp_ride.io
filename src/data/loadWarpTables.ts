import type { WarpTablesFile } from '../core/types'

export async function loadWarpTables(): Promise<WarpTablesFile> {
  const base = import.meta.env.BASE_URL || '/'
  const res = await fetch(`${base}data/warp_tables.json`)
  if (!res.ok) throw new Error(`warp_tables.json fetch failed: ${res.status}`)
  const json = (await res.json()) as WarpTablesFile
  return json
}
