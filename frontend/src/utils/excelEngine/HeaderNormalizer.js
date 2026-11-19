/**
 * Header Normalizer & Column Mapping Engine.
 * Matches spreadsheet headers against alias dictionaries, detects duplicate mappings,
 * and preserves unknown columns for review.
 */

import { cleanCellText } from './SafeFormatters.js';

export class HeaderNormalizer {
  constructor(profile) {
    this.profile = profile;
  }

  normalizeHeaderString(str) {
    return cleanCellText(str)
      .toLowerCase()
      .replace(/[\._\-\(\)\[\]]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Scans a header row and matches against profile standard fields.
   */
  mapHeaders(headerRow = [], manualOverrides = {}) {
    const standardFields = this.profile.standardFields || [];
    const mappedFields = {};
    const columnDetails = [];
    const unmappedColumns = [];
    const duplicateMappings = [];

    // Track which fieldKeys have been claimed
    const claimedKeys = new Map();

    headerRow.forEach((rawCol, colIndex) => {
      const headerStr = cleanCellText(rawCol);
      const normalized = this.normalizeHeaderString(headerStr);

      let matchedField = null;

      // Check manual overrides first
      if (manualOverrides[colIndex]) {
        const overrideKey = manualOverrides[colIndex];
        matchedField = standardFields.find(f => f.key === overrideKey) || {
          key: overrideKey,
          label: overrideKey,
          required: false,
        };
      } else if (normalized) {
        // Match against aliases
        for (const field of standardFields) {
          const match = field.aliases.some(alias => {
            const normAlias = this.normalizeHeaderString(alias);
            return normalized === normAlias || normalized.startsWith(normAlias + ' ') || normalized.endsWith(' ' + normAlias);
          });

          if (match) {
            matchedField = field;
            break;
          }
        }
      }

      // Check if it's a shift column
      const isShift = headerStr ? (this.profile.shiftPattern.test(headerStr) || /shift/i.test(headerStr)) : false;

      if (matchedField) {
        if (claimedKeys.has(matchedField.key)) {
          duplicateMappings.push({
            key: matchedField.key,
            label: matchedField.label,
            colIndexes: [claimedKeys.get(matchedField.key), colIndex],
          });
        } else {
          claimedKeys.set(matchedField.key, colIndex);
          mappedFields[matchedField.key] = colIndex;
        }

        columnDetails.push({
          colIndex,
          originalHeader: headerStr,
          mappedKey: matchedField.key,
          mappedLabel: matchedField.label,
          isStandard: true,
          isShift: false,
          isUnmapped: false,
        });
      } else if (isShift) {
        columnDetails.push({
          colIndex,
          originalHeader: headerStr,
          mappedKey: `shift_${colIndex}`,
          mappedLabel: headerStr,
          isStandard: false,
          isShift: true,
          isUnmapped: false,
        });
      } else {
        const isUnknown = headerStr !== '';
        columnDetails.push({
          colIndex,
          originalHeader: headerStr,
          mappedKey: null,
          mappedLabel: null,
          isStandard: false,
          isShift: false,
          isUnmapped: isUnknown,
        });
        if (isUnknown) {
          unmappedColumns.push({ colIndex, originalHeader: headerStr });
        }
      }
    });

    return {
      mappedFields,
      columnDetails,
      unmappedColumns,
      duplicateMappings,
    };
  }
}
