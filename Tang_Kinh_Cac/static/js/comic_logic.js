// --- BIẾN TOÀN CỤC ---
let allComics = []; 
let allChapters = [];
let currentComic = "";
let currentIndex = 0;
let currentMeta = {}; 
let currentGenres = []; 
let allAvailableGenres = []; 

document.addEventListener("DOMContentLoaded", () => {
    loadLibrary(); // Tải dữ liệu ban đầu
    fetchAllGenres(); // Tải danh sách thể loại cho bộ lọc
});

// ==============================================
// 1. QUẢN LÝ DỮ LIỆU & RENDER CÁC TRANG
// ==============================================

async function loadLibrary() {
    try {
        const response = await fetch('/api/comics');
        allComics = await response.json(); 
        // Sau khi có dữ liệu -> Mặc định vào Trang Chủ
        switchView('home');
    } catch (e) { console.error("Lỗi tải truyện:", e); }
}

async function fetchAllGenres() {
    try {
        const res = await fetch('/api/all-genres');
        allAvailableGenres = await res.json();
        
        // Điền vào Dropdown bộ lọc ở trang List
        const filterSelect = document.getElementById('genre-filter');
        if(filterSelect) {
            allAvailableGenres.forEach(g => {
                filterSelect.innerHTML += `<option value="${g}">${g}</option>`;
            });
        }
    } catch (e) { console.error("Lỗi tải genres:", e); }
}

// Hàm vẽ card truyện (Dùng chung cho Home, List, Search)
function renderComicsToContainer(list, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    
    if (!list || list.length === 0) {
        container.innerHTML = "<p style='color:#777; width:100%; text-align:center;'>Không tìm thấy truyện nào.</p>";
        return;
    }

    list.forEach(comic => {
        // Comic object từ API trả về có: {folder_name, title, cover, ...}
        // Lưu ý: Đôi khi comic chỉ là string tên truyện (nếu API cũ), cần check
        const name = comic.folder_name || comic.title || comic; 
        
        const card = document.createElement('div');
        card.className = 'comic-card';
        card.innerHTML = `
            <div style="height:220px; overflow:hidden; position:relative;">
                <img src="/read/${name}/cover.jpg" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/200x300?text=${name.charAt(0)}'" 
                     style="width:100%; height:100%; object-fit:cover; display:block;">
            </div>
            <div class="title">${name}</div>
        `;
        card.onclick = () => loadChapters(name);
        container.appendChild(card);
    });
}

// --- LOGIC RIÊNG TỪNG TRANG ---

function renderHomePage() {
    // Lấy 8 truyện đầu tiên làm "Mới cập nhật"
    // (Sau này bạn có thể sort theo ngày update)
    const newComics = allComics.slice(0, 8);
    renderComicsToContainer(newComics, 'home-new-list');
}

function renderListPage() {
    // Trang danh sách thì hiện tất cả
    renderComicsToContainer(allComics, 'comic-list');
}

function filterByGenre() {
    const genre = document.getElementById('genre-filter').value;
    if (!genre) {
        renderComicsToContainer(allComics, 'comic-list');
        return;
    }
    // Lọc phía client (Hơi chậm nếu list dài, nhưng tiện)
    const filtered = allComics.filter(c => {
        // API get_comics trả về list dict, trong đó có field 'genres'
        // Nếu API chỉ trả list string tên truyện thì không lọc được ở đây -> Cần API trả full info
        // Tạm thời giả định API trả full info như code python mới
        return c.genres && c.genres.includes(genre);
    });
    renderComicsToContainer(filtered, 'comic-list');
}

function handleSearchPage() {
    const keyword = document.getElementById('search-input-page').value.toLowerCase();
    const filtered = allComics.filter(c => {
        const name = c.folder_name || c.title || c;
        return name.toLowerCase().includes(keyword);
    });
    renderComicsToContainer(filtered, 'search-results');
}

// ==============================================
// 2. ĐIỀU HƯỚNG (NAVIGATION)
// ==============================================

function switchView(viewName) {
    // 1. Ẩn tất cả các view
    ['home', 'list', 'search', 'detail', 'reader'].forEach(v => {
        const el = document.getElementById(v + '-view');
        if (el) el.style.display = 'none';
    });

    // 2. Xử lý Navbar
    const globalNav = document.querySelector('.global-nav');
    const subNav = document.getElementById('sub-nav');
    const backBtn = document.getElementById('navbar');

    if (globalNav) globalNav.style.display = 'flex';
    if (subNav) subNav.style.display = 'block';
    if (backBtn) backBtn.style.display = 'none';

    // Xóa active cũ
    document.querySelectorAll('.btn-sub').forEach(b => b.classList.remove('active'));

    // 3. Logic hiển thị từng trang
    if (viewName === 'home') {
        document.getElementById('home-view').style.display = 'block';
        renderHomePage();
        setActiveSubBtn(0);
    }
    else if (viewName === 'list') {
        document.getElementById('list-view').style.display = 'block';
        renderListPage();
        setActiveSubBtn(1);
    }
    else if (viewName === 'search') {
        document.getElementById('search-view').style.display = 'block';
        document.getElementById('search-input-page').focus();
        setActiveSubBtn(2);
    }
    else if (viewName === 'detail') {
        document.getElementById('detail-view').style.display = 'block';
        if (subNav) subNav.style.display = 'none'; // Ẩn sub-nav
        if (backBtn) {
            backBtn.style.display = 'block';
            backBtn.innerText = `🔙 Thư Viện > ${currentComic}`;
        }
    }
    else if (viewName === 'reader') {
        document.getElementById('reader-view').style.display = 'block';
        if (globalNav) globalNav.style.display = 'none'; // Fullscreen mode
        if (subNav) subNav.style.display = 'none';
        if (backBtn) backBtn.style.display = 'none';
    }
}

function setActiveSubBtn(index) {
    const btns = document.querySelectorAll('.btn-sub');
    if(btns[index]) btns[index].classList.add('active');
}

function goBack() {
    const readerDisplay = document.getElementById('reader-view').style.display;
    if (readerDisplay === 'block') {
        switchView('detail');
    } else {
        switchView('home'); // Mặc định back về Home
    }
}

// ==============================================
// 3. LOGIC CHI TIẾT & ĐỌC (Giữ nguyên logic cũ)
// ==============================================

async function loadChapters(comicName) {
    currentComic = comicName;
    
    // Load Info
    const resInfo = await fetch(`/api/comic-info/${comicName}`);
    currentMeta = await resInfo.json();
    document.getElementById('view-title').innerText = currentMeta.title;
    document.getElementById('view-author').innerText = currentMeta.author || "Unknown";
    document.getElementById('view-status').innerText = currentMeta.status || "N/A";
    document.getElementById('view-desc').innerText = currentMeta.description || "";
    document.getElementById('detail-cover').src = `/read/${comicName}/cover.jpg`;
    
    const genreBox = document.getElementById('view-genres');
    genreBox.innerHTML = "";
    (currentMeta.genres || []).forEach(g => {
        genreBox.innerHTML += `<span class="genre-tag">${g}</span>`;
    });

    // Load Chapters
    const resChap = await fetch(`/api/comic/${comicName}`);
    allChapters = await resChap.json();
    document.getElementById('detail-chap-count').innerText = allChapters.length;
    
    const container = document.getElementById('chapter-list');
    container.innerHTML = "";
    [...allChapters].reverse().forEach(chap => {
        const realIndex = allChapters.indexOf(chap);
        const item = document.createElement('div');
        item.className = 'chapter-item';
        item.innerHTML = `<span>${chap}</span>`;
        item.onclick = () => loadPages(realIndex);
        container.appendChild(item);
    });

    switchView('detail');
}

async function loadPages(index) {
    currentIndex = index;
    const chapName = allChapters[index];
    document.getElementById('reader-comic-title').innerText = currentComic;
    updateChapterSelector();
    updateNavButtons();

    const response = await fetch(`/api/comic/${currentComic}/${chapName}`);
    const images = await response.json();
    const container = document.getElementById('pages-container');
    container.innerHTML = "";
    images.forEach(img => {
        const imgTag = document.createElement('img');
        imgTag.src = `/read/${currentComic}/${chapName}/${img}`;
        imgTag.className = 'page-img';
        imgTag.loading = "lazy";
        container.appendChild(imgTag);
    });

    switchView('reader');
    window.scrollTo(0, 0);
}

// Các hàm phụ trợ Reader (Giữ nguyên)
function updateChapterSelector() {
    const selector = document.getElementById('chapter-selector');
    selector.innerHTML = "";
    allChapters.forEach((chap, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = chap;
        option.selected = (index === currentIndex);
        selector.appendChild(option);
    });
}
function changeChapter(idx) { loadPages(parseInt(idx)); }
function nextChapter() { if (currentIndex < allChapters.length - 1) loadPages(currentIndex + 1); }
function prevChapter() { if (currentIndex > 0) loadPages(currentIndex - 1); }
function updateNavButtons() {
    document.getElementById('btn-prev').disabled = (currentIndex === 0);
    document.getElementById('btn-next').disabled = (currentIndex === allChapters.length - 1);
}
function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
}
function readFirstChapter() { if(allChapters.length > 0) loadPages(0); }
function readLatestChapter() { if(allChapters.length > 0) loadPages(allChapters.length - 1); }

// --- LOGIC SỬA INFO (EDIT MODE) - Giữ nguyên ---
function toggleEditMode(showEdit) {
    const viewDiv = document.getElementById('info-view-mode');
    const editDiv = document.getElementById('info-edit-mode');
    if (showEdit) {
        viewDiv.classList.add('hidden');
        editDiv.classList.remove('hidden');
        document.getElementById('edit-title').value = currentMeta.title;
        document.getElementById('edit-author').value = currentMeta.author;
        document.getElementById('edit-status').value = currentMeta.status;
        document.getElementById('edit-desc').value = currentMeta.description;
        currentGenres = [...(currentMeta.genres || [])];
        renderEditGenres();
    } else {
        viewDiv.classList.remove('hidden');
        editDiv.classList.add('hidden');
    }
}
function renderEditGenres() {
    const container = document.getElementById('edit-genres-list');
    container.innerHTML = "";
    currentGenres.forEach((g, index) => {
        container.innerHTML += `<span class="genre-tag">${g} <span class="tag-remove" onclick="removeGenre(${index})">x</span></span>`;
    });
}
function removeGenre(i) { currentGenres.splice(i, 1); renderEditGenres(); }
function handleGenreInput(e) {
    const val = e.target.value;
    const box = document.getElementById('genre-suggestions');
    if (e.key === 'Enter' && val.trim()) {
        if(!currentGenres.includes(val.trim())) { currentGenres.push(val.trim()); renderEditGenres(); }
        e.target.value = ''; box.style.display = 'none'; return;
    }
    if (val.length > 0) {
        const matches = allAvailableGenres.filter(g => g.toLowerCase().includes(val.toLowerCase()));
        if(matches.length){
            box.innerHTML = matches.map(g => `<div class="suggestion-item" onclick="selectSuggestion('${g}')">${g}</div>`).join('');
            box.style.display = 'block';
        } else box.style.display = 'none';
    } else box.style.display = 'none';
}
function selectSuggestion(g) { 
    if(!currentGenres.includes(g)) { currentGenres.push(g); renderEditGenres(); }
    document.getElementById('genre-input').value = '';
    document.getElementById('genre-suggestions').style.display = 'none';
}
async function saveComicInfo() {
    const newData = {
        title: document.getElementById('edit-title').value,
        author: document.getElementById('edit-author').value,
        status: document.getElementById('edit-status').value,
        description: document.getElementById('edit-desc').value,
        genres: currentGenres
    };
    try {
        await fetch(`/api/save-comic-info/${currentComic}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newData)
        });
        toggleEditMode(false);
        loadChapters(currentComic);
        fetchAllGenres();
        alert("Đã lưu!");
    } catch(e) { alert("Lỗi lưu!"); }
}