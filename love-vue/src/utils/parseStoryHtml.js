/**
 * 将原版故事 HTML 中的 .ft-page 解析为幻灯片数据
 */
export function parseStoryPages(html, baseUrl) {
  const b = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const doc = new DOMParser().parseFromString(html.trim(), 'text/html')
  const pages = doc.querySelectorAll('.ft-page')
  const out = []

  pages.forEach((el, index) => {
    const clone = el.cloneNode(true)
    clone.querySelectorAll('[contenteditable]').forEach((n) => n.removeAttribute('contenteditable'))
    clone.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src')
      if (src && src.startsWith('./')) {
        img.setAttribute('src', b + src.slice(2))
      }
    })
    clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'))
    clone.querySelectorAll('[tppabs]').forEach((n) => n.removeAttribute('tppabs'))

    out.push({
      index,
      pageClass: el.className,
      html: clone.innerHTML,
    })
  })

  return out
}
