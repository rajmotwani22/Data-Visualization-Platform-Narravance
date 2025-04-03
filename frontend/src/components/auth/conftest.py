# backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import app, get_db
from models import Base

# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def test_db():
    # Create the test database and tables
    Base.metadata.create_all(bind=engine)
    
    # Create a session for testing
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
    # Clean up after test
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    # Override the dependency to use the test database
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides = {}

@pytest.fixture
def test_user():
    return {
        "username": "testuser",
        "password": "password",
        "email": "test@example.com"
    }

@pytest.fixture
def auth_headers(client, test_user):
    # Get authentication token
    response = client.post(
        "/api/token",
        data={
            "username": "admin",  # Use the default admin user
            "password": "password"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}