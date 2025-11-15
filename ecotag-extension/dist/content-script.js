// Content script: attempts to extract product data from the current page.
// Listens for a message { action: 'getProduct' } and responds with a product object.

(function(){
  'use strict'

  function tryParseJSON(text){
    try { return JSON.parse(text) } catch (e) { return null }
  }

  // Attempt to extract structured or heuristic materials from a JSON-LD product node
  function extractMaterialsFromJSONLD(node){
    if (!node) return []
    const mats = []
    function pushIf(v){ if (!v) return; if (Array.isArray(v)) v.forEach(x=>pushIf(x)); else if (typeof v === 'string') v.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean).forEach(s=>mats.push(s)); else if (typeof v === 'object'){
      // object forms may have name or materialName
      const name = v.name || v['name'] || v.material || v.materialName
      if (name) pushIf(name)
    }}

    // Common JSON-LD material-like properties
    pushIf(node.material)
    pushIf(node.materials)
    pushIf(node.materialComposition)
    pushIf(node.fabric)
    pushIf(node.hasMaterial)
    // some vendors use 'mainEntity' or nested graph nodes; look for simple patterns
    if (node['@graph'] && Array.isArray(node['@graph'])){
      for (const n of node['@graph']){
        pushIf(n.material || n.materials || n.materialComposition || n.fabric)
      }
    }

    // normalize/unique and return
    const normalized = Array.from(new Set(mats.map(m => m.replace(/\s+/g,' ').trim()))).filter(Boolean)
    return normalized
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
          // attach any discovered materials to the node for downstream use
          try{ const mats = extractMaterialsFromJSONLD(it); if (mats && mats.length) it.materials = mats }catch(e){}
          return it
        }
        // Some sites nest product information under graph
        if (it['@graph']){
          const g = Array.isArray(it['@graph']) ? it['@graph'] : [it['@graph']]
          for (const node of g){
            if (node['@type'] && node['@type'].toString().toLowerCase().includes('product')){
              try{ const mats = extractMaterialsFromJSONLD(node); if (mats && mats.length) node.materials = mats }catch(e){}
              return node
            }
          }
        }
      }
    }
    return null
  }

  // Some official sites publish a ProductGroup JSON-LD (contains hasVariant[]).
  // Prefer this when available because it includes variant SKUs, prices and images.
  function findProductGroupJSONLD(){
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    for (const s of scripts){
      const json = tryParseJSON(s.innerText.trim())
      if (!json) continue
      const items = Array.isArray(json) ? json : [json]
      for (const it of items){
        if (!it) continue
        const t = (it['@type'] || '').toString().toLowerCase()
        if (t === 'productgroup' || t.includes('productgroup')) return it
        if (it['@graph']){
          const g = Array.isArray(it['@graph']) ? it['@graph'] : [it['@graph']]
          for (const node of g){
            const nt = (node && node['@type']) ? node['@type'].toString().toLowerCase() : ''
            if (nt === 'productgroup' || nt.includes('productgroup')) return node
          }
        }
      }
    }
    return null
  }

  function extractFromProductGroup(pg){
    if (!pg) return null
    const title = pg.name || pg['name'] || null
    const description = pg.description || pg['description'] || null
    let images = []
    if (pg.image){
      if (Array.isArray(pg.image)) images = images.concat(pg.image)
      else if (typeof pg.image === 'string') images.push(pg.image)
      else if (pg.image.url) images.push(pg.image.url)
    }
    if (pg.hasVariant && Array.isArray(pg.hasVariant)){
      for (const v of pg.hasVariant){
        if (!v) continue
        if (v.image){
          if (Array.isArray(v.image)) images = images.concat(v.image)
          else if (typeof v.image === 'string') images.push(v.image)
          else if (v.image.url) images.push(v.image.url)
        }
      }
    }
    images = images.filter(Boolean)

    // pick first variant offers for price and sku if present
    let price = null
    let sku = pg.sku || pg['sku'] || pg.productGroupID || null
    if (pg.hasVariant && Array.isArray(pg.hasVariant)){
      for (const v of pg.hasVariant){
        if (!v) continue
        // try offers on variant
        const off = v.offers || (v['offers'] && (Array.isArray(v.offers) ? v.offers[0] : v.offers))
        if (off){
          const amt = off.price || (off.priceSpecification && off.priceSpecification.price)
          const cur = off.priceCurrency || (off.priceSpecification && off.priceSpecification.priceCurrency) || off.priceCurrency
          if (amt){
            price = { raw: String(amt), amount: String(amt), currency: cur || null }
          }
        }
        if (!sku && (v.sku || v['sku'])) sku = v.sku || v['sku']
        if (price && sku) break
      }
    }

    // brand
    let brand = null
    if (pg.brand){
      if (typeof pg.brand === 'string') brand = pg.brand
      else if (pg.brand.name) brand = pg.brand.name
    }

    const url = pg.url || location.href
    const site = (new URL(String(url))).hostname

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
      materials: (function(){
        // attempt to extract materials from the ProductGroup node or variants
        const mats = []
        function p(v){ if (!v) return; if (Array.isArray(v)) v.forEach(x=>p(x)); else if (typeof v === 'string') v.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean).forEach(s=>mats.push(s)); else if (typeof v === 'object'){ const name = v.name || v.material || v.materialName; if (name) p(name) }}
        p(pg.material)
        p(pg.materials)
        p(pg.materialComposition)
        if (pg.hasVariant && Array.isArray(pg.hasVariant)){
          for (const v of pg.hasVariant) p(v.material || v.materials || v.fabric)
        }
        return Array.from(new Set(mats.map(m => m.replace(/\s+/g,' ').trim()))).filter(Boolean)
      })(),
      url,
      site,
      confidence,
      raw: { jsonld: pg }
    }
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
    // Helper: parse a textual price candidate into { amount, currency, raw }
    function parsePriceText(txt){
      if (!txt || typeof txt !== 'string') return null
      const raw = txt.trim().replace(/\s+/g,' ')
      // look for currency symbol or code + number patterns
      // currency symbols (common set)
      const sym = '[€$£¥₹₩฿]'
  const code = '\\b(?:USD|EUR|GBP|JPY|CNY|AUD|CAD|CHF|DKK|NOK|SEK|INR|RON)\\b'
      const patterns = [
        // symbol before number: $12,345.67 or €12,34
        new RegExp(sym + '\\s*([0-9.,\\s]+)'),
        // number before symbol: 12,345.67 $ or 12,34 €
        new RegExp('([0-9.,\\s]+)\\s*' + sym),
        // code before number: USD 12.34
        new RegExp(code + '\\s*([0-9.,\\s]+)', 'i'),
        // number before code: 12.34 USD
        new RegExp('([0-9.,\\s]+)\\s*' + code, 'i')
      ]

      for (const p of patterns){
        const m = raw.match(p)
        if (m){
          // find currency symbol or code
          const currencyMatch = raw.match(new RegExp(sym))
          const codeMatch = raw.match(new RegExp(code, 'i'))
          let currency = null
          if (currencyMatch) currency = currencyMatch[0]
          else if (codeMatch) currency = codeMatch[0].toUpperCase()

          let num = m[1]
          // normalize number: remove spaces, handle comma decimal
          num = num.replace(/\s+/g,'')
          if (num.indexOf(',') !== -1 && num.indexOf('.') === -1){
            // likely decimal comma: 12,50 => 12.50
            num = num.replace(',', '.')
          } else {
            // remove thousand separators (commas or spaces)
            num = num.replace(/[,\s](?=\d{3})/g, '')
          }
          // final cleanup: keep digits and dot
          const norm = (num.match(/[0-9]+(?:\.[0-9]+)?/ ) || [null])[0]
          if (norm) return { raw, amount: norm, currency }
        }
      }
      return null
    }

    // 1) Try JSON-LD offers first (most reliable)
    const json = findJSONLDProduct()
    if (json && json.offers){
      const offers = Array.isArray(json.offers) ? json.offers : [json.offers]
      for (const off of offers){
        if (!off) continue
        // typical shapes: { price, priceCurrency } or PriceSpecification
        let raw = null
        let amount = null
        let currency = null
        if (off.price) { raw = String(off.price); amount = String(off.price) }
        if (off.priceCurrency) currency = String(off.priceCurrency)
        if (!amount && off.priceSpecification){
          const ps = off.priceSpecification
          if (ps.price) { amount = String(ps.price); raw = raw || String(ps.price) }
          if (ps.priceCurrency) currency = currency || String(ps.priceCurrency)
        }
        if (amount) return { raw: raw || amount, amount, currency }
      }
    }

    // If JSON-LD is a ProductGroup with variants, inspect hasVariant entries
    if (json && json.hasVariant && Array.isArray(json.hasVariant)){
      for (const variant of json.hasVariant){
        if (!variant) continue
        const off = variant.offers || (variant['offers'] && (Array.isArray(variant.offers) ? variant.offers[0] : variant.offers))
        if (off){
          let raw = null
          let amount = null
          let currency = null
          if (off.price) { raw = String(off.price); amount = String(off.price) }
          if (off.priceCurrency) currency = String(off.priceCurrency)
          if (!amount && off.priceSpecification){
            const ps = off.priceSpecification
            if (ps.price) { amount = String(ps.price); raw = raw || String(ps.price) }
            if (ps.priceCurrency) currency = currency || String(ps.priceCurrency)
          }
          if (amount) return { raw: raw || amount, amount, currency }
        }
      }
    }

    // 2) Meta tags (og, product meta)
    const metaCandidates = [
      getMeta('product:price:amount'),
      getMeta('og:price:amount'),
      getMeta('price'),
      getMeta('product:price'),
      getMeta('twitter:data1')
    ].filter(Boolean)
    for (const m of metaCandidates){
      const p = parsePriceText(m)
      if (p) return { raw: m, amount: p.amount, currency: p.currency }
    }

    // 3) Data attributes / structured DOM attributes near price
    // search for elements that explicitly carry price information
    const attrSelectors = [
      '[itemprop="price"]',
      '[data-price]',
      '[data-price-amount]',
      '[data-priceamount]',
      '[data-product-price]'
    ]
    for (const sel of attrSelectors){
      const el = document.querySelector(sel)
      if (el){
        const candidates = []
        if (el.dataset && el.dataset.price) candidates.push(el.dataset.price)
        if (el.dataset && el.dataset.priceAmount) candidates.push(el.dataset.priceAmount)
        if (el.getAttribute('content')) candidates.push(el.getAttribute('content'))
        if (el.textContent) candidates.push(el.textContent)
        for (const c of candidates){
          const p = parsePriceText(c)
          if (p) return { raw: c, amount: p.amount, currency: p.currency }
        }
      }
    }

    // 4) Generic class/id heuristics: prefer visible nodes and the first match
    // run a query and inspect candidates
    let candidates = []
    try{
      const els = document.querySelectorAll("[class*='price'], [id*='price'], .product-price, .price, [class*='amount'], [data-test*='price']")
      for (const el of els){
        // skip script/style and hidden
        try{
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 && rect.height === 0) continue
        }catch(e){/* ignore */}
        const txt = (el.dataset && (el.dataset.price || el.dataset.priceAmount)) || el.getAttribute('content') || el.textContent
        if (txt) candidates.push(String(txt).trim())
      }
    }catch(e){/* ignore selection errors */}

    // 5) Fallback: full page search for currency patterns
    if (candidates.length === 0){
      const bodyText = document.body ? document.body.innerText : ''
      const re = /([€$£¥₹₩฿]\s?[0-9][0-9.,\s]*)/g
      const m = re.exec(bodyText)
      if (m) candidates.push(m[0])
    }

    // parse candidates and return first valid one
    for (const c of candidates){
      const p = parsePriceText(c)
      if (p) return { raw: c, amount: p.amount, currency: p.currency }
    }

    return null
  }

  function findSKU(){
    const json = findJSONLDProduct()
    if (json && json.sku) return json.sku
    // If JSON-LD ProductGroup with variants, try to read variant SKU from offers
    if (json && json.hasVariant && Array.isArray(json.hasVariant)){
      for (const variant of json.hasVariant){
        if (!variant) continue
        const off = variant.offers || (variant['offers'] && (Array.isArray(variant.offers) ? variant.offers[0] : variant.offers))
        if (off && (off.sku || off.sku === 0)) return off.sku
        if (variant.sku) return variant.sku
      }
    }
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
    // Prefer ProductGroup JSON-LD when available (official sites often expose this)
    const pg = findProductGroupJSONLD()
    console.log(pg)
    if (pg){
      try {
        const extracted = extractFromProductGroup(pg)
        
        if (extracted) return extracted
      } catch (e){ /* fallthrough to heuristics */ }
    }

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
