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
# 🔑 1. API 키 설정 (여기에 키를 직접 붙여넣으세요!)
# ---------------------------------------------------------
MY_API_KEY = os.getenv("GOOGLE_API_KEY")

if not MY_API_KEY:
    raise ValueError("API 키가 없습니다! .env 파일을 확인하거나 클라우드 환경변수를 설정하세요.")

client = genai.Client(api_key=MY_API_KEY)

# ---------------------------------------------------------
# 🚀 2. 모델 설정 (Gemini 3.0 Flash)
# ---------------------------------------------------------
# 속도가 빠르고 성능이 뛰어난 최신 모델입니다.
MODEL_NAME = "gemini-3-flash-preview"

def get_location_info(city, country):
    """
    [새로운 기능] 주소(도시, 국가)를 주면 위도, 경도, 시간대를 찾아옵니다.
    """
    try:
        # 1. 도시 검색 (예: "Pyeongtaek, South Korea")
        geolocator = Nominatim(user_agent="star_sync_app")
        location = geolocator.geocode(f"{city}, {country}")
        
        if not location:
            # 검색 실패시 에러
            return None, None, None, f"'{city}'의 위치를 지도에서 찾을 수 없습니다."

        # 2. 시간대(TimeZone) 찾기 (예: "Asia/Seoul")
        tf = TimezoneFinder()
        timezone_str = tf.timezone_at(lng=location.longitude, lat=location.latitude)
        
        if not timezone_str:
            return None, None, None, "시간대(Timezone) 정보를 찾을 수 없습니다."
            
        return location.latitude, location.longitude, timezone_str, None

    except Exception as e:
        return None, None, None, str(e)

def get_natal_chart_data(name, year, month, day, hour, minute, city, country="South Korea"):
    """
    위치 정보를 먼저 찾고, 그 좌표로 정확하게 차트를 계산합니다.
    """
    try:
        # 1. 위도, 경도, 시간대 먼저 구하기
        lat, lng, tz_str, error = get_location_info(city, country)
        
        if error:
            return {"error": f"위치 오류: {error}"}

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
    
def get_ai_interpretation(chart_data, user_concern):
    """
    [업그레이드] 긴 줄글 대신, 요즘 스타일의 '핵심 요약' 포맷으로 출력
    """
    
    # 🔮 페르소나: 족집게 도사 (짧고 강렬하게)
    sys_msg = """
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
    * **아이템:** (구체적인 물건)
    
    💌 [고민에 대한 답변]
    (사용자의 고민 "{user_concern}"에 대해 3문장 이내로 명쾌한 솔루션 제시)
    """
    
    user_msg = f"""
    [내담자 정보]
    - 별자리 데이터: {chart_data}
    - 현재 고민: {user_concern}
    
    위 정보를 분석해서 모바일에서 보기 편하게 짧고 굵게 답변해줘.
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
        return f"⚠️ 에러 발생: {str(e)}"
