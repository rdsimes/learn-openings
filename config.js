// Configuration utilities for OpeningManager
import { DOMUtils, MockDOMUtils } from './domUtils.js';
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

// Test configuration with mocks
export function createTestConfig(customMocks = {}) {
    return {
        domUtils: customMocks.domUtils || new MockDOMUtils(),
        speechManager: customMocks.speechManager || createMockSpeechManager(),
        openingBookLoader: customMocks.openingBookLoader || createMockOpeningBookLoader(),
        lineNamesLoader: customMocks.lineNamesLoader || createMockLineNamesLoader(),
        ...customMocks
    };
}

// Mock factories for consistent testing
function createMockSpeechManager() {
    return {
        speakOpeningAnnouncement: () => Promise.resolve(),
        speakMovePair: () => Promise.resolve(),
        speakCompletion: () => Promise.resolve()
    };
}

function createMockOpeningBookLoader() {
    return async () => ({
        'test-opening': {
            'test-line': '1. e4 e5 2. Nf3 Nc6'
        }
    });
}

function createMockLineNamesLoader() {
    return () => ({
        'test-line': 'Test Line'
    });
}

// Configuration with partial mocks (useful for integration tests)
export function createHybridConfig(options = {}) {
    const productionConfig = createProductionConfig();
    const testConfig = createTestConfig();
    
    return {
        ...productionConfig,
        ...options
    };
}

// Utility to setup mock DOM for tests
export function setupMockDOM(mockDOM) {
    // Add common mock elements that OpeningManager expects
    const elements = [
        { id: 'ruy-lopez-lines', tag: 'div' },
        { id: 'queens-gambit-lines', tag: 'div' },
        { id: 'kings-indian-lines', tag: 'div' },
        { id: 'sicilian-lines', tag: 'div' },
        { id: 'vienna-lines', tag: 'div' },
        { id: 'london-lines', tag: 'div' },
        { selector: '.board-section h1', tag: 'h1', id: 'board-title' }
    ];
    
    elements.forEach(({ id, selector, tag }) => {
        const element = mockDOM.createElement(tag);
        const key = selector || id;
        mockDOM.addMockElement(key, element);
    });
    
    return mockDOM;
}
