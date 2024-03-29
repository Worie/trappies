  /**
   * Trappies instance allows to trap keyboard focus to particular area temporary
   */
  class Trappies {
    /**
     * Sets up local configuration
     */
    constructor() {
      // singleTrap: { 
      //   name: string,
      //   isContainer: boolean,
      //   selector: string,
      //    isActive?: boolean,
      //    autoFocus: string
      //  }
      this.fTraplist = new Map();
    }

    /**
     * Returns read only trap list
     */
    get list() {
      return this.fTraplist;
    }

    /**
     * Returns list of selectors for interactive elements 
     */
    get interactiveElementsSelectors() {
      return [
        'a[href]',
        'area[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'iframe',
        '[tabindex]',
        '[contentEditable=true]',
      // makes sure that we do not consider elements that are explicitly turned off to kbd users
      ].map(selector => `${selector}:not([tabindex="-1"])`)
    }

    /**
     * Returns a list of all focusable elements (by the keyboard user)
     */
    get allFocusableElements() {
      // represents generic, single-lined selector for retrieving elements
      const unifiedSelector = this.interactiveElementsSelectors.join(', ');

      return Array.from(document.querySelectorAll(unifiedSelector));
    }

    /**
     * Returns element that would be hidden considered current DOM state
     */
    get elementsToHide() {
      if (!this.activeTrap) {
        return [];
      }

      // first, get all elements that can be focused
      return this.allFocusableElements
        // filter out those entries that we want to keep tabbable
        .filter(e => {
          // if element matches an area, that means that we cannot disable it
          const matchesArea = this.activeTrap.areas.some(area => {
            // if the area is a container and currently processed element is within such area,
            // consider it as one that we cannot touch as well
            if (area.isContainer && e.closest(area.selector)) {
              return true;
            }

            // perform native check against given selector
            return e.matches(area.selector);
          });

          // dont disable elements that were passed in config
          return !matchesArea;
        });
    }

    /**
     * Returns elements that are meant to be looped if trapped
     */
    get elementsToLoop() {
      return this.allFocusableElements.filter(e => {
        return !this.elementsToHide.includes(e);
      });
    }

    /**
     * Returns first element within trap context
     */
    get firstTrappedElement() {
      return this.elementsToLoop[0];
    }

    /**
     * Returns last element within trap context
     */
    get lastTrappedElement() {
      return this.elementsToLoop[this.elementsToLoop.length - 1];
    }

    /**
     * Returns currently active trap
     */
    get activeTrap() {
      return Array.from(this.fTraplist.values()).find(trap => trap.isActive === true);
    }

    /**
     * Returns all currently trapped elements
     */
    get hiddenElements() {
      return document.querySelectorAll('[tabindex="-1"][data-trap-tabindex]')
    }

    /**
     * Event handler that will allow looping within trapped elements
     */
    handleTrappedKeyDown(event) {
      const isFirstFocused = event.target === this.firstTrappedElement;
      const isLastFocused = event.target === this.lastTrappedElement;
      
      if (isFirstFocused && event.key === 'Tab' && event.shiftKey === true) {
        event.preventDefault();
        this.lastTrappedElement.focus();
        return;
      }
      
      if (isLastFocused && event.key === 'Tab' && event.shiftKey === false) {
        event.preventDefault();
        this.firstTrappedElement.focus();
        return;
      }
    }

    /**
     * Enables trap based on passed config
     */
    trapWithin(name) {
      // get object that matches the name
      const trap = this.getTrap(name);
      
      if (this.activeTrap) {
        // make sure that other trappy instances are not running
        this.release();
      };

      this._activate(trap);

      // disable elements temporarly
      this.elementsToHide.forEach(e => {
        // we can guess that it's 0, but we cannot know if we should add this zero back later on
        // "?" is safer concept i suppose
        e.dataset.trapTabindex = e.getAttribute('tabindex') || '?';
        e.setAttribute('tabindex', '-1');
      });

      // store instance of a function bound to this particular class
      trap.loopCallback = this.handleTrappedKeyDown.bind(this);

      // add event to the DOM
      document.addEventListener('keydown', trap.loopCallback);

      // if autofocus is defined, apply it
      if (trap.autoFocus) {
        const autoFocusedEl = document.querySelector(trap.autoFocus);

        // fallback if element doesn't have tabindex attribute set
        if (!autoFocusedEl.getAttribute('tabindex')) {
          autoFocusedEl.setAttribute('tabindex', '-1');
        }

        autoFocusedEl.focus();
      }
    }

    /**
     * Activates given trap and saves current active element as it's trigger
     */
    _activate(trap) {
      // activate trap
      trap.isActive = true;
      // save trigger element - for later restoring it
      trap.triggerElement = document.activeElement;
    }

    /**
     * Deactivates given trap and restores previously focused element
     */
    _deactivate(trap) {
      // mark active trap as disabled
      trap.isActive = false;

      // restores originally focused element
      trap.triggerElement.focus();
    }

    /**
     * Disables trap and returns DOM to its proper state
     */
    release() {
      if (!this.activeTrap) {
        return;
      }

      // deactivates 
      this._deactivate(this.activeTrap);

      // on all hidden elements, perform a clean up
      this.hiddenElements.forEach(e => {
        // if the original tabindex could not be determined, just remove it
        if (e.dataset.trapTabindex === '?') {
          e.removeAttribute('tabindex');
        } else {
          // if tabindex was set explicitly, set it up to its previous state
          e.setAttribute('tabindex', String(e.dataset.trapTabindex));
        }

        // remove helper attribute of the library
        e.removeAttribute('data-trap-tabindex');
      });

      // destroy all event listeners within all traps
      this.fTraplist.forEach(trap => {
        if (trap.loopCallback) {
          // remove event from dom
          document.removeEventListener('keydown', trap.loopCallback);
        }
      })
    }

    /**
     * Creates a new trap
     */
    setTrap(trap) {
      const defaultConfig = {
        areas: [],
      };

      this.fTraplist.set(trap.name, { ...defaultConfig, ...trap});
    }

    /**
     * Returns given trap object
     */
    getTrap(name) {
      return this.fTraplist.get(name);
    }
  }

  module.exports = Trappies;