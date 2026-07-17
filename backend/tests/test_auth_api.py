"""
Test di integrazione: passano dalla vera app FastAPI (TestClient), quindi
esercitano router + service + repository + database di test tutti insieme.
Più lenti dei test unitari, ma verificano che i pezzi funzionino insieme
davvero (validazione Pydantic, status code HTTP, cookie di sessione...).
"""


def test_register_new_user_returns_201_like_response_with_default_role(client, role_factory):
    role_factory("Engineer")  # create_user assegna sempre il ruolo "Engineer" di default

    response = client.post(
        "/api/auth/users/",
        json={
            "email": "nuovo.utente@example.com",
            "first_name": "Nuovo",
            "last_name": "Utente",
            "password": "Password123!",
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["email"] == "nuovo.utente@example.com"
    assert body["role"] == "Engineer"
    assert "password" not in body  # non deve mai trapelare, nemmeno hashata


def test_register_with_duplicate_email_returns_400(client, user_factory):
    user_factory(email="gia.registrato@example.com")

    response = client.post(
        "/api/auth/users/",
        json={
            "email": "gia.registrato@example.com",
            "first_name": "Altro",
            "last_name": "Utente",
            "password": "Password123!",
        },
    )

    assert response.status_code == 400
    assert "già registrata" in response.json()["detail"]


def test_login_with_correct_credentials_sets_auth_cookie(client, user_factory):
    user_factory(email="login.ok@example.com", password="Password123!")

    response = client.post(
        "/api/auth/login",
        data={"username": "login.ok@example.com", "password": "Password123!"},
    )

    assert response.status_code == 200
    assert "access_token" in response.cookies


def test_login_with_wrong_password_returns_401(client, user_factory):
    user_factory(email="login.ko@example.com", password="Password123!")

    response = client.post(
        "/api/auth/login",
        data={"username": "login.ko@example.com", "password": "PasswordSbagliata"},
    )

    assert response.status_code == 401


def test_login_with_inactive_account_returns_403(client, user_factory):
    user_factory(email="disattivato@example.com", password="Password123!", is_active=False)

    response = client.post(
        "/api/auth/login",
        data={"username": "disattivato@example.com", "password": "Password123!"},
    )

    assert response.status_code == 403


def test_me_without_cookie_returns_401(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_with_valid_session_returns_current_user(auth_client):
    client, user = auth_client

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == user.email


def test_only_admin_can_list_users(auth_client):
    """auth_client è un Engineer: la lista utenti è riservata agli Admin."""
    client, _user = auth_client

    response = client.get("/api/auth/users/")

    assert response.status_code == 403
