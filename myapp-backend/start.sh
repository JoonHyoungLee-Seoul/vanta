#!/bin/bash

# 프로덕션 환경에서 FastAPI 애플리케이션 실행
# Gunicorn + Uvicorn workers 사용

# 환경 변수가 설정되어 있는지 확인
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file with required environment variables."
    exit 1
fi

# 가상환경 활성화 (필요한 경우)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Gunicorn으로 애플리케이션 실행
# -w: worker 프로세스 수 (CPU 코어 수 * 2 + 1 권장)
# -k: worker 클래스 (uvicorn.workers.UvicornWorker 사용)
# --bind: 바인딩할 주소와 포트
# --access-logfile: 액세스 로그 파일
# --error-logfile: 에러 로그 파일
# --log-level: 로그 레벨

exec gunicorn main:app \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    --log-level info \
    --timeout 120
