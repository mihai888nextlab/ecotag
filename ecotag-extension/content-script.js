// Content script: attempts to extract product data from the current page.
// Listens for a message { action: 'getProduct' } and responds with a product object.

(function(){
  'use strict'

  function tryParseJSON(text){
    try { return JSON.parse(text) } catch (e) { return null }
  }

  function findJSONLDProduct(){
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    for (const s of scripts){
      const json = tryParseJSON(s.innerText.trim())
      if (!json) continue
      // JSON-LD can be an array or object
      const items = Array.isArray(json) ? json : [json]
      for (const it of items){
        if (!it) continue
        const types = (it['@type'] || it['@type'] && '').toString().toLowerCase() || ''
        if (types.includes('product') || (it['@type'] && it['@type'].toString().toLowerCase() === 'product')){
          return it
        }
        // Some sites nest product information under graph
        if (it['@graph']){
          const g = Array.isArray(it['@graph']) ? it['@graph'] : [it['@graph']]
          for (const node of g){
            if (node['@type'] && node['@type'].toString().toLowerCase().includes('product')) return node
          }
        }
      }
    }
    return null
  }

  function getMeta(name){
    const sel = `meta[name="${name}"]`, m = document.querySelector(sel)
    if (m && m.content) return m.content
    const prop = document.querySelector(`meta[property="${name}"]`)
    if (prop && prop.content) return prop.content
    return null
  }

  function findTitle(){
    // Priority: JSON-LD product name, og:title, twitter:title, meta[name='title'], h1 with product-like class, fallback to document.title
    const json = findJSONLDProduct()
    if (json){
      if (json.name) return json.name
      if (json['name']) return json['name']
    }
    const og = getMeta('og:title') || getMeta('twitter:title') || getMeta('title')
    if (og) return og
    const selectors = ["[itemprop='name']","h1.product-title",".product-title","h1",".product h1",".product-name"]
    for (const s of selectors){
      const el = document.querySelector(s)
      if (el && el.textContent && el.textContent.trim().length>3) return el.textContent.trim()
    }
    return document.title || ''
  }

  function findDescription(){
    const json = findJSONLDProduct()
    if (json){ if (json.description) return json.description }
    const og = getMeta('og:description') || getMeta('description') || getMeta('twitter:description')
    if (og) return og
    const sel = document.querySelector("[itemprop='description'], meta[name='description']")
    if (sel) return sel.content || sel.textContent || ''
    return ''
  }

  function findImages(){
    const json = findJSONLDProduct()
    let imgs = []
    if (json){
      if (json.image){
        if (Array.isArray(json.image)) imgs = imgs.concat(json.image)
        else if (typeof json.image === 'string') imgs.push(json.image)
        else if (json.image['@id'] || json.image.url) imgs.push(json.image.url || json.image['@id'])
      }
    }
    const og = getMeta('og:image') || getMeta('twitter:image')
    if (og) imgs.push(og)
    // find large images in product galleries
    const candidates = Array.from(document.querySelectorAll('img')).filter(i=>i.naturalWidth>=200 && i.naturalHeight>=200)
    for (const c of candidates){
      const src = c.currentSrc || c.src
      if (src && !imgs.includes(src)) imgs.push(src)
    }
    // de-dup and filter
    return imgs.filter(Boolean).slice(0,6)
  }

  function findPrice(){
    const json = findJSONLDProduct()
    if (json && json.offers){
      const offers = Array.isArray(json.offers) ? json.offers[0] : json.offers
      if (offers){
        return { raw: offers.price || offers.priceSpecification || offers.priceCurrency ? `${offers.price || ''}` : null, amount: offers.price || null, currency: offers.priceCurrency || offers.priceCurrency || null }
      }
    }
    // meta tags
    const priceMeta = getMeta('product:price:amount') || getMeta('og:price:amount')
    if (priceMeta) return { raw: priceMeta, amount: priceMeta }
    // DOM heuristics: look for elements with class or id containing 'price'
    const priceEl = document.querySelector("[itemprop='price'], .price, .product-price, [class*='price']")
    if (priceEl && priceEl.textContent){
      const txt = priceEl.textContent.trim()
      const m = txt.match(/([€$£¥₹]\s?\d[\d,\.\s]*)/)
      return { raw: txt, amount: (m && m[0]) || txt }
    }
    // last resort: search for currency-like strings in page
    const bodyText = document.body ? document.body.innerText : ''
    const re = /([€$£¥₹]\s?\d[\d,\.\s]*)/g
    const match = re.exec(bodyText)
    if (match) return { raw: match[0], amount: match[0] }
    return null
  }

  function findSKU(){
    const json = findJSONLDProduct()
    if (json && json.sku) return json.sku
    const el = document.querySelector("[itemprop='sku'], .sku, [class*='sku']")
    if (el) return el.textContent.trim()
    return null
  }

  function findBrand(){
    const json = findJSONLDProduct()
    if (json && json.brand){
      if (typeof json.brand === 'string') return json.brand
      if (json.brand.name) return json.brand.name
    }
    const el = document.querySelector("[itemprop='brand'], .brand, [class*='brand']")
    if (el) return el.textContent.trim()
    return null
  }

  function buildProduct(){
    const title = findTitle()
    const description = findDescription()
    const images = findImages()
    const price = findPrice()
    const sku = findSKU()
    const brand = findBrand()
    const url = location.href
    const site = location.hostname

    const confidence = (() => {
      let score = 0
      if (title) score += 3
      if (description) score += 1
      if (images && images.length) score += 2
      if (price) score += 2
      if (sku) score += 1
      return Math.min(10, score)
    })()

    return {
      title: title || null,
      description: description || null,
      images: images || [],
      price: price || null,
      sku: sku || null,
      brand: brand || null,
      url,
      site,
      confidence,
      raw: {
        jsonld: (()=>{ try { return Array.from(document.querySelectorAll('script[type="application/ld+json"]').values()).map(s=>tryParseJSON(s.innerText)) } catch(e){ return null } })(),
        og: { title: getMeta('og:title'), description: getMeta('og:description'), image: getMeta('og:image') }
      }
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.action !== 'getProduct') return
    try {
      const product = buildProduct()
      sendResponse({ ok: true, product })
    } catch (e){
      sendResponse({ ok: false, error: e && e.message })
    }
    return true
  })

  // --- page-change detection & proactive updates ---
  // send product updates to the extension when the page content or URL changes
  let lastSent = null
  function sendIfChanged(force = false){
    try{
      const product = buildProduct()
      const key = JSON.stringify({ title: product.title, sku: product.sku, price: product.price && product.price.amount, url: product.url })
      if (force || key !== lastSent){
        lastSent = key
        try { chrome.runtime.sendMessage({ action: 'productUpdated', product }) } catch(e) { /* ignore */ }
      }
    }catch(e){/* ignore */}
  }

  // Debounce helper
  function debounce(fn, wait=250){
    let t = null
    return function(...args){
      clearTimeout(t)
      t = setTimeout(()=>fn.apply(this,args), wait)
    }
  }

  const debouncedSend = debounce(sendIfChanged, 300)

  // watch for history API usage (single-page apps)
  ;(function(){
    const _push = history.pushState
    const _replace = history.replaceState
    history.pushState = function(){
      _push.apply(this, arguments)
      // force immediate send on navigations
      sendIfChanged(true)
      // also schedule debounced checks for subsequent DOM updates
      debouncedSend()
    }
    history.replaceState = function(){
      _replace.apply(this, arguments)
      sendIfChanged(true)
      debouncedSend()
    }
    window.addEventListener('popstate', () => { sendIfChanged(true); debouncedSend() })
    window.addEventListener('hashchange', () => { sendIfChanged(true); debouncedSend() })
  })()

  // observe DOM changes as a fallback (pages that render product after XHR)
  const observer = new MutationObserver(debouncedSend)
  try{
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: false })
  }catch(e){/* ignore */}

  // initial send on script load
  try{ sendIfChanged() } catch(e){/* ignore */}

})();
