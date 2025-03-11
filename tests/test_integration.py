"""
tests/test_integration.py
-------------------------
Production-ready integration tests for TaskFable.
These tests simulate multiple users, creating Quest Logs (boards), tasks,
status transitions, invite link generation/acceptance, and activity logging.
After tests run, they clean up test data by deleting created Quest Logs.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

# Ensure the project root is in sys.path.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app  # With relative imports in main.py, this should work.
client = TestClient(app)

# Sample test users.
USER1 = {"identifier": "alice_test", "password": "password123", "email": "alice_test@example.com"}
USER2 = {"identifier": "bob_test", "password": "password123", "email": "bob_test@example.com"}

@pytest.fixture(scope="module")
def test_users():
    """Ensure test users exist and return them."""
    response1 = client.post("/users/login", json=USER1)
    response2 = client.post("/users/login", json=USER2)
    assert response1.status_code in (200, 201), f"User1 login failed: {response1.text}"
    assert response2.status_code in (200, 201), f"User2 login failed: {response2.text}"
    user1 = response1.json()["user"]
    user2 = response2.json()["user"]
    return user1, user2

@pytest.fixture(scope="module")
def cleanup_questlogs(test_users):
    """
    Cleanup: After tests, delete all quest logs created by test users.
    """
    yield
    user1, user2 = test_users
    for user in [user1, user2]:
        list_resp = client.get(f"/questlogs?username={user['username']}")
        if list_resp.status_code == 200:
            ql_list = list_resp.json()
            for ql in ql_list:
                # Delete quest log using the owner username.
                del_resp = client.delete(f"/questlogs/{ql['id']}?username={user['username']}")
                if del_resp.status_code != 200:
                    print(f"Warning: Could not delete quest log {ql['id']} for user {user['username']}")
    # Additionally, purge tasks.
    purge_resp = client.post("/tasks/dev/purge")
    assert purge_resp.status_code == 200
    print("Test quest logs and tasks cleaned up.")

def test_quest_log_creation_and_access(test_users, cleanup_questlogs):
    """Test creation and access of a Quest Log and associated tasks."""
    user1, user2 = test_users

    # User1 creates a Quest Log.
    ql_response = client.post("/questlogs", json={"name": "Test Board", "owner_username": user1["username"]})
    assert ql_response.status_code == 200, f"Quest log creation failed: {ql_response.text}"
    ql_data = ql_response.json()
    assert "quest_log_id" in ql_data, "No quest_log_id in response"
    ql_id = ql_data["quest_log_id"]

    # User1 lists their quest logs.
    list_response = client.get(f"/questlogs?username={user1['username']}")
    assert list_response.status_code == 200, f"Listing quest logs failed: {list_response.text}"
    ql_list = list_response.json()
    assert any(ql["id"] == ql_id for ql in ql_list), "Created quest log not found in list"

    # User1 creates a task in this Quest Log.
    task_data = {
        "title": "Test Task 1",
        "description": "This is a test task",
        "color": "blue",
        "owner_username": user1["username"],
        "co_owners": "",
        "quest_log_id": ql_id
    }
    task_response = client.post("/tasks", json=task_data)
    assert task_response.status_code == 200, f"Task creation failed: {task_response.text}"
    task_id = task_response.json()["task_id"]

    # User2 (not a member) should not see tasks in this board.
    tasks_response_user2 = client.get(f"/tasks?viewer_username={user2['username']}&quest_log_id={ql_id}")
    assert tasks_response_user2.status_code == 200, f"Task listing failed: {tasks_response_user2.text}"
    tasks_user2 = tasks_response_user2.json()
    assert len(tasks_user2) == 0, "User2 should not see tasks before joining the board"

    # User1 generates an invite link.
    invite_response = client.post(
        f"/questlogs/{ql_id}/invite?username={user1['username']}",
        json={"expires_in_hours": 48, "is_permanent": False}
    )
    assert invite_response.status_code == 200, f"Invite generation failed: {invite_response.text}"
    token = invite_response.json()["token"]

    # User2 accepts the invite as a spectator.
    accept_response = client.post(
        "/questlogs/invite/accept",
        json={"token": token, "username": user2["username"], "action": "spectate"}
    )
    assert accept_response.status_code == 200, f"Invite acceptance failed: {accept_response.text}"

    # Now User2 should see tasks in the board.
    tasks_response_user2_after = client.get(f"/tasks?viewer_username={user2['username']}&quest_log_id={ql_id}")
    assert tasks_response_user2_after.status_code == 200, f"Task listing after invite failed: {tasks_response_user2_after.text}"
    tasks_user2_after = tasks_response_user2_after.json()
    assert len(tasks_user2_after) >= 1, "User2 should see tasks after joining as spectator"

def test_task_status_transitions(test_users, cleanup_questlogs):
    """Test task status transitions and locking."""
    user1, _ = test_users

    # Create a new Quest Log.
    ql_response = client.post("/questlogs", json={"name": "Status Board", "owner_username": user1["username"]})
    assert ql_response.status_code == 200, f"Status Board creation failed: {ql_response.text}"
    ql_id = ql_response.json()["quest_log_id"]

    # Create a task.
    task_payload = {
        "title": "Status Test Task",
        "description": "Testing status transitions",
        "color": "red",
        "owner_username": user1["username"],
        "co_owners": "",
        "quest_log_id": ql_id
    }
    task_response = client.post("/tasks", json=task_payload)
    assert task_response.status_code == 200, f"Task creation failed: {task_response.text}"
    task_id = task_response.json()["task_id"]

    # Transition from To-Do to Doing.
    status_payload = {"new_status": "Doing", "username": user1["username"]}
    status_response = client.put(f"/tasks/{task_id}/status", json=status_payload)
    assert status_response.status_code == 200, f"Status update to Doing failed: {status_response.text}"

    # Transition from Doing to Done.
    status_payload_done = {"new_status": "Done", "username": user1["username"]}
    status_response_done = client.put(f"/tasks/{task_id}/status", json=status_payload_done)
    assert status_response_done.status_code == 200, f"Status update to Done failed: {status_response_done.text}"

    # Verify the task is locked.
    tasks_response = client.get(f"/tasks?viewer_username={user1['username']}&quest_log_id={ql_id}")
    assert tasks_response.status_code == 200, f"Fetching tasks failed: {tasks_response.text}"
    tasks_list = tasks_response.json()
    task = next((t for t in tasks_list if t["id"] == task_id), None)
    assert task is not None, "Task not found after status transitions"
    assert task["locked"] is True, "Task should be locked after being marked Done"

def test_activity_logging(test_users, cleanup_questlogs):
    """Test that quest log activities are recorded properly."""
    user1, _ = test_users

    # Create a new Quest Log.
    ql_response = client.post("/questlogs", json={"name": "Activity Board", "owner_username": user1["username"]})
    assert ql_response.status_code == 200, f"Activity Board creation failed: {ql_response.text}"
    ql_id = ql_response.json()["quest_log_id"]

    # Generate an invite.
    invite_response = client.post(
        f"/questlogs/{ql_id}/invite?username={user1['username']}",
        json={"expires_in_hours": 48, "is_permanent": False}
    )
    assert invite_response.status_code == 200, f"Invite generation failed: {invite_response.text}"

    # Fetch activity logs.
    activities_response = client.get(f"/questlogs/{ql_id}/activities")
    assert activities_response.status_code == 200, f"Fetching activities failed: {activities_response.text}"
    activities = activities_response.json()
    assert len(activities) >= 2, "Insufficient activity logs recorded"

if __name__ == "__main__":
    pytest.main()
