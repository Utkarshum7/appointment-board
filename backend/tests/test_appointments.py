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


def test_identical_time_slot_is_rejected(client):
    client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    response = client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    assert response.status_code == 409


def test_partial_overlap_at_the_end_is_rejected(client):
    client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    response = client.post("/appointments", json=make_appointment(start_time="10:30:00", end_time="11:30:00"))
    assert response.status_code == 409


def test_partial_overlap_at_the_start_is_rejected(client):
    client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    response = client.post("/appointments", json=make_appointment(start_time="09:30:00", end_time="10:30:00"))
    assert response.status_code == 409


def test_appointment_fully_contained_inside_another_is_rejected(client):
    client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    response = client.post("/appointments", json=make_appointment(start_time="10:15:00", end_time="10:45:00"))
    assert response.status_code == 409


def test_appointment_fully_containing_another_is_rejected(client):
    client.post("/appointments", json=make_appointment(start_time="10:00:00", end_time="11:00:00"))
    response = client.post("/appointments", json=make_appointment(start_time="09:00:00", end_time="12:00:00"))
    assert response.status_code == 409


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


def test_update_nonexistent_appointment_returns_404(client):
    response = client.put("/appointments/does-not-exist", json=make_appointment())
    assert response.status_code == 404


def test_cancel_nonexistent_appointment_returns_404(client):
    response = client.patch("/appointments/does-not-exist/cancel")
    assert response.status_code == 404


def test_complete_nonexistent_appointment_returns_404(client):
    response = client.patch("/appointments/does-not-exist/complete")
    assert response.status_code == 404


def test_combined_date_and_status_filter(client):
    a = client.post("/appointments", json=make_appointment(date="2030-01-15", start_time="09:00:00", end_time="10:00:00")).json()
    client.post("/appointments", json=make_appointment(date="2030-01-15", start_time="11:00:00", end_time="12:00:00"))
    client.post("/appointments", json=make_appointment(date="2030-01-16", start_time="09:00:00", end_time="10:00:00"))
    client.patch(f"/appointments/{a['id']}/complete")

    response = client.get("/appointments", params={"date": "2030-01-15", "status": "completed"})
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["id"] == a["id"]


def test_invalid_date_filter_format_returns_400(client):
    response = client.get("/appointments", params={"date": "15-01-2030"})
    assert response.status_code == 400


def test_invalid_status_filter_value_returns_422(client):
    response = client.get("/appointments", params={"status": "not-a-real-status"})
    assert response.status_code == 422


def test_description_defaults_to_empty_string(client):
    payload = make_appointment()
    del payload["description"]
    response = client.post("/appointments", json=payload)
    assert response.status_code == 201
    assert response.json()["description"] == ""


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
