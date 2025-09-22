// Configuration utilities for OpeningManager
import { DOMUtils } from './domUtils.js';
import { SpeechManager } from './speechManager.js';
import { initializeOpeningBook, getLineNames } from './openingBook.js';

// Production configuration
export function createProductionConfig() {
    return {
        domUtils: new DOMUtils(),
        speechManager: new SpeechManager(),
        openingBookLoader: initializeOpeningBook,
        lineNamesLoader: getLineNames
    };
}
