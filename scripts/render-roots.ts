/**
 * Paints the woodland roots under the contact card to public/roots.webp.
 * Run with `npm run roots`; re-run only to change the artwork.
 *
 * Every root is a filled, variable-width ribbon grown from a seeded generator, so the output is repeatable:
 * thick, gnarled roots cross under the card, throw off side roots, and thin into fine rootlets. Volume comes
 * from stacked ribbons shifted toward the light; SVG filters add rough edges and bark relief, and bark ridges
 * and moss follow each root's own direction. The filters cost seconds of paint time on a phone, so the page
 * ships this one image rather than the live SVG.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUTPUT = new URL('../public/roots.webp', import.meta.url)
const SCALE = 1.5
const QUALITY = 0.72

const VB_W = 2000
const VB_H = 340
const STEP = 7

type Pt = [number, number]
type Kind = 'main' | 'side' | 'rootlet'
type Limb = { c: Pt[]; n: Pt[]; hw: number[]; kind: Kind }
type Palette = [string, string, string, string]

const LIGHT: Pt = [-0.34, -0.94]
const BARK: Palette = ['#4A3B2C', '#5B4937', '#6E5A47', '#8C7765']
const BARK_FAR: Palette = ['#8C7765', '#9A8673', '#A89582', '#B8A694']

/** Waypoints of the structural roots, painted back to front. */
const FAR_ROOTS: { way: Pt[]; width: number; seed: number }[] = [
  { way: [[1000, -10], [900, 70], [720, 120], [560, 170], [430, 150], [250, 196], [60, 214], [-30, 250]], width: 30, seed: 3 },
  { way: [[1000, -10], [1110, 66], [1270, 124], [1420, 150], [1590, 200], [1760, 192], [2030, 236]], width: 30, seed: 8 },
  { way: [[1000, -10], [930, 110], [800, 190], [640, 268], [560, 345]], width: 24, seed: 14 },
  { way: [[1000, -10], [1080, 120], [1190, 210], [1370, 270], [1450, 345]], width: 24, seed: 21 },
]
const NEAR_ROOTS: { way: Pt[]; width: number; seed: number }[] = [
  { way: [[1040, -12], [940, 40], [780, 80], [620, 96], [440, 130], [280, 128], [120, 160], [-20, 170]], width: 40, seed: 31 },
  { way: [[960, -12], [1060, 42], [1230, 76], [1400, 90], [1560, 126], [1760, 120], [2020, 152]], width: 38, seed: 37 },
  { way: [[1010, -12], [965, 60], [860, 118], [700, 158], [520, 196], [340, 246], [190, 262], [40, 300]], width: 58, seed: 41 },
  { way: [[990, -12], [1040, 62], [1150, 112], [1310, 160], [1480, 190], [1660, 250], [1820, 272], [1980, 310]], width: 54, seed: 47 },
  { way: [[1030, -12], [975, 70], [915, 150], [880, 210], [800, 262], [740, 345]], width: 46, seed: 53 },
  { way: [[970, -12], [1030, 74], [1090, 140], [1120, 215], [1210, 270], [1250, 345]], width: 48, seed: 59 },
  { way: [[1000, -12], [1014, 80], [985, 160], [1006, 240], [990, 350]], width: 52, seed: 61 },
]

function random(seed: number) {
  let s = seed * 2654435761
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const fmt = ([x, y]: Pt) => `${x.toFixed(1)} ${y.toFixed(1)}`

/** Catmull-Rom spline through the waypoints, sampled at an even-ish step. */
function spline(way: Pt[]) {
  const out: Pt[] = []
  for (let i = 0; i < way.length - 1; i++) {
    const a = way[Math.max(0, i - 1)]
    const b = way[i]
    const c = way[i + 1]
    const d = way[Math.min(way.length - 1, i + 2)]
    const steps = Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / STEP)
    for (let k = 0; k < steps; k++) {
      const t = k / steps
      const at = (p: number, q: number, r: number, s: number) =>
        0.5 * (2 * q + (r - p) * t + (2 * p - 5 * q + 4 * r - s) * t * t + (3 * q - p - 3 * r + s) * t * t * t)
      out.push([at(a[0], b[0], c[0], d[0]), at(a[1], b[1], c[1], d[1])])
    }
  }
  out.push(way[way.length - 1])
  return out
}

/** A root searching outward through the soil: it wanders, sinks, and levels off near the bottom. */
function wander(start: Pt, heading: number, length: number, rand: () => number) {
  const pts: Pt[] = [start]
  const sway = rand() * Math.PI * 2
  let [x, y] = start
  let angle = heading
  for (let s = 0; s < length; s += STEP) {
    const outward = Math.cos(angle) >= 0
    const sink = y > 272 ? 0.08 : 0.62
    angle += ((outward ? sink : Math.PI - sink) - angle) * 0.045 + Math.sin(s * 0.03 + sway) * 0.05 + (rand() - 0.5) * 0.12
    x += Math.cos(angle) * STEP
    y += Math.sin(angle) * STEP
    pts.push([x, y])
  }
  return pts
}

function normals(c: Pt[]) {
  return c.map((_, i): Pt => {
    const a = c[Math.max(0, i - 1)]
    const b = c[Math.min(c.length - 1, i + 1)]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return [-(b[1] - a[1]) / len, (b[0] - a[0]) / len]
  })
}

function limb(path: Pt[], width: number, kind: Kind, rand: () => number): Limb {
  const last = path.length - 1
  const phases = [rand(), rand(), rand(), rand()].map((p) => p * Math.PI * 2)
  const knots = Array.from({ length: kind === 'rootlet' ? 0 : 3 + Math.floor(rand() * 4) }, () => ({
    at: rand(),
    size: 0.1 + rand() * 0.24,
    span: 0.015 + rand() * 0.03,
  }))
  const amp = width * 0.07 + 1
  const raw = normals(path)
  const c = path.map(([x, y], i): Pt => {
    const s = i * STEP
    const t = i / last
    const bend = amp * Math.min(1, t * 8) * (1 - t * 0.6) * (Math.sin(s * 0.035 + phases[0]) * 0.6 + Math.sin(s * 0.09 + phases[1]) * 0.4)
    return [x + raw[i][0] * bend, y + raw[i][1] * bend]
  })
  const tip = kind === 'main' ? 0.07 : 0.12
  const curve = kind === 'main' ? 0.85 : 1.2
  const hw = path.map((_, i) => {
    const s = i * STEP
    const t = i / last
    const taper = (1 - t) ** curve * (1 - tip) + tip * (1 - t ** 8)
    const flare = 1 + 0.45 * Math.exp(-t * 14)
    const burl = knots.reduce((sum, k) => sum + k.size * Math.exp(-(((t - k.at) / k.span) ** 2)), 0)
    const gnarl = kind === 'rootlet' ? 0 : Math.sin(s * 0.07 + phases[2]) * 0.06 + Math.sin(s * 0.19 + phases[3]) * 0.04
    return (width / 2) * taper * flare * (1 + burl + gnarl)
  })
  return { c, n: normals(c), hw, kind }
}

/** Closed outline of a limb – `shift` slides it toward the light, `scale` narrows it. */
function ribbon({ c, n, hw }: Limb, shift: number, scale: number) {
  const side = (sign: number) =>
    c.map(([x, y], i): Pt => {
      const off = shift * hw[i] * (n[i][0] * LIGHT[0] + n[i][1] * LIGHT[1]) + sign * scale * hw[i]
      return [x + n[i][0] * off, y + n[i][1] * off]
    })
  const pts = [...side(1), ...side(-1).reverse()]
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  let d = `M${fmt(mid(pts[0], pts[1]))}`
  for (let i = 1; i <= pts.length; i++) {
    const p = pts[i % pts.length]
    d += `Q${fmt(p)} ${fmt(mid(p, pts[(i + 1) % pts.length]))}`
  }
  return `${d}Z`
}

/** Bark ridges running with the grain, plus short transverse cracks on the heavy roots. */
function bark({ c, n, hw, kind }: Limb, rand: () => number) {
  const lines = { deep: '', ridge: '', shine: '' }
  const strands = kind === 'main' ? 18 : 7
  for (let k = 0; k < strands; k++) {
    const u = rand() * 1.7 - 0.85
    const phase = rand() * Math.PI * 2
    const roll = rand()
    const key = roll < 0.45 ? 'deep' : roll < 0.8 ? 'ridge' : 'shine'
    let i = Math.floor(rand() * 10)
    while (i < c.length - 5 && hw[i] > 2) {
      const end = Math.min(c.length - 1, i + 5 + Math.floor(rand() * 15))
      for (let j = i; j <= end; j++) {
        const o = hw[j] * (u + Math.sin(j * 0.13 + phase) * 0.07)
        lines[key] += `${j === i ? 'M' : 'L'}${fmt([c[j][0] + n[j][0] * o, c[j][1] + n[j][1] * o])}`
      }
      i = end + 2 + Math.floor(rand() * 9)
    }
  }
  if (kind === 'main') {
    for (let i = 3 + Math.floor(rand() * 4); i < c.length - 3 && hw[i] > 4; i += 3 + Math.floor(rand() * 6)) {
      const from = rand() * 1.2 - 0.8
      const to = from + 0.2 + rand() * 0.4
      const a: Pt = [c[i][0] + n[i][0] * hw[i] * from, c[i][1] + n[i][1] * hw[i] * from]
      const b: Pt = [c[i + 2][0] + n[i + 2][0] * hw[i + 2] * to, c[i + 2][1] + n[i + 2][1] * hw[i + 2] * to]
      lines.deep += `M${fmt(a)}L${fmt(b)}`
    }
  }
  return lines
}

/** Cushions of moss and flecks of lichen on the upward-facing curves of a root. */
function moss({ c, n, hw }: Limb, rand: () => number) {
  const out = { deep: '', body: '', fleck: '', lichen: '' }
  const patch = (from: number, to: number, side: number, inner: number, rise: number, seed: number) => {
    const edge = (u: number) => {
      const pts: Pt[] = []
      for (let i = from; i <= to; i++) {
        const t = (i - from) / (to - from)
        const swell = Math.sin(Math.PI * t) ** 0.6 * (1 + Math.sin(i * 0.9 + seed) * 0.3 + Math.sin(i * 2.3 + seed) * 0.2)
        const o = hw[i] * (1 - (1 - inner) * u * swell) + (1 - u) * rise * swell
        pts.push([c[i][0] + n[i][0] * side * o, c[i][1] + n[i][1] * side * o])
      }
      return pts
    }
    return `M${[...edge(0), ...edge(1).reverse()].map(fmt).join('L')}Z`
  }

  let i = 4 + Math.floor(rand() * 14)
  while (i < c.length - 12) {
    const span = 4 + Math.floor(rand() * 13)
    const end = Math.min(c.length - 2, i + span)
    const mid = Math.floor((i + end) / 2)
    if (hw[mid] > 3.5 && Math.abs(n[mid][1]) > 0.55) {
      const side = n[mid][1] < 0 ? 1 : -1
      const seed = rand() * 10
      const lift = Math.min(5, 1.4 + hw[mid] * 0.3)
      out.deep += patch(i, end, side, 0.1, lift, seed)
      out.body += patch(i + 1, end - 1, side, 0.42, lift * 0.75, seed + 1)
      for (let k = 0; k < span * 1.6; k++) {
        const j = i + Math.floor(rand() * (end - i))
        const o = side * (hw[j] * (0.3 + rand() * 0.75) + rand() * lift * 0.6)
        const p: Pt = [c[j][0] + n[j][0] * o, c[j][1] + n[j][1] * o]
        out.fleck += `M${fmt(p)}h.01`
      }
      if (rand() < 0.5) {
        const j = i + Math.floor(rand() * (end - i))
        for (let k = 0; k < 5; k++) {
          const u = (rand() * 1.4 - 0.4) * side * hw[j]
          const p: Pt = [c[j][0] + n[j][0] * u + (rand() - 0.5) * 12, c[j][1] + n[j][1] * u + (rand() - 0.5) * 6]
          out.lichen += `M${fmt(p)}h.01`
        }
      }
    }
    i = end + 3 + Math.floor(rand() * 22)
  }
  return out
}

/** One structural root with its side roots and rootlets, thinnest first so the heavy wood sits on top. */
function grow({ way, width, seed }: { way: Pt[]; width: number; seed: number }) {
  const rand = random(seed)
  const main = limb(spline(way), width, 'main', rand)
  const sides: Limb[] = []
  const rootlets: Limb[] = []

  const branch = (from: Limb, i: number, spread: number, length: number, thick: number, kind: Kind) => {
    const a = from.c[Math.max(0, i - 1)]
    const b = from.c[Math.min(from.c.length - 1, i + 1)]
    const dir = Math.atan2(b[1] - a[1], b[0] - a[0]) + (rand() < 0.5 ? -1 : 1) * spread
    return limb(wander(from.c[i], dir, length, rand), thick, kind, rand)
  }

  for (let t = 0.14 + rand() * 0.08; t < 0.92; t += 0.07 + rand() * 0.1) {
    const i = Math.floor(t * (main.c.length - 1))
    const thick = Math.max(3.5, main.hw[i] * (0.7 + rand() * 0.4))
    const side = branch(main, i, 0.32 + rand() * 0.7, (80 + rand() * 210) * (1 - t * 0.5), thick, 'side')
    sides.push(side)
    const count = 2 + Math.floor(rand() * 4)
    for (let k = 0; k < count; k++) {
      const at = Math.floor((0.2 + rand() * 0.75) * (side.c.length - 1))
      rootlets.push(branch(side, at, 0.4 + rand() * 0.8, 26 + rand() * 90, 1.5 + rand() * 1.7, 'rootlet'))
    }
    rootlets.push(branch(main, i, 0.6 + rand() * 0.8, 24 + rand() * 70, 1.5 + rand() * 1.6, 'rootlet'))
  }
  return { rootlets, sides, main, rand }
}

function draw(system: ReturnType<typeof grow>[]) {
  return system.map(({ rootlets, sides, main, rand }) => ({
    rootlets: rootlets.map((l) => ribbon(l, 0, 1)).join(''),
    wood: [...sides, main].map((l) => ({
      bands: [ribbon(l, 0, 1), ribbon(l, 0.16, 0.8), ribbon(l, 0.3, 0.56), ribbon(l, 0.46, 0.27)],
      bark: bark(l, rand),
      moss: l.kind === 'main' || l.hw[0] > 7 ? moss(l, rand) : null,
    })),
  }))
}

const FAR = draw(FAR_ROOTS.map(grow))
const NEAR = draw(NEAR_ROOTS.map(grow))

const layer = (roots: ReturnType<typeof draw>, palette: Palette, mossy: boolean) =>
  roots
    .map((root) => {
      const wood = root.wood
        .map(
          (l) => `${l.bands.map((d, b) => `<path d="${d}" fill="${palette[b]}"/>`).join('')}
          <g fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="${l.bark.deep}" stroke="#2E2318" stroke-opacity="0.6" stroke-width="1.1"/>
            <path d="${l.bark.ridge}" stroke="#3A2D21" stroke-opacity="0.4" stroke-width="0.7"/>
            <path d="${l.bark.shine}" stroke="#B9A48F" stroke-opacity="0.45" stroke-width="0.7"/>
          </g>`,
        )
        .join('')
      const growth = root.wood
        .map(({ moss: m }) =>
          m
            ? `<path d="${m.deep}" fill="#48604F" fill-opacity="0.9"/>
            <path d="${m.body}" fill="#6B8E6E" fill-opacity="0.85"/>
            <path d="${m.fleck}" stroke="#8EA691" stroke-width="1.7" stroke-linecap="round"/>
            <path d="${m.lichen}" stroke="#C9D3C2" stroke-opacity="0.8" stroke-width="3.2" stroke-linecap="round"/>`
            : '',
        )
        .join('')
      return `<g filter="url(#root-bark)"><path d="${root.rootlets}" fill="${palette[2]}"/>${wood}</g>
      ${mossy ? `<g filter="url(#root-moss)">${growth}</g>` : ''}`
    })
    .join('')

const region = `filterUnits="userSpaceOnUse" x="0" y="0" width="${VB_W}" height="${VB_H}" color-interpolation-filters="sRGB"`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" width="${VB_W * SCALE}" height="${VB_H * SCALE}">
  <defs>
    <filter id="root-bark" ${region}>
      <!-- Rough the silhouette, then light a height map of rounded wood plus stretched bark noise -->
      <feTurbulence type="fractalNoise" baseFrequency="0.03 0.055" numOctaves="3" seed="7" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="6" xChannelSelector="R" yChannelSelector="G" result="wood"/>
      <feGaussianBlur in="wood" stdDeviation="2.4" result="round"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.09 0.3" numOctaves="3" seed="11" result="grain"/>
      <feComposite in="round" in2="grain" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" result="height"/>
      <feDiffuseLighting in="height" surfaceScale="5" diffuseConstant="1.15" lighting-color="#fff" result="light">
        <feDistantLight azimuth="250" elevation="52"/>
      </feDiffuseLighting>
      <feBlend in="light" in2="wood" mode="multiply" result="lit"/>
      <feComposite in="lit" in2="wood" operator="in" result="body"/>
      <!-- Soft shadow onto the earth and across the roots behind -->
      <feGaussianBlur in="wood" stdDeviation="6" result="spread"/>
      <feOffset in="spread" dx="3" dy="8" result="fall"/>
      <feColorMatrix in="fall" type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.14  0 0 0 0 0.09  0 0 0 0.42 0" result="shade"/>
      <feMerge><feMergeNode in="shade"/><feMergeNode in="body"/></feMerge>
    </filter>
    <filter id="root-moss" ${region}>
      <!-- Fine, high-frequency displacement frays the edges into tufts -->
      <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="2" seed="4" result="tuft"/>
      <feDisplacementMap in="SourceGraphic" in2="tuft" scale="11" xChannelSelector="R" yChannelSelector="G" result="frayed"/>
      <feDiffuseLighting in="tuft" surfaceScale="2.2" diffuseConstant="1.25" lighting-color="#fff" result="light">
        <feDistantLight azimuth="250" elevation="58"/>
      </feDiffuseLighting>
      <feBlend in="light" in2="frayed" mode="multiply" result="lit"/>
      <feComposite in="lit" in2="frayed" operator="in"/>
    </filter>
  </defs>
  <!-- Far roots stay pale, as if seen through the mist -->
  <g opacity="0.5">${layer(FAR, BARK_FAR, false)}</g>
  ${layer(NEAR, BARK, true)}
</svg>`

// Headless Chrome paints the SVG onto a canvas and prints it back as WebP, so no image tooling is needed.
const page = `<!doctype html><script>
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    canvas.getContext('2d').drawImage(img, 0, 0)
    document.body.textContent = 'ROOTS:' + canvas.toDataURL('image/webp', ${QUALITY}) + ':ROOTS'
  }
  img.src = 'data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}'
</script><body></body>`

const dir = mkdtempSync(join(tmpdir(), 'roots-'))
const file = join(dir, 'page.html')
writeFileSync(file, page)
const dom = execFileSync(
  CHROME,
  ['--headless=new', '--disable-gpu', '--virtual-time-budget=120000', '--dump-dom', `file://${file}`],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
)
rmSync(dir, { recursive: true })

const match = dom.match(/ROOTS:data:image\/webp;base64,([^:]+):ROOTS/)
if (!match) throw new Error('Chrome did not return the painted image')
const webp = Buffer.from(match[1], 'base64')
writeFileSync(OUTPUT, webp)
console.log(`public/roots.webp – ${VB_W * SCALE}×${VB_H * SCALE}, ${Math.round(webp.length / 1024)} KB`)
