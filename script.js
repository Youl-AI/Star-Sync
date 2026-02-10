try {
    Kakao.init('6516527c220b1e6dd951d65fb477c9be');
    console.log("✅ 카카오 초기화 성공!");
} catch (e) {
    console.log("⚠️ 카카오 초기화 실패", e);
}

let currentLanguage = 'ko';

// 🌏 데이터베이스
const WORLD_DB = {
    // 🇰🇷 대한민국 (모든 시/군 포함)
    "South Korea": [
        "Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Sejong",
        "Suwon", "Seongnam", "Uijeongbu", "Anyang", "Bucheon", "Gwangmyeong", "Pyeongtaek",
        "Dongducheon", "Ansan", "Goyang", "Gwacheon", "Guri", "Namyangju", "Osan",
        "Siheung", "Gunpo", "Uiwang", "Hanam", "Yongin", "Paju", "Icheon",
        "Anseong", "Gimpo", "Hwaseong", "Gwangju (Gyeonggi)", "Yangju", "Pocheon", "Yeoju",
        "Yeoncheon", "Gapyeong", "Yangpyeong",
        "Chuncheon", "Wonju", "Gangneung", "Donghae", "Taebaek", "Sokcho", "Samcheok",
        "Hongcheon", "Hoengseong", "Yeongwol", "Pyeongchang", "Jeongseon", "Cheorwon",
        "Hwacheon", "Yanggu", "Inje", "Goseong (Gangwon)", "Yangyang",
        "Cheongju", "Chungju", "Jecheon", "Boeun", "Okcheon", "Yeongdong",
        "Jeungpyeong", "Jincheon", "Goesan", "Eumseong", "Danyang",
        "Cheonan", "Gongju", "Boryeong", "Asan", "Seosan", "Nonsan", "Gyeryong", "Dangjin",
        "Geumsan", "Buyeo", "Seocheon", "Cheongyang", "Hongseong", "Yesan", "Taean",
        "Jeonju", "Gunsan", "Iksan", "Jeongeup", "Namwon", "Gimje", "Wanju", "Jinan",
        "Muju", "Jangsu", "Imsil", "Sunchang", "Gochang", "Buan",
        "Mokpo", "Yeosu", "Suncheon", "Naju", "Gwangyang", "Damyang", "Gokseong",
        "Gurye", "Goheung", "Boseong", "Hwasun", "Jangheung", "Gangjin", "Haenam",
        "Yeongam", "Muan", "Hampyeong", "Yeonggwang", "Jangseong", "Wando", "Jindo", "Sinan",
        "Pohang", "Gyeongju", "Gimcheon", "Andong", "Gumi", "Yeongju", "Yeongcheon",
        "Sangju", "Mungyeong", "Gyeongsan", "Gunwi", "Uiseong", "Cheongsong", "Yeongyang",
        "Yeongdeok", "Cheongdo", "Goryeong", "Seongju", "Chilgok", "Yecheon", "Bonghwa",
        "Uljin", "Ulleung",
        "Changwon", "Jinju", "Tongyeong", "Sacheon", "Gimhae", "Miryang", "Geoje", "Yangsan",
        "Uiryeong", "Haman", "Changnyeong", "Goseong (Gyeongnam)", "Namhae", "Hadong",
        "Sancheong", "Hamyang", "Geochang", "Hapcheon",
        "Jeju City", "Seogwipo"
    ],

    // 🇺🇸 미국
    "United States": [
        "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "San Francisco", "Charlotte", "Indianapolis", "Seattle", "Denver", "Washington", "Boston", "El Paso", "Nashville", "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Mesa", "Sacramento", "Atlanta", "Kansas City", "Colorado Springs", "Miami", "Raleigh", "Omaha", "Long Beach", "Virginia Beach", "Oakland", "Minneapolis", "Tulsa", "Arlington", "Tampa", "New Orleans", "Honolulu"
    ],

    // 🇯🇵 일본
    "Japan": [
        "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Kobe", "Kyoto", "Fukuoka", "Kawasaki", "Saitama", "Hiroshima", "Sendai", "Kitakyushu", "Chiba", "Sakai", "Niigata", "Hamamatsu", "Kumamoto", "Sagamihara", "Shizuoka", "Okinawa"
    ],

    // 🇨🇳 중국
    "China": [
        "Beijing", "Shanghai", "Chongqing", "Tianjin", "Guangzhou", "Shenzhen", "Chengdu", "Nanjing", "Wuhan", "Hangzhou", "Xi'an", "Shenyang", "Harbin", "Jinan", "Qingdao", "Dalian", "Zhengzhou", "Xiamen", "Kunming", "Changsha"
    ],

    // 🇪🇺 유럽
    "United Kingdom": ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Edinburgh", "Bristol", "Cardiff", "Belfast"],
    "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"],
    "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig"],
    "Italy": ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Bari", "Venice"],
    "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Palma", "Bilbao"],
    "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
    "Switzerland": ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"],
    "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Vladivostok"],

    // 아시아/태평양
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Hobart"],
    "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City"],
    "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur"],
    "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang", "Haiphong", "Can Tho"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Hat Yai"],
    "Philippines": ["Manila", "Quezon City", "Davao City", "Cebu City", "Zamboanga City"],
    "Singapore": ["Singapore"],
    "Taiwan": ["Taipei", "Kaohsiung", "Taichung", "Tainan"],
    "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan", "Bali (Denpasar)"],

    // 중동/아프리카
    "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
    "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina"],
    "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"],
    "Egypt": ["Cairo", "Alexandria", "Giza"],
    "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],

    // 남미
    "Brazil": ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador", "Fortaleza"],
    "Argentina": ["Buenos Aires", "Cordoba", "Rosario", "Mendoza"],
    "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Cancun"]
};

// 페이지 로드 시 실행
window.onload = function () {
    // 1. Air Datepicker 초기화
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


    // 국가 목록 생성
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

    // 기본값 설정 (국가/도시)
    selectOption('country', 'South Korea', 'countryList');
    updateCities('South Korea');
    selectOption('city', 'Seoul', 'cityList');

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.dropdown-wrapper')) {
            closeAllDropdowns();
        }
    });
    createStars();

    setInterval(createShootingStar, 3500);

    setLanguage('ko');
};

// 시간/분 목록 생성 함수
function populateTimeLists() {
    // 1. Hour (0 ~ 23)
    const hourList = document.getElementById('hourList');
    for (let i = 0; i < 24; i++) {
        const li = document.createElement('li');
        li.textContent = i;
        li.onclick = function () { selectOption('hour', i, 'hourList'); };
        hourList.appendChild(li);
    }

    // 2. Minute (00, 15, 30, 45)
    const minuteList = document.getElementById('minuteList');
    const minutes = [0, 15, 30, 45];
    minutes.forEach(min => {
        const li = document.createElement('li');
        li.textContent = (min === 0 ? "00" : min);
        li.onclick = function () { selectOption('minute', (min === 0 ? "00" : min), 'minuteList'); };
        minuteList.appendChild(li);
    });
}

// 스마트 타이핑 함수
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

// 드롭다운 닫기
function closeAllDropdowns(exceptId) {
    const allDropdowns = document.querySelectorAll('.dropdown-list');
    allDropdowns.forEach(list => {
        if (list.id !== exceptId) list.style.display = 'none';
    });
}

// 검색 필터
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

// 목록 보여주기
function showList(listId) {
    closeAllDropdowns(listId);
    const list = document.getElementById(listId);
    const items = list.getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) { items[i].style.display = ""; }
    list.style.display = 'block';
}

// 항목 선택
function selectOption(inputId, value, listId) {
    document.getElementById(inputId).value = value;
    document.getElementById(listId).style.display = 'none';
}

// 도시 목록 업데이트
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

// 분석 요청 함수
async function analyze() {
    const btn = document.getElementById('btnSubmit');
    const spinner = document.getElementById('spinner');
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
    spinner.style.display = "block";
    resultArea.style.display = "none";
    coupangNotice.style.display = "none";

    const [y, m, d] = dateVal.split('-').map(Number);

    const requestData = {
        name: document.getElementById('name').value,
        year: y,
        month: m,
        day: d,
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
            const itemRegex = /\[\[(.*?)\]\]/g;
            const linkedText = rawText.replace(itemRegex, (match, itemName) => {
                const searchUrl = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(itemName)}&channel=user`;
                const buyText = currentLanguage === 'ko' ? "(구매하기)" : "(Buy Now)";
                return `<a href="${searchUrl}" target="_blank" class="coupang-link">🎁 ${itemName} ${buyText}</a>`;
            });

            if (typeof marked !== 'undefined') aiResponse.innerHTML = marked.parse(linkedText);
            else aiResponse.innerHTML = linkedText;

            if (rawText.match(itemRegex)) coupangNotice.style.display = "block";
            resultArea.style.display = "block";
        } else {
            alert("Error: " + data.detail);
        }

    } catch (error) {
        alert(currentLanguage === 'ko' ? "서버 오류! 나중에 다시 시도해주세요." : "Server Error! Please try again later.");
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.innerText = currentLanguage === 'ko' ? "분석 시작하기 🚀" : "Start Analysis 🚀";
        spinner.style.display = "none";
    }
}

// 카카오 공유
function shareKakao() {
    try {
        if (!Kakao.isInitialized()) {
            alert("카카오톡 공유 기능을 사용할 수 없습니다.");
            return;
        }
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
    } catch (e) {
        alert("Share Error: " + e);
    }
}

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

function setLanguage(lang) {
    // 현재 언어 상태 업데이트
    currentLanguage = lang;

    // 버튼 스타일 변경
    document.getElementById('btn-ko').classList.toggle('active', lang === 'ko');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');

    // 텍스트 변경
    const t = translations[lang];
    document.getElementById('txt-subtitle').innerText = t.subtitle;
    document.getElementById('lbl-name').innerText = t.lblName;
    document.getElementById('lbl-birth').innerText = t.lblBirth;
    document.getElementById('lbl-place').innerText = t.lblPlace;
    document.getElementById('lbl-concern').innerText = t.lblConcern;
    document.getElementById('concern').placeholder = t.placeholderConcern;
    document.getElementById('btnSubmit').innerText = t.btnSubmit;
    document.getElementById('spinner').innerText = t.spinner;
    document.getElementById('btn-kakao-txt').innerText = t.kakaoBtn;
    document.getElementById('link-about').innerText = t.linkAbout;
    document.getElementById('link-privacy').innerText = t.linkPrivacy;

    document.getElementById('name').placeholder = t.placeholderName;
    document.getElementById('hour').placeholder = t.placeholderHour;
    document.getElementById('minute').placeholder = t.placeholderMinute;
    document.getElementById('concern').placeholder = t.placeholderConcern;

    // 설명글(긴 글) 섹션 교체
    if (lang === 'ko') {
        document.querySelector('.info-section.lang-ko').style.display = 'block';
        document.querySelector('.info-section.lang-en').style.display = 'none';
    } else {
        document.querySelector('.info-section.lang-ko').style.display = 'none';
        document.querySelector('.info-section.lang-en').style.display = 'block';
    }
}

function createStars() {
    const starContainer = document.querySelector('.stars');
    if (!starContainer) return;

    const starCount = 100;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';

        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 2 + 1;
        const duration = Math.random() * 3 + 2;

        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.setProperty('--duration', `${duration}s`);

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

    const angle = Math.random() * 30 + 30;
    shootingStar.style.setProperty('--angle', angle + 'deg');

    starContainer.appendChild(shootingStar);

    setTimeout(() => {
        shootingStar.remove();
    }, 4000);
}