"""
Altro esempio di test di integrazione, sullo stesso modello di
test_auth_api.py, ma sulle Procedure. Qui il punto interessante è la
regola di isolamento dati per il ruolo Customer: un Customer deve vedere
SOLO le procedure del proprio cliente, mai quelle degli altri (vedi
services/procedure_service.py: get_procedure_by_id e get_all_procedures).
"""
import uuid


def test_engineer_can_create_a_procedure(auth_client):
    client, _user = auth_client

    response = client.post(
        "/api/procedures/",
        json={"title": "Procedura di test", "description": "Una descrizione"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["title"] == "Procedura di test"


def test_customer_cannot_create_a_procedure(client, user_factory, login):
    customer_user = user_factory(email="cliente@example.com", role_name="Customer")
    login(customer_user)

    response = client.post(
        "/api/procedures/",
        json={"title": "Procedura vietata", "description": None},
    )

    assert response.status_code == 403


def test_get_procedure_by_id_returns_404_for_unknown_id(auth_client):
    client, _user = auth_client

    response = client.get(f"/api/procedures/{uuid.uuid4()}")

    assert response.status_code == 404


def test_customer_cannot_access_a_procedure_of_another_customer(
    client, user_factory, customer_factory, login
):
    own_customer = customer_factory(name="Cliente Proprio", vat_number="IT00000000001")
    other_customer = customer_factory(name="Cliente Altrui", vat_number="IT00000000002")

    engineer = user_factory(email="autore@example.com", role_name="Engineer")
    login(engineer)
    create_response = client.post(
        "/api/procedures/",
        json={
            "title": "Procedura del cliente altrui",
            "description": None,
            "customer_id": str(other_customer.id),
        },
    )
    procedure_id = create_response.json()["id"]

    customer_user = user_factory(
        email="cliente.proprio@example.com",
        role_name="Customer",
        customer_id=own_customer.id,
    )
    login(customer_user)

    response = client.get(f"/api/procedures/{procedure_id}")

    assert response.status_code == 403


def test_customer_can_access_a_procedure_of_their_own_customer(
    client, user_factory, customer_factory, login
):
    own_customer = customer_factory(name="Cliente Proprio", vat_number="IT00000000003")

    engineer = user_factory(email="autore2@example.com", role_name="Engineer")
    login(engineer)
    create_response = client.post(
        "/api/procedures/",
        json={
            "title": "Procedura del cliente proprio",
            "description": None,
            "customer_id": str(own_customer.id),
        },
    )
    procedure_id = create_response.json()["id"]

    customer_user = user_factory(
        email="cliente.proprio2@example.com",
        role_name="Customer",
        customer_id=own_customer.id,
    )
    login(customer_user)

    response = client.get(f"/api/procedures/{procedure_id}")

    assert response.status_code == 200
    assert response.json()["id"] == procedure_id


def test_procedures_list_is_filtered_by_customer_for_customer_role(
    client, user_factory, customer_factory, login
):
    customer_a = customer_factory(name="Cliente A", vat_number="IT00000000004")
    customer_b = customer_factory(name="Cliente B", vat_number="IT00000000005")

    engineer = user_factory(email="autore3@example.com", role_name="Engineer")
    login(engineer)
    client.post(
        "/api/procedures/",
        json={"title": "Procedura A", "description": None, "customer_id": str(customer_a.id)},
    )
    client.post(
        "/api/procedures/",
        json={"title": "Procedura B", "description": None, "customer_id": str(customer_b.id)},
    )

    customer_user = user_factory(
        email="cliente.a@example.com", role_name="Customer", customer_id=customer_a.id
    )
    login(customer_user)

    response = client.get("/api/procedures/")

    assert response.status_code == 200
    titles = [item["title"] for item in response.json()["items"]]
    assert titles == ["Procedura A"]
