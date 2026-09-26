// Pasted HTML (from Word, Google Docs, websites, ChatGPT…) → the description editor's own clean markup.
// Keeps the arrangement: headings (H1 → H2, H5/H6 → H4), paragraphs, bold / italic / underline / strike, bullet and
// numbered lists, links, tables and text alignment. Drops everything else — fonts, sizes, colours, classes, images,
// scripts, Word's XML — so the result matches the site's styling and passes the backend sanitizer.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s: string) => esc(s).replace(/"/g, '&quot;')
const SAFE_URL = /^(https?:\/\/|mailto:|tel:)/i
const LIST_TYPES = /^(disc|circle|square|decimal|lower-alpha|upper-alpha|lower-roman|upper-roman)$/i
const DROP = new Set(['script', 'style', 'meta', 'link', 'title', 'head', 'noscript', 'iframe', 'object', 'svg', 'img',
  'video', 'audio', 'canvas', 'button', 'input', 'select', 'textarea', 'form', 'o:p', 'xml'])
const BLOCK = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'blockquote', 'pre',
  'section', 'article', 'header', 'footer', 'main', 'aside', 'figure', 'hr', 'dl', 'dt', 'dd', 'thead', 'tbody', 'tr'])
const HEADING: Record<string, string> = { h1: 'h2', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h4', h6: 'h4' }
// Word's fake bullets at the start of a "list paragraph"
const WORD_BULLET = /^\s*([·•▪■◦o§\-–*]|\(?\d{1,3}[.)]|\(?[a-z][.)]|\(?[ivx]{1,5}[.)])\s+/i

function alignOf(el: HTMLElement): string {
  const a = (el.style?.textAlign || el.getAttribute('align') || '').toLowerCase()
  return ['center', 'right', 'justify'].includes(a) ? ` style="text-align: ${a}"` : ''
}

// Inline formatting a <span>/<font>/<b> actually applies (Docs puts bold in styles, and wraps everything in a
// <b style="font-weight:normal">, which is *not* bold).
function inlineMarks(el: HTMLElement, tag: string): string[] {
  const st = el.style || ({} as CSSStyleDeclaration)
  const fw = (st.fontWeight || '').toLowerCase()
  const marks: string[] = []
  const boldTag = tag === 'b' || tag === 'strong'
  if ((boldTag && fw !== 'normal' && fw !== '400') || fw === 'bold' || fw === 'bolder' || Number(fw) >= 600) marks.push('strong')
  if (tag === 'i' || tag === 'em' || /italic/i.test(st.fontStyle || '')) marks.push('em')
  const deco = `${st.textDecoration || ''} ${st.textDecorationLine || ''}`
  if (tag === 'u' || /underline/i.test(deco)) marks.push('u')
  if (tag === 's' || tag === 'strike' || tag === 'del' || /line-through/i.test(deco)) marks.push('s')
  return marks
}

function inner(node: Node): string {
  let out = ''
  node.childNodes.forEach(c => { out += convert(c) })
  return out
}

const hasBlockInside = (el: Element) => Array.from(el.querySelectorAll('*')).some(c => BLOCK.has(c.tagName.toLowerCase()))
const IS_BLOCK_HTML = /^<(p|h[2-4]|ul|ol|table|blockquote)[\s>]/

// Wrap loose inline runs between blocks in <p> so the result is well-formed.
function blocks(node: Node): string {
  let out = '', run = ''
  const flush = () => { if (run.replace(/<br>|&nbsp;|\s/g, '')) out += `<p>${run.trim()}</p>`; run = '' }
  node.childNodes.forEach(c => {
    const tag = c.nodeType === 1 ? (c as Element).tagName.toLowerCase() : ''
    const html = convert(c)
    if ((tag && BLOCK.has(tag)) || IS_BLOCK_HTML.test(html)) { flush(); out += html } else run += html
  })
  flush()
  return out
}

// Consecutive Word "list paragraphs" (class MsoListParagraph…, or mso-list styles) → a real list.
function wordLists(root: HTMLElement) {
  const isItem = (el: Element) => el.tagName === 'P' && (/MsoList/i.test(el.className) || /mso-list/i.test(el.getAttribute('style') || ''))
  Array.from(root.querySelectorAll('p')).forEach(p => {
    if (!isItem(p) || !p.parentElement) return
    const prev = p.previousElementSibling
    const firstText = (p.textContent || '').trim()
    const ordered = /^\(?(\d{1,3}|[a-z]|[ivx]{1,5})[.)]\s/i.test(firstText)
    let list: Element
    if (prev && (prev.tagName === 'UL' || prev.tagName === 'OL') && prev.getAttribute('data-word') === '1') list = prev
    else {
      list = root.ownerDocument.createElement(ordered ? 'ol' : 'ul')
      list.setAttribute('data-word', '1')
      p.parentElement.insertBefore(list, p)
    }
    const li = root.ownerDocument.createElement('li')
    // Word puts the bullet glyph in its own span (mso-list:Ignore); drop that, or a leading bullet in the text.
    p.querySelectorAll('span[style*="mso-list"]').forEach(s => { if (/ignore/i.test(s.getAttribute('style') || '')) s.remove() })
    li.innerHTML = p.innerHTML
    const walker = root.ownerDocument.createTreeWalker(li, NodeFilter.SHOW_TEXT)
    const first = walker.nextNode()
    if (first && WORD_BULLET.test(first.textContent || '')) first.textContent = (first.textContent || '').replace(WORD_BULLET, '')
    list.appendChild(li)
    p.remove()
  })
}

function convert(node: Node): string {
  if (node.nodeType === 3) {
    // Collapse source-code whitespace like the browser would.
    return esc((node.textContent || '').replace(/[\r\n\t ]+/g, ' '))
  }
  if (node.nodeType !== 1) return ''
  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  if (DROP.has(tag) || tag.includes(':')) return ''

  if (HEADING[tag]) {
    const t = inner(el).replace(/<\/?strong>/g, '').trim()   // headings are bold already
    return t ? `<${HEADING[tag]}${alignOf(el)}>${t}</${HEADING[tag]}>` : ''
  }
  switch (tag) {
    case 'br': return '<br>'
    case 'hr': return ''
    case 'p': {
      const t = inner(el).trim()
      return t.replace(/<br>|&nbsp;|\s/g, '') ? `<p${alignOf(el)}>${t}</p>` : ''
    }
    case 'div': case 'section': case 'article': case 'header': case 'footer': case 'main': case 'aside': case 'figure':
      if (hasBlockInside(el)) return blocks(el)
      { const t = inner(el).trim(); return t.replace(/<br>|&nbsp;|\s/g, '') ? `<p${alignOf(el)}>${t}</p>` : '' }
    case 'blockquote': { const t = blocks(el); return t ? `<blockquote>${t}</blockquote>` : '' }
    case 'pre': return `<p>${esc(el.textContent || '').replace(/\n/g, '<br>')}</p>`
    case 'ul': case 'ol': {
      const type = (el.style?.listStyleType || '').toLowerCase()
      const items = Array.from(el.childNodes).map(c => {
        const ct = c.nodeType === 1 ? (c as Element).tagName.toLowerCase() : ''
        if (ct === 'li') return convert(c)
        if (ct === 'ul' || ct === 'ol') return `<li>${convert(c)}</li>`        // badly nested list
        const t = convert(c).trim(); return t && t !== ' ' ? `<li>${t}</li>` : ''
      }).join('')
      return items ? `<${tag}${LIST_TYPES.test(type) ? ` style="list-style-type: ${type}"` : ''}>${items}</${tag}>` : ''
    }
    case 'li': {
      // A <p> inside an <li> would add a gap — keep its text inline, nested lists as-is.
      let t = ''
      el.childNodes.forEach(c => {
        const ct = c.nodeType === 1 ? (c as Element).tagName.toLowerCase() : ''
        t += ct === 'p' || ct === 'div' ? inner(c) : convert(c)
      })
      return t.trim() ? `<li${alignOf(el)}>${t.trim()}</li>` : ''
    }
    case 'dl': return blocks(el)
    case 'dt': return `<p><strong>${inner(el)}</strong></p>`
    case 'dd': return `<p>${inner(el)}</p>`
    case 'table': {
      const rows = Array.from(el.querySelectorAll('tr')).filter(r => r.closest('table') === el)
      const body = rows.map(r => `<tr>${Array.from(r.children).filter(c => /^(td|th)$/i.test(c.tagName)).map(c => {
        const ct = c.tagName.toLowerCase(); return `<${ct}>${inner(c).replace(/<\/?p[^>]*>/g, ' ').trim()}</${ct}>`
      }).join('')}</tr>`).join('')
      return body ? `<table><tbody>${body}</tbody></table>` : ''
    }
    case 'thead': case 'tbody': case 'tfoot': case 'tr': case 'td': case 'th': return inner(el)
    case 'a': {
      const href = (el.getAttribute('href') || '').trim()
      const t = inner(el)
      return SAFE_URL.test(href) ? `<a href="${escAttr(href)}">${t}</a>` : t
    }
    default: {
      // b / strong / i / em / u / s / span / font / mark / code … → only the formatting that really applies.
      // A wrapper around whole paragraphs (Google Docs' <b id=docs-internal-guid>) is just unwrapped.
      if (hasBlockInside(el)) return blocks(el)
      const t = inner(el)
      if (!t) return ''
      return inlineMarks(el, tag).reduceRight((acc, m) => `<${m}>${acc}</${m}>`, t)
    }
  }
}

export function cleanPastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const body = doc.body
  // Word conditional comments / fragment markers
  body.querySelectorAll('*').forEach(n => { if (/^(o:|w:|v:)/i.test(n.tagName)) n.remove() })
  wordLists(body)
  const hasBlocks = Array.from(body.querySelectorAll('*')).some(n => BLOCK.has(n.tagName.toLowerCase()))
  let out = hasBlocks ? blocks(body) : inner(body).trim()
  out = out
    .replace(/<(strong|em|u|s)>(\s*)<\/\1>/g, '$2')              // empty marks
    .replace(/<\/(strong|em|u|s)><\1>/g, '')                     // <b>a</b><b>b</b> → <b>ab</b>
    .replace(/(<br>\s*){3,}/g, '<br><br>')
    .replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, '')
  return out
}

// Plain text (no HTML on the clipboard): blank line = paragraph, "- • *" lines = bullets, "1." lines = numbers,
// short lines ending with ":" or in Title Case alone = subheadings.
export function textToRichHtml(text: string): string {
  const paras = text.replace(/\r\n?/g, '\n').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  return paras.map(p => {
    const lines = p.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.every(l => /^[-•*▪◦]\s+/.test(l))) return `<ul>${lines.map(l => `<li>${esc(l.replace(/^[-•*▪◦]\s+/, ''))}</li>`).join('')}</ul>`
    if (lines.every(l => /^\d{1,3}[.)]\s+/.test(l))) return `<ol>${lines.map(l => `<li>${esc(l.replace(/^\d{1,3}[.)]\s+/, ''))}</li>`).join('')}</ol>`
    if (lines.length === 1 && p.length <= 70 && !/[.!?,;]$/.test(p) && /^#{1,3}\s+|:$|^([A-Z][\w'’&-]*\s?){1,9}$/.test(p)) {
      return `<h2>${esc(p.replace(/^#{1,3}\s+/, '').replace(/:$/, ''))}</h2>`
    }
    return `<p>${esc(p).replace(/\n/g, '<br>')}</p>`
  }).join('')
}
