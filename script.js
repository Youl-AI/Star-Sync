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

// 영문명 → 한글 표기. 드롭다운 표시는 "한글 (English)", 서버 전송은 영문 유지
const KO_LABELS = {
    "South Korea": "대한민국", "United States": "미국", "Japan": "일본", "China": "중국",
    "United Kingdom": "영국", "France": "프랑스", "Germany": "독일", "Italy": "이탈리아",
    "Spain": "스페인", "Netherlands": "네덜란드", "Switzerland": "스위스", "Russia": "러시아",
    "Australia": "호주", "Canada": "캐나다", "India": "인도", "Vietnam": "베트남",
    "Thailand": "태국", "Philippines": "필리핀", "Singapore": "싱가포르", "Taiwan": "대만",
    "Indonesia": "인도네시아", "United Arab Emirates": "아랍에미리트", "Saudi Arabia": "사우디아라비아",
    "Turkey": "터키", "Egypt": "이집트", "South Africa": "남아프리카공화국", "Brazil": "브라질",
    "Argentina": "아르헨티나", "Mexico": "멕시코",

    "Seoul": "서울", "Busan": "부산", "Daegu": "대구", "Incheon": "인천", "Gwangju": "광주",
    "Daejeon": "대전", "Ulsan": "울산", "Sejong": "세종", "Suwon": "수원", "Seongnam": "성남",
    "Uijeongbu": "의정부", "Anyang": "안양", "Bucheon": "부천", "Gwangmyeong": "광명",
    "Pyeongtaek": "평택", "Dongducheon": "동두천", "Ansan": "안산", "Goyang": "고양",
    "Gwacheon": "과천", "Guri": "구리", "Namyangju": "남양주", "Osan": "오산", "Siheung": "시흥",
    "Gunpo": "군포", "Uiwang": "의왕", "Hanam": "하남", "Yongin": "용인", "Paju": "파주",
    "Icheon": "이천", "Anseong": "안성", "Gimpo": "김포", "Hwaseong": "화성",
    "Gwangju (Gyeonggi)": "광주(경기)", "Yangju": "양주", "Pocheon": "포천", "Yeoju": "여주",
    "Yeoncheon": "연천", "Gapyeong": "가평", "Yangpyeong": "양평", "Chuncheon": "춘천",
    "Wonju": "원주", "Gangneung": "강릉", "Donghae": "동해", "Taebaek": "태백", "Sokcho": "속초",
    "Samcheok": "삼척", "Hongcheon": "홍천", "Hoengseong": "횡성", "Yeongwol": "영월",
    "Pyeongchang": "평창", "Jeongseon": "정선", "Cheorwon": "철원", "Hwacheon": "화천",
    "Yanggu": "양구", "Inje": "인제", "Goseong (Gangwon)": "고성(강원)", "Yangyang": "양양",
    "Cheongju": "청주", "Chungju": "충주", "Jecheon": "제천", "Boeun": "보은", "Okcheon": "옥천",
    "Yeongdong": "영동", "Jeungpyeong": "증평", "Jincheon": "진천", "Goesan": "괴산",
    "Eumseong": "음성", "Danyang": "단양", "Cheonan": "천안", "Gongju": "공주",
    "Boryeong": "보령", "Asan": "아산", "Seosan": "서산", "Nonsan": "논산", "Gyeryong": "계룡",
    "Dangjin": "당진", "Geumsan": "금산", "Buyeo": "부여", "Seocheon": "서천",
    "Cheongyang": "청양", "Hongseong": "홍성", "Yesan": "예산", "Taean": "태안",
    "Jeonju": "전주", "Gunsan": "군산", "Iksan": "익산", "Jeongeup": "정읍", "Namwon": "남원",
    "Gimje": "김제", "Wanju": "완주", "Jinan": "진안", "Muju": "무주", "Jangsu": "장수",
    "Imsil": "임실", "Sunchang": "순창", "Gochang": "고창", "Buan": "부안", "Mokpo": "목포",
    "Yeosu": "여수", "Suncheon": "순천", "Naju": "나주", "Gwangyang": "광양", "Damyang": "담양",
    "Gokseong": "곡성", "Gurye": "구례", "Goheung": "고흥", "Boseong": "보성", "Hwasun": "화순",
    "Jangheung": "장흥", "Gangjin": "강진", "Haenam": "해남", "Yeongam": "영암", "Muan": "무안",
    "Hampyeong": "함평", "Yeonggwang": "영광", "Jangseong": "장성", "Wando": "완도",
    "Jindo": "진도", "Sinan": "신안", "Pohang": "포항", "Gyeongju": "경주", "Gimcheon": "김천",
    "Andong": "안동", "Gumi": "구미", "Yeongju": "영주", "Yeongcheon": "영천", "Sangju": "상주",
    "Mungyeong": "문경", "Gyeongsan": "경산", "Gunwi": "군위", "Uiseong": "의성",
    "Cheongsong": "청송", "Yeongyang": "영양", "Yeongdeok": "영덕", "Cheongdo": "청도",
    "Goryeong": "고령", "Seongju": "성주", "Chilgok": "칠곡", "Yecheon": "예천",
    "Bonghwa": "봉화", "Uljin": "울진", "Ulleung": "울릉", "Changwon": "창원", "Jinju": "진주",
    "Tongyeong": "통영", "Sacheon": "사천", "Gimhae": "김해", "Miryang": "밀양", "Geoje": "거제",
    "Yangsan": "양산", "Uiryeong": "의령", "Haman": "함안", "Changnyeong": "창녕",
    "Goseong (Gyeongnam)": "고성(경남)", "Namhae": "남해", "Hadong": "하동", "Sancheong": "산청",
    "Hamyang": "함양", "Geochang": "거창", "Hapcheon": "합천", "Jeju City": "제주",
    "Seogwipo": "서귀포",

    "Tokyo": "도쿄", "Yokohama": "요코하마", "Osaka": "오사카", "Nagoya": "나고야",
    "Sapporo": "삿포로", "Kobe": "고베", "Kyoto": "교토", "Fukuoka": "후쿠오카",
    "Okinawa": "오키나와", "Beijing": "베이징", "Shanghai": "상하이", "Guangzhou": "광저우",
    "Shenzhen": "선전", "Chengdu": "청두", "New York": "뉴욕", "Los Angeles": "로스앤젤레스",
    "Chicago": "시카고", "San Francisco": "샌프란시스코", "Seattle": "시애틀",
    "Las Vegas": "라스베이거스", "Honolulu": "호놀룰루", "Washington": "워싱턴",
    "Boston": "보스턴", "London": "런던", "Paris": "파리", "Berlin": "베를린", "Rome": "로마",
    "Madrid": "마드리드", "Barcelona": "바르셀로나", "Amsterdam": "암스테르담",
    "Zurich": "취리히", "Geneva": "제네바", "Moscow": "모스크바", "Sydney": "시드니",
    "Melbourne": "멜버른", "Brisbane": "브리즈번", "Toronto": "토론토", "Vancouver": "밴쿠버",
    "Montreal": "몬트리올", "Mumbai": "뭄바이", "Delhi": "델리", "Ho Chi Minh City": "호치민",
    "Hanoi": "하노이", "Da Nang": "다낭", "Bangkok": "방콕", "Chiang Mai": "치앙마이",
    "Phuket": "푸껫", "Manila": "마닐라", "Cebu City": "세부", "Taipei": "타이베이",
    "Kaohsiung": "가오슝", "Jakarta": "자카르타", "Bali (Denpasar)": "발리(덴파사르)",
    "Dubai": "두바이", "Abu Dhabi": "아부다비", "Istanbul": "이스탄불", "Cairo": "카이로",
    "Cape Town": "케이프타운", "Johannesburg": "요하네스버그", "Sao Paulo": "상파울루",
    "Rio de Janeiro": "리우데자네이루", "Buenos Aires": "부에노스아이레스",
    "Mexico City": "멕시코시티", "Cancun": "칸쿤"
};

const KO_REVERSE = {};
Object.keys(KO_LABELS).forEach(en => { KO_REVERSE[KO_LABELS[en]] = en; });

// 드롭다운 표시용: "서울 (Seoul)" — 매핑 없으면 영문 그대로
function displayLabel(name) {
    return KO_LABELS[name] ? `${KO_LABELS[name]} (${name})` : name;
}

const EN_NAMES = new Set(Object.keys(WORLD_DB));
Object.values(WORLD_DB).forEach(list => list.forEach(c => EN_NAMES.add(c)));

// 입력값 → 서버 전송용 영문: "서울 (Seoul)" → "Seoul", "서울" → "Seoul", "Seoul" → "Seoul"
function toEnglishValue(value) {
    if (!value) return value;
    const v = value.trim();
    if (EN_NAMES.has(v)) return v;
    if (KO_REVERSE[v]) return KO_REVERSE[v];
    const i = v.indexOf(" (");
    if (i > -1 && v.endsWith(")")) {
        const inner = v.slice(i + 2, -1);
        if (EN_NAMES.has(inner)) return inner;
        return inner;
    }
    return v;
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
        placeholderCountry: "국가 (예: 대한민국)",
        placeholderCity: "도시 (예: 서울)",
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
        placeholderCountry: "Country",
        placeholderCity: "City",
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

    const countryList = document.getElementById('countryList');
    Object.keys(WORLD_DB).forEach(country => {
        const li = document.createElement('li');
        li.textContent = displayLabel(country);
        li.onclick = function () {
            selectOption('country', displayLabel(country), 'countryList');
            updateCities(country);
        };
        countryList.appendChild(li);
    });

    selectOption('country', displayLabel('South Korea'), 'countryList');
    updateCities('South Korea');
    selectOption('city', displayLabel('Seoul'), 'cityList');

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.dropdown-wrapper')) {
            closeAllDropdowns();
        }
    });

    createStars();
    setInterval(createShootingStar, 3500);

    const btnKo = document.getElementById('btn-ko');
    const btnEn = document.getElementById('btn-en');

    if (btnKo) btnKo.addEventListener('click', () => setLanguage('ko'));
    if (btnEn) btnEn.addEventListener('click', () => setLanguage('en'));

    setLanguage('ko');
};

/* =========================================
   [3] 다국어(언어) 설정 함수 (setLanguage)
   ========================================= */
function setLanguage(lang) {
    currentLanguage = lang;

    const btnKo = document.getElementById('btn-ko');
    const btnEn = document.getElementById('btn-en');
    if (btnKo) btnKo.classList.toggle('active', lang === 'ko');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');

    const t = translations[lang];
    if (!t) return;

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

    const setPlaceholder = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = text;
    };

    setPlaceholder('name', t.placeholderName);
    setPlaceholder('hour', t.placeholderHour);
    setPlaceholder('minute', t.placeholderMinute);
    setPlaceholder('country', t.placeholderCountry);
    setPlaceholder('city', t.placeholderCity);
    setPlaceholder('concern', t.placeholderConcern);

    document.querySelectorAll('.lang-ko').forEach(el => {
        el.style.display = (lang === 'ko') ? 'block' : 'none';
    });
    document.querySelectorAll('.lang-en').forEach(el => {
        el.style.display = (lang === 'en') ? 'block' : 'none';
    });
}

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
            li.textContent = displayLabel(city);
            li.onclick = function () { selectOption('city', displayLabel(city), 'cityList'); };
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

    if (!chartContainer) {
        alert(currentLanguage === 'en' ? "No analysis result yet!" : "아직 분석 결과가 없습니다!");
        return;
    }

    const userName = document.getElementById('name').value || "Guest";

    let userConcern = window.aiKeyword || (currentLanguage === 'en' ? "2026_Fortune" : "2026운세");
    if (!userConcern || userConcern.length > 30 || userConcern.includes(" ")) {
        userConcern = currentLanguage === 'en' ? "2026_Fortune" : "2026운세";
    }

    const defaultThemeText = currentLanguage === 'en' ? "2026, Your universe unfolds." : "2026년, 당신의 우주가 펼쳐집니다.";
    let themeText = defaultThemeText;
    let scoreText = "";

    if (aiResponse) {
        const lines = aiResponse.innerText.split('\n');

        for (let line of lines) {
            let cleanLine = line.trim();

            if (cleanLine.includes("테마") || cleanLine.toLowerCase().includes("theme")) {
                let parts = cleanLine.split(/[:：]/);
                if (parts.length > 1) {
                    themeText = parts[1].trim().replace(/^"/, '').replace(/"$/, '');
                } else {
                    themeText = cleanLine;
                }
            }

            if (cleanLine.includes("종합 운기") || cleanLine.includes("총점") || cleanLine.toLowerCase().includes("score") || (cleanLine.includes("점수") && cleanLine.includes("점"))) {
                scoreText = cleanLine.replace(/^[✨🍀⭐️\s]+/, '');
            }
        }
    }

    const captureDiv = document.createElement('div');
    captureDiv.className = 'share-card poster-style';
    document.body.appendChild(captureDiv);

    const titleText = currentLanguage === 'en' ? `${userName}'s Universe` : `${userName}님의 우주`;
    const yearTag = currentLanguage === 'en' ? "#Year_2026" : "#2026년";
    const analyzedByText = currentLanguage === 'en' ? "ANALYZED BY BYEOLSAEM" : "별샘 분석";

    const header = document.createElement('div');
    header.innerHTML = `
        <div class="poster-header">
            <div class="poster-subtitle">STAR SYNC ANALYSIS</div>
            <h1 class="poster-title">${titleText}</h1>
            <div class="poster-tags">
                <span class="tag-badge">${yearTag}</span>
                <span class="tag-badge">#${userConcern}</span>
            </div>
        </div>
    `;
    captureDiv.appendChild(header);

    const chartClone = chartContainer.cloneNode(true);
    captureDiv.appendChild(chartClone);

    const legendEl = document.querySelector('.chart-legend');
    if (legendEl) captureDiv.appendChild(legendEl.cloneNode(true));

    let scoreHtml = scoreText ? `<div class="message-score">${scoreText}</div>` : "";

    const messageBox = document.createElement('div');
    messageBox.className = 'poster-message-box';
    messageBox.innerHTML = `
        <div class="message-label">MY THEME & SCORE</div>
        <div class="message-text">"${themeText}"</div>
        ${scoreHtml}
        <div class="poster-footer">${analyzedByText}</div>
    `;
    captureDiv.appendChild(messageBox);

    html2canvas(captureDiv, {
        backgroundColor: "#151520",
        scale: 2, useCORS: true, logging: false,
        width: 600, height: 850,
        windowWidth: 600, windowHeight: 750
    }).then(canvas => {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');

        const downloadName = currentLanguage === 'en' ? "Byeolsaem_Poster.png" : "별샘_결과.png";
        link.download = `${userName}_${downloadName}`;
        link.href = image;
        link.click();
        document.body.removeChild(captureDiv);
    }).catch(err => {
        console.error("캡처 에러:", err);
        alert(currentLanguage === 'en' ? "Error saving image." : "저장 중 오류가 발생했습니다.");
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

    let roleTitle = "";
    if (elementId === 'res-sun') roleTitle = currentLanguage === 'ko' ? "나의 본질은" : "My Essence";
    else if (elementId === 'res-moon') roleTitle = currentLanguage === 'ko' ? "나의 내면은" : "My Inner Self";
    else if (elementId === 'res-rising') roleTitle = currentLanguage === 'ko' ? "나의 첫인상은" : "My First Impression";

    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `
            <div class="zodiac-result-box">
                <span class="z-icon">${info.icon}</span>
                <div class="z-text-group">
                    <span class="z-role-title">${roleTitle}</span>
                    <span class="z-desc-highlight">'${label}'</span>
                </div>
            </div>
        `;
    }
}

function shareKakao() {
    try {
        if (!Kakao.isInitialized()) { alert("카카오톡 공유 기능을 사용할 수 없습니다."); return; }
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: '별샘 ✨',
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
        country: toEnglishValue(document.getElementById('country').value) || "South Korea",
        city: toEnglishValue(document.getElementById('city').value) || "Seoul",
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
            window.aiKeyword = data.keyword;
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
                const officialLink = data.coupang_link || "https://link.coupang.com/a/dPGEq7";
                return `<a href="${officialLink}" target="_blank" class="lucky-badge" title="행운의 아이템 구경하기">🎁 ${cleanName}</a>`;
            });

            if (formattedHtml.includes("핵심 배치") || formattedHtml.includes("Key Placements")) {
                const visualHTML = renderStelliumVisualizer(rawText, data.chart_data);
                formattedHtml = formattedHtml.replace(/.*(?:핵심 배치|Key Placements).*/, (match) => {
                    return `<div class="chart-outer-wrapper"><div class="chart-inner-scaler">${visualHTML}</div></div><br>${match}`;
                });
            }

            aiResponse.innerHTML = formattedHtml;

            if (rawText.includes('[[')) coupangNotice.style.display = "block";
            else coupangNotice.style.display = "none";

            loadingArea.style.display = "none";
            resultArea.style.display = "block";
            resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
   [5] 리얼 천궁도 시각화 엔진 (Real Chart - 완벽 다국어 변환 적용)
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
    zodiacs.forEach(z => {
        slotsData.push({ ...z, planets: [], houses: [], active: false, isLong: false });
    });

    const planetKeywords = [
        { ko: "태양", en: "Sun" }, { ko: "달", en: "Moon" }, { ko: "수성", en: "Mercury" },
        { ko: "금성", en: "Venus" }, { ko: "화성", en: "Mars" }, { ko: "목성", en: "Jupiter" },
        { ko: "토성", en: "Saturn" }, { ko: "천왕성", en: "Uranus" }, { ko: "해왕성", en: "Neptune" },
        { ko: "명왕성", en: "Pluto" }
    ];

    if (chartData) {
        const pMap = { "sun": "태양", "moon": "달", "mercury": "수성", "venus": "금성", "mars": "화성", "jupiter": "목성", "saturn": "토성", "uranus": "천왕성", "neptune": "해왕성", "pluto": "명왕성" };
        Object.keys(pMap).forEach(key => {
            const val = chartData[key] || chartData[key.charAt(0).toUpperCase() + key.slice(1)];
            if (val) {
                const code = val.substring(0, 3).toUpperCase();
                const idx = slotsData.findIndex(s => s.code === code);
                if (idx !== -1) {
                    slotsData[idx].active = true;
                    if (!slotsData[idx].planets.includes(pMap[key])) slotsData[idx].planets.push(pMap[key]);
                }
            }
        });
        const risingVal = chartData["rising"] || chartData["Rising"];
        if (risingVal) {
            const code = risingVal.substring(0, 3).toUpperCase();
            const idx = slotsData.findIndex(s => s.code === code);
            if (idx !== -1) {
                slotsData[idx].active = true;
                slotsData[idx].houses.push("ASC");
            }
        }
    }

    if (text) {
        const lines = text.split('\n');
        let targetLine = lines.find(line => /핵심 배치|Key Placements/i.test(line));
        if (targetLine) {
            slotsData.forEach((slot, idx) => {
                if (targetLine.includes(slot.name) || targetLine.toLowerCase().includes(slot.en.toLowerCase())) {
                    const textIdx = targetLine.indexOf(slot.name) !== -1 ? targetLine.indexOf(slot.name) : targetLine.toLowerCase().indexOf(slot.en.toLowerCase());
                    const snippet = targetLine.substring(Math.max(0, textIdx - 20), Math.min(targetLine.length, textIdx + 30));

                    const hMatch = snippet.match(/(\d+)(?:하|H|st|nd|rd|th)/i);
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

    for (let i = 0; i < 12; i++) {
        if (slotsData[i].active) {
            const prevIdx = (i === 0) ? 11 : i - 1;
            if (slotsData[prevIdx].active && !slotsData[prevIdx].isLong) {
                slotsData[i].isLong = true;
            }
        }
    }

    let chartInnerHtml = "";
    let legendHtml = "";
    let hasActiveData = false;

    const pTrans = {
        "태양": "Sun", "달": "Moon", "수성": "Mercury", "금성": "Venus", "화성": "Mars",
        "목성": "Jupiter", "토성": "Saturn", "천왕성": "Uranus", "해왕성": "Neptune", "명왕성": "Pluto"
    };

    slotsData.forEach((data, index) => {
        let activeClass = "";
        let connectionLine = "";
        let expandedPanel = "";

        if (data.active) {
            hasActiveData = true;
            activeClass = "active-nebula";

            const distClass = data.isLong ? "dist-long" : "dist-short";

            let tagsHtml = "";
            data.houses.forEach(h => {
                if (h === "ASC") {
                    tagsHtml += `<span class="panel-house asc-house">RISING Sign</span>`;
                } else {
                    let displayHouse = h;
                    if (currentLanguage === 'en') {
                        const hNum = h.replace(/[^0-9]/g, '');
                        let suffix = "th";
                        if (hNum === "1") suffix = "st";
                        else if (hNum === "2") suffix = "nd";
                        else if (hNum === "3") suffix = "rd";
                        displayHouse = `${hNum}${suffix} House`;
                    }
                    tagsHtml += `<span class="panel-house">${displayHouse}</span>`;
                }
            });

            let planetsHtml = "";
            data.planets.forEach(pNameKo => {
                const displayPlanetName = currentLanguage === 'en' ? pTrans[pNameKo] : pNameKo;
                if (SYMBOLS[pNameKo]) planetsHtml += `<div class="panel-p-item">${SYMBOLS[pNameKo]} <span>${displayPlanetName}</span></div>`;
            });

            if (planetsHtml === "" && !data.houses.includes("ASC")) {
                const emptyText = currentLanguage === 'en' ? "Placement Info" : "배치 정보";
                planetsHtml = `<div class="panel-p-item" style="color:#aaa; font-size:0.75rem;">${emptyText}</div>`;
            }

            connectionLine = ``;

            const displayZodiacName = currentLanguage === 'en' ? data.en : data.name;

            expandedPanel = `
                <div class="hud-anchor ${distClass}">
                    <div class="hud-line"></div>
                    <div class="expanded-data-panel">
                        <div class="panel-content">
                            <div class="panel-header">
                                <div class="panel-tags">${tagsHtml}</div>
                                <span class="panel-z-name">${displayZodiacName}</span>
                            </div>
                            <div class="panel-planets-list">${planetsHtml}</div>
                        </div>
                    </div>
                </div>
            `;

            legendHtml += `
                <div class="legend-item">
                    <div class="panel-header">
                        <div class="panel-tags">${tagsHtml}</div>
                        <span class="panel-z-name">${data.sym} ${displayZodiacName}</span>
                    </div>
                    <div class="panel-planets-list">${planetsHtml}</div>
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

    const mainTitle = currentLanguage === 'en' ? "✨ Your Personal Natal Chart" : "✨ 당신만의 우주 천궁도";
    const subTitle = currentLanguage === 'en' ? "The map of destiny where the stars lingered at the moment of your birth" : "태어난 순간, 별들이 머물던 운명의 지도";

    return `
        <div class="chart-section-header">
            <h3 class="chart-main-title">${mainTitle}</h3>
            <p class="chart-sub-title">${subTitle}</p>
        </div>
        <div class="nebula-chart-container">
            <div class="cosmic-bg"></div><div class="orbit-rings"></div>
            <div class="chart-sectors-wrapper">${chartInnerHtml}</div>
            <div class="center-core"><span>KEY</span><br>CHART</div>
        </div>
        <div class="chart-legend">${legendHtml}</div>
    `;
}