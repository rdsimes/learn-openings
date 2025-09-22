// DOM utilities abstraction for better testability
export class DOMUtils {
    getElementById(id) {
        return document.getElementById(id);
    }
    
    querySelector(selector) {
        return document.querySelector(selector);
    }
    
    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }
    
    createElement(tagName) {
        return document.createElement(tagName);
    }
    
    addClass(element, className) {
        element.classList.add(className);
    }
    
    removeClass(element, className) {
        element.classList.remove(className);
    }
    
    toggleClass(element, className) {
        element.classList.toggle(className);
    }
    
    setAttribute(element, name, value) {
        element.setAttribute(name, value);
    }
    
    setTextContent(element, text) {
        element.textContent = text;
    }
    
    setInnerHTML(element, html) {
        element.innerHTML = html;
    }
    
    appendChild(parent, child) {
        parent.appendChild(child);
    }
    
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
    }
    
    removeEventListener(element, event, handler) {
        element.removeEventListener(event, handler);
    }
}

// Mock DOM utilities for testing
export class MockDOMUtils {
    constructor() {
        this.elements = new Map();
        this.eventListeners = new Map();
    }
    
    getElementById(id) {
        return this.elements.get(id) || null;
    }
    
    querySelector(selector) {
        // Simple mock - you can expand this for more complex selectors
        if (selector.startsWith('#')) {
            return this.getElementById(selector.slice(1));
        }
        return this.elements.get(selector) || null;
    }
    
    querySelectorAll(selector) {
        // Mock implementation - returns array of matching elements
        const results = [];
        this.elements.forEach((element, key) => {
            if (this._matchesSelector(key, selector)) {
                results.push(element);
            }
        });
        return results;
    }
    
    createElement(tagName) {
        const element = {
            tagName: tagName.toUpperCase(),
            id: '',
            className: '',
            classList: {
                add: (className) => {
                    const classes = element.className.split(' ').filter(c => c);
                    if (!classes.includes(className)) {
                        classes.push(className);
                        element.className = classes.join(' ');
                    }
                },
                remove: (className) => {
                    const classes = element.className.split(' ').filter(c => c !== className);
                    element.className = classes.join(' ');
                },
                toggle: (className) => {
                    const classes = element.className.split(' ').filter(c => c);
                    if (classes.includes(className)) {
                        element.classList.remove(className);
                    } else {
                        element.classList.add(className);
                    }
                },
                contains: (className) => {
                    return element.className.split(' ').includes(className);
                }
            },
            textContent: '',
            innerHTML: '',
            attributes: new Map(),
            children: [],
            parentNode: null
        };
        return element;
    }
    
    addClass(element, className) {
        element.classList.add(className);
    }
    
    removeClass(element, className) {
        element.classList.remove(className);
    }
    
    toggleClass(element, className) {
        element.classList.toggle(className);
    }
    
    setAttribute(element, name, value) {
        element.attributes.set(name, value);
    }
    
    setTextContent(element, text) {
        element.textContent = text;
    }
    
    setInnerHTML(element, html) {
        element.innerHTML = html;
    }
    
    appendChild(parent, child) {
        parent.children.push(child);
        child.parentNode = parent;
    }
    
    addEventListener(element, event, handler) {
        const key = `${element.id || 'anonymous'}_${event}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key).push(handler);
    }
    
    removeEventListener(element, event, handler) {
        const key = `${element.id || 'anonymous'}_${event}`;
        if (this.eventListeners.has(key)) {
            const handlers = this.eventListeners.get(key);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    // Helper methods for testing
    addMockElement(id, element) {
        if (element && typeof element === 'object') {
            element.id = id;
        }
        this.elements.set(id, element);
    }
    
    getMockElement(id) {
        return this.elements.get(id);
    }
    
    triggerEvent(elementId, eventType, eventData = {}) {
        const key = `${elementId}_${eventType}`;
        if (this.eventListeners.has(key)) {
            const handlers = this.eventListeners.get(key);
            handlers.forEach(handler => handler(eventData));
        }
    }
    
    _matchesSelector(elementKey, selector) {
        // Simple matching logic - can be expanded
        if (selector.startsWith('.')) {
            const element = this.elements.get(elementKey);
            return element && element.className && element.className.includes(selector.slice(1));
        }
        return false;
    }
    
    // Reset for clean test state
    reset() {
        this.elements.clear();
        this.eventListeners.clear();
    }
}
