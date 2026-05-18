/**
 * Detect stale index.html vs CDN (mixed deploy edges) and reload once — only forward to a newer build.
 */
;(function () {
  if (typeof window === 'undefined' || !window.location) return

  var key = 'forfuture_deploy_sync_v1'
  var meta = document.querySelector('meta[name="forfuture-build"]')
  var currentBuild = meta && meta.getAttribute('content')
  if (!currentBuild) return

  window.__FORFUTURE_BUILD__ = currentBuild

  function shouldCheck() {
    try {
      return sessionStorage.getItem(key) !== currentBuild
    } catch (e) {
      return true
    }
  }

  function markChecked() {
    try {
      sessionStorage.setItem(key, currentBuild)
    } catch (e) {
      /* ignore */
    }
  }

  function parseBuild(html) {
    var match = html.match(/forfuture-build" content="([^"]+)"/)
    return match && match[1]
  }

  function reloadForward() {
    try {
      sessionStorage.removeItem(key)
    } catch (e) {
      /* ignore */
    }
    window.location.reload()
  }

  function runCheck() {
    if (!shouldCheck()) return

    fetch(window.location.origin + '/index.html?_ff=' + Date.now(), {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then(function (res) {
        return res.text()
      })
      .then(function (html) {
        var latest = parseBuild(html)
        markChecked()
        if (!latest || latest === currentBuild) return
        // Only upgrade — never reload into an older cached index (prevents “new UI → old UI” flash).
        if (latest > currentBuild) {
          reloadForward()
        }
      })
      .catch(function () {
        markChecked()
      })
  }

  runCheck()
})()
