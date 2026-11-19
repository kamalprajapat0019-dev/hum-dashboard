/**
 * Merged Cell Resolver.
 * In Excel / SheetJS, merged cell areas only hold their value in the top-left cell.
 * This utility resolves and propagates merged values across the 2D grid so downstream
 * column and date readers can read parent headers without guessing.
 */

export class MergedCellResolver {
  constructor(merges = [], rawGrid = []) {
    this.merges = Array.isArray(merges) ? merges : [];
    this.rawGrid = rawGrid;
    this.resolvedGrid = this._resolveGrid();
  }

  _resolveGrid() {
    // Deep copy raw grid
    const grid = this.rawGrid.map(row => (Array.isArray(row) ? [...row] : []));

    for (const merge of this.merges) {
      if (!merge || !merge.s || !merge.e) continue;
      const startR = merge.s.r;
      const endR = merge.e.r;
      const startC = merge.s.c;
      const endC = merge.e.c;

      const masterVal = grid[startR]?.[startC];
      if (masterVal === undefined || masterVal === null || masterVal === '') continue;

      for (let r = startR; r <= endR; r++) {
        if (!grid[r]) grid[r] = [];
        for (let c = startC; c <= endC; c++) {
          grid[r][c] = masterVal;
        }
      }
    }

    return grid;
  }

  getMergeAt(r, c) {
    return this.merges.find(m =>
      r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c
    ) || null;
  }

  isMerged(r, c) {
    return this.getMergeAt(r, c) !== null;
  }

  getCellValue(r, c) {
    return this.resolvedGrid[r]?.[c] ?? null;
  }

  getResolvedGrid() {
    return this.resolvedGrid;
  }
}
