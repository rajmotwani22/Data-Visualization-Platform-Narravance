# backend/tests/test_app.py
import pytest
from fastapi.testclient import TestClient

def test_get_tasks_empty(client, auth_headers):
    response = client.get("/api/tasks", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

def test_create_task(client, auth_headers):
    task_data = {
        "source_a": {
            "companies": ["Toyota"],
            "start_date": "2023-01-01"
        },
        "source_b": {
            "companies": ["Honda"],
            "start_date": "2023-01-01"
        }
    }
    response = client.post("/api/tasks", json=task_data, headers=auth_headers)
    assert response.status_code == 201
    assert response.json()["status"] == "pending"
    assert "id" in response.json()

def test_get_task_not_found(client, auth_headers):
    response = client.get("/api/tasks/999", headers=auth_headers)
    assert response.status_code == 404

def test_get_task_exists(client, auth_headers):
    # First create a task
    task_data = {
        "source_a": {"companies": ["Toyota"]},
        "source_b": {"companies": ["Honda"]}
    }
    create_response = client.post("/api/tasks", json=task_data, headers=auth_headers)
    task_id = create_response.json()["id"]
    
    # Then get the task
    response = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == task_id

def test_get_companies_empty(client, auth_headers):
    response = client.get("/api/companies", headers=auth_headers)
    assert response.status_code == 200
    # Initially may be empty until data is processed
    assert isinstance(response.json(), list)

def test_get_models_empty(client, auth_headers):
    response = client.get("/api/models", headers=auth_headers)
    assert response.status_code == 200
    # Initially may be empty until data is processed
    assert isinstance(response.json(), list)