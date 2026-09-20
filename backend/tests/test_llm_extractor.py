"""Unit tests for ClaimExtractor LLM dispatcher, failover chain, and zero-hallucination compliance.
"""
import json
import pytest
import httpx
from datetime import date
from unittest.mock import patch, MagicMock

from app.extraction.extractor import ClaimExtractor
from app.models.schemas import StructuredClaimRecord


def test_claim_extractor_openai_format():
    extractor = ClaimExtractor()
    extractor.primary_key = "sk-test-openai-key-12345"
    extractor.fallback_key = None

    sample_llm_response = {
        "insurer_name": "Star Health and Allied Insurance",
        "policy_number": "P/161114/01/2021/008742",
        "claim_reference": "CIR/2026/161114/098711",
        "claim_amount": 284500.0,
        "rejection_date": "2026-08-14",
        "stated_ground": "Repudiation under Clause 4.2",
        "cited_clause_ref": "Clause 4.2",
        "policy_inception_date": "2021-03-01",
        "continuous_months": 65,
        "policyholder_name": "Rajesh Kumar",
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": json.dumps(sample_llm_response)}}]
    }
    mock_resp.raise_for_status = MagicMock()

    with patch.object(httpx.Client, "post", return_value=mock_resp) as mock_post:
        record = extractor._call_llm_extraction("Sample rejection text", provider="primary")
        assert record.insurer_name == "Star Health and Allied Insurance"
        assert record.policy_number == "P/161114/01/2021/008742"
        assert record.claim_reference == "CIR/2026/161114/098711"
        assert record.continuous_months == 65
        assert record.policyholder_name == "Rajesh Kumar"
        assert record.cited_clause_ref == "Clause 4.2"
        assert record.rejection_date == date(2026, 8, 14)


def test_claim_extractor_anthropic_format():
    extractor = ClaimExtractor()
    extractor.primary_key = "sk-ant-test-key-12345"
    extractor.fallback_key = None

    sample_llm_response = {
        "insurer_name": "Care Health Insurance",
        "policy_number": "18942201-00",
        "claim_reference": "CARE/2026/CLM/44120",
        "claim_amount": 92000.0,
        "rejection_date": "2026-08-18",
        "stated_ground": "Repudiation without clause",
        "cited_clause_ref": None,
        "policy_inception_date": "2026-08-06",
        "continuous_months": 0,
        "policyholder_name": "Sneha Verma",
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "content": [{"text": json.dumps(sample_llm_response)}]
    }
    mock_resp.raise_for_status = MagicMock()

    with patch.object(httpx.Client, "post", return_value=mock_resp) as mock_post:
        record = extractor._call_llm_extraction("Sample text", provider="primary")
        assert record.insurer_name == "Care Health Insurance"
        assert record.cited_clause_ref is None
        assert record.policyholder_name == "Sneha Verma"


def test_claim_extractor_failover_to_fallback_and_heuristic():
    extractor = ClaimExtractor()
    extractor.primary_key = "sk-primary-broken"
    extractor.fallback_key = "sk-fallback-broken"

    # Both LLMs raise network errors
    with patch.object(httpx.Client, "post", side_effect=httpx.ConnectError("Network timeout")):
        # Must gracefully fall back to deterministic regex heuristic without crashing
        raw_text = """
        STAR HEALTH AND ALLIED INSURANCE CO. LTD.
        Policyholder: Rajesh Kumar
        Policy No: P/161114/01/2021/008742
        Claim Reference No: CIR/2026/161114/098711
        Date: 14/08/2026
        Repudiation under Clause 4.2
        Claim Amount: INR 2,84,500.00
        """
        record = extractor.extract(raw_text.encode("utf-8"), "letter.txt")
        assert record.insurer_name == "Star Health and Allied Insurance"
        assert record.policy_number == "P/161114/01/2021/008742"
        assert record.claim_reference == "CIR/2026/161114/098711"
        assert record.cited_clause_ref == "Clause 4.2"
        assert record.policyholder_name == "Rajesh Kumar"
