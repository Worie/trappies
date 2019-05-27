### Trappies

`Trappies` is an alternative, lightweigth solution (see also [focus-trap](https://github.com/davidtheclark/focus-trap)) to trap focus within certian container or list of elements.

Written is ES6, to use with older browser please use tools like `Babel` or other of your choice.

## Usage

```js
const Trappies = require('trappies');
const traps = new Trappies();

traps.setTrap({
    name: 'modal', // name of the trap that is going to be created
    autoFocus: '.modal', // element that will be autofocused once trap activates
    areas: [{
        isContainer: true, // optional: if true will make all focusable elements within selector reachable
        selector: '.modal' // selector to element that should be focusable (or have all children focusable)
    }],
});

traps.setTrap({
    name: 'something else', 
    autoFocus: '.other',
    areas: [{
        selector: '.other'
    }, {
        selector: '.yet-another'
    }],
});

// activates trap, allowing to only navigate within `.modal` container
traps.trapWithin('modal');

// to deactivate trap, use `release` method
traps.release();

// activating another trap will lead to releaseing currently active, restoring the state before activation
// queueing is not implemented at this point, but PRs welcome!
traps.trapWithin('something else');
```

## License
[MIT](./LICENSE)