"""
Test "a livello di service" per l'agente di revisione periodica delle
procedure (services/procedure_review_service.py). Il client Gemini viene
sempre mockato (monkeypatch su services.gemini_service.ai_client) per non
fare mai vere chiamate a Google durante i test, come indicato in
tests/README.md.
"""
import json
import uuid

import pytest
from fastapi import HTTPException

import models
from models.procedure import Procedure
from models.procedure_version import ProcedureVersion
from models.procedure_steps import ProcedureStep
from services import procedure_review_service


class _FakeGeminiResponse:
    def __init__(self, payload: dict):
        self.text = json.dumps(payload)


def _mock_ai_client(monkeypatch, payload: dict):
    """Sostituisce ai_client.models.generate_content con una risposta finta e valida."""
    fake_client = type("FakeClient", (), {})()
    fake_models = type("FakeModels", (), {})()
    fake_models.generate_content = lambda *a, **k: _FakeGeminiResponse(payload)
    fake_client.models = fake_models
    monkeypatch.setattr("services.gemini_service.ai_client", fake_client)


@pytest.fixture()
def procedure_with_steps(db_session, user_factory):
    author = user_factory(email="autore@example.com", role_name="Engineer")
    procedure = Procedure(title="Procedura di test", user_id=author.id)
    db_session.add(procedure)
    db_session.flush()

    version = ProcedureVersion(procedure_id=procedure.id, version_number="1.0.0", status="published")
    db_session.add(version)
    db_session.flush()

    step1 = ProcedureStep(version_id=version.id, step_number=1, title="Step uno", description="Fai una cosa")
    step2 = ProcedureStep(version_id=version.id, step_number=2, title="Step due", description="Fai un'altra cosa")
    db_session.add_all([step1, step2])
    db_session.commit()
    db_session.refresh(procedure)
    db_session.refresh(version)
    return procedure, version


def _no_findings_payload():
    return {"findings": []}


def _one_finding_payload(title: str, severity: str = "high"):
    return {
        "findings": [
            {
                "procedure_title": title,
                "severity": severity,
                "category": "inefficiency",
                "summary": "Step ridondante",
                "rationale": "Lo step 2 duplica il lavoro dello step 1.",
                "proposed_changes": [
                    {"step_number": 2, "field": "description", "current_value": "Fai un'altra cosa", "proposed_value": "Descrizione migliorata"}
                ],
                "referenced_policy_titles": [],
                "referenced_document_titles": [],
            }
        ]
    }


def test_run_review_with_no_issues_creates_no_findings(db_session, procedure_with_steps, monkeypatch):
    _mock_ai_client(monkeypatch, _no_findings_payload())

    run = procedure_review_service.run_review(db_session, triggered_by="manual")

    assert run.status == "completed"
    assert run.procedures_reviewed == 1
    assert run.findings_count == 0


def test_run_review_creates_finding_and_notifies_admins_for_high_severity(
    db_session, procedure_with_steps, user_factory, monkeypatch
):
    procedure, _version = procedure_with_steps
    admin = user_factory(email="admin@example.com", role_name="Admin")
    _mock_ai_client(monkeypatch, _one_finding_payload(procedure.title, severity="high"))

    run = procedure_review_service.run_review(db_session, triggered_by="scheduler")

    assert run.status == "completed"
    assert run.findings_count == 1

    findings = db_session.query(models.ProcedureReviewFinding).filter(
        models.ProcedureReviewFinding.run_id == run.id
    ).all()
    assert len(findings) == 1
    assert findings[0].severity == "high"
    assert findings[0].status == "pending"

    notifications = db_session.query(models.Notification).filter(
        models.Notification.user_id == admin.id
    ).all()
    assert len(notifications) == 1
    assert notifications[0].type == "procedure_review"


def test_run_review_skips_procedures_with_an_existing_pending_finding(
    db_session, procedure_with_steps, monkeypatch
):
    procedure, _version = procedure_with_steps
    _mock_ai_client(monkeypatch, _one_finding_payload(procedure.title))

    first_run = procedure_review_service.run_review(db_session, triggered_by="manual")
    assert first_run.findings_count == 1

    second_run = procedure_review_service.run_review(db_session, triggered_by="manual")

    assert second_run.procedures_reviewed == 0
    assert second_run.findings_count == 0


def test_accept_finding_creates_new_version_with_proposed_changes(
    db_session, procedure_with_steps, user_factory, monkeypatch
):
    procedure, version = procedure_with_steps
    admin = user_factory(email="admin2@example.com", role_name="Admin")
    _mock_ai_client(monkeypatch, _one_finding_payload(procedure.title))

    run = procedure_review_service.run_review(db_session, triggered_by="manual")
    finding = db_session.query(models.ProcedureReviewFinding).filter(
        models.ProcedureReviewFinding.run_id == run.id
    ).first()

    new_version = procedure_review_service.accept_finding(db_session, str(finding.id), admin)

    assert new_version.procedure_id == procedure.id
    assert new_version.status == "draft"
    step2 = next(s for s in new_version.steps if s.step_number == 2)
    assert step2.description == "Descrizione migliorata"

    db_session.refresh(finding)
    assert finding.status == "accepted"
    assert finding.reviewed_by_id == admin.id


def test_accept_finding_twice_raises_400(db_session, procedure_with_steps, user_factory, monkeypatch):
    procedure, _version = procedure_with_steps
    admin = user_factory(email="admin3@example.com", role_name="Admin")
    _mock_ai_client(monkeypatch, _one_finding_payload(procedure.title))

    run = procedure_review_service.run_review(db_session, triggered_by="manual")
    finding = db_session.query(models.ProcedureReviewFinding).filter(
        models.ProcedureReviewFinding.run_id == run.id
    ).first()

    procedure_review_service.accept_finding(db_session, str(finding.id), admin)

    with pytest.raises(HTTPException) as exc_info:
        procedure_review_service.accept_finding(db_session, str(finding.id), admin)

    assert exc_info.value.status_code == 400


def test_dismiss_finding_marks_it_dismissed(db_session, procedure_with_steps, user_factory, monkeypatch):
    procedure, _version = procedure_with_steps
    admin = user_factory(email="admin4@example.com", role_name="Admin")
    _mock_ai_client(monkeypatch, _one_finding_payload(procedure.title))

    run = procedure_review_service.run_review(db_session, triggered_by="manual")
    finding = db_session.query(models.ProcedureReviewFinding).filter(
        models.ProcedureReviewFinding.run_id == run.id
    ).first()

    dismissed = procedure_review_service.dismiss_finding(db_session, str(finding.id), admin)

    assert dismissed.status == "dismissed"
    assert dismissed.reviewed_by_id == admin.id


def test_accept_finding_on_unknown_id_returns_404(db_session, user_factory):
    admin = user_factory(email="admin5@example.com", role_name="Admin")

    with pytest.raises(HTTPException) as exc_info:
        procedure_review_service.accept_finding(db_session, str(uuid.uuid4()), admin)

    assert exc_info.value.status_code == 404
