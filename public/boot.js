/**
 * Production boot: unregister stale workers, verify index.html entry + stylesheet, then load the app bundle.
 */
;(function () {
  if (typeof window === 'undefined' || !window.location) return

  var BUILD_META = 'forfuture-build'
  var ENTRY_META = 'forfuture-entry'
  var STYLESHEET_META = 'forfuture-stylesheet'
  var SESSION_KEY = 'forfuture_boot_reload_v5'
  var MAX_RELOADS = 2

  function getMeta(name) {
    var el = document.querySelector('meta[name="' + name + '"]')
    return el ? el.getAttribute('content') || '' : ''
  }

  function stripQuery(url) {
    return url.replace(/\?.*$/, '')
  }

  function cacheBustUrl(src) {
    if (!src) return src
    var token = '_nc=' + Date.now()
    return src + (src.indexOf('?') >= 0 ? '&' : '?') + token
  }

  function loadEntry(src) {
    if (!src || document.querySelector('script[data-forfuture-entry="true"]')) return
    var s = document.createElement('script')
    s.type = 'module'
    s.crossOrigin = 'anonymous'
    s.src = cacheBustUrl(src)
    s.setAttribute('data-forfuture-entry', 'true')
    document.head.appendChild(s)
  }

  function reloadOnce() {
    try {
      var count = parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10) + 1
      if (count > MAX_RELOADS) {
        sessionStorage.removeItem(SESSION_KEY)
        loadEntry(getMeta(ENTRY_META))
        return
      }
      sessionStorage.setItem(SESSION_KEY, String(count))
    } catch (e) {
      /* ignore */
    }
    var url = new URL(window.location.href)
    url.searchParams.set('_ffboot', String(Date.now()))
    window.location.replace(url.toString())
  }

  function parseMeta(html, name) {
    var re = new RegExp('name="' + name + '" content="([^"]+)"')
    var match = html.match(re)
    return match && match[1]
  }

  function clearBootQuery() {
    try {
      var url = new URL(window.location.href)
      if (!url.searchParams.has('_ffboot')) return
      url.searchParams.delete('_ffboot')
      var next = url.pathname + url.search + url.hash
      window.history.replaceState(null, '', next || url.pathname)
    } catch (e) {
      /* ignore */
    }
  }

  function purgeServiceWorkers() {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (reg) {
        reg.unregister()
      })
    })
  }

  function start() {
    clearBootQuery()
    purgeServiceWorkers()

    var currentBuild = getMeta(BUILD_META)
    var currentEntry = getMeta(ENTRY_META)
    var currentStylesheet = getMeta(STYLESHEET_META)

    if (!currentEntry) return

    window.__FORFUTURE_BUILD__ = currentBuild
    window.__FORFUTURE_ENTRY__ = currentEntry

    fetch(window.location.origin + '/index.html?_ffboot=' + Date.now(), {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then(function (res) {
        return res.text()
      })
      .then(function (html) {
        var serverBuild = parseMeta(html, BUILD_META)
        var serverEntry = parseMeta(html, ENTRY_META)
        var serverStylesheet = parseMeta(html, STYLESHEET_META)

        if (serverEntry && stripQuery(serverEntry) !== stripQuery(currentEntry)) {
          reloadOnce()
          return
        }
        if (
          serverStylesheet &&
          currentStylesheet &&
          stripQuery(serverStylesheet) !== stripQuery(currentStylesheet)
        ) {
          reloadOnce()
          return
        }
        if (serverBuild && currentBuild && serverBuild !== currentBuild) {
          reloadOnce()
          return
        }

        try {
          sessionStorage.removeItem(SESSION_KEY)
        } catch (e) {
          /* ignore */
        }

        loadEntry(currentEntry)
      })
      .catch(function () {
        loadEntry(currentEntry)
      })
  }

  start()
})()
