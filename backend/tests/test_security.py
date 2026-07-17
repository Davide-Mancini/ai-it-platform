"""
Test "unitari puri": nessun database, nessuna richiesta HTTP, nessuna
fixture custom. Solo funzioni pure prese in input/output. È il tipo di
test più semplice da scrivere ed è un buon punto di partenza.
"""
from security.security import (
    create_access_token,
    get_password_hash,
    verify_access_token,
    verify_password,
)


def test_password_hash_is_never_equal_to_the_plain_password():
    hashed = get_password_hash("SuperSegreta123!")

    assert hashed != "SuperSegreta123!"


def test_verify_password_accepts_the_correct_password():
    hashed = get_password_hash("SuperSegreta123!")

    assert verify_password("SuperSegreta123!", hashed) is True


def test_verify_password_rejects_a_wrong_password():
    hashed = get_password_hash("SuperSegreta123!")

    assert verify_password("PasswordSbagliata", hashed) is False


def test_access_token_round_trip_returns_the_original_email():
    token = create_access_token(data={"sub": "utente@example.com"})

    assert verify_access_token(token) == "utente@example.com"


def test_verify_access_token_rejects_a_garbage_token():
    assert verify_access_token("questo-non-e-un-jwt-valido") is None
