;(function () {
  var STORAGE = 'forfuture-appearance-v1'
  var defaults = { appearanceMode: 'system', visualComfort: false, reduceMotion: false }

  function parse(raw) {
    if (!raw) return defaults
    try {
      var o = JSON.parse(raw)
      var mode = o.appearanceMode
      return {
        appearanceMode:
          mode === 'light' || mode === 'dark' || mode === 'system' ? mode : 'system',
        visualComfort: Boolean(o.visualComfort),
        reduceMotion: Boolean(o.reduceMotion),
      }
    } catch (e) {
      return defaults
    }
  }

  function resolve(mode) {
    if (mode === 'light' || mode === 'dark') return mode
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  var prefs = parse(localStorage.getItem(STORAGE))
  var resolved = resolve(prefs.appearanceMode)
  var root = document.documentElement
  var osReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  root.setAttribute('data-appearance-mode', prefs.appearanceMode)
  root.setAttribute('data-theme', resolved)
  root.setAttribute('data-comfort', prefs.visualComfort ? 'true' : 'false')
  root.setAttribute('data-reduce-motion', prefs.reduceMotion || osReduce ? 'true' : 'false')
  root.style.colorScheme = resolved
})()
