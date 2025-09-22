// Vitest test file for OpeningManager
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpeningManager } from './openingManager.js'
import { MockDOMUtils } from './domUtils.js'

// Mock the openingBook module to provide the openingNames
vi.mock('./openingBook.js', async () => {
    const actual = await vi.importActual('./openingBook.js')
    return {
        ...actual,
        openingNames: {
            'ruylopez': 'Ruy Lopez'  // Use correct key without hyphens
        }
    }
})

// Mock dependencies for testing
class MockChessBoardManager {
    constructor() {
        this.resetCalled = false
        this.movesMade = []
        this.game = { turn: () => 'w' }
        this.userMovesEnabled = false
    }
    
    reset() {
        this.resetCalled = true
        this.movesMade = []
    }
    
    makeMove(move) {
        this.movesMade.push(move)
        return { san: move, from: 'e2', to: 'e4' }
    }
    
    enableUserMoves() {
        this.userMovesEnabled = true
    }
    
    disableUserMoves(showOverlay = true) {
        this.userMovesEnabled = false
    }
    
    getGame() {
        return this.game
    }
}

class MockUIManager {
    constructor() {
        this.status = ''
        this.gameInfo = ''
        this.errors = []
        this.playButtonEnabled = false
        this.testButtonEnabled = false
    }
    
    setStatus(status) {
        this.status = status
    }
    
    setGameInfo(info) {
        this.gameInfo = info
    }
    
    showError(error) {
        this.errors.push(error)
    }
    
    enablePlayButton() {
        this.playButtonEnabled = true
    }
    
    enableTestButton() {
        this.testButtonEnabled = true
    }
    
    setStatusClass() {
        // Mock implementation
    }
    
    setProgressInfo() {
        // Mock implementation
    }
    
    updatePlayButtonText() {
        // Mock implementation
    }
    
    updateTestButtonText() {
        // Mock implementation
    }
    
    disablePlayButton() {
        // Mock implementation
    }
    
    disableTestButton() {
        // Mock implementation
    }
}

class MockSpeechManager {
    constructor() {
        this.announcements = []
        this.movePairs = []
        this.completions = []
    }
    
    speakOpeningAnnouncement(opening, line) {
        this.announcements.push({ opening, line })
        return Promise.resolve()
    }
    
    speakMovePair(moves) {
        this.movePairs.push(moves)
        return Promise.resolve()
    }
    
    speakCompletion(nextPlayer) {
        this.completions.push(nextPlayer)
        return Promise.resolve()
    }
}

// Mock opening book loader
const mockOpeningBookLoader = vi.fn(async () => {
    return {
        'ruylopez': {  // Use correct key without hyphens
            'main-line': '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6',
            'exchange': '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6'
        }
    }
})

const mockLineNamesLoader = vi.fn(() => {
    return {
        'main-line': 'Main Line',
        'exchange': 'Exchange Variation'
    }
})

describe('OpeningManager', () => {
    let mockChessBoard
    let mockUI
    let mockDOM
    let mockSpeech
    let openingManager

    beforeEach(() => {
        // Reset all mocks before each test
        mockChessBoard = new MockChessBoardManager()
        mockUI = new MockUIManager()
        mockDOM = new MockDOMUtils()
        mockSpeech = new MockSpeechManager()
        
        // Reset mock function call counts
        mockOpeningBookLoader.mockClear()
        mockLineNamesLoader.mockClear()
        
        // Create fresh instance for each test
        openingManager = new OpeningManager(mockChessBoard, mockUI, {
            domUtils: mockDOM,
            speechManager: mockSpeech,
            openingBookLoader: mockOpeningBookLoader,
            lineNamesLoader: mockLineNamesLoader
        })
    })

    describe('initialization', () => {
        it('should initialize successfully with valid dependencies', async () => {
            // Setup mock DOM elements
            const linesContainer = mockDOM.createElement('div')
            mockDOM.addMockElement('ruylopez-lines', linesContainer)  // Use correct key
            
            const result = await openingManager.initialize()
            
            expect(result).toBe(true)
            expect(mockUI.errors).toHaveLength(0)
            expect(Object.keys(openingManager.getOpeningBook())).toHaveLength(1)
            expect(mockOpeningBookLoader).toHaveBeenCalledOnce()
            expect(mockLineNamesLoader).toHaveBeenCalledOnce()
        })

        it('should handle initialization errors gracefully', async () => {
            // Mock loader to throw error
            const errorLoader = vi.fn().mockRejectedValue(new Error('Failed to load'))
            
            const failingManager = new OpeningManager(mockChessBoard, mockUI, {
                domUtils: mockDOM,
                speechManager: mockSpeech,
                openingBookLoader: errorLoader,
                lineNamesLoader: mockLineNamesLoader
            })
            
            const result = await failingManager.initialize()
            
            expect(result).toBe(false)
            expect(mockUI.errors).toHaveLength(1)
            expect(mockUI.errors[0]).toBe('Could not load opening book from PGN files')
        })
    })

    describe('opening selection', () => {
        beforeEach(async () => {
            // Setup mock DOM elements
            const linesContainer = mockDOM.createElement('div')
            mockDOM.addMockElement('ruylopez-lines', linesContainer)  // Use correct key
            
            const titleElement = mockDOM.createElement('h1')
            mockDOM.addMockElement('.board-section h1', titleElement)
            
            await openingManager.initialize()
        })

        it('should select an opening and update UI correctly', () => {
            // Create a proper DOM structure with parent-child relationship
            const categoryElement = mockDOM.createElement('div')
            categoryElement.classList.add('opening-category')
            const lineElement = mockDOM.createElement('div')
            mockDOM.appendChild(categoryElement, lineElement)
            
            openingManager.selectOpening('ruylopez', 'main-line', lineElement)  // Use correct key
            
            expect(openingManager.getSelectedOpening()).toBe('ruylopez')
            expect(openingManager.getSelectedLine()).toBe('main-line')
            expect(mockUI.playButtonEnabled).toBe(true)
            expect(mockUI.testButtonEnabled).toBe(true)
            expect(lineElement.classList.contains('selected')).toBe(true)
            expect(mockUI.gameInfo).toContain('Main Line variation selected')
        })

        it('should update board title when opening is selected', () => {
            // Create a proper DOM structure with parent-child relationship
            const categoryElement = mockDOM.createElement('div')
            categoryElement.classList.add('opening-category')
            const lineElement = mockDOM.createElement('div')
            mockDOM.appendChild(categoryElement, lineElement)
            const titleElement = mockDOM.getMockElement('.board-section h1')
            
            openingManager.selectOpening('ruylopez', 'main-line', lineElement)  // Use correct key
            
            expect(titleElement.textContent).toBe('Ruy Lopez - Main Line')
        })

        it('should remove selection from other elements', () => {
            // Create proper DOM structure with parent-child relationships
            const categoryElement1 = mockDOM.createElement('div')
            categoryElement1.classList.add('opening-category')
            const element1 = mockDOM.createElement('div')
            mockDOM.appendChild(categoryElement1, element1)
            
            const categoryElement2 = mockDOM.createElement('div')
            categoryElement2.classList.add('opening-category')
            const element2 = mockDOM.createElement('div')
            mockDOM.appendChild(categoryElement2, element2)
            
            // Add elements to mock DOM
            mockDOM.addMockElement('element1', element1)
            mockDOM.addMockElement('element2', element2)
            
            // Mock querySelectorAll to return both elements
            const querySelectorAllSpy = vi.spyOn(mockDOM, 'querySelectorAll')
            querySelectorAllSpy.mockReturnValue([element1, element2])
            
            // Select first opening
            openingManager.selectOpening('ruylopez', 'main-line', element1)  // Use correct key
            
            // Select second opening
            openingManager.selectOpening('ruylopez', 'exchange', element2)  // Use correct key
            
            expect(element1.classList.contains('selected')).toBe(false)
            expect(element2.classList.contains('selected')).toBe(true)
        })
    })

    describe('test mode', () => {
        beforeEach(async () => {
            await openingManager.initialize()
            
            // Create proper DOM structure with parent-child relationship
            const categoryElement = mockDOM.createElement('div')
            categoryElement.classList.add('opening-category')
            const lineElement = mockDOM.createElement('div')
            mockDOM.appendChild(categoryElement, lineElement)
            
            openingManager.selectOpening('ruylopez', 'main-line', lineElement)  // Use correct key
            await openingManager.testOpening()
        })

        it('should start test mode correctly', () => {
            expect(openingManager.isTestMode).toBe(true)
            expect(openingManager.currentTestMoveIndex).toBe(0)
            expect(openingManager.testMoves).toContain('e4')
            expect(mockUI.status).toContain('Test Mode')
            expect(mockChessBoard.resetCalled).toBe(true)
        })

        it('should accept correct moves in test mode', () => {
            const correctMove = { san: 'e4', from: 'e2', to: 'e4' }
            
            const result = openingManager.handleTestMove(correctMove)
            
            expect(result).toBe(true)
            expect(openingManager.currentTestMoveIndex).toBe(1)
            expect(mockUI.status).toBe('✅ Correct! 5 moves to go')
        })

        it('should reject incorrect moves in test mode', () => {
            const incorrectMove = { san: 'd4', from: 'd2', to: 'd4' }
            
            const result = openingManager.handleTestMove(incorrectMove)
            
            expect(result).toBe(false)
            expect(openingManager.currentTestMoveIndex).toBe(0)
            expect(mockUI.status).toContain('❌ Wrong move!')
        })

        it('should complete test mode after all correct moves', () => {
            // Simulate all moves in the opening
            const moves = [
                { san: 'e4', from: 'e2', to: 'e4' },
                { san: 'e5', from: 'e7', to: 'e5' },
                { san: 'Nf3', from: 'g1', to: 'f3' },
                { san: 'Nc6', from: 'b8', to: 'c6' },
                { san: 'Bb5', from: 'f1', to: 'b5' },
                { san: 'a6', from: 'a7', to: 'a6' }
            ]
            
            moves.forEach(move => {
                openingManager.handleTestMove(move)
            })
            
            expect(openingManager.isTestMode).toBe(false)
            expect(mockUI.status).toContain('🎉 Perfect!')
        })

        it('should handle disambiguation in move comparison', () => {
            // Test with a move that has disambiguation
            openingManager.testMoves = ['Ncb4'] // Expected move with disambiguation
            openingManager.currentTestMoveIndex = 0
            
            const actualMove = { san: 'Nb4', from: 'c2', to: 'b4' }
            const result = openingManager.handleTestMove(actualMove)
            
            expect(result).toBe(true)
        })
    })

    describe('DOM operations', () => {
        it('should use DOM utilities for all DOM operations', async () => {
            const linesContainer = mockDOM.createElement('div')
            mockDOM.addMockElement('ruylopez-lines', linesContainer)  // Use correct key
            
            const createElementSpy = vi.spyOn(mockDOM, 'createElement')
            const setInnerHTMLSpy = vi.spyOn(mockDOM, 'setInnerHTML')
            const appendChildSpy = vi.spyOn(mockDOM, 'appendChild')
            
            await openingManager.initialize()
            
            expect(createElementSpy).toHaveBeenCalled()
            expect(setInnerHTMLSpy).toHaveBeenCalledWith(linesContainer, '')
            expect(appendChildSpy).toHaveBeenCalled()
        })

        it('should toggle category visibility using DOM utilities', () => {
            const linesElement = mockDOM.createElement('div')
            mockDOM.addMockElement('test-category-lines', linesElement)
            
            const toggleClassSpy = vi.spyOn(mockDOM, 'toggleClass')
            
            openingManager.toggleCategory('test-category')
            
            expect(toggleClassSpy).toHaveBeenCalledWith(linesElement, 'expanded')
        })
    })

    describe('speech integration', () => {
        beforeEach(async () => {
            await openingManager.initialize()
            
            // Create proper DOM structure with parent-child relationship
            const categoryElement = mockDOM.createElement('div')
            categoryElement.classList.add('opening-category')
            const lineElement = mockDOM.createElement('div')
            mockDOM.appendChild(categoryElement, lineElement)
            
            openingManager.selectOpening('ruylopez', 'main-line', lineElement)  // Use correct key
        })

        it('should announce opening start when playing', async () => {
            await openingManager.playOpening()
            
            expect(mockSpeech.announcements).toHaveLength(1)
            expect(mockSpeech.announcements[0]).toEqual({
                opening: 'Ruy Lopez',
                line: 'Main Line'
            })
        })

        it('should speak move pairs during playback', async () => {
            await openingManager.playOpening()
            
            expect(mockSpeech.movePairs.length).toBeGreaterThan(0)
        })
    })
})
