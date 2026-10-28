let currentAlbum = "all";

const gallery = document.getElementById("gallery");
const albumsDiv = document.getElementById("albums");
const empty = document.getElementById("empty");
const photoCount = document.getElementById("photoCount");

async function loadAlbums() {
  const response = await fetch("/api/albums");
  const albums = await response.json();

  albumsDiv.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "album-btn " + (currentAlbum === "all" ? "active" : "");
  allBtn.textContent = "All Photos";
  allBtn.onclick = () => {
    currentAlbum = "all";
    loadAlbums();
    loadPhotos();
  };
  albumsDiv.appendChild(allBtn);

  albums.forEach(album => {
    const wrapper = document.createElement("span");

    const btn = document.createElement("button");
    btn.className = "album-btn " + (String(currentAlbum) === String(album.id) ? "active" : "");
    btn.textContent = "📁 " + album.name;
    btn.onclick = () => {
      currentAlbum = String(album.id);
      loadAlbums();
      loadPhotos();
    };

    const del = document.createElement("button");
    del.className = "album-delete";
    del.textContent = "×";
    del.title = "Delete album";
    del.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm("Delete this empty album?")) return;

      const r = await fetch("/api/albums/" + album.id, { method: "DELETE" });
      const data = await r.json();

      if (!r.ok) {
        alert(data.error);
        return;
      }

      currentAlbum = "all";
      loadAlbums();
      loadPhotos();
      loadAlbumOptions();
    };

    wrapper.appendChild(btn);
    wrapper.appendChild(del);
    albumsDiv.appendChild(wrapper);
  });
}

async function loadPhotos() {
  const response = await fetch("/api/photos?album=" + currentAlbum);
  const photos = await response.json();

  gallery.innerHTML = "";
  photoCount.textContent = `${photos.length} photo${photos.length === 1 ? "" : "s"}`;
  empty.style.display = photos.length ? "none" : "block";

  photos.forEach(photo => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = "/uploads/" + photo.filename;
    img.alt = photo.title;
    img.onclick = () => openViewer(photo);

    const info = document.createElement("div");
    info.className = "card-info";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = photo.title;

    const album = document.createElement("div");
    album.className = "card-album";
    album.textContent = photo.album_name ? "📁 " + photo.album_name : "No album";

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "Delete";
    del.onclick = () => deletePhoto(photo.id);

    info.appendChild(title);
    info.appendChild(album);
    info.appendChild(del);
    card.appendChild(img);
    card.appendChild(info);
    gallery.appendChild(card);
  });
}

async function loadAlbumOptions() {
  const response = await fetch("/api/albums");
  const albums = await response.json();
  const select = document.getElementById("albumSelect");

  select.innerHTML = '<option value="">No album</option>';

  albums.forEach(album => {
    select.innerHTML += `<option value="${album.id}">${escapeHtml(album.name)}</option>`;
  });
}

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const message = document.getElementById("uploadMessage");
  message.textContent = "Uploading...";

  try {
    const response = await fetch("/api/photos", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error || "Upload failed.";
      return;
    }

    e.target.reset();
    closeUpload();
    await loadAlbums();
    await loadPhotos();
    await loadAlbumOptions();
  } catch {
    message.textContent = "Server error. Make sure Node.js is running.";
  }
});

document.getElementById("albumForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("albumName").value.trim();
  const message = document.getElementById("albumMessage");

  const response = await fetch("/api/albums", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  const data = await response.json();

  if (!response.ok) {
    message.textContent = data.error;
    return;
  }

  e.target.reset();
  closeAlbum();
  await loadAlbums();
  await loadAlbumOptions();
});

async function deletePhoto(id) {
  if (!confirm("Are you sure you want to delete this photo?")) return;

  const response = await fetch("/api/photos/" + id, { method: "DELETE" });
  const data = await response.json();

  if (!response.ok) {
    alert(data.error);
    return;
  }

  loadPhotos();
}

function openUpload() {
  document.getElementById("uploadModal").style.display = "flex";
  loadAlbumOptions();
}

function closeUpload() {
  document.getElementById("uploadModal").style.display = "none";
  document.getElementById("uploadMessage").textContent = "";
}

function openAlbum() {
  document.getElementById("albumModal").style.display = "flex";
}

function closeAlbum() {
  document.getElementById("albumModal").style.display = "none";
  document.getElementById("albumMessage").textContent = "";
}

function openViewer(photo) {
  document.getElementById("viewerImage").src = "/uploads/" + photo.filename;
  document.getElementById("viewerTitle").textContent = photo.title;
  document.getElementById("viewer").style.display = "flex";
}

function closeViewer(event) {
  if (event.target.id === "viewer" || event.target.classList.contains("viewer-close")) {
    document.getElementById("viewer").style.display = "none";
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

loadAlbums();
loadPhotos();