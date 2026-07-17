"""
Test "a livello di service": niente TestClient, chiamiamo direttamente le
funzioni Python in services/task_service.py passando db_session e uno user
finto. Sono più veloci di un test HTTP end-to-end e più mirati: utili per
coprire le regole di business (chi può fare cosa) senza preoccuparsi di
routing, schema Pydantic o serializzazione JSON.
"""
import uuid

import pytest
from fastapi import HTTPException

import schemas
from models.procedure import Procedure
from models.task import Task
from services import task_service


@pytest.fixture()
def procedure_with_task(db_session, user_factory):
    author = user_factory(email="autore@example.com", role_name="Engineer")
    procedure = Procedure(title="Procedura di test", user_id=author.id)
    db_session.add(procedure)
    db_session.commit()

    task = Task(title="Task di test", status="pending", priority="low", procedure_id=procedure.id)
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    return task


def test_customer_cannot_change_task_priority(db_session, user_factory, procedure_with_task):
    customer = user_factory(email="cliente@example.com", role_name="Customer")
    update = schemas.TaskUpdatePriority(priority="high")

    with pytest.raises(HTTPException) as exc_info:
        task_service.update_task_priority(
            task_id=str(procedure_with_task.id),
            priority_update=update,
            db=db_session,
            current_user=customer,
        )

    assert exc_info.value.status_code == 403


def test_engineer_can_change_task_priority(db_session, user_factory, procedure_with_task):
    engineer = user_factory(email="tecnico@example.com", role_name="Engineer")
    update = schemas.TaskUpdatePriority(priority="critical")

    updated_task = task_service.update_task_priority(
        task_id=str(procedure_with_task.id),
        priority_update=update,
        db=db_session,
        current_user=engineer,
    )

    assert updated_task.priority == "critical"


def test_update_priority_on_missing_task_returns_404(db_session, user_factory):
    engineer = user_factory(email="tecnico2@example.com", role_name="Engineer")
    update = schemas.TaskUpdatePriority(priority="high")

    with pytest.raises(HTTPException) as exc_info:
        task_service.update_task_priority(
            task_id=str(uuid.uuid4()),
            priority_update=update,
            db=db_session,
            current_user=engineer,
        )

    assert exc_info.value.status_code == 404


def test_only_admin_can_assign_a_task(db_session, user_factory, procedure_with_task):
    engineer = user_factory(email="non.admin@example.com", role_name="Engineer")
    assignee = user_factory(email="assegnatario@example.com", role_name="Engineer")

    with pytest.raises(HTTPException) as exc_info:
        task_service.assign_user_to_task(
            task_id=str(procedure_with_task.id),
            user_id=assignee.id,
            db=db_session,
            current_user=engineer,
        )

    assert exc_info.value.status_code == 403


def test_admin_assigns_a_task_and_it_appears_in_assigned_users(db_session, user_factory, procedure_with_task):
    admin = user_factory(email="admin@example.com", role_name="Admin")
    assignee = user_factory(email="assegnatario2@example.com", role_name="Engineer")

    task = task_service.assign_user_to_task(
        task_id=str(procedure_with_task.id),
        user_id=assignee.id,
        db=db_session,
        current_user=admin,
    )

    assert assignee.id in [u.id for u in task.assigned_users]
