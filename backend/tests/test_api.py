"""Integration tests for all 7 endpoints of the Pratikar API.
Tests against valid and invalid inputs, demo cases, error responses, and session disposal.
"""
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
assets_dir = Path(__file__).resolve().parent.parent / "demo_cases" / "demo_assets"


def test_health_endpoint():
    """1. GET /api/health returns liveness and warmed state for demo day."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["warmed"] is True
    assert "providers" in data


def test_upload_unsupported_extension():
    """Unsupported file extension rejected with PRD §14 exact error message."""
    files = {
        "rejection_letter": ("letter.docx", b"fake docx bytes", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        "policy_wording": ("policy.pdf", b"%PDF-fake", "application/pdf"),
    }
    response = client.post("/api/analyses", files=files)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "We can read PDF, JPG and PNG. This file is a .docx — please upload the PDF version." in detail["message"]


def test_pre_cached_demo_cases():
    """Pre-cached demo cases return in under 5 seconds (NFR / Tech Stack §12.2)."""
    # Demo Case 1 (Strong)
    r1 = client.get("/api/analyses/demo-case-1-strong-moratorium")
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["verdict"]["level"] == "strong"
    assert d1["claim_record"]["continuous_months"] == 65
    assert len(d1["verdict"]["evidence_trail"]) >= 1

    # Demo Case 2 (Weak - Flow B)
    r2 = client.get("/api/analyses/demo-case-2-weak-valid-rejection")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["verdict"]["level"] == "weak"
    assert d2["appeal_available"] is False

    # Attempting to generate appeal on Weak case must be blocked (PRD FR-12)
    r2_appeal = client.post("/api/analyses/demo-case-2-weak-valid-rejection/appeal", json={"language": "en"})
    assert r2_appeal.status_code == 400
    assert "Weak verdict" in r2_appeal.json()["detail"]

    # Demo Case 3 (Moderate - Flow C Clause-less)
    r3 = client.get("/api/analyses/demo-case-3-vague-no-clause")
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["verdict"]["flow"] == "flow_c"
    assert d3["grounds_letter_available"] is True


def test_full_pipeline_flow_a():
    """Full Flow A live pipeline on real generated Case 1 PDFs."""
    letter_path = assets_dir / "case_1_rejection_letter.pdf"
    policy_path = assets_dir / "case_1_policy_wording.pdf"

    with open(letter_path, "rb") as f_l, open(policy_path, "rb") as f_p:
        files = {
            "rejection_letter": ("rejection_letter.pdf", f_l.read(), "application/pdf"),
            "policy_wording": ("policy_wording.pdf", f_p.read(), "application/pdf"),
        }

    # 1. POST /api/analyses
    res_post = client.post("/api/analyses", files=files)
    assert res_post.status_code == 201
    analysis_id = res_post.json()["analysis_id"]

    # 2. GET /api/analyses/{id}
    res_get = client.get(f"/api/analyses/{analysis_id}")
    assert res_get.status_code == 200
    data = res_get.json()
    assert data["status"] == "complete"
    assert data["claim_record"]["continuous_months"] == 65
    assert data["verdict"]["level"] == "strong"
    assert len(data["verdict"]["evidence_trail"]) >= 1

    # 3. GET /api/analyses/{id}/evidence/{ref}
    first_ev_id = data["verdict"]["evidence_trail"][0]["id"]
    res_ev = client.get(f"/api/analyses/{analysis_id}/evidence/{first_ev_id}")
    assert res_ev.status_code == 200
    ev_data = res_ev.json()
    assert ev_data["id"] == first_ev_id

    # 4. POST /api/analyses/{id}/appeal (English)
    res_appeal = client.post(f"/api/analyses/{analysis_id}/appeal", json={"language": "en"})
    assert res_appeal.status_code == 200
    doc_id = res_appeal.json()["document_id"]

    # 5. GET /api/analyses/{id}/appeal/{docId} (PDF Stream)
    res_pdf = client.get(f"/api/analyses/{analysis_id}/appeal/{doc_id}")
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF-")

    # 6. DELETE /api/analyses/{id} (Session disposal)
    res_del = client.delete(f"/api/analyses/{analysis_id}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "success"

    # Verify session is permanently deleted
    res_gone = client.get(f"/api/analyses/{analysis_id}")
    assert res_gone.status_code == 404
