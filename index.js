/**
 * Trappy instance allows to trap keyboard focus to particular area temporary
 */
class Trap {
  /**
   * Sets up local configuration
   */
  constructor(config) {
    this.fConfig = config;
    this.fKeyHandler = null;
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
    // first, get all elements that can be focused
    return this.allFocusableElements
      // filter out those entries that we want to keep tabbable
      .filter(e => {
        // if element matches an area, that means that we cannot disable it
        const matchesArea = this.fConfig.areas.some(area => {
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
  trapWithin() {
    // make sure that other trappy instances are not running
    this.releaseAllTraps();

    // disable elements temporarly
    this.elementsToHide.forEach(e => {
      // we can guess that it's 0, but we cannot know if we should add this zero back later on
      // "?" is safer concept i suppose
      e.dataset.trapTabindex = e.getAttribute('tabindex') || '?';
      e.setAttribute('tabindex', '-1');
    });

    // store instance of a function bound to this particular class
    this.fKeyHandler = this.handleTrappedKeyDown.bind(this);

    // add event to the DOM
    document.addEventListener('keydown', this.fKeyHandler);
  }

  /**
   * Disables trap and returns DOM to its proper state
   */
  releaseAllTraps() {
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

    // remove event from dom
    document.removeEventListener('keydown', this.fKeyHandler);
  }
}