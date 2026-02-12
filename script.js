/* =========================================
   [1] 초기화 및 데이터 (사용자 원본 데이터 유지)
   ========================================= */
try {
    Kakao.init('6516527c220b1e6dd951d65fb477c9be');
    console.log("✅ 카카오 초기화 성공!");
} catch (e) {
    console.log("⚠️ 카카오 초기화 실패", e);
}

let currentLanguage = 'ko';

const SYMBOLS = {
    "양자리": "♈", "황소자리": "♉", "쌍둥이자리": "♊", "게자리": "♋",
    "사자자리": "♌", "처녀자리": "♍", "천칭자리": "♎", "전갈자리": "♏",
    "사수자리": "♐", "염소자리": "♑", "물병자리": "♒", "물고기자리": "♓",
    "태양": "☉", "달": "☽", "수성": "☿", "금성": "♀", "화성": "♂",
    "목성": "♃", "토성": "♄", "천왕성": "♅", "해왕성": "♆", "명왕성": "♇"
};

const ZODIAC_INFO = {
    "Aries": { ko: "개척자", en: "The Pioneer", icon: "🔥", desc: "새로운 시작과 열정" },
    "Taurus": { ko: "수호자", en: "The Steward", icon: "🌿", desc: "안정과 끈기" },
    "Gemini": { ko: "지식인", en: "The Communicator", icon: "🌬️", desc: "호기심과 정보" },
    "Cancer": { ko: "치유자", en: "The Nurturer", icon: "🌊", desc: "감성과 보호" },
    "Leo": { ko: "주인공", en: "The Royal", icon: "👑", desc: "자신감과 창조" },
    "Virgo": { ko: "분석가", en: "The Analyst", icon: "🌾", desc: "디테일과 완벽" },
    "Libra": { ko: "중재자", en: "The Diplomat", icon: "⚖️", desc: "조화와 균형" },
    "Scorpio": { ko: "전략가", en: "The Alchemist", icon: "🦂", desc: "통찰과 변화" },
    "Sagittarius": { ko: "모험가", en: "The Explorer", icon: "🏹", desc: "자유와 철학" },
    "Capricorn": { ko: "경영자", en: "The Achiever", icon: "🐐", desc: "책임과 야망" },
    "Aquarius": { ko: "혁명가", en: "The Innovator", icon: "🏺", desc: "독창성과 미래" },
    "Pisces": { ko: "몽상가", en: "The Dreamer", icon: "🐟", desc: "공감과 예술" }
};

const ZODIAC_MAPPING = {
    "ARI": "Aries", "TAU": "Taurus", "GEM": "Gemini", "CAN": "Cancer",
    "LEO": "Leo", "VIR": "Virgo", "LIB": "Libra", "SCO": "Scorpio",
    "SAG": "Sagittarius", "CAP": "Capricorn", "AQU": "Aquarius", "PIS": "Pisces"
};

const WORLD_DB = {
    "South Korea": [
        "Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Sejong", "Suwon", "Seongnam", "Uijeongbu", "Anyang", "Bucheon", "Gwangmyeong", "Pyeongtaek", "Dongducheon", "Ansan", "Goyang", "Gwacheon", "Guri", "Namyangju", "Osan", "Siheung", "Gunpo", "Uiwang", "Hanam", "Yongin", "Paju", "Icheon", "Anseong", "Gimpo", "Hwaseong", "Gwangju (Gyeonggi)", "Yangju", "Pocheon", "Yeoju", "Yeoncheon", "Gapyeong", "Yangpyeong", "Chuncheon", "Wonju", "Gangneung", "Donghae", "Taebaek", "Sokcho", "Samcheok", "Hongcheon", "Hoengseong", "Yeongwol", "Pyeongchang", "Jeongseon", "Cheorwon", "Hwacheon", "Yanggu", "Inje", "Goseong (Gangwon)", "Yangyang", "Cheongju", "Chungju", "Jecheon", "Boeun", "Okcheon", "Yeongdong", "Jeungpyeong", "Jincheon", "Goesan", "Eumseong", "Danyang", "Cheonan", "Gongju", "Boryeong", "Asan", "Seosan", "Nonsan", "Gyeryong", "Dangjin", "Geumsan", "Buyeo", "Seocheon", "Cheongyang", "Hongseong", "Yesan", "Taean", "Jeonju", "Gunsan", "Iksan", "Jeongeup", "Namwon", "Gimje", "Wanju", "Jinan", "Muju", "Jangsu", "Imsil", "Sunchang", "Gochang", "Buan", "Mokpo", "Yeosu", "Suncheon", "Naju", "Gwangyang", "Damyang", "Gokseong", "Gurye", "Goheung", "Boseong", "Hwasun", "Jangheung", "Gangjin", "Haenam", "Yeongam", "Muan", "Hampyeong", "Yeonggwang", "Jangseong", "Wando", "Jindo", "Sinan", "Pohang", "Gyeongju", "Gimcheon", "Andong", "Gumi", "Yeongju", "Yeongcheon", "Sangju", "Mungyeong", "Gyeongsan", "Gunwi", "Uiseong", "Cheongsong", "Yeongyang", "Yeongdeok", "Cheongdo", "Goryeong", "Seongju", "Chilgok", "Yecheon", "Bonghwa", "Uljin", "Ulleung", "Changwon", "Jinju", "Tongyeong", "Sacheon", "Gimhae", "Miryang", "Geoje", "Yangsan", "Uiryeong", "Haman", "Changnyeong", "Goseong (Gyeongnam)", "Namhae", "Hadong", "Sancheong", "Hamyang", "Geochang", "Hapcheon", "Jeju City", "Seogwipo"
    ],
    "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "San Francisco", "Charlotte", "Indianapolis", "Seattle", "Denver", "Washington", "Boston", "El Paso", "Nashville", "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Mesa", "Sacramento", "Atlanta", "Kansas City", "Colorado Springs", "Miami", "Raleigh", "Omaha", "Long Beach", "Virginia Beach", "Oakland", "Minneapolis", "Tulsa", "Arlington", "Tampa", "New Orleans", "Honolulu"],
    "Japan": ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Kobe", "Kyoto", "Fukuoka", "Kawasaki", "Saitama", "Hiroshima", "Sendai", "Kitakyushu", "Chiba", "Sakai", "Niigata", "Hamamatsu", "Kumamoto", "Sagamihara", "Shizuoka", "Okinawa"],
    "China": ["Beijing", "Shanghai", "Chongqing", "Tianjin", "Guangzhou", "Shenzhen", "Chengdu", "Nanjing", "Wuhan", "Hangzhou", "Xi'an", "Shenyang", "Harbin", "Jinan", "Qingdao", "Dalian", "Zhengzhou", "Xiamen", "Kunming", "Changsha"],
    "United Kingdom": ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Edinburgh", "Bristol", "Cardiff", "Belfast"],
    "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"],
    "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig"],
    "Italy": ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Venice"],
    "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Bilbao"],
    "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
    "Switzerland": ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"],
    "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Vladivostok"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Hobart"],
    "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City"],
    "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur"],
    "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang", "Haiphong", "Can Tho"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Hat Yai"],
    "Philippines": ["Manila", "Quezon City", "Davao City", "Cebu City", "Zamboanga City"],
    "Singapore": ["Singapore"],
    "Taiwan": ["Taipei", "Kaohsiung", "Taichung", "Tainan"],
    "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan", "Bali (Denpasar)"],
    "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
    "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina"],
    "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"],
    "Egypt": ["Cairo", "Alexandria", "Giza"],
    "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
    "Brazil": ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador", "Fortaleza"],
    "Argentina": ["Buenos Aires", "Cordoba", "Rosario", "Mendoza"],
    "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Cancun"]
};

// [중요] 번역 데이터 (이게 없어서 아까 영어가 떴던 겁니다)
const translations = {
    'ko': {
        subtitle: "AI가 분석하는 당신의 운명 데이터",
        lblName: "이름",
        lblBirth: "생년월일 / 시간",
        lblPlace: "태어난 장소 (국가 / 도시)",
        lblConcern: "고민 내용",
        placeholderName: "이름을 입력해 주세요.",
        placeholderHour: "시",
        placeholderMinute: "분",
        placeholderConcern: "요즘 가장 큰 고민이 무엇인가요?",
        btnSubmit: "분석 시작하기 🚀",
        spinner: "💫 별들의 신호를 수신 중...",
        kakaoBtn: "카카오톡으로 친구에게 자랑하기",
        linkAbout: "서비스 소개",
        linkPrivacy: "개인정보처리방침"
    },
    'en': {
        subtitle: "AI-Powered Destiny Analysis",
        lblName: "Name",
        lblBirth: "Birth Date / Time",
        lblPlace: "Birthplace (Country / City)",
        lblConcern: "Your Concern",
        placeholderName: "Type your name.",
        placeholderHour: "Hour",
        placeholderMinute: "Minute",
        placeholderConcern: "What is your main concern?",
        btnSubmit: "Start Analysis 🚀",
        spinner: "💫 Reading the stars...",
        kakaoBtn: "Share with Friends",
        linkAbout: "About Us",
        linkPrivacy: "Privacy Policy"
    }
};

/* =========================================
   [2] 페이지 로드 시 초기화 (window.onload)
   ========================================= */
window.onload = function () {
    // 1. Air Datepicker 초기화 (사용자님 원래 달력)
    new AirDatepicker('#birthdate', {
        locale: {
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            today: 'Today',
            clear: 'Clear',
            dateFormat: 'yyyy-MM-dd',
            timeFormat: 'hh:mm aa',
            firstDay: 0
        },
        autoClose: true,
        dateFormat: 'yyyy-MM-dd',
        isMobile: false
    });

    populateTimeLists();

    // 2. 국가 목록 생성
    const countryList = document.getElementById('countryList');
    Object.keys(WORLD_DB).forEach(country => {
        const li = document.createElement('li');
        li.textContent = country;
        li.onclick = function () {
            selectOption('country', country, 'countryList');
            updateCities(country);
        };
        countryList.appendChild(li);
    });

    // 3. 기본값 설정 (국가/도시)
    selectOption('country', 'South Korea', 'countryList');
    updateCities('South Korea');
    selectOption('city', 'Seoul', 'cityList');

    // 4. 드롭다운 닫기 이벤트
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.dropdown-wrapper')) {
            closeAllDropdowns();
        }
    });

    // 5. 배경 효과
    createStars();
    setInterval(createShootingStar, 3500);

    // 6. [중요] 언어 버튼 이벤트 연결 (버튼이 안 눌리는 문제 해결)
    const btnKo = document.getElementById('btn-ko');
    const btnEn = document.getElementById('btn-en');

    if (btnKo) btnKo.addEventListener('click', () => setLanguage('ko'));
    if (btnEn) btnEn.addEventListener('click', () => setLanguage('en'));

    // 7. [중요] 초기 언어 설정 (한글로 시작)
    setLanguage('ko');
};

/* =========================================
   [3] 다국어(언어) 설정 함수 (setLanguage)
   이 함수가 없어서 버튼이 작동하지 않았습니다.
   ========================================= */
function setLanguage(lang) {
    currentLanguage = lang;

    // 버튼 스타일 토글
    const btnKo = document.getElementById('btn-ko');
    const btnEn = document.getElementById('btn-en');
    if (btnKo) btnKo.classList.toggle('active', lang === 'ko');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');

    // 텍스트 교체
    const t = translations[lang];
    if (!t) return; // 안전장치

    // 각 요소가 존재하는지 확인하고 텍스트 변경
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setText('txt-subtitle', t.subtitle);
    setText('lbl-name', t.lblName);
    setText('lbl-birth', t.lblBirth);
    setText('lbl-place', t.lblPlace);
    setText('lbl-concern', t.lblConcern);
    setText('btnSubmit', t.btnSubmit);
    setText('btn-kakao-txt', t.kakaoBtn);
    setText('link-about', t.linkAbout);
    setText('link-privacy', t.linkPrivacy);

    // 플레이스홀더 교체
    const setPlaceholder = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = text;
    };

    setPlaceholder('name', t.placeholderName);
    setPlaceholder('hour', t.placeholderHour);
    setPlaceholder('minute', t.placeholderMinute);
    setPlaceholder('concern', t.placeholderConcern);
}

// ... (아래는 사용자님의 헬퍼 함수들 - 수정 없음) ...
function populateTimeLists() {
    const hourList = document.getElementById('hourList');
    for (let i = 0; i < 24; i++) {
        const li = document.createElement('li');
        li.textContent = i;
        li.onclick = function () { selectOption('hour', i, 'hourList'); };
        hourList.appendChild(li);
    }
    const minuteList = document.getElementById('minuteList');
    const minutes = [0, 15, 30, 45];
    minutes.forEach(min => {
        const li = document.createElement('li');
        li.textContent = (min === 0 ? "00" : min);
        li.onclick = function () { selectOption('minute', (min === 0 ? "00" : min), 'minuteList'); };
        minuteList.appendChild(li);
    });
}

function autoFormatDate(input) {
    let value = input.value.replace(/\D/g, '');
    let formattedValue = '';
    if (value.length > 4) {
        formattedValue = value.substring(0, 4) + '-' + value.substring(4, 6);
        if (value.length > 6) {
            formattedValue += '-' + value.substring(6, 8);
        }
    } else {
        formattedValue = value;
    }
    input.value = formattedValue;
}

function closeAllDropdowns(exceptId) {
    const allDropdowns = document.querySelectorAll('.dropdown-list');
    allDropdowns.forEach(list => {
        if (list.id !== exceptId) list.style.display = 'none';
    });
}

function filterList(inputId, listId) {
    closeAllDropdowns(listId);
    const input = document.getElementById(inputId);
    const filter = input.value.toUpperCase();
    const list = document.getElementById(listId);
    const items = list.getElementsByTagName('li');
    list.style.display = 'block';
    for (let i = 0; i < items.length; i++) {
        const txtValue = items[i].textContent || items[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) items[i].style.display = "";
        else items[i].style.display = "none";
    }
}

function showList(listId) {
    closeAllDropdowns(listId);
    const list = document.getElementById(listId);
    const items = list.getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) { items[i].style.display = ""; }
    list.style.display = 'block';
}

function selectOption(inputId, value, listId) {
    document.getElementById(inputId).value = value;
    document.getElementById(listId).style.display = 'none';
}

function updateCities(country) {
    const cityList = document.getElementById('cityList');
    const cityInput = document.getElementById('city');
    cityList.innerHTML = "";
    cityInput.value = "";
    if (WORLD_DB[country]) {
        WORLD_DB[country].forEach(city => {
            const li = document.createElement('li');
            li.textContent = city;
            li.onclick = function () { selectOption('city', city, 'cityList'); };
            cityList.appendChild(li);
        });
    }
}

function createStars() {
    const starContainer = document.querySelector('.stars');
    if (!starContainer) return;
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
        starContainer.appendChild(star);
    }
}

function createShootingStar() {
    const starContainer = document.querySelector('.stars');
    if (!starContainer) return;
    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting_star';
    shootingStar.style.top = (Math.random() * 50) + '%';
    shootingStar.style.left = (Math.random() * 100) + '%';
    shootingStar.style.setProperty('--angle', (Math.random() * 30 + 30) + 'deg');
    starContainer.appendChild(shootingStar);
    setTimeout(() => { shootingStar.remove(); }, 4000);
}

function saveResultImage() {
    const chartContainer = document.querySelector('.nebula-chart-container');
    const aiResponse = document.getElementById('aiResponse');
    if (!chartContainer) { alert("아직 분석 결과가 없습니다!"); return; }

    const userName = document.getElementById('name').value || "Guest";
    let userConcern = document.getElementById('concern').value || "Destiny";
    if (userConcern.length > 8) userConcern = userConcern.substring(0, 8) + "...";

    // 🌟 [핵심 로직] "테마"와 "점수" 핀셋 추출
    let themeText = "2026년, 당신의 우주가 펼쳐집니다."; // 기본값
    let scoreText = ""; // 점수가 없으면 표시 안 함

    if (aiResponse) {
        const lines = aiResponse.innerText.split('\n');

        for (let line of lines) {
            let cleanLine = line.trim();

            // 1. "테마" 찾기 (예: ✨ 당신의 테마: "내면의 전문성을...")
            if (cleanLine.includes("테마")) {
                // 콜론(:) 뒤의 내용만 가져오기
                let parts = cleanLine.split(/[:：]/);
                if (parts.length > 1) {
                    themeText = parts[1].trim().replace(/^"/, '').replace(/"$/, ''); // 따옴표 제거
                } else {
                    themeText = cleanLine;
                }
            }

            // 2. "종합 운기" 또는 "점수" 찾기 (예: 🍀 종합 운기: 92점)
            if (cleanLine.includes("종합 운기") || cleanLine.includes("총점") || (cleanLine.includes("점수") && cleanLine.includes("점"))) {
                scoreText = cleanLine.replace(/^[✨🍀⭐️\s]+/, ''); // 앞의 이모지 제거
            }
        }
    }

    // 가상 포스터 생성
    const captureDiv = document.createElement('div');
    captureDiv.className = 'share-card poster-style';
    document.body.appendChild(captureDiv);

    // 헤더
    const header = document.createElement('div');
    header.innerHTML = `
        <div class="poster-header">
            <div class="poster-subtitle">STAR SYNC ANALYSIS</div>
            <h1 class="poster-title">${userName}님의 우주</h1>
            <div class="poster-tags">
                <span class="tag-badge">#2026년</span>
                <span class="tag-badge">#${userConcern}</span>
            </div>
        </div>
    `;
    captureDiv.appendChild(header);

    // 차트 복사
    const chartClone = chartContainer.cloneNode(true);
    captureDiv.appendChild(chartClone);

    // 🌟 [수정] 하단 메시지 박스 (테마 + 점수)
    // 점수(scoreText)가 있으면 보여주고, 없으면 테마만 보여줌
    let scoreHtml = scoreText ? `<div class="message-score">${scoreText}</div>` : "";

    const messageBox = document.createElement('div');
    messageBox.className = 'poster-message-box';
    messageBox.innerHTML = `
        <div class="message-label">MY THEME & SCORE</div>
        <div class="message-text">"${themeText}"</div>
        ${scoreHtml}
        <div class="poster-footer">Analyzed by Star Sync</div>
    `;
    captureDiv.appendChild(messageBox);

    // 캡처
    html2canvas(captureDiv, {
        backgroundColor: "#151520",
        scale: 2, useCORS: true, logging: false,
        width: 600, height: 850,
        windowWidth: 600, windowHeight: 850
    }).then(canvas => {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `${userName}_StarSync_Poster.png`;
        link.click();
        document.body.removeChild(captureDiv);
    }).catch(err => {
        console.error("캡처 에러:", err);
        alert("저장 중 오류가 발생했습니다.");
        document.body.removeChild(captureDiv);
    });
}

function updatePlanetCard(elementId, signNameRaw) {
    if (!signNameRaw) return;
    const shortCode = signNameRaw.substring(0, 3).toUpperCase();
    let fullName = ZODIAC_MAPPING[shortCode];
    if (!fullName) fullName = signNameRaw.split(' ')[0];
    const info = ZODIAC_INFO[fullName] || { ko: "미지", en: "Unknown", icon: "✨", desc: "신비로운 별" };
    const label = currentLanguage === 'ko' ? info.ko : info.en;
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `<div class="zodiac-result-box"><span class="z-icon">${info.icon}</span><div class="z-text-group"><span class="z-name">${shortCode}</span> <span class="z-desc">${label}</span></div></div>`;
    }
}

function shareKakao() {
    try {
        if (!Kakao.isInitialized()) { alert("카카오톡 공유 기능을 사용할 수 없습니다."); return; }
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: 'Star Sync ✨',
                description: 'Check out my 2026 fortune analysis by AI!',
                imageUrl: 'https://cdn-icons-png.flaticon.com/512/2647/2647287.png',
                link: { mobileWebUrl: window.location.href, webUrl: window.location.href },
            },
            buttons: [{ title: 'Check mine', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } }],
        });
    } catch (e) { alert("Share Error: " + e); }
}

/* =========================================
   [4] 메인 분석 함수 (analyze) - 차트 기능 포함
   ========================================= */
async function analyze() {
    const btn = document.getElementById('btnSubmit');
    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');
    const aiResponse = document.getElementById('aiResponse');
    const coupangNotice = document.getElementById('coupangNotice');

    const dateVal = document.getElementById('birthdate').value;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!document.getElementById('name').value || !document.getElementById('concern').value || !dateVal) {
        alert(currentLanguage === 'ko' ? "모든 항목을 입력해주세요!" : "Please fill in all fields!");
        return;
    }
    if (!datePattern.test(dateVal)) {
        alert(currentLanguage === 'ko' ? "날짜를 YYYY-MM-DD 형식으로 입력해주세요." : "Please enter the date in YYYY-MM-DD format.");
        return;
    }

    btn.disabled = true;
    btn.innerText = currentLanguage === 'ko' ? "분석 중... 🚀" : "Analyzing... 🚀";
    loadingArea.style.display = "block";
    resultArea.style.display = "none";
    coupangNotice.style.display = "none";

    const [y, m, d] = dateVal.split('-').map(Number);
    const requestData = {
        name: document.getElementById('name').value,
        year: y, month: m, day: d,
        hour: parseInt(document.getElementById('hour').value),
        minute: parseInt(document.getElementById('minute').value),
        country: document.getElementById('country').value || "South Korea",
        city: document.getElementById('city').value || "Seoul",
        concern: document.getElementById('concern').value,
        lang: currentLanguage
    };

    try {
        const response = await fetch("https://star-sync.onrender.com/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (response.ok) {
            let rawText = data.ai_message;

            if (data.chart_data) {
                const zodiacMap = { "ARI": "Aries", "TAU": "Taurus", "GEM": "Gemini", "CAN": "Cancer", "LEO": "Leo", "VIR": "Virgo", "LIB": "Libra", "SCO": "Scorpio", "SAG": "Sagittarius", "CAP": "Capricorn", "AQU": "Aquarius", "PIS": "Pisces" };
                ['sun', 'moon', 'rising'].forEach(type => {
                    if (data.chart_data[type]) {
                        const raw = data.chart_data[type].trim().substring(0, 3).toUpperCase();
                        const fullName = zodiacMap[raw] || "Aries";
                        updatePlanetCard(`res-${type}`, fullName, raw);
                    }
                });
            }

            let formattedHtml = rawText;
            formattedHtml = formattedHtml.replace(/### (.*)/g, '<h3 class="result-header">$1</h3>');
            formattedHtml = formattedHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="gold-text">$1</strong>');
            formattedHtml = formattedHtml.replace(/\n*\s*---\s*\n*/g, '<hr class="custom-divider">');
            formattedHtml = formattedHtml.replace(/^\* (.*)/gm, '<div class="star-list-item">$1</div>');
            formattedHtml = formattedHtml.replace(/\n/g, '<br>');
            formattedHtml = formattedHtml.replace(/\[\[(.*?)\]\]/g, (match, itemName) => {
                const cleanName = itemName.trim();
                const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(cleanName)}&channel=user`;
                return `<a href="${searchUrl}" target="_blank" class="lucky-badge">🎁 ${cleanName}</a>`;
            });

            if (formattedHtml.includes("핵심 배치")) {
                const visualHTML = renderStelliumVisualizer(rawText, data.chart_data);
                formattedHtml = formattedHtml.replace(/.*핵심 배치.*/, (match) => {
                    return `${visualHTML}<br>${match}`;
                });
            }

            aiResponse.innerHTML = formattedHtml;

            if (rawText.includes('[[')) coupangNotice.style.display = "block";
            else coupangNotice.style.display = "none";

            loadingArea.style.display = "none";
            resultArea.style.display = "block";
            if (document.getElementById('btnSaveImg')) {
                document.getElementById('btnSaveImg').style.display = 'flex';
            }
        } else {
            alert("Error: " + data.detail);
            loadingArea.style.display = "none";
        }
    } catch (error) {
        alert(currentLanguage === 'ko' ? "서버 오류! 나중에 다시 시도해주세요." : "Server Error! Please try again later.");
        console.error(error);
        loadingArea.style.display = "none";
    } finally {
        btn.disabled = false;
        btn.innerText = currentLanguage === 'ko' ? "분석 시작하기 🚀" : "Start Analysis 🚀";
    }
}

/* =========================================
   [5] 리얼 천궁도 시각화 엔진 (Real Chart)
   ========================================= */
function renderStelliumVisualizer(text, chartData) {
    const zodiacs = [
        { name: "양자리", sym: "♈", en: "Aries", code: "ARI" }, { name: "황소자리", sym: "♉", en: "Taurus", code: "TAU" },
        { name: "쌍둥이자리", sym: "♊", en: "Gemini", code: "GEM" }, { name: "게자리", sym: "♋", en: "Cancer", code: "CAN" },
        { name: "사자자리", sym: "♌", en: "Leo", code: "LEO" }, { name: "처녀자리", sym: "♍", en: "Virgo", code: "VIR" },
        { name: "천칭자리", sym: "♎", en: "Libra", code: "LIB" }, { name: "전갈자리", sym: "♏", en: "Scorpio", code: "SCO" },
        { name: "사수자리", sym: "♐", en: "Sagittarius", code: "SAG" }, { name: "염소자리", sym: "♑", en: "Capricorn", code: "CAP" },
        { name: "물병자리", sym: "♒", en: "Aquarius", code: "AQU" }, { name: "물고기자리", sym: "♓", en: "Pisces", code: "PIS" }
    ];

    let slotsData = [];
    // 1. 데이터 초기화
    zodiacs.forEach(z => {
        slotsData.push({ ...z, planets: [], houses: [], active: false, isLong: false });
    });

    const planetKeywords = [
        { ko: "태양", en: "Sun" }, { ko: "달", en: "Moon" }, { ko: "수성", en: "Mercury" },
        { ko: "금성", en: "Venus" }, { ko: "화성", en: "Mars" }, { ko: "목성", en: "Jupiter" },
        { ko: "토성", en: "Saturn" }, { ko: "천왕성", en: "Uranus" }, { ko: "해왕성", en: "Neptune" },
        { ko: "명왕성", en: "Pluto" }
    ];

    // (1) 서버 데이터 매핑
    if (chartData) {
        const pMap = { "sun": "태양", "moon": "달", "mercury": "수성", "venus": "금성", "mars": "화성", "jupiter": "목성", "saturn": "토성", "uranus": "천왕성", "neptune": "해왕성", "pluto": "명왕성" };
        Object.keys(pMap).forEach(key => {
            if (chartData[key]) {
                const code = chartData[key].substring(0, 3).toUpperCase();
                const idx = slotsData.findIndex(s => s.code === code);
                if (idx !== -1) {
                    slotsData[idx].active = true;
                    if (!slotsData[idx].planets.includes(pMap[key])) slotsData[idx].planets.push(pMap[key]);
                }
            }
        });
        if (chartData["rising"]) {
            const code = chartData["rising"].substring(0, 3).toUpperCase();
            const idx = slotsData.findIndex(s => s.code === code);
            if (idx !== -1) {
                slotsData[idx].active = true;
                slotsData[idx].houses.push("ASC");
            }
        }
    }

    // (2) 텍스트 분석 매핑
    if (text) {
        const lines = text.split('\n');
        let targetLine = lines.find(line => line.includes("핵심 배치"));
        if (targetLine) {
            slotsData.forEach((slot, idx) => {
                if (targetLine.includes(slot.name)) {
                    const textIdx = targetLine.indexOf(slot.name);
                    const snippet = targetLine.substring(Math.max(0, textIdx - 20), Math.min(targetLine.length, textIdx + 30));

                    const hMatch = snippet.match(/(\d+)[하H]/);
                    if (hMatch) {
                        slotsData[idx].active = true;
                        if (!slotsData[idx].houses.some(h => h.includes("HOUSE"))) {
                            slotsData[idx].houses.unshift(`${hMatch[1]} HOUSE`);
                        }
                    }
                    planetKeywords.forEach(p => {
                        if (snippet.includes(p.ko) || snippet.toLowerCase().includes(p.en.toLowerCase())) {
                            slotsData[idx].active = true;
                            if (!slotsData[idx].planets.includes(p.ko)) slotsData[idx].planets.push(p.ko);
                        }
                    });
                }
            });
        }
    }

    // 🌟 [핵심] 충돌 방지 로직 (지그재그 배치)
    // 이전 별자리가 활성화되어 있다면, 현재 별자리는 멀리(Long) 보냅니다.
    for (let i = 0; i < 12; i++) {
        if (slotsData[i].active) {
            // 바로 앞의 인덱스 (0번이면 11번 확인)
            const prevIdx = (i === 0) ? 11 : i - 1;

            // 앞집이 활성화되어 있고, 앞집이 '가까운 거리(Short)'라면 -> 나는 '먼 거리(Long)'로 간다
            if (slotsData[prevIdx].active && !slotsData[prevIdx].isLong) {
                slotsData[i].isLong = true;
            }
        }
    }

    // (3) HTML 생성
    let chartInnerHtml = "";
    let hasActiveData = false;

    slotsData.forEach((data, index) => {
        let activeClass = "";
        let connectionLine = "";
        let expandedPanel = "";

        if (data.active) {
            hasActiveData = true;
            activeClass = "active-nebula";

            // 🌟 거리 조절 클래스 추가
            const distClass = data.isLong ? "dist-long" : "dist-short";

            let tagsHtml = "";
            data.houses.forEach(h => {
                if (h === "ASC") tagsHtml += `<span class="panel-house asc-house">RISING Sign</span>`;
                else tagsHtml += `<span class="panel-house">${h}</span>`;
            });

            let planetsHtml = "";
            data.planets.forEach(pName => {
                if (SYMBOLS[pName]) planetsHtml += `<div class="panel-p-item">${SYMBOLS[pName]} <span>${pName}</span></div>`;
            });

            if (planetsHtml === "" && !data.houses.includes("ASC")) {
                planetsHtml = `<div class="panel-p-item" style="color:#aaa; font-size:0.75rem;">Placement Info</div>`;
            }

            // 연결선과 패널에 distClass 적용
            connectionLine = `<div class="radial-line ${distClass}"></div>`;
            expandedPanel = `
                <div class="expanded-data-panel ${distClass}">
                    <div class="panel-content">
                        <div class="panel-header">
                            <div class="panel-tags">${tagsHtml}</div>
                            <span class="panel-z-name">${data.name}</span>
                        </div>
                        <div class="panel-planets-list">${planetsHtml}</div>
                    </div>
                </div>
            `;
        }

        chartInnerHtml += `
            <div class="chart-sector sector-${index} ${activeClass}" data-zodiac="${data.en}">
                <div class="inner-glow-symbol">${data.sym}</div>
                ${connectionLine}
                ${expandedPanel}
            </div>
        `;
    });

    if (!hasActiveData) return "";

    return `
        <div class="nebula-chart-container">
            <div class="cosmic-bg"></div><div class="orbit-rings"></div>
            <div class="chart-sectors-wrapper">${chartInnerHtml}</div>
            <div class="center-core"><span>KEY</span><br>CHART</div>
        </div>
    `;
}