// 구글 스프레드시트 웹앱 URL (이 URL은 실제 배포 후 변경해야 합니다)
const SHEET_API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// 데이터 스토어
let posts = [];
let lectures = [];
let currentPostId = 1;
let currentLectureId = 1;
let isLoading = false;

// DOM 요소 선택 - 메인 섹션
const homeSection = document.getElementById('home-section');
const lecturesSection = document.getElementById('lectures-section');
const listSection = document.getElementById('list-section');
const writeSection = document.getElementById('write-section');
const viewSection = document.getElementById('view-section');
const editSection = document.getElementById('edit-section');
const addLectureSection = document.getElementById('add-lecture-section');
const lectureDetailSection = document.getElementById('lecture-detail-section');

// DOM 요소 선택 - 게시판
const postsList = document.getElementById('posts-list');
const newPostBtn = document.getElementById('new-post-btn');
const postForm = document.getElementById('post-form');
const cancelBtn = document.getElementById('cancel-btn');
const backBtn = document.getElementById('back-btn');
const editBtn = document.getElementById('edit-btn');
const deleteBtn = document.getElementById('delete-btn');
const editForm = document.getElementById('edit-form');
const editCancelBtn = document.getElementById('edit-cancel-btn');

// DOM 요소 선택 - 강의
const lecturesGrid = document.getElementById('lectures-grid');
const addLectureBtn = document.getElementById('add-lecture-btn');
const lectureForm = document.getElementById('lecture-form');
const lectureCancelBtn = document.getElementById('lecture-cancel-btn');
const backToLecturesBtn = document.getElementById('back-to-lectures-btn');
const deleteLectureBtn = document.getElementById('delete-lecture-btn');

// DOM 요소 선택 - 홈 섹션
const latestLectures = document.getElementById('latest-lectures');
const latestPosts = document.getElementById('latest-posts');

// 네비게이션 요소 선택
const navLinks = document.querySelectorAll('.nav-link');

// 로딩 인디케이터 생성
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
loadingIndicator.innerHTML = '<div class="spinner"></div><p>로딩 중...</p>';
document.body.appendChild(loadingIndicator);

// 페이지 로드 시 초기화
window.addEventListener('load', async () => {
    // 데이터 로드
    showLoading();
    await Promise.all([fetchPosts(), fetchLectures()]);
    hideLoading();
    
    // 홈 화면 초기화
    updateHomeSection();
    
    // 네비게이션 이벤트 설정
    setupNavigation();
});

// 네비게이션 설정
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetSection = document.getElementById(link.dataset.section);
            showMainSection(targetSection);
            
            // 특정 섹션에 관련된 추가 작업
            if (link.dataset.section === 'list-section') {
                showLoading();
                await fetchPosts();
                displayPosts();
                hideLoading();
            } else if (link.dataset.section === 'lectures-section') {
                showLoading();
                await fetchLectures();
                displayLectures();
                hideLoading();
            }
        });
    });
}

// 홈 섹션 업데이트
function updateHomeSection() {
    updateLatestLectures();
    updateLatestPosts();
}

// 최신 강의 목록 업데이트
function updateLatestLectures() {
    latestLectures.innerHTML = '';
    
    if (lectures.length === 0) {
        latestLectures.innerHTML = '<p>아직 강의가 없습니다.</p>';
        return;
    }
    
    // 최신 강의 3개까지만 표시
    const recentLectures = [...lectures].sort((a, b) => b.id - a.id).slice(0, 3);
    
    recentLectures.forEach(lecture => {
        const lectureItem = document.createElement('div');
        lectureItem.className = 'feature-item';
        lectureItem.innerHTML = `
            <a href="#" class="lecture-link" data-id="${lecture.id}">${lecture.title}</a>
        `;
        latestLectures.appendChild(lectureItem);
    });
    
    // 강의 링크 클릭 이벤트 추가
    document.querySelectorAll('.lecture-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lectureId = parseInt(link.dataset.id);
            displayLectureDetails(lectureId);
            showMainSection(lectureDetailSection);
        });
    });
}

// 최신 게시글 목록 업데이트
function updateLatestPosts() {
    latestPosts.innerHTML = '';
    
    if (posts.length === 0) {
        latestPosts.innerHTML = '<p>아직 게시글이 없습니다.</p>';
        return;
    }
    
    // 최신 게시글 3개까지만 표시
    const recentPosts = [...posts].sort((a, b) => b.id - a.id).slice(0, 3);
    
    recentPosts.forEach(post => {
        const postItem = document.createElement('div');
        postItem.className = 'feature-item';
        postItem.innerHTML = `
            <a href="#" class="post-link" data-id="${post.id}">${post.title}</a>
        `;
        latestPosts.appendChild(postItem);
    });
    
    // 게시글 링크 클릭 이벤트 추가
    document.querySelectorAll('.post-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = parseInt(link.dataset.id);
            displayPostDetails(postId);
            showMainSection(viewSection);
        });
    });
}

// 구글 스프레드시트에서 게시글 데이터 가져오기
async function fetchPosts() {
    try {
        const response = await fetch(`${SHEET_API_URL}?action=getPosts`);
        const data = await response.json();
        
        if (data.success) {
            posts = data.posts || [];
            
            // 현재 최대 게시글 ID 찾기
            if (posts.length > 0) {
                const maxId = Math.max(...posts.map(post => post.id));
                currentPostId = maxId + 1;
            }
        } else {
            console.error('게시글 로드 실패:', data.error);
            showMessage('게시글을 불러오는데 실패했습니다', 'error');
        }
    } catch (error) {
        console.error('게시글 로드 중 오류 발생:', error);
        showMessage('서버 연결에 실패했습니다', 'error');
    }
}

// 구글 스프레드시트에서 강의 데이터 가져오기
async function fetchLectures() {
    try {
        const response = await fetch(`${SHEET_API_URL}?action=getLectures`);
        const data = await response.json();
        
        if (data.success) {
            lectures = data.lectures || [];
            
            // 현재 최대 강의 ID 찾기
            if (lectures.length > 0) {
                const maxId = Math.max(...lectures.map(lecture => lecture.id));
                currentLectureId = maxId + 1;
            }
        } else {
            console.error('강의 로드 실패:', data.error);
            showMessage('강의를 불러오는데 실패했습니다', 'error');
        }
    } catch (error) {
        console.error('강의 로드 중 오류 발생:', error);
        showMessage('서버 연결에 실패했습니다', 'error');
    }
}

// 게시글 저장
async function savePost(post) {
    try {
        showLoading();
        const response = await fetch(SHEET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'savePost',
                post: post
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 저장 성공 시 다시 데이터 가져오기
            await fetchPosts();
            showMessage('게시글이 저장되었습니다', 'success');
        } else {
            console.error('게시글 저장 실패:', data.error);
            showMessage('게시글 저장에 실패했습니다', 'error');
        }
        hideLoading();
        
    } catch (error) {
        console.error('게시글 저장 중 오류 발생:', error);
        showMessage('서버 연결에 실패했습니다', 'error');
        hideLoading();
    }
}

// 게시글 삭제
async function deletePost(postId) {
    try {
        showLoading();
        const response = await fetch(SHEET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'deletePost',
                postId: postId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 삭제 성공 시 다시 데이터 가져오기
            await fetchPosts();
            showMessage('게시글이 삭제되었습니다', 'success');
        } else {
            console.error('게시글 삭제 실패:', data.error);
            showMessage('게시글 삭제에 실패했습니다', 'error');
        }
        hideLoading();
        
    } catch (error) {
        console.error('게시글 삭제 중 오류 발생:', error);
        showMessage('서버 연결에 실패했습니다', 'error');
        hideLoading();
    }
}

// 강의 저장
async function saveLecture(lecture) {
    try {
        showLoading();
        const response = await fetch(SHEET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveLecture',
                lecture: lecture
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 저장 성공 시 다시 데이터 가져오기
            await fetchLectures();
            showMessage('강의가 저장되었습니다', 'success');
        } else {
            console.error('강의 저장 실패:', data.error);
            showMessage('강의 저장에 실패했습니다', 'error');
        }
        hideLoading();
        
    } catch (error) {
        console.error('강의 저장 중 오류 발생:', error);
        showMessage('서버 연결에 실패했습니다', 'error');
        hideLoading();
    }
}

// 강의 삭제
async function deleteLecture(lectureId) {
    try {
        showLoading();
        const response = await fetch(SHEET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'deleteLecture',
                lectureId: lectureId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 삭제 성공 시 다시 데이터 가져오기
            await fetchLectures();
            showMessage('강의가 삭제되었습니다', 'success');
        } else {
            console.error('강의 삭제 실패:', data.error);
            showMessage('강의 삭제에 실패했습니다', 'error');
        }
        hideLoading();
        
    } catch (error) {
        console.error('강의 삭제 중 오류 발생:', error);
        showMessage('서버 연결에 실패했습니다', 'error');
        hideLoading();
    }
}

// 강의 목록 표시 함수
function displayLectures() {
    lecturesGrid.innerHTML = '';
    
    if (lectures.length === 0) {
        lecturesGrid.innerHTML = '<p class="no-items">등록된 강의가 없습니다.</p>';
        return;
    }
    
    lectures.forEach(lecture => {
        const card = document.createElement('div');
        card.className = 'lecture-card';
        card.innerHTML = `
            <div class="lecture-card-content">
                <h3>${lecture.title}</h3>
                <p>${lecture.description}</p>
                <a href="#" class="btn primary-btn view-lecture-btn" data-id="${lecture.id}">자세히 보기</a>
            </div>
        `;
        lecturesGrid.appendChild(card);
    });
    
    // 강의 상세 보기 버튼 클릭 이벤트 추가
    document.querySelectorAll('.view-lecture-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const lectureId = parseInt(btn.dataset.id);
            displayLectureDetails(lectureId);
            showMainSection(lectureDetailSection);
        });
    });
}

// 강의 상세 내용 표시 함수
function displayLectureDetails(lectureId) {
    const lecture = lectures.find(l => l.id === lectureId);
    
    if (lecture) {
        document.getElementById('view-lecture-title').textContent = lecture.title;
        document.getElementById('view-lecture-desc').textContent = lecture.description;
        const lectureUrl = document.getElementById('view-lecture-url');
        lectureUrl.href = lecture.url;
        
        // 강의 ID 저장 (삭제 시 사용)
        lectureDetailSection.dataset.lectureId = lecture.id;
    }
}

// 강의 추가 버튼 클릭 이벤트
addLectureBtn.addEventListener('click', () => {
    showMainSection(addLectureSection);
    lectureForm.reset();
});

// 강의 취소 버튼 클릭 이벤트
lectureCancelBtn.addEventListener('click', () => {
    showMainSection(lecturesSection);
});

// 강의 폼 제출 이벤트
lectureForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('lecture-title').value;
    const description = document.getElementById('lecture-desc').value;
    const url = document.getElementById('lecture-url').value;
    
    // 새 강의 객체 생성
    const newLecture = {
        id: currentLectureId++,
        title: title,
        description: description,
        url: url,
        date: new Date().toLocaleDateString('ko-KR')
    };
    
    // 강의 추가 및 저장
    await saveLecture(newLecture);
    
    // 강의 목록 갱신 및 화면 전환
    displayLectures();
    updateHomeSection();
    showMainSection(lecturesSection);
});

// 강의 목록으로 돌아가기 버튼 클릭 이벤트
backToLecturesBtn.addEventListener('click', () => {
    showMainSection(lecturesSection);
});

// 강의 삭제 버튼 클릭 이벤트
deleteLectureBtn.addEventListener('click', async () => {
    const lectureId = parseInt(lectureDetailSection.dataset.lectureId);
    
    if (confirm('정말 이 강의를 삭제하시겠습니까?')) {
        // 강의 삭제
        await deleteLecture(lectureId);
        displayLectures();
        updateHomeSection();
        showMainSection(lecturesSection);
    }
});

// 새 글 작성 버튼 클릭 이벤트
newPostBtn.addEventListener('click', () => {
    showMainSection(writeSection);
    postForm.reset();
});

// 취소 버튼 클릭 이벤트
cancelBtn.addEventListener('click', () => {
    showMainSection(listSection);
});

// 폼 제출 이벤트 (게시글 작성)
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const content = document.getElementById('content').value;
    
    // 새 게시글 객체 생성
    const newPost = {
        id: currentPostId++,
        title: title,
        author: author,
        content: content,
        date: new Date().toLocaleDateString('ko-KR')
    };
    
    // 게시글 추가 및 저장
    await savePost(newPost);
    
    // 게시글 목록 갱신 및 화면 전환
    displayPosts();
    updateHomeSection();
    showMainSection(listSection);
});

// 목록으로 돌아가기 버튼 클릭 이벤트
backBtn.addEventListener('click', () => {
    showMainSection(listSection);
});

// 수정 버튼 클릭 이벤트
editBtn.addEventListener('click', () => {
    const postId = parseInt(viewSection.dataset.postId);
    const post = posts.find(p => p.id === postId);
    
    if (post) {
        document.getElementById('edit-id').value = post.id;
        document.getElementById('edit-title').value = post.title;
        document.getElementById('edit-author').value = post.author;
        document.getElementById('edit-content').value = post.content;
        
        showMainSection(editSection);
    }
});

// 수정 취소 버튼 클릭 이벤트
editCancelBtn.addEventListener('click', () => {
    showMainSection(viewSection);
});

// 수정 폼 제출 이벤트
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-id').value);
    const title = document.getElementById('edit-title').value;
    const author = document.getElementById('edit-author').value;
    const content = document.getElementById('edit-content').value;
    
    // 게시글 객체 생성
    const updatedPost = {
        id: id,
        title: title,
        author: author,
        content: content,
        date: (posts.find(p => p.id === id) || {}).date || new Date().toLocaleDateString('ko-KR')
    };
    
    // 게시글 저장
    await savePost(updatedPost);
    
    // 게시글 목록 갱신 및 화면 전환
    displayPosts();
    updateHomeSection();
    displayPostDetails(id);
    showMainSection(viewSection);
});

// 삭제 버튼 클릭 이벤트
deleteBtn.addEventListener('click', async () => {
    const postId = parseInt(viewSection.dataset.postId);
    
    if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
        // 게시글 삭제
        await deletePost(postId);
        displayPosts();
        updateHomeSection();
        showMainSection(listSection);
    }
});

// 게시글 목록 표시 함수
function displayPosts() {
    postsList.innerHTML = '';
    
    // 게시글을 최신순으로 정렬 (id 기준 역순)
    const sortedPosts = [...posts].sort((a, b) => b.id - a.id);
    
    if (sortedPosts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">게시글이 없습니다.</td>';
        postsList.appendChild(row);
    } else {
        sortedPosts.forEach(post => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${post.id}</td>
                <td><a href="#" class="post-title-link" data-id="${post.id}">${post.title}</a></td>
                <td>${post.author}</td>
                <td>${post.date}</td>
            `;
            postsList.appendChild(row);
        });
        
        // 게시글 제목 클릭 이벤트 추가
        document.querySelectorAll('.post-title-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = parseInt(link.dataset.id);
                displayPostDetails(postId);
                showMainSection(viewSection);
            });
        });
    }
}

// 게시글 상세 내용 표시 함수
function displayPostDetails(postId) {
    const post = posts.find(p => p.id === postId);
    
    if (post) {
        document.getElementById('view-title').textContent = post.title;
        document.getElementById('view-author').textContent = post.author;
        document.getElementById('view-date').textContent = post.date;
        document.getElementById('view-content').textContent = post.content;
        
        // 게시글 ID 저장 (수정/삭제 시 사용)
        viewSection.dataset.postId = post.id;
    }
}

// 메인 섹션 전환 함수
function showMainSection(section) {
    // 모든 섹션 숨기기
    homeSection.classList.add('hidden');
    lecturesSection.classList.add('hidden');
    listSection.classList.add('hidden');
    writeSection.classList.add('hidden');
    viewSection.classList.add('hidden');
    editSection.classList.add('hidden');
    addLectureSection.classList.add('hidden');
    lectureDetailSection.classList.add('hidden');
    
    // 선택한 섹션만 표시
    section.classList.remove('hidden');
    
    // 활성 네비게이션 링크 표시
    updateActiveNav(section.id);
}

// 활성 네비게이션 표시 함수
function updateActiveNav(sectionId) {
    navLinks.forEach(link => {
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// 로딩 표시 함수
function showLoading() {
    isLoading = true;
    loadingIndicator.classList.add('show');
}

// 로딩 숨김 함수
function hideLoading() {
    isLoading = false;
    loadingIndicator.classList.remove('show');
}

// 메시지 표시 함수
function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message-toast ${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // 애니메이션 효과를 위해 약간의 지연 후 클래스 추가
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 10);
    
    // 3초 후 메시지 삭제
    setTimeout(() => {
        messageEl.classList.remove('show');
        
        // 애니메이션 완료 후 요소 제거
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 3000);
} 
