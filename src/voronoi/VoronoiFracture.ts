import { BufferImageSource, Graphics, RenderTexture, Sprite, Texture } from "pixi.js";
import { Game } from "../game.js";

export const W = 500;
export const H = 500;

// generated color palette
const COLOR_PALETTE = [
  0xcecbf6, 0xafa8ec, 0x9fe1cb, 0x5dcaa3, 0xf5c4b3, 0xf0997b, 0xf4c0d1, 0xed83b1, 0xb5d4f4, 0x85b7eb, 0xc0dd97,
  0x97c459, 0xfac775, 0xef9f27, 0xf7c2c1, 0xf09595,
];

export interface ImpactParams {
  x: number; // 0..1
  y: number; // 0..1
  force: number; // 0..1
}

// A Voronoi seed site
interface Site {
  x: number;
  y: number;
  id: number;
  color: number; // from COLOR_PALETTE
}

// The three switchable visualisation modes required by the spec
export type RenderMode = "cells" | "distance" | "noised-distance";

export class Voronoi {
  // Returns white octagon texture
  public static getOctagonTexture(): Texture {
    const cx = W / 2,
      cy = H / 2,
      radius = 250;

    const points: number[] = [];

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;

      points.push(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }

    const g = new Graphics();
    g.poly(points);
    g.fill({ color: 0xffffff, alpha: 0.5 });

    const texture = Game.ins.app.renderer.generateTexture(g);
    g.destroy();

    return texture;
  }

  public getTexture(numSites = 30, impact: ImpactParams = { x: 0.5, y: 0.5, force: 0.6 }): Texture {
    const { renderTexture } = this.renderToTexture(numSites, impact);
    return renderTexture;
  }

  public drawForMesh(
    numSites = 30,
    impact: ImpactParams,
  ): {
    texture: Texture; // texture for pre-break mesh
    cells: Array<{
      cx: number;
      cy: number;
      cw: number;
      ch: number;
      cellTexture: Texture; // texture per cell
      vx: number;
      vy: number;
      va: number;
    }>;
  } {
    const { renderTexture, sites, siteGrid, maskGrid } = this.renderToTexture(numSites, impact);

    const texture = renderTexture;
    const ix = impact.x * W;
    const iy = impact.y * H;

    // get image data of whole canvas by extracting pixels from the render texture
    const renderer = Game.ins.app.renderer;
    const atlasPixels = renderer.extract.pixels(renderTexture);

    const cells = sites.flatMap((_site, i) => {
      // find bounding box of current cell based on sitegrid and maskgrid
      let minX = W,
        minY = H,
        maxX = 0,
        maxY = 0;
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const idx = py * W + px;
          if (siteGrid[idx] === i && maskGrid[idx]) {
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px > maxX) maxX = px;
            if (py > maxY) maxY = py;
          }
        }
      }

      // site landed outside the mask entirely, skip it
      if (minX > maxX || minY > maxY) return [];

      const cw = maxX - minX + 1;
      const ch = maxY - minY + 1;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      // copy only pixels belonging to this cell, leave others transparent
      const cellPixels = new Uint8Array(cw * ch * 4);
      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const srcIdx = py * W + px;
          if (siteGrid[srcIdx] !== i || !maskGrid[srcIdx]) continue;

          const dstIdx = ((py - minY) * cw + (px - minX)) * 4;
          const srcPx = srcIdx * 4;
          cellPixels[dstIdx + 0] = atlasPixels.pixels[srcPx + 0];
          cellPixels[dstIdx + 1] = atlasPixels.pixels[srcPx + 1];
          cellPixels[dstIdx + 2] = atlasPixels.pixels[srcPx + 2];
          cellPixels[dstIdx + 3] = atlasPixels.pixels[srcPx + 3];
        }
      }

      // create texture from buffer
      const cellTexture = new Texture({
        source: new BufferImageSource({
          resource: cellPixels,
          width: cw,
          height: ch,
          format: "rgba8unorm",
        }),
      });

      // Velocity outward from impact
      let dx = cx - ix,
        dy = cy - iy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dist;
      dy /= dist;
      const speed = 0.08 + 0.18 * (1 - Math.min(dist / 500, 1));

      return [
        {
          cx,
          cy,
          cw,
          ch,
          cellTexture,
          vx: dx * speed,
          vy: dy * speed,
          va: (Math.random() - 0.5) * 0.003 * (dist / 200 + 0.5),
        },
      ];
    });
    return { texture, cells };
  }

  private renderToTexture(
    numSites: number,
    impact: ImpactParams,
  ): {
    renderTexture: RenderTexture;
    sites: Site[];
    siteGrid: Int32Array;
    maskGrid: Uint8Array;
  } {
    // generate numSites sites based on impact force and position
    const sites = this.generateSites(numSites, impact);

    // make polygon out of our quadrat
    const octPoly = this.buildOctagonPoly(W / 2, H / 2, 250);
    const maskGrid = this.buildMaskGrid(octPoly, W, H);

    // pixel/grid based voronoi diagram via jump flood algorithm
    const { siteGrid, distGrid } = this.runJFA(sites, maskGrid, W, H);

    // just some values no time for more lol
    this.applyNoiseToDistField(distGrid, maskGrid, W, H, 40, 18);

    // visualizations
    const pixels = this.renderToPixelBuffer(sites, siteGrid, distGrid, maskGrid, W, H);
    const baseSprite = new Sprite(
      new Texture({
        source: new BufferImageSource({
          resource: pixels,
          width: W,
          height: H,
          format: "rgba8unorm",
        }),
      }),
    );

    const edgesGfx = this.drawCellEdges(siteGrid, maskGrid, W, H);

    // overlay (currently only for seed point)
    const overlayGfx = this.drawOverlays(sites, impact);

    const renderer = Game.ins.app.renderer;
    const renderTexture = RenderTexture.create({ width: W, height: H });
    renderer.render({ container: baseSprite, target: renderTexture, clear: true });
    renderer.render({ container: edgesGfx, target: renderTexture, clear: false });
    renderer.render({ container: overlayGfx, target: renderTexture, clear: false });

    // noise overlay
    // yes im computing the noise twice
    if (Game.ins.debug_show_noise_overlay) {
      console.info("Noise overlay");
      const noisePixels = new Uint8Array(W * H * 4);
      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const idx = py * W + px;
          if (!maskGrid[idx]) continue;

          const n = this.valueNoise(px, py, 40);
          const v = Math.round(n * 255);
          noisePixels[idx * 4 + 0] = v;
          noisePixels[idx * 4 + 1] = v;
          noisePixels[idx * 4 + 2] = v;
          noisePixels[idx * 4 + 3] = 180; // semi-transparent so cell colors still show through
        }
      }

      const noiseSprite = new Sprite(
        new Texture({
          source: new BufferImageSource({
            resource: noisePixels,
            width: W,
            height: H,
            format: "rgba8unorm",
          }),
        }),
      );
      renderer.render({ container: noiseSprite, target: renderTexture, clear: false });
      noiseSprite.destroy(true);
    }

    baseSprite.destroy(true);
    edgesGfx.destroy();
    overlayGfx.destroy();

    return { renderTexture, sites, siteGrid, maskGrid };
  }

  private renderToPixelBuffer(
    sites: Site[],
    siteGrid: Int32Array,
    distGrid: Float32Array,
    maskGrid: Uint8Array,
    width: number,
    height: number,
  ): Uint8Array {
    const data = new Uint8Array(width * height * 4); // fromBuffer wants Uint8Array, not Uint8ClampedArray

    const maxDist = new Float32Array(sites.length);
    for (let i = 0; i < width * height; i++) {
      const sid = siteGrid[i];
      if (sid >= 0 && distGrid[i] > maxDist[sid]) maxDist[sid] = distGrid[i];
    }

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const idx = py * width + px;

        // Outside silhouette → fully transparent
        if (!maskGrid[idx] || siteGrid[idx] < 0) {
          data[idx * 4 + 3] = 0;
          continue;
        }

        const sid = siteGrid[idx];
        const baseColor = sites[sid].color;
        const br = (baseColor >> 16) & 0xff;
        const bg = (baseColor >> 8) & 0xff;
        const bb = baseColor & 0xff;

        if (!Game.ins.debug_show_distance_fields) {
          // if no distance fields shown -> flat color
          // (except center dot)
          data[idx * 4 + 0] = br;
          data[idx * 4 + 1] = bg;
          data[idx * 4 + 2] = bb;
          data[idx * 4 + 3] = 153; // 0.6 × 255
        } else {
          // show distance fields to cell boundary (color gradient)
          const t = maxDist[sid] > 0 ? distGrid[idx] / maxDist[sid] : 0;

          // lerp from black at boundary to full colour at centre
          data[idx * 4 + 0] = Math.round(br * t + 20 * (1 - t));
          data[idx * 4 + 1] = Math.round(bg * t + 20 * (1 - t));
          data[idx * 4 + 2] = Math.round(bb * t + 20 * (1 - t));
          data[idx * 4 + 3] = 220;
        }
      }
    }

    return data;
  }

  // 1-pixel cell boundary lines
  // horizontal & vertical neighbour difference scan
  private drawCellEdges(siteGrid: Int32Array, maskGrid: Uint8Array, width: number, height: number): Graphics {
    const g = new Graphics();
    g.setStrokeStyle({ color: 0x444441, alpha: 0.5, width: 1 });

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width - 1; px++) {
        const idx = py * width + px;
        if (!maskGrid[idx]) continue;
        const a = siteGrid[idx],
          b = siteGrid[idx + 1];
        if (a !== b && a >= 0 && b >= 0) {
          g.moveTo(px + 1, py).lineTo(px + 1, py + 1);
        }
      }
    }
    for (let py = 0; py < height - 1; py++) {
      for (let px = 0; px < width; px++) {
        const idx = py * width + px;
        if (!maskGrid[idx]) continue;
        const a = siteGrid[idx],
          b = siteGrid[(py + 1) * width + px];
        if (a !== b && a >= 0 && b >= 0) {
          g.moveTo(px, py + 1).lineTo(px + 1, py + 1);
        }
      }
    }

    g.stroke();
    return g;
  }

  /* eslint-disable */
  private drawOverlays(sites: Site[], _: ImpactParams): Graphics {
    // const ix = impact.x * W;
    // const iy = impact.y * H;

    const g = new Graphics();

    // One filled dot per seed site
    if (Game.ins.debug_show_seed_points) {
      g.setFillStyle({ color: 0x2c2c2a, alpha: 0.85 });
      for (const site of sites) {
        g.circle(site.x, site.y, 3).fill();
      }
    }

    // // impact point marker
    // const markerR = 10;
    // ctx.strokeStyle = "#d85a30";
    // ctx.lineWidth = 2;
    // ctx.beginPath();
    // ctx.arc(ix, iy, markerR, 0, Math.PI * 2);
    // ctx.stroke();

    return g;
  }

  // generate sites based on a rayleigh distribution centered around the impact point
  // sigma is determined by force
  // basically implementing https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
  // and run it for every site
  private generateSites(n: number, impact: ImpactParams, padding = 20): Site[] {
    const ix = impact.x * W;
    const iy = impact.y * H;

    // maximum radius that lets sites reach the corners
    const maxRadius = Math.sqrt(W * W + H * H) / 2;

    const force = Math.max(0.01, Math.min(1, impact.force));

    // force 0 -> completely uniform spread
    // force 1 -> all on one point
    const sigma = maxRadius * (1 - force);

    const sites: Site[] = [];

    while (sites.length < n) {
      const r = sigma * Math.sqrt(-2 * Math.log(Math.random()));
      const theta = Math.random() * Math.PI * 2;

      const x = Math.min(W - padding, Math.max(padding, ix + r * Math.cos(theta)));
      const y = Math.min(H - padding, Math.max(padding, iy + r * Math.sin(theta)));

      sites.push({ x, y, id: sites.length, color: COLOR_PALETTE[sites.length % COLOR_PALETTE.length] });
    }
    return sites;
  }

  // build a regular convex octagon w 45 degree steps
  private buildOctagonPoly(cx: number, cy: number, radius: number): Array<{ x: number; y: number }> {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (Math.PI / 4) * i; // 45deg steps
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }

  // point-in-convex-polygon test (CCW winding)
  private pointInConvexPolygon(px: number, py: number, poly: Array<{ x: number; y: number }>): boolean {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      if ((b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x) < 0) return false;
    }
    return true;
  }

  // precompute mask array inside silhouette
  // used to avoid repeating polygon test every tick
  private buildMaskGrid(poly: Array<{ x: number; y: number }>, width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height);
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        mask[py * width + px] = this.pointInConvexPolygon(px, py, poly) ? 1 : 0;
      }
    }
    return mask;
  }

  private computeVoronoiEdgeDistances(
    src: Array<{ siteId: number; seedX: number; seedY: number }>,
    sites: Site[],
    maskGrid: Uint8Array,
    width: number,
    height: number,
  ): Float32Array {
    const distGrid = new Float32Array(width * height);

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const idx = py * width + px;
        if (!maskGrid[idx] || src[idx].siteId < 0) continue;

        const pa = sites[src[idx].siteId];
        let minEdgeDist = Infinity;

        // check all sites
        // not very efficient
        for (const pb of sites) {
          if (pb.id === pa.id) continue;

          // midpoint between pa and pb
          const mx = (pa.x + pb.x) / 2;
          const my = (pa.y + pb.y) / 2;

          // direction pa -> pb
          const dx = pb.x - pa.x;
          const dy = pb.y - pa.y;
          const len = Math.sqrt(dx * dx + dy * dy);

          // normal distance from x to the Voronoi edge
          const d = ((px - mx) * dx + (py - my) * dy) / len;

          if (d < minEdgeDist) {
            minEdgeDist = d;
          }
        }

        distGrid[idx] = Math.max(0, minEdgeDist);
      }
    }

    return distGrid;
  }

  // applies noise to dist grid
  private applyNoiseToDistField(
    distGrid: Float32Array,
    maskGrid: Uint8Array,
    width: number,
    height: number,
    noiseScale: number,
    noiseStrength: number,
  ): void {
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const idx = py * width + px;
        if (!maskGrid[idx]) continue;

        const n = (this.valueNoise(px, py, noiseScale) - 0.5) * noiseStrength;
        distGrid[idx] = Math.max(0, distGrid[idx] + n);
      }
    }
  }

  // based on https://en.wikipedia.org/wiki/Jump_flooding_algorithm
  private runJFA(
    sites: Site[],
    maskGrid: Uint8Array,
    width: number,
    height: number,
  ): { siteGrid: Int32Array; distGrid: Float32Array } {
    const N = width * height;
    const EMPTY = -1;

    // A cell holds the nearest known seed for that pixel
    type Cell = { siteId: number; seedX: number; seedY: number };
    const empty = (): Cell => ({ siteId: EMPTY, seedX: -1, seedY: -1 });
    const sqDist = (ax: number, ay: number, bx: number, by: number) => (ax - bx) ** 2 + (ay - by) ** 2;

    // init: set all pixels empty
    let src: Cell[] = Array.from({ length: N }, empty);

    // still step 0, set seed pixels to their unique colors
    for (const site of sites) {
      const px = Math.round(site.x);
      const py = Math.round(site.y);
      const inBounds = px >= 0 && px < width && py >= 0 && py < height;
      if (inBounds && maskGrid[py * width + px])
        src[py * width + px] = { siteId: site.id, seedX: site.x, seedY: site.y };
    }

    // Start: For each step size k (N/2, N/4, ..., 1), run one iteration of the JFA:
    const maxDim = Math.max(width, height);
    // I hate javascript what is this
    const steps = Array.from({ length: Math.ceil(Math.log2(maxDim)) }, (_, i) =>
      Math.max(1, 2 ** (Math.ceil(Math.log2(maxDim)) - 1 - i)),
    ).concat([1]); // JFA+1 variant

    const NEIGHBOUR_OFFSETS = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ] as const;

    for (const step of steps) {
      const dst: Cell[] = Array.from({ length: N }, empty);

      // Iterate over every pixel p at (x, y)
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const idx = py * width + px;

          if (!maskGrid[idx]) continue; // if outside mask grid, ignore

          let best = src[idx];
          let bestDist = best.siteId >= 0 ? sqDist(px, py, best.seedX, best.seedY) : Infinity;

          // for each noighbor q at ...:
          for (const [dx, dy] of NEIGHBOUR_OFFSETS) {
            const nx = px + dx * step;
            const ny = py + dy * step;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const neighbour = src[ny * width + nx];
            // if neighbor is undefined we dont core
            if (neighbour.siteId === EMPTY) continue;

            // if neighbor is colored, look at distance. over iteration the lowest distance is taken
            const d = sqDist(px, py, neighbour.seedX, neighbour.seedY);
            if (d < bestDist) {
              bestDist = d;
              best = neighbour;
            }
          }

          // at the end, the neighbor with the best distance is taken
          dst[idx] = best;
        }
      }

      src = dst; // swap -> output becomes input
    }

    // extract typed output arrays
    const siteGrid = new Int32Array(N);
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        siteGrid[py * width + px] = src[py * width + px].siteId;
      }
    }
    const distGrid = this.computeVoronoiEdgeDistances(src, sites, maskGrid, width, height);

    return { siteGrid, distGrid };
  }

  // value noise based loosely on this: https://thebookofshaders.com/11
  private valueNoise(px: number, py: number, scale: number): number {
    const xi = Math.floor(px / scale);
    const yi = Math.floor(py / scale);
    const xf = px / scale - xi;
    const yf = py / scale - yi;

    // smoothstep
    const ux = xf * xf * (3 - 2 * xf);
    const uy = yf * yf * (3 - 2 * yf);

    // typical "random"-ish hash: sin(seed) * beeg prime -> just get fraction
    const hash = (a: number, b: number): number => {
      const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
      return n - Math.floor(n);
    };

    // nlend
    return (
      hash(xi, yi) * (1 - ux) * (1 - uy) +
      hash(xi + 1, yi) * ux * (1 - uy) +
      hash(xi, yi + 1) * (1 - ux) * uy +
      hash(xi + 1, yi + 1) * ux * uy
    );
  }
}
