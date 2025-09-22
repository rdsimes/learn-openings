// Test for DOM utilities
import { describe, it, expect, beforeEach } from 'vitest'
import { DOMUtils, MockDOMUtils } from './domUtils.js'

describe('DOMUtils', () => {
    describe('MockDOMUtils', () => {
        let mockDOM

        beforeEach(() => {
            mockDOM = new MockDOMUtils()
        })

        it('should create elements with proper structure', () => {
            const element = mockDOM.createElement('div')
            
            expect(element.tagName).toBe('DIV')
            expect(element.className).toBe('')
            expect(element.textContent).toBe('')
            expect(element.children).toEqual([])
        })

        it('should manage element classes correctly', () => {
            const element = mockDOM.createElement('div')
            
            mockDOM.addClass(element, 'test-class')
            expect(element.className).toBe('test-class')
            
            mockDOM.addClass(element, 'another-class')
            expect(element.className).toBe('test-class another-class')
            
            mockDOM.removeClass(element, 'test-class')
            expect(element.className).toBe('another-class')
            
            mockDOM.toggleClass(element, 'toggle-class')
            expect(element.className).toBe('another-class toggle-class')
            
            mockDOM.toggleClass(element, 'toggle-class')
            expect(element.className).toBe('another-class')
        })

        it('should handle element storage and retrieval', () => {
            const element = mockDOM.createElement('div')
            mockDOM.addMockElement('test-id', element)
            
            const retrieved = mockDOM.getElementById('test-id')
            expect(retrieved).toBe(element)
            expect(retrieved.id).toBe('test-id')
        })

        it('should query elements by selector', () => {
            const element1 = mockDOM.createElement('div')
            const element2 = mockDOM.createElement('span')
            
            mockDOM.addMockElement('element1', element1)
            mockDOM.addMockElement('element2', element2)
            
            // Test ID selector
            const found = mockDOM.querySelector('#element1')
            expect(found).toBe(element1)
            
            // Test that non-existent selectors return null
            const notFound = mockDOM.querySelector('#nonexistent')
            expect(notFound).toBeNull()
        })

        it('should handle event listeners', () => {
            const element = mockDOM.createElement('button')
            mockDOM.addMockElement('test-button', element)
            
            let clickCount = 0
            const clickHandler = () => { clickCount++ }
            
            mockDOM.addEventListener(element, 'click', clickHandler)
            
            // Trigger the event
            mockDOM.triggerEvent('test-button', 'click')
            expect(clickCount).toBe(1)
            
            // Trigger again
            mockDOM.triggerEvent('test-button', 'click')
            expect(clickCount).toBe(2)
        })

        it('should handle parent-child relationships', () => {
            const parent = mockDOM.createElement('div')
            const child = mockDOM.createElement('span')
            
            mockDOM.appendChild(parent, child)
            
            expect(parent.children).toContain(child)
            expect(child.parentNode).toBe(parent)
        })

        it('should reset state for clean tests', () => {
            const element = mockDOM.createElement('div')
            mockDOM.addMockElement('test', element)
            
            expect(mockDOM.getElementById('test')).toBe(element)
            
            mockDOM.reset()
            
            expect(mockDOM.getElementById('test')).toBeNull()
        })

        it('should handle attributes correctly', () => {
            const element = mockDOM.createElement('input')
            
            mockDOM.setAttribute(element, 'type', 'text')
            mockDOM.setAttribute(element, 'placeholder', 'Enter text')
            
            expect(element.attributes.get('type')).toBe('text')
            expect(element.attributes.get('placeholder')).toBe('Enter text')
        })

        it('should handle text content and innerHTML', () => {
            const element = mockDOM.createElement('div')
            
            mockDOM.setTextContent(element, 'Hello World')
            expect(element.textContent).toBe('Hello World')
            
            mockDOM.setInnerHTML(element, '<span>HTML Content</span>')
            expect(element.innerHTML).toBe('<span>HTML Content</span>')
        })
    })
})
