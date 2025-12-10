import os
from dotenv import load_dotenv

load_dotenv()

# 환경 변수
DATABASE_URL = os.getenv("DATABASE_URL")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-in-production")

# CORS 설정
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

# 결제 정보 (환경변수에서 읽음)
BANK_NAME = os.getenv("BANK_NAME", "우리은행")
BANK_ACCOUNT_NUMBER = os.getenv("BANK_ACCOUNT_NUMBER", "1002-83863-3924")
BANK_ACCOUNT_HOLDER = os.getenv("BANK_ACCOUNT_HOLDER", "받는분")
PAYMENT_AMOUNT = int(os.getenv("PAYMENT_AMOUNT", "25000"))

# JWT 설정 (인증 시스템용)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-jwt-secret-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

# 환경 검증
def validate_production_config():
    """프로덕션 환경에서 필수 설정이 올바른지 검증"""
    if ENVIRONMENT == "production":
        errors = []

        if not DATABASE_URL:
            errors.append("DATABASE_URL is not set")

        if SECRET_KEY == "default-secret-key-change-in-production":
            errors.append("SECRET_KEY is using default value. Change it in production!")

        if JWT_SECRET_KEY == "default-jwt-secret-change-in-production":
            errors.append("JWT_SECRET_KEY is using default value. Change it in production!")

        if len(SECRET_KEY) < 32:
            errors.append("SECRET_KEY should be at least 32 characters long")

        if len(JWT_SECRET_KEY) < 32:
            errors.append("JWT_SECRET_KEY should be at least 32 characters long")

        if "localhost" in ",".join(ALLOWED_ORIGINS) or "127.0.0.1" in ",".join(ALLOWED_ORIGINS):
            errors.append("ALLOWED_ORIGINS contains localhost in production. Add production domain!")

        if errors:
            error_msg = "Production configuration errors:\n" + "\n".join(f"  - {e}" for e in errors)
            raise ValueError(error_msg)

# 개발 환경인지 확인
IS_DEVELOPMENT = ENVIRONMENT == "development"
IS_PRODUCTION = ENVIRONMENT == "production"

# 프로덕션 환경에서 설정 검증
if IS_PRODUCTION:
    validate_production_config()
