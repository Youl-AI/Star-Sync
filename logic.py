import os
from google import genai
from google.genai import types
from kerykeion import AstrologicalSubject
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 🚀 [변경점 1] 클라이언트 연결 방식이 훨씬 심플해졌습니다.
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# 모델 설정 (가장 빠르고 안정적인 최신 Flash 모델 추천)
MODEL_NAME = "gemini-2.5-flash"

def get_natal_chart_data(name, year, month, day, hour, minute, city, nation="KR"):
    """
    kerykeion (v4.x+)을 사용하여 차트 데이터를 계산합니다.
    """
    try:
        user = AstrologicalSubject(name, year, month, day, hour, minute, city, nation)
        
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
        return {"error": f"위치 계산 실패: {str(e)}"}

def get_ai_interpretation(chart_data, user_concern):
    """
    [변경점 2] google-genai 최신 문법으로 해석 요청
    """
    
    # 시스템 프롬프트 (AI의 페르소나)
    sys_msg = """
    당신은 30년 경력의 '심리 점성술사'입니다. 
    내담자의 출생 차트와 현재 고민을 연결하여 깊이 있는 통찰과 치유를 제공하세요.
    단순한 행성 나열이 아닌, 구체적인 솔루션(Action Item)을 반드시 포함하세요.
    """
    
    user_msg = f"""
    [내담자 정보]
    - 차트 데이터: {chart_data}
    - 현재 고민: {user_concern}
    
    심도 있는 점성술 상담을 진행해줘.
    """

    try:
        # 🚀 [변경점 3] generate_content 문법 변경
        response = client.models.generate_content(
            model=MODEL_NAME,
            config=types.GenerateContentConfig(
                system_instruction=sys_msg,
                temperature=0.7, # 창의성 조절
            ),
            contents=user_msg
        )
        return response.text

    except Exception as e:
        return f"⚠️ 에러 발생: {str(e)}\n(잠시 후 다시 시도해보세요)"
