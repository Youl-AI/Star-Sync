from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # 👈 추가된 보안 도구
from pydantic import BaseModel
from logic import get_natal_chart_data, get_ai_interpretation

app = FastAPI(
    title="Star Sync API",
    description="점성술 운세 분석 백엔드 서버",
    version="1.0.0"
)

# 🔓 CORS 설정 (모든 곳에서 접속 허용)
# 주의: 실제 배포할 때는 'allow_origins'에 내 웹사이트 주소만 넣어야 안전합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 주소 허용 (테스트용)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    name: str
    year: int
    month: int
    day: int
    hour: int
    minute: int
    city: str
    country: str
    concern: str

@app.get("/")
def read_root():
    return {"status": "Server is running 🚀"}

@app.post("/analyze")
async def analyze_star(request: AnalysisRequest):
    # 1. 차트 데이터 계산
    chart_data = get_natal_chart_data(
        request.name, request.year, request.month, request.day,
        request.hour, request.minute, request.city, request.country
    )
    
    if "error" in chart_data:
        raise HTTPException(status_code=400, detail=chart_data["error"])

    # 2. AI 해석
    ai_result = get_ai_interpretation(chart_data, request.concern)
    
    return {
        "user_name": request.name,
        "chart_data": chart_data,
        "ai_message": ai_result
    }
