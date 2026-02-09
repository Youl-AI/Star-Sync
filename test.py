import os
from google import genai
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

try:
    # 클라이언트 연결
    client = genai.Client(api_key="AIzaSyB00Ic4LC-jIgLAVYomXCex4dPWFhaQhFY")
    
    print("📋 사용 가능한 Gemini 모델 목록:")
    print("-" * 30)
    
    # 모델 목록 조회 (페이지 단위로 가져옴)
    # 'generateContent' 기능이 있는 모델만 필터링해서 보여줍니다.
    for model in client.models.list():
        if "generateContent" in model.supported_actions:
            # 모델 이름에서 'models/' 접두사 제거하고 출력
            model_id = model.name.replace("models/", "")
            print(f"✨ {model_id}")
            
    print("-" * 30)

except Exception as e:
    print(f"❌ 에러 발생: {e}")
