# backend/tests/test_auth.py
import pytest
from fastapi.testclient import TestClient

def test_login_success(client):
    response = client.post(
        "/api/token",
        data={
            "username": "admin",
            "password": "password"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    response = client.post(
        "/api/token",
        data={
            "username": "admin",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_get_current_user(client, auth_headers):
    response = client.get("/api/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "admin"

def test_unauthorized_access(client):
    response = client.get("/api/tasks")
    assert response.status_code == 401

# Add to backend/tests/test_auth.py

def test_register_user(client):
    new_user = {
        "username": "newuser",
        "email": "new@example.com",
        "password": "newpassword"
    }
    response = client.post("/api/register", json=new_user)
    assert response.status_code == 200
    assert response.json()["message"] == "User registered successfully"
    
    # Try to register the same user again (should fail)
    response = client.post("/api/register", json=new_user)
    assert response.status_code == 400
    
    # Try to login with the new user
    login_response = client.post(
        "/api/token",
        data={
            "username": new_user["username"],
            "password": new_user["password"]
        }
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()