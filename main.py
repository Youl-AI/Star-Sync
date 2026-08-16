import os
import re
import hmac
import hashlib
import time
import requests
import json
import urllib.parse
from dotenv import load_dotenv

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from logic import get_natal_chart_data, get_ai_interpretation, get_fortune_year

# 1. 환경 변수(.env)에서 쿠팡 API 키 불러오기
load_dotenv()
COUPANG_ACCESS_KEY = os.getenv("COUPANG_ACCESS_KEY")
COUPANG_SECRET_KEY = os.getenv("COUPANG_SECRET_KEY")

app = FastAPI(title="별샘 API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
    lang: str = "ko" 

# 🌟 쿠팡 파트너스 API 단축 링크 생성 함수
def get_coupang_affiliate_link(keyword: str) -> str:
    # API 키가 없으면 기본 링크 반환
    if not COUPANG_ACCESS_KEY or not COUPANG_SECRET_KEY:
        return "https://link.coupang.com/a/dPGEq7"

    DOMAIN = "https://api-gateway.coupang.com"
    URL = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink"
    
    encoded_keyword = urllib.parse.quote(keyword)
    search_url = f"https://www.coupang.com/np/search?q={encoded_keyword}"
    
    request_data = {"coupangUrls": [search_url]}
    
    method = "POST"
    
    # 🚨 [핵심 수정] 시간에 'T'와 'Z'를 포함한 정확한 GMT 포맷 생성
    datetime_gmt = time.strftime('%y%m%d', time.gmtime()) + 'T' + time.strftime('%H%M%S', time.gmtime()) + 'Z'
    
    # 암호화할 메시지에도 정확히 동일한 포맷을 넣어야 합니다.
    message = datetime_gmt + method + URL
    
    signature = hmac.new(
        bytes(COUPANG_SECRET_KEY, 'utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # 헤더에 들어갈 인증 문자열 생성
    authorization = f"CEA algorithm=HmacSHA256, access-key={COUPANG_ACCESS_KEY}, signed-date={datetime_gmt}, signature={signature}"
    
    headers = {
        "Authorization": authorization,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(DOMAIN + URL, headers=headers, data=json.dumps(request_data))
        response_data = response.json()
        
        # 성공 시 진짜 단축 링크 반환
        if response.status_code == 200 and response_data.get("data"):
            return response_data["data"][0]["shortenUrl"]
        else:
            print("⚠️ 쿠팡 API 응답 에러:", response_data)
            return "https://link.coupang.com/a/dPGEq7"
            
    except Exception as e:
        print("🔥 쿠팡 API 통신 에러:", e)
        return "https://link.coupang.com/a/dPGEq7"

@app.get("/")
def read_root():
    return {"status": "Server is running 🚀"}

@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    print(f"📝 요청 받음: {request.name}, {request.city}, 언어: {request.lang}")
    
    try:
        # 점성술 차트 데이터 계산
        chart_data = get_natal_chart_data(
            request.name, request.year, request.month, request.day,
            request.hour, request.minute, request.city, request.country
        )
        
        # 차트 계산에서 에러가 났는지 확인
        if "error" in chart_data:
            print(f"❌ 차트 계산 오류: {chart_data['error']}")
            return {"ai_message": f" 죄송합니다. 위치를 찾지 못했어요.\n오류 내용: {chart_data['error']}"}

        # AI 해석 요청
        ai_message = get_ai_interpretation(chart_data, request.concern, lang=request.lang)
        report_text = ai_message.get("report", "")
        
        # 🌟 AI가 뽑아준 키워드로 쿠팡 링크 실시간 생성
        match = re.search(r'\[\[(.*?)\]\]', report_text)
        if match:
            search_keyword = match.group(1).strip() # 예: "가죽 명함 지갑"
        else:
            search_keyword = ai_message.get("keyword", "행운의 아이템") # 만약 대괄호가 없으면 예비용 사용
            
        coupang_link = get_coupang_affiliate_link(search_keyword)
        
        print("✅ 분석 및 쿠팡 링크 생성 완료!")
        
        return {
            "ai_message": ai_message["report"],       
            "keyword": ai_message.get("keyword", f"{get_fortune_year()}운세"),
            
            "coupang_link": coupang_link, 
            "chart_data": {
                "sun": chart_data.get("Sun"),       
                "moon": chart_data.get("Moon"),     
                "rising": chart_data.get("Rising")  
            }
        }

    except Exception as e:
        print(f"🔥 치명적인 서버 에러: {str(e)}")
        return {"ai_message": f"서버 내부에서 알 수 없는 오류가 발생했습니다.\n개발자 도구의 에러 메시지: {str(e)}"}
