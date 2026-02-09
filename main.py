# main.py
import os
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from logic import get_natal_chart_data, get_ai_interpretation

app = FastAPI(title="Star Sync API")

# 🔓 1. CORS 설정 (모든 문 열어두기)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # 모든 곳에서 접속 허용
    allow_credentials=False,  # 쿠키/인증 정보 차단 (충돌 방지)
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 받는 형식 정의
class AnalysisRequest(BaseModel):
    name: str
    year: int
    month: int
    day: int
    hour: int
    minute: int
    country: str
    city: str
    concern: str

@app.get("/")
def read_root():
    return {"status": "Server is running 🚀"}

@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    print(f"📝 요청 받음: {request.name}, {request.city}") # 로그 출력
    
    try:
        # 1. 점성술 차트 데이터 계산
        chart_data = get_natal_chart_data(
            request.name,
            request.year,
            request.month,
            request.day,
            request.hour,
            request.minute,
            request.city,
            request.country
        )
        
        # 🚨 [중요] 차트 계산에서 에러가 났는지 확인! (여기서 서버가 자주 죽음)
        if "error" in chart_data:
            print(f"❌ 차트 계산 오류: {chart_data['error']}")
            return {"ai_message": f" 죄송합니다. 위치를 찾지 못했어요.\n오류 내용: {chart_data['error']}"}

        # 2. AI 해석 요청
        ai_message = get_ai_interpretation(chart_data, request.concern)
        
        print("✅ 분석 완료!")
        return {"ai_message": ai_message}

    except Exception as e:
        # 🛡️ 무슨 일이 있어도 서버가 죽지 않게 방어!
        print(f"🔥 치명적인 서버 에러: {str(e)}")
        return {"ai_message": f"서버 내부에서 알 수 없는 오류가 발생했습니다.\n개발자 도구의 에러 메시지: {str(e)}"}
