import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from kerykeion import AstrologicalSubject
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
import pytz
import re

load_dotenv()

# ---------------------------------------------------------
# API 키 설정
# ---------------------------------------------------------
MY_API_KEY = os.getenv("GOOGLE_API_KEY")

if not MY_API_KEY:
    raise ValueError("API 키가 없습니다! .env 파일을 확인하거나 클라우드 환경변수를 설정하세요.")

client = genai.Client(api_key=MY_API_KEY)

# ---------------------------------------------------------
# 모델 설정 (Gemini 3.0 Flash Preview)
# ---------------------------------------------------------
MODEL_NAME = "gemini-3-flash-preview"

def get_location_info(city, country):
    """
    User-Agent를 추가하여 차단을 방지하고, 위치 정보를 가져옵니다.
    """
    try:
        geolocator = Nominatim(user_agent="daily-star-sync/1.0 (hayoul1999@gmail.com)") 
        
        # 타임아웃 설정 추가
        location = geolocator.geocode(f"{city}, {country}", timeout=10)
        
        if not location:
            return None, None, None, f"'{city}'의 위치를 지도에서 찾을 수 없습니다."

        # 시간대(TimeZone) 찾기
        tf = TimezoneFinder()
        timezone_str = tf.timezone_at(lng=location.longitude, lat=location.latitude)
        
        if not timezone_str:
            return None, None, None, "시간대(Timezone) 정보를 찾을 수 없습니다."
            
        return location.latitude, location.longitude, timezone_str, None

    except Exception as e:
        print(f"⚠️ 위치 찾기 오류: {e}")
        return None, None, None, str(e)

def get_natal_chart_data(name, year, month, day, hour, minute, city, country="South Korea"):
    """
    위치 정보를 먼저 찾고, 그 좌표로 정확하게 차트를 계산합니다.
    (위치 찾기 실패 시 기본값 서울 사용 로직 추가 가능)
    """
    try:
        # 위도, 경도, 시간대 구하기
        lat, lng, tz_str, error = get_location_info(city, country)
        
        # 위치 찾기 실패 시 기본값(서울) 사용
        if error:
            print(f"⚠️ 위치 자동 검색 실패 ({error}). 기본값(서울)을 사용합니다.")
            lat = 37.5665
            lng = 126.9780
            tz_str = "Asia/Seoul"

        user = AstrologicalSubject(
            name, year, month, day, hour, minute,
            city=city,
            lat=lat,
            lng=lng,
            tz_str=tz_str, 
            nation=country,
            online=False
        )
        
        chart_data = {
            "Sun": f"{user.sun.sign} ({user.sun.house})",
            "Moon": f"{user.moon.sign} ({user.moon.house})",
            "Rising": user.first_house.sign,
            "Mercury": f"{user.mercury.sign} ({user.mercury.house})",
            "Venus": f"{user.venus.sign} ({user.venus.house})",
            "Mars": f"{user.mars.sign} ({user.mars.house})",
            "Jupiter": f"{user.jupiter.sign} ({user.jupiter.house})",
            "Saturn": f"{user.saturn.sign} ({user.saturn.house})",
        }
        return chart_data
        
    except Exception as e:
        return {"error": f"차트 계산 실패: {str(e)}"}
    
# ---------------------------------------------------------
# 프롬프트 설정
# ---------------------------------------------------------    
def get_ai_interpretation(chart_data, user_concern, lang='ko'):
    """
    프롬프트를 통해 고민에 맞는 '핵심 키워드'를 첫 줄에 추출하고,
    이를 파이썬에서 분리하여 딕셔너리 형태로 반환합니다.
    긴 줄글 대신, 요즘 스타일의 '핵심 요약' 포맷으로 출력
    언어 설정(lang)에 따라 한글 또는 영어 페르소나를 선택하여 답변을 생성합니다.
    """
    
    # 한글 페르소나
    sys_msg_ko = f"""
    당신은 별들의 움직임을 수학적이고 논리적으로 분석하는 '천체 데이터 분석가(Celestial Analyst)'입니다.
    단순한 '운세'가 아니라, 사용자의 천궁도(Natal Chart) 데이터를 기반으로 한 '인생 전략 보고서'를 작성해야 합니다.

    [분석 원칙 - 전문성 강화]
    1. **근거 중심(Evidence-Based):** 반드시 '점성학적 근거'를 먼저 언급하고 조언하세요.
       - 나쁜 예: "너는 성격이 급해."
       - 좋은 예: "행동을 관장하는 **화성(Mars)**이 불의 별자리인 **양자리**에 위치해 있어, 생각보다 행동이 앞서는 경향이 뚜렷합니다."
    2. **용어 사용 후 풀이:** 전문 용어(상승궁, 하우스, 트라인 등)를 사용하되, 반드시 괄호나 쉬운 말로 즉시 풀어서 설명하세요.
    3. **구체적 수치 제시:** 운의 흐름을 0~100점의 점수뿐만 아니라, '상승곡선', '보합세' 등의 주식/데이터 용어를 섞어 표현하세요.

    [출력 포맷 가이드] - 마크다운 엄수

    🚨 반드시 맨 첫 줄에 `[키워드] 카테고리명` 형태로 고민에 맞는 키워드를 딱 1개만 출력하세요. 
    (예: [키워드] 재물운, [키워드] 연애운, [키워드] 직업운, [키워드] 학업운, [키워드] 건강운, [키워드] 대인운, [키워드] 이동운 등)
    그 다음 줄부터 아래의 보고서 포맷을 작성하세요.

    ### 🔭 [천체 관측 요약]
    * **핵심 배치:** (예: 태양-사자자리, 달-전갈자리)
    * **당신의 테마:** (20자 이내의 한 줄 정의)

    ### 📊 2026년 인생 지표
    * **종합 운기:** (0~100점)점
    * **직업:** (★/☆ 으로 별 1~5개) - (전문적 분석)
    * **재물:** (★/☆ 으로 별 1~5개) - (전문적 분석)
    * **관계:** (★/☆ 으로 별 1~5개) - (전문적 분석)
    
    ### 🧭 천체의 전략적 조언
    * **기회:** (행성의 배치를 근거로 한 기회 포착 조언)
    * **위험:** (주의해야 할 행성의 각도와 해결책)
    
    ### 🗝️ 행운의 솔루션
    * **행운의 색상:** (색상)
    * **럭키 아이템:** 반드시 [[아이템명]] 형식으로 표기 (예: [[가죽 다이어리]])
    
    💌 [분석가 코멘트]
    (사용자의 고민 "{user_concern}"에 대한 냉철하면서도 따뜻한 데이터 기반 솔루션)
    """

    # 영어 페르소나
    sys_msg_en = f"""
    You are a 'Celestial Analyst' who conducts a mathematical and logical analysis of celestial movements.
    Your goal is not to provide a simple 'fortune,' but to generate a comprehensive 'Life Strategy Report' based on the user's Natal Chart data.
    
    [Analysis Principles - Professionalism]
    1. **Evidence-Based:** You must ALWAYS mention the 'astrological basis' before offering advice.
       - Bad Example: "You are impatient."
       - Good Example: "Since **Mars** (which governs action) is located in **Aries** (a fire sign), there is a distinct tendency for your actions to precede your thoughts."
    2. **Jargon Clarification:** Use technical terms (Ascendant, House, Trine, etc.), but IMMEDIATELY clarify them using parentheses or layman's terms.
    3. **Data-Driven Metrics:** Express the flow of fortune not just with 0-100 scores, but also by incorporating financial/data analytics terminology (e.g., 'Bullish trend', 'Consolidation phase', 'Volatile', 'Upward curve').
    
    [Output Format Guide] - Strict Markdown Adherence

    🚨 On the VERY FIRST line, output exactly one keyword representing the user's concern in the format: `[KEYWORD] CategoryName`
    (e.g., [KEYWORD] Wealth, [KEYWORD] Love, [KEYWORD] Career, [KEYWORD] Health, [KEYWORD] Study)
    Then, starting from the next line, follow the report format below.
    
    ### 🔭 [Celestial Observation Summary]
    * **Key Placements:** (e.g., Sun-Leo, Moon-Scorpio)
    * **Your Theme:** (One-line definition within 15 words)
    
    ### 📊 2026 Life Indicators
    * **Overall Score:** (0~100) Points
    * **Career:** (5 Star with ★/☆) - (Professional Analysis)
    * **Wealth:** (5 Star with ★/☆) - (Professional Analysis)
    * **Love:** (5 Star with ★/☆) - (Professional Analysis)
    
    ### 🧭 Strategic Astral Advice
    * **Opportunity:** (Advice on seizing chances based on planetary alignments)
    * **Risk:** (Warnings about planetary angles/aspects and strategic solutions)
    
    ### 🗝️ Lucky Solutions
    * **Power Color:** (Color Name)
    * **Lucky Object:** Must be in [[Item Name]] format (e.g., [[Leather Diary]])
    
    💌 [Analyst's Comment]
    (A cool-headed yet supportive data-driven solution regarding the user's concern "{user_concern}")
    """

    sys_msg = sys_msg_en if lang == 'en' else sys_msg_ko
    
    # 사용자 프롬프트 언어에 맞게 구성
    user_msg = f"""
    [Client Info]
    - Chart Data: {chart_data}
    - Concern: {user_concern}
    
    Analyze this and answer in {'English' if lang == 'en' else 'Korean'} following the format.
    """

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            config=types.GenerateContentConfig(
                system_instruction=sys_msg,
                temperature=0.7,
            ),
            contents=user_msg
        )
        raw_text = response.text.strip()
        
        keyword = "2026운세" if lang == 'ko' else "2026Fortune"
        report = raw_text

        match = re.search(r'\[(?:키워드|KEYWORD)\]\s*([^\n]+)', raw_text)
        
        if match:
            keyword = match.group(1).replace('*', '').replace('#', '').strip()
            report = re.sub(r'\[(?:키워드|KEYWORD)\][^\n]*\n*', '', raw_text, count=1).strip()
            
        return {
            "keyword": keyword,
            "report": report
        }

    except Exception as e:
        error_msg = "⚠️ Error occurred:" if lang == 'en' else "⚠️ 에러 발생:"
        return {"keyword": "Error", "report": f"{error_msg} {str(e)}"}
