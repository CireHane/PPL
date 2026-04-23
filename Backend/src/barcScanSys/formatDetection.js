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

//== Outbound Format Detection ==//

/**
 * Detect if barcode is a Channel
 * Format: SHOPEE, TOKOPEDIA, LAZADA, BUKALAPAK (uppercase letters only)
 */
export const isChannel = (barcode) => {
  const channelPattern = /^[A-Z]{2,}$/;
  return channelPattern.test(barcode) && barcode.length <= 20;
};

/**
 * Detect if barcode is a Resi (shipping receipt number)
 * Format: SPXID066237503871, TKPD0987654321, LAZ123456789 (6+ alphanumeric)
 * Must NOT be just uppercase letters (to avoid channel confusion)
 */
export const isResi = (barcode) => {
  const resiPattern = /^[A-Z0-9]{6,}$/;
  // Must contain at least one digit to distinguish from channel
  return resiPattern.test(barcode) && /\d/.test(barcode) && barcode.length <= 50;
};

/**
 * Extended detectBarcodeType for outbound + inbound
 * Returns: 'channel', 'resi', 'sku', 'rak', or null
 */
export const detectOutboundBarcodeType = (barcode) => {
  if (!barcode || typeof barcode !== 'string') {
    return null;
  }

  const upperBarcode = barcode.toUpperCase().trim();

  // Check Channel first (most specific: letters only)
  if (isChannel(upperBarcode)) {
    return 'channel';
  }

  // Check Resi (6+ alphanumeric with at least one digit)
  if (isResi(upperBarcode)) {
    return 'resi';
  }

  // Check RAK (letter-digit-digit format)
  if (isRAK(upperBarcode)) {
    return 'rak';
  }

  // Check SKU (alphanumeric with size suffix)
  if (isSKU(upperBarcode)) {
    return 'sku';
  }

  return null;
}; 
