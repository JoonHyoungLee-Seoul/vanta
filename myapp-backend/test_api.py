#!/usr/bin/env python3
"""
FastAPI 서버 테스트 스크립트
사용법: python test_api.py
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def print_response(response, title):
    """응답을 예쁘게 출력"""
    print(f"\n{'='*60}")
    print(f"📌 {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    print(f"{'='*60}\n")
    return response.json()

def test_full_registration_flow():
    """전체 회원가입 플로우 테스트"""

    print("\n🚀 회원가입 플로우 테스트 시작\n")

    # 1. 초대코드 검증
    print("1️⃣ 초대코드 검증 중...")

    # 사용 가능한 초대코드 중 하나를 사용
    test_codes = ["TEST010", "TEST011", "TEST012", "TEST013", "TEST014", "TEST015"]
    invitation_code = test_codes[0]  # 첫 번째 코드 사용

    print(f"   초대코드: {invitation_code}")
    response = requests.post(
        f"{BASE_URL}/auth/invitation/verify",
        json={"invitation_code": invitation_code}
    )
    result = print_response(response, "초대코드 검증 결과")

    if not result.get("valid"):
        print("❌ 초대코드가 유효하지 않습니다. 테스트를 중단합니다.")
        print(f"💡 초대코드 '{invitation_code}'가 사용 불가능합니다.")
        print("   다음 명령어로 새 초대코드를 생성하세요:")
        print("   npx prisma studio")
        print("   또는 SQL: INSERT INTO \"Invitation\" (code, is_used) VALUES ('TEST999', false);")
        return

    session_id = result.get("sessionId")
    print(f"✅ 세션 ID 획득: {session_id}")

    # 2. 이름 저장
    print("\n2️⃣ 이름 저장 중...")
    response = requests.put(
        f"{BASE_URL}/auth/register/name",
        json={
            "session_id": session_id,
            "name": "테스트유저"
        }
    )
    print_response(response, "이름 저장 결과")

    # 3. 생년월일 저장
    print("\n3️⃣ 생년월일 저장 중...")
    response = requests.put(
        f"{BASE_URL}/auth/register/birthday",
        json={
            "session_id": session_id,
            "birthday": "1995-05-15"
        }
    )
    print_response(response, "생년월일 저장 결과")

    # 4. 휴대폰 저장
    print("\n4️⃣ 휴대폰 번호 저장 중...")
    response = requests.put(
        f"{BASE_URL}/auth/register/phone",
        json={
            "session_id": session_id,
            "phone": "010-9876-5432"
        }
    )
    print_response(response, "휴대폰 저장 결과")

    # 5. 비밀번호 저장 + User 생성
    print("\n5️⃣ 비밀번호 저장 및 사용자 생성 중...")
    response = requests.put(
        f"{BASE_URL}/auth/register/password",
        json={
            "session_id": session_id,
            "password": "testPassword123!"
        }
    )
    result = print_response(response, "최종 사용자 생성 결과")

    if result.get("ok"):
        print(f"\n🎉 회원가입 완료! User ID: {result.get('userId')}")
    else:
        print(f"\n❌ 회원가입 실패: {result.get('message')}")

def test_individual_endpoints():
    """개별 엔드포인트 테스트"""

    print("\n🔍 개별 엔드포인트 테스트\n")

    # 잘못된 초대코드 테스트
    print("❌ 잘못된 초대코드 테스트...")
    response = requests.post(
        f"{BASE_URL}/auth/invitation/verify",
        json={"invitation_code": "INVALID_CODE"}
    )
    print_response(response, "잘못된 초대코드")

    # 잘못된 세션 테스트
    print("❌ 잘못된 세션 ID 테스트...")
    response = requests.put(
        f"{BASE_URL}/auth/register/name",
        json={
            "session_id": "invalid-session-id",
            "name": "테스트",
            "password": "test123"
        }
    )
    print_response(response, "잘못된 세션 ID")

if __name__ == "__main__":
    try:
        # 서버 연결 확인
        print("🔌 서버 연결 확인 중...")
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ 서버가 정상적으로 실행 중입니다!")

        # 메뉴 선택
        print("\n" + "="*60)
        print("테스트 옵션을 선택하세요:")
        print("="*60)
        print("1. 전체 회원가입 플로우 테스트")
        print("2. 개별 엔드포인트 테스트")
        print("3. 둘 다 실행")
        print("="*60)

        choice = input("\n선택 (1-3): ").strip()

        if choice == "1":
            test_full_registration_flow()
        elif choice == "2":
            test_individual_endpoints()
        elif choice == "3":
            test_individual_endpoints()
            test_full_registration_flow()
        else:
            print("❌ 잘못된 선택입니다.")

    except requests.exceptions.ConnectionError:
        print("❌ 서버에 연결할 수 없습니다.")
        print("💡 서버가 실행 중인지 확인하세요: uvicorn main:app --reload")
    except KeyboardInterrupt:
        print("\n\n⚠️  테스트가 사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
