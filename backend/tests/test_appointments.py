def make_appointment(**overrides):
    payload = {
        "title": "Team sync",
        "description": "Weekly sync",
        "date": "2030-01-15",
        "start_time": "10:00:00",
        "end_time": "11:00:00",
    }
    payload.update(overrides)
    return payload


def test_create_valid_appointment(client):
    response = client.post("/appointments", json=make_appointment())
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Team sync"
    assert body["status"] == "scheduled"


def test_missing_title_is_rejected(client):
    payload = make_appointment()
    payload["title"] = ""
    response = client.post("/appointments", json=payload)
    assert response.status_code == 422


def test_missing_required_field_is_rejected(client):
    payload = make_appointment()
    del payload["date"]
    response = client.post("/appointments", json=payload)
    assert response.status_code == 422


def test_end_time_before_start_time_is_rejected(client):
    payload = make_appointment(start_time="11:00:00", end_time="10:00:00")
    response = client.post("/appointments", json=payload)
    assert response.status_code == 422


def test_end_time_equal_to_start_time_is_rejected(client):
    payload = make_appointment(start_time="10:00:00", end_time="10:00:00")
    response = client.post("/appointments", json=payload)
    assert response.status_code == 422


def test_overlapping_appointment_is_rejected(client):
    client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    overlapping = [
        ("10:30:00", "11:30:00"),
        ("09:30:00", "10:30:00"),
        ("10:15:00", "10:45:00"),
        ("09:00:00", "12:00:00"),
    ]
    for start, end in overlapping:
        response = client.post("/appointments", json=make_appointment(start_time=start, end_time=end))
        assert response.status_code == 409, f"{start}-{end} should conflict"


def test_adjacent_appointments_are_allowed(client):
    client.post("/appointments", json=make_appointment(start_time="09:00:00", end_time="10:00:00"))
    response = client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    assert response.status_code == 201


def test_different_dates_do_not_conflict(client):
    client.post("/appointments", json=make_appointment(date="2030-01-15", start_time="10:00:00", end_time="11:00:00"))
    response = client.post("/appointments", json=make_appointment(date="2030-01-16", start_time="10:00:00", end_time="11:00:00"))
    assert response.status_code == 201


def test_editing_appointment_does_not_conflict_with_itself(client):
    created = client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00")).json()
    response = client.put(
        f"/appointments/{created['id']}",
        json=make_appointment(title="Team sync (updated)", start_time="10:00:00", end_time="11:00:00"),
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Team sync (updated)"


def test_editing_into_another_appointments_slot_is_rejected(client):
    client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    second = client.post("/appointments", json=make_appointment(start_time="13:00:00", end_time="14:00:00")).json()
    response = client.put(
        f"/appointments/{second['id']}",
        json=make_appointment(start_time="10:30:00", end_time="11:30:00"),
    )
    assert response.status_code == 409


def test_cancelled_appointment_stays_visible_and_marked(client):
    created = client.post("/appointments", json=make_appointment()).json()
    response = client.patch(f"/appointments/{created['id']}/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"

    listing = client.get("/appointments").json()
    assert any(a["id"] == created["id"] and a["status"] == "cancelled" for a in listing)


def test_cancelled_slot_can_be_reused(client):
    created = client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00")).json()
    client.patch(f"/appointments/{created['id']}/cancel")

    response = client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    assert response.status_code == 201


def test_complete_appointment(client):
    created = client.post("/appointments", json=make_appointment()).json()
    response = client.patch(f"/appointments/{created['id']}/complete")
    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_cannot_complete_a_cancelled_appointment(client):
    created = client.post("/appointments", json=make_appointment()).json()
    client.patch(f"/appointments/{created['id']}/cancel")
    response = client.patch(f"/appointments/{created['id']}/complete")
    assert response.status_code == 409


def test_cannot_cancel_a_completed_appointment(client):
    created = client.post("/appointments", json=make_appointment()).json()
    client.patch(f"/appointments/{created['id']}/complete")
    response = client.patch(f"/appointments/{created['id']}/cancel")
    assert response.status_code == 409


def test_filter_by_date(client):
    client.post("/appointments", json=make_appointment(date="2030-01-15"))
    client.post("/appointments", json=make_appointment(date="2030-01-16"))
    response = client.get("/appointments", params={"date": "2030-01-15"})
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["date"] == "2030-01-15"


def test_filter_by_status(client):
    a = client.post("/appointments", json=make_appointment(start_time="09:00:00", end_time="10:00:00")).json()
    client.post("/appointments", json=make_appointment(start_time="11:00:00", end_time="12:00:00"))
    client.patch(f"/appointments/{a['id']}/complete")

    response = client.get("/appointments", params={"status": "completed"})
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["id"] == a["id"]


def test_get_single_appointment(client):
    created = client.post("/appointments", json=make_appointment()).json()
    response = client.get(f"/appointments/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_nonexistent_appointment_returns_404(client):
    response = client.get("/appointments/does-not-exist")
    assert response.status_code == 404
