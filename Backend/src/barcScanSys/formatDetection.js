//Detects barcode type based on format patterns

/**
 * Detect if barcode is a SKU
 * Format: Parent SKU (ZW260121A) or Child SKU (ZW260121A-M, SS1326C*XL)
 * Pattern: alphanumeric base followed by optional size suffix (S|M|L|XL|XXL|XXXL)
 * Max length: 13 chars (to distinguish from longer RESI codes which are 14+ chars)
 */
export const isSKU = (barcode) => {
  const skuPattern = /^[A-Z0-9]+([-*](S|M|L|XL|XXL|XXXL))?$/;
  return skuPattern.test(barcode) && barcode.length >= 3 && barcode.length <= 13;
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
 * Format: Known channel names only (marketplace/platform names)
 */
export const isChannel = (barcode) => {
  const validChannels = [
    'SHOPEE',
    'TOKOPEDIA',
    'LAZADA',
    'BLIBLI',
    'BUKALAPAK',
    'TIKTOK',
    'TIKTOK SHOP',
    'JD.ID',
    'ZALORA',
    'ORAMI',
    'SOCIOLLA',
    'AKULAKU',
    'RALALI',
    'GOMART',
    'GRABMART',
    'SHOPEEFOOD',
    'SHOPEEMART',
    'JET.CO.ID',
  ];
  return validChannels.includes(barcode);
};

/**
 * Detect if barcode is a Resi (shipping receipt number)
 * Format: Courier prefix only (SPX, JNE, AJ, JT, SC, ANA, etc.)
 * Initial validation just checks for valid courier prefix
 */
export const isResi = (barcode) => {
  // List of valid courier prefixes (can be followed by any characters)
  const courierPrefixes = [
    'SPX',    // Shopee SiCepat
    'SICE',   // Shopee SiCepat
    'JNE',    // Shopee/Tokopedia/Lazada JNE
    'AJ',     // Shopee Anteraja
    'JT',     // Tokopedia J&T
    'SC',     // Tokopedia SiCepat
    'ANA',    // Tokopedia Anteraja
    'LX',     // Lazada LEX
    'IDE',    // Lazada ID Express
    'LP',     // Lion Parcel
    'WH',     // Wahana
    'NIN',    // Ninja Express
    'EE',     // Pos Indonesia EMS
  ];

  // Check if barcode starts with any valid courier prefix
  return courierPrefixes.some(prefix => barcode.startsWith(prefix));
};

/**
 * Extended detectBarcodeType for outbound + inbound
 * Returns: 'channel', 'resi', 'sku', 'rak', or null
 * Detection order: CHANNEL → RESI → SKU → RAK
 */
export const detectOutboundBarcodeType = (barcode) => {
  if (!barcode || typeof barcode !== 'string') {
    return null;
  }

  const upperBarcode = barcode.toUpperCase().trim();

  // Check Channel first (known channel names: SHOPEE, TOKOPEDIA, etc.)
  if (isChannel(upperBarcode)) {
    return 'channel';
  }

  // Check RESI second (courier prefix: SPX, JNE, AJ, JT, etc.)
  if (isResi(upperBarcode)) {
    return 'resi';
  }

  // Check SKU third (alphanumeric with optional size suffix, max 13 chars)
  if (isSKU(upperBarcode)) {
    return 'sku';
  }

  // Check RAK last (letter-digit-digit format like A-1-1)
  if (isRAK(upperBarcode)) {
    return 'rak';
  }

  return null;
}; 
