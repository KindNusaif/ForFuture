/**
 * Runs before boot.js: when Netlify publishes a new build, clear stale caches once.
 */
;(function () {
  if (typeof window === 'undefined' || !window.location) return

  var BUILD_META = 'forfuture-build'
  var STORAGE_KEY = 'forfuture_deploy_build'

  function getBuildId() {
    var el = document.querySelector('meta[name="' + BUILD_META + '"]')
    return el ? el.getAttribute('content') || '' : ''
  }

  function clearCaches() {
    if (!('caches' in window)) return Promise.resolve()
    return caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          return caches.delete(key)
        }),
      )
    })
  }

  function hardReload() {
    try {
      var url = new URL(window.location.href)
      url.searchParams.set('_ffsync', String(Date.now()))
      window.location.replace(url.toString())
    } catch (e) {
      window.location.reload()
    }
  }

  var build = getBuildId()
  if (!build) return

  try {
    var previous = localStorage.getItem(STORAGE_KEY)
    if (previous && previous !== build) {
      localStorage.setItem(STORAGE_KEY, build)
      clearCaches().finally(hardReload)
      return
    }
    localStorage.setItem(STORAGE_KEY, build)
  } catch (e) {
    /* ignore */
  }
})()
