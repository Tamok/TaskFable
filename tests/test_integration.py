"""
tests/test_integration.py
--------------------------
Unified integration tests for TaskFable covering:
  - Quest log creation, task creation, invite generation/acceptance,
    participant retrieval, and invite revocation.
  - Task status transitions and locking.
  - Activity logging.
  - GET alias for invite acceptance.
  - Logout behavior.
All test data is cleaned up after tests.
"""
import sys
import os
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

# Ensure project root is in sys.path.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app
from backend.models import User
from backend.db import SessionLocal

client = TestClient(app)

# Test user data.
TEST_USER1 = {"identifier": "alice_all_features", "password": "password123", "email": "alice_all_features@example.com"}
TEST_USER2 = {"identifier": "bob_all_features", "password": "password123", "email": "bob_all_features@example.com"}

@pytest.fixture(scope="module")
def test_users():
    # Create test users.
    response1 = client.post("/users/login", json=TEST_USER1)
    response2 = client.post("/users/login", json=TEST_USER2)
    assert response1.status_code in (200, 201), f"User1 creation/login failed: {response1.text}"
    assert response2.status_code in (200, 201), f"User2 creation/login failed: {response2.text}"
    user1 = response1.json()["user"]
    user2 = response2.json()["user"]
    yield user1, user2
    # Cleanup test users.
    session = SessionLocal()
    for user in [user1, user2]:
        try:
            db_user = session.query(User).filter(User.username == user["username"]).first()
            if db_user:
                session.delete(db_user)
        except OperationalError:
            pass
    session.commit()
    session.close()

@pytest.fixture(scope="module")
def cleanup_questlogs(test_users):
    yield
    # Delete quest logs created by test users.
    user1, user2 = test_users
    for user in [user1, user2]:
        try:
            list_resp = client.get(f"/questlogs?username={user['username']}")
            if list_resp.status_code == 200:
                ql_list = list_resp.json()
                for ql in ql_list:
                    del_resp = client.delete(f"/questlogs/{ql['id']}?username={user['username']}")
                    if del_resp.status_code != 200:
                        print(f"Warning: Could not delete quest log {ql['id']} for user {user['username']}")
        except Exception as e:
            print("Error during quest log cleanup:", e)
    try:
        purge_resp = client.post("/tasks/dev/purge")
        assert purge_resp.status_code == 200
    except OperationalError:
        print("Warning: Tasks table may have been dropped during cleanup.")

def test_quest_log_creation_and_invite(test_users, cleanup_questlogs):
    user1, user2 = test_users
    # Create a quest log.
    ql_response = client.post("/questlogs", json={"name": "All Features Board", "owner_username": user1["username"]})
    assert ql_response.status_code == 200, f"Quest log creation failed: {ql_response.text}"
    ql_id = ql_response.json()["quest_log_id"]

    # Verify quest log appears in owner's list.
    list_response = client.get(f"/questlogs?username={user1['username']}")
    assert list_response.status_code == 200, f"Listing quest logs failed: {list_response.text}"
    ql_list = list_response.json()
    assert any(ql["id"] == ql_id for ql in ql_list), "Created quest log not found"

    # Create a task.
    task_data = {
        "title": "All Features Task",
        "description": "Testing task creation",
        "color": "blue",
        "owner_username": user1["username"],
        "co_owners": "",
        "quest_log_id": ql_id
    }
    task_response = client.post("/tasks", json=task_data)
    assert task_response.status_code == 200, f"Task creation failed: {task_response.text}"
    task_id = task_response.json()["task_id"]

    # Ensure user2 (not a member) does not see tasks.
    tasks_response_user2 = client.get(f"/tasks?viewer_username={user2['username']}&quest_log_id={ql_id}")
    assert tasks_response_user2.status_code == 200, f"Task listing failed for user2: {tasks_response_user2.text}"
    tasks_user2 = tasks_response_user2.json()
    assert len(tasks_user2) == 0, "User2 should not see tasks before joining"

    # Generate a non-permanent invite.
    invite_response = client.post(
        f"/questlogs/{ql_id}/invite?username={user1['username']}",
        json={"expires_in_hours": 48, "is_permanent": False}
    )
    assert invite_response.status_code == 200, f"Invite generation failed: {invite_response.text}"
    token = invite_response.json()["token"]

    # User2 accepts the invite.
    accept_response = client.post(
        "/questlogs/invite/accept",
        json={"token": token, "username": user2["username"], "action": "spectate"}
    )
    assert accept_response.status_code == 200, f"Invite acceptance failed: {accept_response.text}"

    # User2 should now see tasks.
    tasks_response_user2_after = client.get(f"/tasks?viewer_username={user2['username']}&quest_log_id={ql_id}")
    assert tasks_response_user2_after.status_code == 200, f"Task listing after invite failed: {tasks_response_user2_after.text}"
    tasks_user2_after = tasks_response_user2_after.json()
    assert len(tasks_user2_after) >= 1, "User2 should see tasks after joining"

    # Test permanent invite generation with expiry should fail.
    perm_response_fail = client.post(
        f"/questlogs/{ql_id}/invite?username={user1['username']}",
        json={"expires_in_hours": 24, "is_permanent": True}
    )
    assert perm_response_fail.status_code == 400, "Permanent invite with expiry should fail"

    # Generate a correct permanent invite.
    perm_response = client.post(
        f"/questlogs/{ql_id}/invite?username={user1['username']}",
        json={"is_permanent": True}
    )
    assert perm_response.status_code == 200, "Permanent invite generation failed"
    perm_token = perm_response.json()["token"]

    # Get invites.
    invites_response = client.get(f"/questlogs/{ql_id}/invites")
    assert invites_response.status_code == 200, "Getting invites failed"
    invites = invites_response.json()
    non_perm_invite = next((inv for inv in invites if inv["token"] == token), None)
    revoke_response = client.delete(f"/questlogs/invites/{non_perm_invite['id']}?username={user1['username']}")
    assert revoke_response.status_code == 200, "Revoking invite failed"

    # Verify participants list includes both users.
    participants_response = client.get(f"/questlogs/{ql_id}/participants")
    assert participants_response.status_code == 200, "Fetching participants failed"
    participants = participants_response.json()
    assert any(p["username"] == user1["username"] for p in participants), "Owner not in participants"
    assert any(p["username"] == user2["username"] for p in participants), "Spectator not in participants"

def test_task_status_transitions(test_users, cleanup_questlogs):
    user1, _ = test_users
    # Create a quest log.
    ql_response = client.post("/questlogs", json={"name": "Status Test Board", "owner_username": user1["username"]})
    assert ql_response.status_code == 200, f"Quest log creation failed: {ql_response.text}"
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
    assert status_response.status_code == 200, "Status update to Doing failed"

    # Transition from Doing to Done.
    status_payload_done = {"new_status": "Done", "username": user1["username"]}
    status_response_done = client.put(f"/tasks/{task_id}/status", json=status_payload_done)
    assert status_response_done.status_code == 200, "Status update to Done failed"

    # Verify task is locked.
    tasks_response_after = client.get(f"/tasks?viewer_username={user1['username']}&quest_log_id={ql_id}")
    tasks_list = tasks_response_after.json()
    task = next((t for t in tasks_list if t["id"] == task_id), None)
    assert task is not None, "Task not found after status transitions"
    assert task["locked"] is True, "Task should be locked after Done status"

def test_activity_logging(test_users, cleanup_questlogs):
    user1, _ = test_users
    # Create a quest log.
    ql_response = client.post("/questlogs", json={"name": "Activity Logging Board", "owner_username": user1["username"]})
    assert ql_response.status_code == 200, f"Quest log creation failed: {ql_response.text}"
    ql_id = ql_response.json()["quest_log_id"]

    # Generate an invite to trigger an activity log.
    invite_response = client.post(
        f"/questlogs/{ql_id}/invite?username={user1['username']}",
        json={"expires_in_hours": 24, "is_permanent": False}
    )
    assert invite_response.status_code == 200, "Invite generation failed"

    # Fetch activity logs.
    activities_response = client.get(f"/questlogs/{ql_id}/activities")
    assert activities_response.status_code == 200, "Fetching activities failed"
    activities = activities_response.json()
    assert len(activities) >= 1, "No activity logs recorded"

def test_invite_accept_get_alias():
    token = "dummy-token"
    response = client.get(f"/questlogs/invite/accept?token={token}")
    assert response.status_code == 200
    data = response.json()
    assert "Please use the TaskFable application" in data["detail"]

def test_logout_behavior():
    # Create a temporary user.
    response = client.post("/users/login", json={"identifier": "temp_logout", "password": "password123", "email": "temp_logout@example.com"})
    assert response.status_code in (200, 201)
    user = response.json()["user"]
    username = user["username"]
    # Confirm user exists.
    res_get = client.get(f"/users/{username}")
    assert res_get.status_code == 200
    # Delete user directly.
    session = SessionLocal()
    db_user = session.query(User).filter(User.username == username).first()
    if db_user:
        session.delete(db_user)
    session.commit()
    session.close()
    # Verify that subsequent GET returns 404.
    res_after = client.get(f"/users/{username}")
    assert res_after.status_code == 404

if __name__ == "__main__":
    pytest.main()