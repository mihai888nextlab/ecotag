// background service worker (base)
// This is intentionally minimal. Put event handlers here as needed.

self.addEventListener('install', () => {
  // Service worker installed
})

// Relay tab activation/updates so the popup can refresh its product info
if (chrome && chrome.tabs) {
  async function ensureContentScript(tabId){
    return new Promise((resolve) => {
      try {
        // First get the tab info so we can avoid trying to inject into
        // restricted Chrome pages like chrome://extensions, chrome://newtab, etc.
        chrome.tabs.get(tabId, (tab) => {
          try {
            const url = tab && tab.url ? (tab.url + '') : ''
            // Allow only http(s) and file urls for injection/messaging. Trying to
            // message chrome://, chrome-extension:// or other internal pages
            // will produce "Cannot access a chrome:// URL" runtime errors.
            const allowed = /^https?:\/\//i.test(url) || /^file:\/\//i.test(url)
            if (!allowed) return resolve(false)

            // try to send a ping to content script
            chrome.tabs.sendMessage(tabId, { action: '__ping__' }, (resp) => {
              if (!chrome.runtime.lastError && resp && resp.ok) return resolve(true)
              // otherwise try to inject the content script file
              try {
                chrome.scripting.executeScript({ target: { tabId }, files: ['content-script.js'] }, () => {
                  // If executeScript caused a runtime.lastError, injection failed
                  if (chrome.runtime.lastError) return resolve(false)
                  // content script should register after injection
                  resolve(true)
                })
              } catch (e) { resolve(false) }
            })
          } catch (e) { resolve(false) }
        })
      } catch (e) { resolve(false) }
    })
  }

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const ok = await ensureContentScript(activeInfo.tabId)
      // Use callback form and swallow any runtime.lastError to avoid
      // unhandled promise rejections when there is no receiver.
      try {
        chrome.runtime.sendMessage({ action: 'activeTabChanged', tabId: activeInfo.tabId, injected: !!ok }, () => {
          /* ignore errors when no listener is present */
          if (chrome.runtime && chrome.runtime.lastError) {
            // noop
          }
        })
      } catch(e) { /* ignore */ }
    } catch(e){}
  })

  // some pages update via navigation within the same tab; notify on updates too
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // notify when URL changes or tab becomes complete
    if (changeInfo.status === 'complete' || changeInfo.url) {
      try {
        const ok = await ensureContentScript(tabId)
        try {
          chrome.runtime.sendMessage({ action: 'activeTabChanged', tabId, injected: !!ok }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
              // noop
            }
          })
        } catch(e) { /* ignore */ }
      } catch(e){}
    }
  })
}
