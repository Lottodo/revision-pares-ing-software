import pytest
import requests
import os

BASE_URL = "http://localhost:3000/api"

@pytest.fixture(scope="session")
def api():
    """Session to keep cookies/auth across requests"""
    session = requests.Session()
    return session

def test_01_login_admin(api):
    response = api.post(f"{BASE_URL}/auth/login", json={
        "username": "admin_root",
        "password": "1234"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "data" in data, "No data in response"
    token = data["data"].get("token")
    assert token, "No token found in response"
    
    # Set the token for subsequent requests
    api.headers.update({"Authorization": f"Bearer {token}"})

def test_02_get_events(api):
    response = api.get(f"{BASE_URL}/events")
    assert response.status_code == 200, f"Get events failed: {response.text}"
    assert isinstance(response.json().get("data"), list)

def test_03_get_users(api):
    response = api.get(f"{BASE_URL}/users")
    assert response.status_code == 200, f"Get users failed: {response.text}"
    assert isinstance(response.json().get("data"), list)

def test_04_create_event(api):
    payload = {
        "name": "Test Event Automation",
        "slug": "test-auto",
        "description": "Created by automated test",
        "active": True
    }
    response = api.post(f"{BASE_URL}/events", json=payload)
    # Check if we can create an event
    assert response.status_code in [201, 200], f"Create event failed: {response.text}"
    
def test_05_assign_role(api):
    # Try assigning a role to a user
    # Need to fetch a user first
    users_resp = api.get(f"{BASE_URL}/users")
    users = users_resp.json().get("data", [])
    assert len(users) > 0, "No users found"
    target_user = next((u for u in users if u["username"] == "multi_user"), users[0])
    
    events_resp = api.get(f"{BASE_URL}/events")
    events = events_resp.json().get("data", [])
    assert len(events) > 0, "No events found"
    target_event = events[0]

    payload = {
        "userId": target_user["id"],
        "eventId": target_event["id"],
        "role": "EDITOR"
    }
    response = api.post(f"{BASE_URL}/users/roles/assign", json=payload)
    assert response.status_code in [201, 200], f"Assign role failed: {response.text}"

def test_06_verify_access_after_role_assignment(api):
    """
    Simulate the bug mentioned: users lose access after role assignment.
    We test if the API still considers the user authenticated.
    """
    response = api.get(f"{BASE_URL}/auth/me")
    assert response.status_code == 200, f"Lost access after role assignment! {response.text}"

