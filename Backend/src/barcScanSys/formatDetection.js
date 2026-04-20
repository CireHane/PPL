//Detects barcode type based on format patterns

/**
 * Detect if barcode is a SKU
 * Format: HU02-XL, SS1326C*XL, ZW260121A-M, etc.
 * Pattern: alphanumeric characters with possible dash or asterisk, 3-20 chars
 */
export const isSKU = (barcode) => {
  const skuPattern = /^[A-Z0-9]+[\*\-]?[A-Z0-9\*\-]*$/;
  return skuPattern.test(barcode) && barcode.length >= 3 && barcode.length <= 50;
};

/**
 * Detect if barcode is a RAK (Rack location)
 * Format: V-1-1, A-2-3, B-4-1, etc.
 * Pattern: Single letter + dash + number + dash + number
 */
export const isRAK = (barcode) => {
  const rakPattern = /^[A-Z]-\d+-\d+$/;
  return rakPattern.test(barcode);
};

/**
 * Main function to detect barcode type
 * @param {string} barcode - The scanned barcode value
 * @returns {string|null} - Returns 'sku', 'rak', or null if unrecognized
 */
export const detectBarcodeType = (barcode) => {
  if (!barcode || typeof barcode !== 'string') {
    return null;
  }

  const upperBarcode = barcode.toUpperCase().trim();

  // Check RAK first (more specific pattern)
  if (isRAK(upperBarcode)) {
    return 'rak';
  }

  // Check SKU (more general pattern)
  if (isSKU(upperBarcode)) {
    return 'sku';
  }

  return null;
};

/**
 * Format barcode for storage (normalize)
 * @param {string} barcode - Raw barcode input
 * @returns {string} - Normalized barcode
 */
export const normalizeBarcode = (barcode) => {
  return barcode.toUpperCase().trim();
};
