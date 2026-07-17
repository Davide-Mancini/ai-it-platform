"""
Test di integrazione (via TestClient) per gli endpoint di
api/endpoints/procedure_review_endpoint.py. Il client Gemini è mockato
(vedi tests/README.md, sezione 6) per non fare mai vere chiamate a Google.
"""
import json

from services.gemini_service import RoleChecker  # noqa: F401  solo per chiarezza del pattern testato


class _FakeGeminiResponse:
    def __init__(self, payload: dict):
        self.text = json.dumps(payload)


def _mock_ai_client(monkeypatch):
    fake_client = type("FakeClient", (), {})()
    fake_models = type("FakeModels", (), {})()
    fake_models.generate_content = lambda *a, **k: _FakeGeminiResponse({"findings": []})
    fake_client.models = fake_models
    monkeypatch.setattr("services.gemini_service.ai_client", fake_client)


def test_non_admin_cannot_trigger_review(client, user_factory, login):
    engineer = user_factory(email="engineer@example.com", role_name="Engineer")
    login(engineer)

    response = client.post("/api/procedure-review/run")

    assert response.status_code == 403


def test_admin_can_trigger_review(client, user_factory, login, monkeypatch):
    _mock_ai_client(monkeypatch)
    admin = user_factory(email="admin@example.com", role_name="Admin")
    login(admin)

    response = client.post("/api/procedure-review/run")

    assert response.status_code == 202
    body = response.json()
    assert body["status"] in ("running", "completed")
    assert "run_id" in body


def test_non_admin_cannot_list_findings(client, user_factory, login):
    engineer = user_factory(email="engineer2@example.com", role_name="Engineer")
    login(engineer)

    response = client.get("/api/procedure-review/findings")

    assert response.status_code == 403


def test_admin_can_list_findings_empty(client, user_factory, login):
    admin = user_factory(email="admin2@example.com", role_name="Admin")
    login(admin)

    response = client.get("/api/procedure-review/findings")

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0


def test_reject_unknown_finding_returns_404(client, user_factory, login):
    admin = user_factory(email="admin3@example.com", role_name="Admin")
    login(admin)

    response = client.post("/api/procedure-review/findings/00000000-0000-0000-0000-000000000000/reject")

    assert response.status_code == 404
