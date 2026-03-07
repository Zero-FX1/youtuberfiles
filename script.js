let files = []
let folder = ""

const list = document.getElementById("list")
const pathEl = document.getElementById("path")
const search = document.getElementById("search")
const sort = document.getElementById("sort")

fetch("files.json")
  .then(r => r.json())
  .then(data => {
    files = data
    render()
  })

search.oninput = render
sort.onchange = render

function render() {
  list.innerHTML = ""
  pathEl.textContent = "files/" + folder

  let filtered = files.filter(f => f.path.startsWith(folder))
  const folders = new Set()

  filtered.forEach(file => {
    const rest = file.path.slice(folder.length)
    const parts = rest.split("/")
    if (parts.length > 1) folders.add(parts[0])
  })

  folders.forEach(f => createFolder(f))

  filtered
    .filter(f => !f.path.slice(folder.length).includes("/"))
    .filter(f => f.name.toLowerCase().includes(search.value.toLowerCase()))
    .sort(sortFiles)
    .forEach(createFileWithPreview)
}

function sortFiles(a, b) {
  if (sort.value === "size") return b.size - a.size
  return a.name.localeCompare(b.name)
}

function createFolder(name) {
  const div = document.createElement("div")
  div.className = "item"
  div.innerHTML = `<div class="name">📁 ${name}</div>`
  div.onclick = () => {
    folder += name + "/"
    render()
  }
  list.appendChild(div)
}

function createFileWithPreview(file) {
  const div = document.createElement("div")
  div.className = "item"

  div.innerHTML = `
    <div class="name">📄 ${file.name} (${format(file.size)})
      <a class="download" href="files/${file.path}" download>Download</a>
    </div>
    <div class="preview"></div>
  `

  const previewContainer = div.querySelector(".preview")
  addPreview(previewContainer, file)
  list.appendChild(div)
}

function addPreview(container, file) {
  const ext = file.name.split(".").pop().toLowerCase()
  const url = "files/" + file.path

  if (["png","jpg","jpeg","gif","webp"].includes(ext)) {
    const img = document.createElement("img")
    img.src = url
    container.appendChild(img)
  } else if (["mp4","webm","mov"].includes(ext)) {
    const video = document.createElement("video")
    video.src = url
    video.controls = true
    container.appendChild(video)
  } else if (["mp3","wav","ogg","flac","m4a"].includes(ext)) {
    const audio = document.createElement("audio")
    audio.src = url
    audio.controls = true
    container.appendChild(audio)
  } else {
    const link = document.createElement("a")
    link.href = url
    link.download = file.name
    link.textContent = "Download file"
    link.className = "download"
    container.appendChild(link)
  }
}

function format(bytes){
  if(bytes<1024) return bytes+" B"
  if(bytes<1024*1024) return (bytes/1024).toFixed(1)+" KB"
  return (bytes/1024/1024).toFixed(1)+" MB"
}

