let files=[]
let folder=""

const list=document.getElementById("list")
const path=document.getElementById("path")
const preview=document.getElementById("preview")
const search=document.getElementById("search")
const sort=document.getElementById("sort")

fetch("files.json")
.then(r=>r.json())
.then(data=>{
files=data
render()
})

document.getElementById("back").onclick=()=>{
if(folder==="")return
folder=folder.split("/").slice(0,-2).join("/")+"/"
if(folder==="/")folder=""
render()
}

search.oninput=render
sort.onchange=render

function render(){

list.innerHTML=""
path.textContent="files/"+folder

let filtered=files.filter(f=>f.path.startsWith(folder))

const folders=new Set()

filtered.forEach(file=>{

let rest=file.path.slice(folder.length)
let parts=rest.split("/")

if(parts.length>1){
folders.add(parts[0])
}

})

folders.forEach(f=>createFolder(f))

filtered
.filter(f=>!f.path.slice(folder.length).includes("/"))
.filter(f=>f.name.toLowerCase().includes(search.value.toLowerCase()))
.sort(sortFiles)
.forEach(createFile)

}

function sortFiles(a,b){

if(sort.value==="size"){
return b.size-a.size
}

return a.name.localeCompare(b.name)

}

function createFolder(name){

const div=document.createElement("div")
div.className="item"

div.innerHTML=`
<div class="name">📁 ${name}</div>
<div>open</div>
`

div.onclick=()=>{
folder+=name+"/"
render()
}

list.appendChild(div)

}

function createFile(file){

const div=document.createElement("div")
div.className="item"

div.innerHTML=`
<div class="name">📄 ${file.name}</div>
<div>
${format(file.size)}
<a class="download" href="files/${file.path}" download>download</a>
</div>
`

div.onclick=()=>showPreview(file)

list.appendChild(div)

}

function showPreview(file){

preview.innerHTML=""

let ext=file.name.split(".").pop().toLowerCase()

let url="files/"+file.path

if(["png","jpg","jpeg","gif","webp"].includes(ext)){

preview.innerHTML=`<h3>${file.name}</h3><img src="${url}">`

}

else if(["mp4","webm","mov"].includes(ext)){

preview.innerHTML=`<h3>${file.name}</h3><video controls src="${url}"></video>`

}

else if(["mp3","wav","ogg","flac"].includes(ext)){

preview.innerHTML=`<h3>${file.name}</h3><audio controls src="${url}"></audio>`

}

else{

preview.innerHTML=`<h3>${file.name}</h3>
<a class="download" href="${url}" download>Download file</a>`

}

}

function format(bytes){

if(bytes<1024)return bytes+" B"
if(bytes<1024*1024)return (bytes/1024).toFixed(1)+" KB"
return (bytes/1024/1024).toFixed(1)+" MB"

}