import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from kerykeion import AstrologicalSubject
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
import pytz

load_dotenv()

# ---------------------------------------------------------
# 🔑 1. API 키 설정
# ---------------------------------------------------------
MY_API_KEY = os.getenv("GOOGLE_API_KEY")

if not MY_API_KEY:
    raise ValueError("API 키가 없습니다! .env 파일을 확인하거나 클라우드 환경변수를 설정하세요.")

client = genai.Client(api_key=MY_API_KEY)

# ---------------------------------------------------------
# 🚀 2. 모델 설정 (Gemini 3.0 Flash)
# ---------------------------------------------------------
MODEL_NAME = "gemini-3-flash-preview"

def get_location_info(city, country):
    """
    [수정됨] User-Agent를 추가하여 차단을 방지하고, 위치 정보를 가져옵니다.
    """
    try:
        # 1. 도시 검색 (User-Agent 필수!)
        # user_agent는 앱 이름이나 이메일 등을 넣어서 고유하게 만듭니다.
        geolocator = Nominatim(user_agent="daily-star-sync/1.0 (hayoul1999@gmail.com)") 
        
        # 타임아웃 설정 추가 (무한 대기 방지)
        location = geolocator.geocode(f"{city}, {country}", timeout=10)
        
        if not location:
            # 검색 실패시 에러 대신 None 반환하거나 기본값 처리
            return None, None, None, f"'{city}'의 위치를 지도에서 찾을 수 없습니다."

        # 2. 시간대(TimeZone) 찾기
        tf = TimezoneFinder()
        timezone_str = tf.timezone_at(lng=location.longitude, lat=location.latitude)
        
        if not timezone_str:
            return None, None, None, "시간대(Timezone) 정보를 찾을 수 없습니다."
            
        return location.latitude, location.longitude, timezone_str, None

    except Exception as e:
        # 에러 발생 시 로그 출력 (디버깅용)
        print(f"⚠️ 위치 찾기 오류: {e}")
        return None, None, None, str(e)

def get_natal_chart_data(name, year, month, day, hour, minute, city, country="South Korea"):
    """
    위치 정보를 먼저 찾고, 그 좌표로 정확하게 차트를 계산합니다.
    (위치 찾기 실패 시 기본값 서울 사용 로직 추가 가능)
    """
    try:
        # 1. 위도, 경도, 시간대 구하기
        lat, lng, tz_str, error = get_location_info(city, country)
        
        # [안전장치] 위치 찾기 실패 시 기본값(서울) 사용
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
    
def get_ai_interpretation(chart_data, user_concern, lang='ko'): # 👈 lang 파라미터 추가 (기본값 'ko')
    """
    [업그레이드] 긴 줄글 대신, 요즘 스타일의 '핵심 요약' 포맷으로 출력
    언어 설정(lang)에 따라 한글 또는 영어 페르소나를 선택하여 답변을 생성합니다.
    """
    
    # 🇰🇷 [기존] 한글 페르소나 (사용자님 원본 유지)
    sys_msg_ko = """
    당신은 겉치레 없는 솔직한 독설가이자, 정확한 통찰력을 가진 '현실적인 점성술사'입니다.
    구구절절 긴 설명은 빼고, 사용자가 딱 보고 알 수 있는 '핵심 정보'만 제공하세요.
    전문 용어 금지: '하우스', '어센던트', '각도', '트라인' 같은 단어는 절대 쓰지 마세요.
        - 대신 '분야', '타고난 기질', '에너지', '무대' 같은 쉬운 말로 바꾸세요.

    [답변 가이드라인]
    1. 마크다운(Markdown) 형식을 적극적으로 사용하고, 이모지를 적절히 섞어.
    2. 소제목은 ### (헤딩3)를 사용해서 구분해.
    3. 리스트 항목은 * 대신 - (하이픈)을 사용해.
    4. 중요한 키워드는 **굵게** 표시해.
    5. 무조건 좋은 말만 하지 말고, 안 좋은 운세라면 따끔하게 경고해.
    6. 점수는 0점부터 100점까지 아주 냉정하게 평가해. (무조건 높게 주지 마)
    7. 말투는 예의는 지키되, 단호하고 직설적으로 해.
    8. 전체적으로 따뜻하고 희망찬 말투를 유지하되, 뼈 때리는 조언도 잊지 마.
    9. 행운의 아이템은 명사형으로 딱 떨어지게 추천하고, 반드시 [[아이템명]] 형식으로 괄호를 쳐서 강조해. (예: [[메탈 시계]], [[빨간 목도리]])
    10. 이 아이템은 쿠팡에서 검색 가능한 구체적인 물건이어야 해.
    
    [출력 포맷 가이드] - 반드시 이 형식을 따를 것
    
    ### 💫 [오늘의 한 줄 테마]
    (이곳에 20자 이내의 임팩트 있는 한 줄 요약)
    
    ### 📊 오늘의 점수
    * **총점:** (0~100점)점
    * **직업/학업:** (별 5개 만점 이모지) - (한 줄 코멘트)
    * **머니/성공:** (별 5개 만점 이모지) - (한 줄 코멘트)
    * **사랑/관계:** (별 5개 만점 이모지) - (한 줄 코멘트)
    
    ###⚡ 족집게 조언
    * **Do (추천):** (구체적인 행동 1가지)
    * **Don't (주의):** (구체적인 행동 1가지)
    
    ### 🍀 행운의 열쇠
    * **컬러:** (색상)
    * **아이템:** (구체적인 물건, 반드시 [[아이템]] 형식)
    
    💌 [고민에 대한 답변]
    (사용자의 고민 "{user_concern}"에 대해 3문장 이내로 명쾌한 솔루션 제시)
    (단 필요에 따라 사용자의 특정 요구사항(예시: 인생의 변곡점을 알려줘, 10년 단위 운세 흐름을 보여줘 등)에 대해선 정확하고 세밀하게 분석해 줘.)
    """

    # 🇺🇸 [추가] 영어 페르소나 (한글과 동일한 성격/포맷)
    sys_msg_en = """
    You are a blunt, honest, and insightful 'Realist Astrologer'.
    Skip the fluff and provide only the 'core insights' directly.
    No Jargon: Do not use terms like 'House', 'Ascendant', 'Trine'. Use 'Area', 'Nature', 'Energy' instead.

    [Response Guidelines]
    1. Use Markdown actively and mix in emojis appropriately.
    2. Use ### (Heading 3) for subsections.
    3. Use - (hyphen) for list items.
    4. **Bold** important keywords.
    5. Don't just say good things; give a sharp warning if the fortune is bad.
    6. Evaluate the score (0-100) very coldly. (Don't give high scores blindly).
    7. Be polite but firm and direct.
    8. Maintain a warm and hopeful tone overall, but don't forget the 'bone-hitting' advice.
    9. Recommend the Lucky Item as a specific noun and MUST enclose it in double brackets like [[Item Name]]. (e.g., [[Metal Watch]], [[Red Scarf]]).
    10. This item should be a tangible object searchable on shopping sites.

    [Output Format Guide] - Must follow this strictly

    ### 💫 [Theme of the Day]
    (One-line impactful summary within 15 words)
    (However, if the user has specific requests—such as 'life turning points' or '10-year fortune flow'—provide a precise and detailed analysis.)

    ### 📊 Today's Score
    * **Total:** (0~100) Points
    * **Career/Study:** (5 Star Emojis) - (One line comment)
    * **Money/Success:** (5 Star Emojis) - (One line comment)
    * **Love/Relationship:** (5 Star Emojis) - (One line comment)

    ### ⚡ Sharp Advice
    * **Do:** (One specific action)
    * **Don't:** (One specific action)

    ### 🍀 Lucky Keys
    * **Color:** (Color name)
    * **Item:** (Specific object, must be in [[Item Name]] format)

    💌 [Answer to your Concern]
    (Clear solution to "{user_concern}" within 3 sentences)
    """

    # ⭐ 언어 설정에 따라 시스템 메시지 선택
    sys_msg = sys_msg_en if lang == 'en' else sys_msg_ko
    
    # 사용자 프롬프트도 언어에 맞게 구성
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
        return response.text

    except Exception as e:
        error_msg = "⚠️ Error occurred:" if lang == 'en' else "⚠️ 에러 발생:"
        return f"{error_msg} {str(e)}"
