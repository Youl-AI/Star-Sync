import streamlit as st
import datetime
from logic import get_natal_chart_data, get_ai_interpretation

# 1. 페이지 설정
st.set_page_config(
    page_title="Star Sync | 당신의 우주를 연결하세요", 
    page_icon="💫",
    layout="centered"
)

# 2. 헤더 및 브랜드 스토리
st.title("💫 Star Sync")
st.markdown("### : 우주의 데이터와 당신의 일상을 동기화(Sync)합니다.")
st.info("Data-Driven Astrology: 고대의 데이터를 현대의 기술로 해석합니다.")
st.markdown("---")

# ---------------------------------------------------------
# 🇰🇷 대한민국 도시 데이터베이스 (행정구역별 분류)
# ---------------------------------------------------------
MAJOR_CITIES = [
    # 1. 특별시/광역/자치시 (Major Metropolitan Cities)
    "Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Sejong",

    # 2. 경기도 (Gyeonggi-do)
    "Suwon", "Seongnam", "Uijeongbu", "Anyang", "Bucheon", "Gwangmyeong", "Pyeongtaek", 
    "Dongducheon", "Ansan", "Goyang", "Gwacheon", "Guri", "Namyangju", "Osan", 
    "Siheung", "Gunpo", "Uiwang", "Hanam", "Yongin", "Paju", "Icheon", 
    "Anseong", "Gimpo", "Hwaseong", "Gwangju (Gyeonggi)", "Yangju", "Pocheon", "Yeoju",

    # 3. 강원도 (Gangwon-do)
    "Chuncheon", "Wonju", "Gangneung", "Donghae", "Taebaek", "Sokcho", "Samcheok",

    # 4. 충청북도 (Chungcheongbuk-do)
    "Cheongju", "Chungju", "Jecheon",

    # 5. 충청남도 (Chungcheongnam-do)
    "Cheonan", "Gongju", "Boryeong", "Asan", "Seosan", "Nonsan", "Gyeryong", "Dangjin",

    # 6. 전라북도 (Jeollabuk-do)
    "Jeonju", "Gunsan", "Iksan", "Jeongeup", "Namwon", "Gimje",

    # 7. 전라남도 (Jeollanam-do)
    "Mokpo", "Yeosu", "Suncheon", "Naju", "Gwangyang",

    # 8. 경상북도 (Gyeongsangbuk-do)
    "Pohang", "Gyeongju", "Gimcheon", "Andong", "Gumi", "Yeongju", "Yeongcheon", 
    "Sangju", "Mungyeong", "Gyeongsan",

    # 9. 경상남도 (Gyeongsangnam-do)
    "Changwon", "Jinju", "Tongyeong", "Sacheon", "Gimhae", "Miryang", "Geoje", "Yangsan",

    # 10. 제주도 (Jeju-do)
    "Jeju City", "Seogwipo"
]

# 3. 사이드바: 사용자 데이터 입력
with st.sidebar:
    st.header("1. Sync Profile 📡")
    
    name = st.text_input("이름 (Name)", "User")
    
    col1, col2 = st.columns(2)
    with col1:
        birth_date = st.date_input("생년월일", min_value=datetime.date(1950, 1, 1))
    with col2:
        birth_time = st.time_input("태어난 시간", datetime.time(12, 00))
    
    # ✅ [변경] 텍스트 입력 대신 '검색 가능한 선택 상자' 사용
    # 사용자가 'Seo'만 쳐도 'Seoul'이 자동 추천됩니다.
    city = st.selectbox(
        "태어난 도시 (City)", 
        options=MAJOR_CITIES,
        index=0  # 기본값: Seoul
    )
    
    # 국가 코드는 도시와 맞아야 하므로 기본값을 KR로 두되 수정 가능하게 함
    country = st.text_input("국가 코드 (Country Code)", "KR")
    
    st.markdown("---")
    st.caption("Powered by **Gemini 3.0 Flash**")

# 4. 메인 화면: 고민 입력
st.subheader("2. Sync Context 💭")
user_concern = st.text_area(
    "현재 우주에게 묻고 싶은 당신의 고민은 무엇인가요?",
    height=100,
    placeholder="예: 이번 프로젝트가 성공적으로 끝날 수 있을까요? / 지금 썸 타는 사람과 잘 될 수 있을까요?"
)

# 5. 실행 버튼
if st.button("Star Sync 시작하기 🚀", use_container_width=True):
    if not user_concern:
        st.warning("⚠️ 고민 내용을 입력해주세요.")
    else:
        with st.spinner("💫 행성 데이터를 수신하고 Gemini 3.0 Pro가 분석 중입니다..."):
            
            # Logic 호출
            chart_data = get_natal_chart_data(
                name, 
                birth_date.year, birth_date.month, birth_date.day,
                birth_time.hour, birth_time.minute,
                city, country
            )
            
            if "error" in chart_data:
                st.error(f"❌ 위치 데이터 오류: {chart_data['error']}")
            else:
                result = get_ai_interpretation(chart_data, user_concern)
                
                st.success("✅ Synchronization Complete!")
                st.markdown("### 🔮 분석 리포트")
                st.markdown(f"""
                <div style="background-color: #f0f2f6; padding: 20px; border-radius: 10px; border-left: 5px solid #6c5ce7;">
                    {result}
                </div>
                """, unsafe_allow_html=True)
                
                with st.expander("🛠️ 천문 데이터 로그"):
                    st.json(chart_data)
