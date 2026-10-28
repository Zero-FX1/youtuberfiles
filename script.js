let files = []
let folder = ""

const list = document.getElementById("list")
const pathEl = document.getElementById("path")
const statsEl = document.getElementById("stats")
const search = document.getElementById("search")
const sort = document.getElementById("sort")
const lightbox = document.getElementById("lightbox")
const lightboxImg = lightbox.querySelector("img")

const IMAGE = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"]
const VIDEO = ["mp4", "webm", "mov"]
const AUDIO = ["mp3", "wav", "ogg", "flac", "m4a"]

// ---------- helpers ----------
function el(tag, className, text) {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text !== undefined) e.textContent = text
  return e
}

const fileUrl = file => "files/" + file.path.split("/").map(encodeURIComponent).join("/")
const extOf = name => (name.includes(".") ? name.split(".").pop().toLowerCase() : "")

function kindOf(ext) {
  if (IMAGE.includes(ext)) return "image"
  if (VIDEO.includes(ext)) return "video"
  if (AUDIO.includes(ext)) return "audio"
  return "other"
}

function format(bytes) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB"
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB"
}

function sortFiles(a, b) {
  if (sort.value === "size") return b.size - a.size
  return a.name.localeCompare(b.name, undefined, { numeric: true })
}

// ---------- loading ----------
for (let i = 0; i < 6; i++) list.appendChild(el("div", "skeleton"))

fetch("files.json")
  .then(r => r.json())
  .then(data => {
    files = data
    readHash()
    render()
  })
  .catch(() => {
    list.innerHTML = ""
    const e = el("div", "empty")
    e.append(el("div", "big", "⚠️"), el("div", "", "Couldn't load files.json"))
    list.appendChild(e)
  })

// ---------- navigation (hash based so the back button works) ----------
function readHash() {
  const h = decodeURIComponent(location.hash.slice(1))
  folder = h && !h.endsWith("/") ? h + "/" : h
}

function go(path) {
  folder = path
  search.value = ""
  history.pushState(null, "", path ? "#" + encodeURIComponent(path.slice(0, -1)).replace(/%2F/g, "/") : location.pathname)
  render()
  window.scrollTo({ top: 0, behavior: "smooth" })
}

window.addEventListener("popstate", () => { readHash(); render() })
window.addEventListener("hashchange", () => { readHash(); render() })

search.oninput = render
sort.onchange = render

// ---------- rendering ----------
function renderCrumbs() {
  pathEl.innerHTML = ""
  const parts = folder.split("/").filter(Boolean)

  const root = el("button", parts.length ? "" : "current", "🏠 files")
  root.onclick = () => parts.length && go("")
  pathEl.appendChild(root)

  let acc = ""
  parts.forEach((p, i) => {
    acc += p + "/"
    const target = acc
    pathEl.appendChild(el("span", "sep", "/"))
    const b = el("button", i === parts.length - 1 ? "current" : "", p)
    if (i < parts.length - 1) b.onclick = () => go(target)
    pathEl.appendChild(b)
  })
}

function render() {
  list.innerHTML = ""
  renderCrumbs()

  const query = search.value.trim().toLowerCase()
  let idx = 0
  let count = 0

  if (query) {
    // global search across every folder
    const hits = files
      .filter(f => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query))
      .sort(sortFiles)
    hits.forEach(f => list.appendChild(createFile(f, idx++, true)))
    statsEl.textContent = `${hits.length} result${hits.length === 1 ? "" : "s"} for "${search.value.trim()}"`
    if (!hits.length) list.appendChild(emptyState("🔍", "Nothing matches that search"))
    return
  }

  const inFolder = files.filter(f => f.path.startsWith(folder))
  const folders = new Map()
  const here = []

  inFolder.forEach(file => {
    const rest = file.path.slice(folder.length)
    const parts = rest.split("/")
    if (parts.length > 1) {
      const entry = folders.get(parts[0]) || { count: 0, size: 0 }
      entry.count++
      entry.size += file.size
      folders.set(parts[0], entry)
    } else {
      here.push(file)
    }
  })

  ;[...folders.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(name => {
    list.appendChild(createFolder(name, folders.get(name), idx++))
    count++
  })

  here.sort(sortFiles).forEach(f => {
    list.appendChild(createFile(f, idx++, false))
    count++
  })

  const total = here.reduce((s, f) => s + f.size, 0)
  statsEl.textContent = count
    ? `${folders.size} folder${folders.size === 1 ? "" : "s"} · ${here.length} file${here.length === 1 ? "" : "s"} · ${format(total)} here`
    : ""
  if (!count) list.appendChild(emptyState("👻", "This folder is empty"))
}

function emptyState(icon, msg) {
  const e = el("div", "empty")
  e.append(el("div", "big", icon), el("div", "", msg))
  return e
}

function createFolder(name, info, i) {
  const div = el("div", "item folder")
  div.style.setProperty("--i", i)
  div.tabIndex = 0

  const icon = el("div", "ficon", "📁")
  const body = el("div")
  body.append(
    el("div", "fname", name),
    el("div", "fmeta", `${info.count} file${info.count === 1 ? "" : "s"} · ${format(info.size)}`)
  )
  div.append(icon, body)

  const open = () => go(folder + name + "/")
  div.onclick = open
  div.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open() } }
  return div
}

function createFile(file, i, showPath) {
  const ext = extOf(file.name)
  const kind = kindOf(ext)

  const div = el("div", "item")
  div.style.setProperty("--i", Math.min(i, 24))

  const head = el("div", "head")
  const title = el("div", "title")
  const meta = format(file.size) + (showPath && file.path.includes("/") ? " · " + file.path.slice(0, file.path.lastIndexOf("/")) : "")
  title.append(el("div", "fname", file.name), el("div", "fmeta", meta))
  head.append(title, el("span", "badge " + kind, (ext || "file").toUpperCase()))

  const preview = el("div", "preview")
  addPreview(preview, file, kind)

  const actions = el("div", "actions")
  const dl = el("a", "download", "⬇ Download")
  dl.href = fileUrl(file)
  dl.download = file.name
  actions.appendChild(dl)

  div.append(head, preview, actions)
  return div
}

function addPreview(container, file, kind) {
  const url = fileUrl(file)

  if (kind === "image") {
    const img = document.createElement("img")
    img.loading = "lazy"
    img.alt = file.name
    img.src = url
    img.onclick = () => openLightbox(url)
    container.appendChild(img)
  } else if (kind === "video") {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.controls = true
    video.src = url
    container.appendChild(video)
  } else if (kind === "audio") {
    const audio = document.createElement("audio")
    audio.preload = "none"
    audio.controls = true
    audio.src = url
    container.appendChild(audio)
  } else {
    container.appendChild(el("div", "generic", "📄"))
  }
}

// ---------- lightbox ----------
function openLightbox(url) {
  lightboxImg.src = url
  lightbox.hidden = false
}
lightbox.onclick = () => { lightbox.hidden = true; lightboxImg.src = "" }
document.addEventListener("keydown", e => { if (e.key === "Escape") lightbox.onclick() })
