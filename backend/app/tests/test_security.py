from uuid import uuid4

import pytest

from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.enums import UserRole


def test_password_hash_verification():
    hashed_password = hash_password("correct-password")

    assert verify_password("correct-password", hashed_password)
    assert not verify_password("wrong-password", hashed_password)


def test_access_token_contains_user_identity_and_role():
    user_id = uuid4()
    token = create_access_token(user_id=user_id, role=UserRole.ADMIN)

    payload = decode_access_token(token)

    assert payload["sub"] == str(user_id)
    assert payload["role"] == UserRole.ADMIN.value


def test_invalid_access_token_is_rejected():
    with pytest.raises(AppError):
        decode_access_token("invalid-token")
