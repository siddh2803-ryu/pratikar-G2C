# Pratikar (प्रतिकार) — Health Insurance Claim Rejection Contest Engine

> **Geek2Code 2026 Grand Final · 20 September 2026**  
> **Track:** FinTech / InsurTech, Open Innovation  
> **Team:** Sid, Pratham, Navya, Parnika, Dhiraj  

---

## 1. Problem & Core Solution

In FY25, **87.50%** of Indian health insurance claims were settled by number, meaning roughly 1 in 8 went unpaid. While health insurance produces **61.5%** of all Insurance Ombudsman complaints, **50.8% of formal awards go in the policyholder's favour**. Almost nobody contests; roughly half of those who do, win.

**Pratikar** converts this skilled legal task into software:
1. **Upload:** User provides their insurer's rejection letter (photo or PDF) and policy wording PDF.
2. **Locate:** System extracts stated ground & cited clause, then retrieves that clause verbatim from the policy with its page reference.
3. **Test:** Two independent reasoning paths evaluate the claim:
   - **Path A (Deterministic Rule Engine):** Evaluates hand-coded IRDAI provisions (YAML rulebook) with zero model involvement.
   - **Path B (Clause Retrieval):** Verbatim quotes from the user's own policy (Quote-or-Abstain).
4. **Merge & Grounding Gate:** Hard architectural gate drops any assertion lacking a verified source (page span or named circular provision).
5. **Deliver:** Returns a contestability verdict (**Strong / Moderate / Weak**) with an interactive Evidence Trail, and generates a ready-to-file Grievance-Officer (GRO) appeal PDF in English or Hindi.

---

## 2. Team Responsibility Allocation

| Member | Primary Ownership | Deliverables in this Codebase |
| :--- | :--- | :--- |
| **Sid** | Architecture, Rule Engine & Grounding Gate | `app/rules/`, `app/merge/grounding_gate.py`, `app/generation/` |
| **Pratham** | Ingestion, API & Session Disposal | `app/ingestion/`, `app/api/analyses.py`, `app/db/database.py` |
| **Navya** | IRDAI Regulatory Rulebook as YAML | `backend/rulebook/irdai_rules.yaml` (Coded Master Circular 2024 provisions) |
| **Parnika** | Frontend Design & Evidence Trail UI | `frontend/src/components/`, `frontend/src/pages/` |
| **Dhiraj** | Ground-truth Suite & Verification | `backend/tests/`, `backend/demo_cases/` |

---

## 3. Technology Stack

- **Backend:** FastAPI, Python 3.12, Uvicorn
- **PDF & Vision:** PyMuPDF (`fitz`), Pillow (image deskewing)
- **Document Generation:** ReportLab with embedded Noto Sans Devanagari font
- **Regulatory Rules:** Pure YAML (`backend/rulebook/irdai_rules.yaml`)
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, TypeScript
- **Testing:** Pytest (Unit tests for rule determinism, grounding gate, and API integration)

---

## 4. Quickstart Guide

### A. Backend Setup & Startup
```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Run backend API server (runs on port 8000)
./backend/run.sh
```
*API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)*

### B. Frontend Startup
```bash
cd frontend
npm run dev
```
*Frontend available at: [http://localhost:5173](http://localhost:5173)*

### C. Running Verification Tests
```bash
source .venv/bin/activate
PYTHONPATH=backend pytest backend/tests/ -v
```

---

## 5. Pre-Cached Demo Cases (<5s Guarantee)

For demo day reliability under network volatility, 3 pre-cached demo cases are baked in:
1. **Flow A (Strong Verdict):** `demo-case-1-strong-moratorium`  
   Claim repudiated citing pre-existing disease (Clause 4.2) after 65 continuous months. Violates IRDAI Master Circular 2024 cl. 13 (60-month statutory moratorium). Generates official GRO appeal letter.
2. **Flow B (Weak Verdict):** `demo-case-2-weak-valid-rejection`  
   Claim repudiated under Clause 4.1 for illness hospitalisation 12 days after inception. Standard 30-day exclusion applies. Rejection stands; system honestly explains why and generates **no appeal** (PRD FR-12).
3. **Flow C (Clause-less Rejection):** `demo-case-3-vague-no-clause`  
   Vague letter citing no clause. Triggers official Request-for-Grounds letter demanding specific operative terms under IRDAI regulations.

---

## 6. Architecture & Grounding Guarantee

```
  [Rejection Letter] + [Policy Wording PDF]
                     │
                     ▼
             [Ingestion & Extraction]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    [Path A: IRDAI Rules]    [Path B: Verbatim Clause]
  (YAML provisions, no LLM)   (Exact page span quoting)
         │                       │
         └───────────┬───────────┘
                     ▼
          [Grounding Gate (Merge)]
  * Any assertion lacking a source is DISCARDED *
                     │
                     ▼
  [Strong / Moderate / Weak Verdict + Evidence Trail]
                     │
                     ▼
      [Downloadable Appeal Letter PDF]
```
