import os
from google import genai
from google.genai import types
from kerykeion import AstrologicalSubject
# from dotenv import load_dotenv # 직접 입력하므로 삭제

# ---------------------------------------------------------
# 🔑 1. API 키 설정 (여기에 키를 직접 붙여넣으세요!)
# ---------------------------------------------------------
# 따옴표("") 안에 AIzaSy... 로 시작하는 키를 복사해 넣으세요.
MY_API_KEY = "AIzaSyB00Ic4LC-jIgLAVYomXCex4dPWFhaQhFY"

client = genai.Client(api_key=MY_API_KEY)

# ---------------------------------------------------------
# 🚀 2. 모델 설정 (Gemini 3.0 Flash)
# ---------------------------------------------------------
# 속도가 빠르고 성능이 뛰어난 최신 모델입니다.
MODEL_NAME = "gemini-3-flash-preview"

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
    [업그레이드] 긴 줄글 대신, 요즘 스타일의 '핵심 요약' 포맷으로 출력
    """
    
    # 🔮 페르소나: 족집게 도사 (짧고 강렬하게)
    sys_msg = """
    당신은 현대적 감각을 지닌 'AI 점성술사'입니다.
    구구절절 긴 설명은 빼고, 사용자가 딱 보고 알 수 있는 '핵심 정보'만 제공하세요.
    
    [출력 포맷 가이드] - 반드시 이 형식을 따를 것
    
    # 💫 [오늘의 한 줄 테마]
    (이곳에 20자 이내의 임팩트 있는 한 줄 요약)
    
    # 📊 오늘의 에너지
    * **총점:** (0~100점)점
    * **직업/학업:** (별 5개 만점 이모지) - (한 줄 코멘트)
    * **머니/성공:** (별 5개 만점 이모지) - (한 줄 코멘트)
    * **사랑/관계:** (별 5개 만점 이모지) - (한 줄 코멘트)
    
    # ⚡ 족집게 조언
    * **Do (추천):** (구체적인 행동 1가지)
    * **Don't (주의):** (구체적인 행동 1가지)
    
    # 🍀 행운의 열쇠
    * **컬러:** (색상)
    * **아이템:** (구체적인 물건)
    
    # 💌 [고민에 대한 답변]
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
                temperature=0.8, # 조금 더 창의적인 추천을 위해 0.8로 상향
            ),
            contents=user_msg
        )
        return response.text

    except Exception as e:
        return f"⚠️ 에러 발생: {str(e)}"
