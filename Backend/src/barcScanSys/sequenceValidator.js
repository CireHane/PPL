
// Validates barcode scan order for inbound process
// Inbound sequence: SKU (step 1) → RAK (step 2)


/**
 * Get expected barcode type based on current step
 * @param {number} currentStep - Current scan step (0, 1, 2)
 * @returns {string|null} - Expected barcode type or null if complete
 */
export const getExpectedBarcodeType = (currentStep) => {
  const stepMap = {
    0: 'sku',    // Step 0: Expecting SKU first
    1: 'rak',    // Step 1: Expecting RAK second
    2: null,     // Step 2: Process complete
  };

  return stepMap[currentStep] !== undefined ? stepMap[currentStep] : null;
};

/**
 * Validate if scanned barcode matches expected sequence
 * @param {number} currentStep - Current step in sequence (0, 1, 2)
 * @param {string} scannedType - Type of barcode scanned ('sku' or 'rak')
 * @returns {object} - { valid: boolean, error?: string, nextStep?: number }
 */
export const validateSequence = (currentStep, scannedType) => {
  if (currentStep === undefined || currentStep === null) {
    return {
      valid: false,
      error: 'Invalid session state',
    };
  }

  // Map step to expected type
  const expectedType = getExpectedBarcodeType(currentStep);

  if (expectedType === null) {
    return {
      valid: false,
      error: 'Inbound process already completed',
    };
  }

  // Check if scanned type matches expected type
  if (scannedType !== expectedType) {
    return {
      valid: false,
      error: `Expected ${expectedType.toUpperCase()}, but got ${scannedType.toUpperCase()}`,
    };
  }

  // Valid scan - determine next step
  const nextStep = currentStep + 1;
  const isComplete = nextStep === 2;

  return {
    valid: true,
    nextStep,
    isComplete,
  };
};

/**
 * Get step description for UI feedback
 * @param {number} step - Current step (0, 1, 2)
 * @returns {string} - Human-readable step description
 */
export const getStepDescription = (step) => {
  const descriptions = {
    0: 'Ready to scan SKU',
    1: 'SKU scanned. Now scan RAK location',
    2: 'Inbound process completed',
  };

  return descriptions[step] || 'Unknown step';
};
