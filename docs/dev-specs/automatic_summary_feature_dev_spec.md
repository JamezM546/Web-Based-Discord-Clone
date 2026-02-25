# Dev Specification Document
**Project:** Web‑Based Discord Clone with Enhanced Usability Features  
**Feature:** What You Missed Summary (WYMS)  
**Version:** v0.3

---

## 1. Document Version History

| Version | Date       | Editor        | Summary of Changes |
| :------ | :--------- | :------------ | :----------------- |
| **v0.1**| 2026‑02‑14 | James Mullins | Initial draft of Dev Spec header created. |
| **v0.2**| 2026‑02‑15 | James Mullins | Aligned preview feature to reuse manual summary infrastructure directly, along with rationales. |
| **v0.3**| 2026-02-16 | Elvis Valcarcel | Adjusted numbering in architecture to avoid conflicts with other devspecs |

### Authors & Contributors

| Name              | Role / Responsibility                    | Contributed Versions |
| :---------------- | :--------------------------------------- | :------------------- |
| **James Mullins** | Product Lead / Requirements Definition   | v0.1-2        |
| **Elvis Valcarcel** | Editor Extraordinaire | v0.3 |


### Rationale & Justification
The header section clearly identifies what feature the document covers and which project it belongs to as well. It also includes the changes to the documents and how it's tracked over time. This allows for traceability, revisions, and supports organization and maintainability throughout the development process.

## 2. Architecture Diagram

```text
Component: MS2.0 Message & Summarization Module 
(Implemented in Manual Summary – Reused by WYMS)
────────────────────────────────────────────────────────────
┌──────────────────────────────────────────────┐
│ Class: MS2.1 SummaryService                  │
├──────────────────────────────────────────────┤
│ Fields                                       │
│ - summarizationProvider : SummarizationProvider │
├──────────────────────────────────────────────┤
│ Methods                                      │
│ - generateBullets(messages : List<Message>, maxBullets : Integer) │
│ - generateHighlights(messages : List<Message>, maxHighlights : Integer) │
└──────────────────────────────────────────────┘
        │
        │ calls
        ▼
┌──────────────────────────────────────────────┐
│ Class: MS2.2 SummarizationProvider           │
├──────────────────────────────────────────────┤
│ Fields                                       │
│ - providerName : String                      │
│ - requestTimeoutMilliseconds : Integer       │
├──────────────────────────────────────────────┤
│ Methods                                      │
│ - summarize(messageTexts : List<String>, maxItems : Integer) │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Class: MS2.3 MessageRepository               │
├──────────────────────────────────────────────┤
│ Fields                                       │
│ - databaseClient : DatabaseClient            │
├──────────────────────────────────────────────┤
│ Methods                                      │
│ - fetchMessagesAfter(serverIdentifier, channelIdentifier, lastReadMessageIdentifier, limit) │
│ - fetchMessagesWithinTimeWindow(serverIdentifier, channelIdentifier, timeWindowMinutes, limit) │
│ - getLastReadMessageIdentifier(userIdentifier, channelIdentifier) │
│ - setLastReadMessageIdentifier(userIdentifier, channelIdentifier, messageIdentifier) │
└──────────────────────────────────────────────┘
        ▲
        │ used by
        │
┌──────────────────────────────────────────────┐
│ Class: MS2.1 SummaryService                 │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Class: MS2.6 MembershipService              │
├──────────────────────────────────────────────┤
│ Methods                                      │
│ - assertUserHasChannelAccess(userId, serverId, channelId) │
└──────────────────────────────────────────────┘
        ▲
        │ invoked by feature services before
        │ calling MessageRepository / SummaryService
        │
        └─────────────────────────────────────────────

────────────────────────────────────────────────────────────
Component: MSOD1.0 Channel Page (Manual Summary on Demand)
────────────────────────────────────────────────────────────
Class: MSOD1.1 ChannelPageView
 ├─ displays → SummaryCardModel

Class: MSOD1.2 ChannelPageController
 ├─ interacts with → MSOD1.1 ChannelPageView
 ├─ depends on → MSOD1.3 SummaryApiClient
 └─ produces → SummaryCardModel → updates view

Class: MSOD1.3 SummaryApiClient
 └─ sends requests to → ManualSummaryController

Class: ManualSummaryController
 └─ delegates to → ManualSummaryService

Class: ManualSummaryService
 ├─ depends on → MS2.6 MembershipService
 ├─ depends on → MS2.3 MessageRepository
 ├─ depends on → MS2.1 SummaryService
 └─ produces → SummaryCard

────────────────────────────────────────────────────────────
Component: WYMS1.0 Server Channel List Page
(Dependent on MS2.0 Module from Manual Summary)
────────────────────────────────────────────
Class: WYMS1.1 ServerChannelListView
 └─ displays → WhatYouMissedPreviewCardModel

Class: WYMS1.2 ServerChannelListController
 ├─ interacts with → WYMS1.1 ServerChannelListView
 ├─ depends on → WYMS1.3 WhatYouMissedApiClient
 └─ produces → WhatYouMissedPreviewCardModel → updates view

Class: WYMS1.3 WhatYouMissedApiClient
 └─ sends requests to → WYMS3.1 WhatYouMissedService

────────────────────────────────────────────
Component: WYMS3.0 What You Missed Backend Service
(Extends Manual Summary Module)
────────────────────────────────────────────
Class: WYMS3.1 WhatYouMissedService
 ├─ depends on → MS2.6 MembershipService
 ├─ depends on → MS2.3 MessageRepository      (reused from Manual Summary)
 ├─ depends on → MS2.1 SummaryService         (reused from Manual Summary)
 ├─ depends on → WYMS2.2 LastReadRepository
 └─ produces → preview bullet data

Class: WYMS2.2 LastReadRepository
 └─ provides last-read anchor → WYMS3.1 WhatYouMissedService

```

### Deployment and Where Components Run

| Component | Runtime Location | Rationale |
| :-------- | :---------------- | :-------- |
| **MS2.0 Message & Summarization Module** | **Server** | MessageRepository, SummaryService, and SummarizationProvider run on the server; database access and summarization API calls occur server-side. |
| **MSOD1.0 / MSOD3.0** (Manual Summary) | **Client** (views) + **Server** (backend) | ChannelPageView and controllers run in the browser; ManualSummaryController and ManualSummaryService run on the server. |
| **WYMS1.0 Server Channel List Page** | **Client** | Channel list and preview overlay run in the browser. |
| **WYMS3.0 What You Missed Backend Service** | **Server** | WhatYouMissedService and LastReadRepository run on the server. |

**Information flow (summary):** User clicks channel → ServerChannelListController (client) calls WhatYouMissedApiClient → backend WhatYouMissedService. Service uses LastReadRepository for anchor, MS2.3 MessageRepository for messages, MS2.1 SummaryService for highlights. Preview data flows back to client.

### Rationale & Justification
The system is designed in clear layers so that each part has one specific responsibility. The UI handles display and user interaction, controllers handle actions, API clients will handle networking, and backend handles the business logic. Both features, “Manual Summary” and the “What you Missed Preview” will use the same core process and logic so we can make sure they work as intended. All in all, this design keeps the system organized and easier to maintain as the project grows.

## 3. Class Diagrams

```text
Component: MS2.0 Message & Summarization Module (Manual Summary – Reused by WYMS)
Class: MS2.1 SummaryService
 ├─ depends on → MS2.2 SummarizationProvider
 ├─ operates on → MS2.3 MessageRepository
 ├─ generates → bullets/highlights for Manual Summary + WYMS
 └─ methods → generateBullets(...), generateHighlights(...)

Class: MS2.3 MessageRepository
 ├─ provides data to → MSOD3.2 ManualSummaryService
 ├─ provides data to → WYMS3.1 WhatYouMissedService
 └─ supports → fetchMessagesAfter(...), fetchMessagesWithinTimeWindow(...), getLastReadMessageIdentifier(...), setLastReadMessageIdentifier(...)

Class: MS2.6 MembershipService
 ├─ validates access for → MSOD3.2 ManualSummaryService
 └─ validates access for → WYMS3.1 WhatYouMissedService
────────────────────────────────────────────
Component: MSOD1.0 Channel Page (Manual Summary)

Class: MSOD1.2 ChannelPageController
 ├─ interacts with → MSOD1.1 ChannelPageView
 ├─ depends on → MSOD1.3 SummaryApiClient
 └─ produces → MSOD2.1 SummaryCardModel → updates view

Class: MSOD1.3 SummaryApiClient
 ├─ sends requests to → MSOD3.1 ManualSummaryController
 └─ transforms response → MSOD2.1 SummaryCardModel

Class: MSOD3.1 ManualSummaryController
 └─ delegates to → MSOD3.2 ManualSummaryService

Class: MSOD3.2 ManualSummaryService
 ├─ depends on → MS2.6 MembershipService
 ├─ depends on → MS2.3 MessageRepository
 ├─ depends on → MS2.1 SummaryService
 └─ produces → MSOD3.3 SummaryCard

Class: MSOD3.3 SummaryCard → contains summary bullet data
────────────────────────────────────────────
Component: WYMS1.0 Server Channel List (Dependent on MS2.0)

Class: WYMS1.2 ServerChannelListController
 ├─ interacts with → WYMS1.1 ServerChannelListView
 ├─ depends on → WYMS1.3 WhatYouMissedApiClient
 └─ produces → WYMS2.1 WhatYouMissedPreviewCardModel → updates view

Class: WYMS1.3 WhatYouMissedApiClient
 ├─ sends requests to → WYMS3.1 WhatYouMissedService
 └─ transforms response → WYMS2.1 WhatYouMissedPreviewCardModel

Class: WYMS3.1 WhatYouMissedService
 ├─ depends on → MS2.6 MembershipService
 ├─ depends on → MS2.1 MessageRepository   (reused from Manual Summary)
 ├─ depends on → MS2.2 SummaryService      (reused from Manual Summary)
 ├─ depends on → WYMS2.2 LastReadRepository
 └─ produces → preview bullet data

Class: WYMS2.2 LastReadRepository
 └─ provides last-read anchor → WYMS3.1 WhatYouMissedService

```
### Rationale & Justification
The class diagram defines clear responsibilities and dependencies so each feature is easy to reason about. Shared classes such as the message retrieval, summarization and access checks, are reused by both the Manual Summary and What you Missed Preview, which keeps the logic consistent. This will reduce coupling and support future changes without breaking parts of the system.

## 4. List of Classes

### Component: MS2.0 Message & Summarization Module (Reusable by Manual Summary + WYMS)

**Class: MS2.1 SummaryService**  
* **Purpose & Responsibility:** Orchestrates summary generation (bullets/highlights) from message text and enforces max limits.  
* **Implements Design Features:** Shared summarization pipeline for both features; consistent formatting and size control.  
* **Type:** Service (business logic)

**Class: MS2.2 SummarizationProvider**  
* **Purpose & Responsibility:** Adapter to underlying summarization engine (LLM or heuristic) returning condensed text items.  
* **Implements Design Features:** Pluggable summarization backend; engine swap without changing feature logic.  
* **Type:** Service (integration)

**Class: MS2.3 MessageRepository**  
* **Purpose & Responsibility:** Fetches message data after a last‑read anchor or within a time window; manages last‑read message identifiers for Manual Summary.  
* **Implements Design Features:** Shared retrieval and last‑read state for Manual Summary + WYMS; WYMS2.2 LastReadRepository may wrap these methods or use separate storage.  
* **Type:** Data Access (storage-facing)

**Class: MS2.6 MembershipService**  
* **Purpose & Responsibility:** Validates user authorization before generating summaries/previews.  
* **Implements Design Features:** Access control guardrail for summarization endpoints.  
* **Type:** Service (security)

### Component: MSOD1.0 Channel Page (Manual Summary) — View + Controller

**Class: MSOD1.1 ChannelPageView**  
* **Purpose & Responsibility:** Displays channel UI state and manual summary output (loading/error/success).  
* **Type:** View

**Class: MSOD1.2 ChannelPageController**  
* **Purpose & Responsibility:** Handles manual summary requests and coordinates view state + API calls.  
* **Type:** Controller (client-side)

### Component: MSOD2.0 Manual Summary Data Module

**Class: MSOD2.1 SummaryCardModel**  
* **Purpose & Responsibility:** View-ready representation of a manual summary (metadata + bullets).  
* **Type:** Data Model

**Class: MSOD2.3 SummaryApiClient**  
* **Purpose & Responsibility:** Requests manual summary from backend and maps response to client model.  
* **Type:** Service (client networking)

### Component: MSOD3.0 Manual Summary Backend

**Class: MSOD3.1 ManualSummaryController**  
* **Purpose & Responsibility:** API entry point; validates request and routes to service.  
* **Type:** Controller (server-side)

**Class: MSOD3.2 ManualSummaryService**  
* **Purpose & Responsibility:** Manual summary logic: checks access, fetches messages, calls SummaryService.  
* **Type:** Service (business logic)

**Class: MSOD3.3 SummaryCard**  
* **Purpose & Responsibility:** Backend summary object serialized to client.  
* **Type:** Data Model

### Component: WYMS1.0 Server Channel List — View + Controller

**Class: WYMS1.1 ServerChannelListView**  
* **Purpose & Responsibility:** Displays channel list and “what you missed” preview before entering channel.  
* **Type:** View

**Class: WYMS1.2 ServerChannelListController**  
* **Purpose & Responsibility:** Handles channel click, requests preview, updates view, supports handoff to Manual Summary.  
* **Type:** Controller (client-side)

**Class: WYMS1.3 WhatYouMissedApiClient**  
* **Purpose & Responsibility:** Requests preview data and maps response to client model.  
* **Type:** Service (client networking)

### Component: WYMS2.0 What You Missed Data Module

**Class: WYMS2.1 WhatYouMissedPreviewCardModel**  
* **Purpose & Responsibility:** View-ready preview card (missed count, time range, highlights).  
* **Type:** Data Model

**Class: WYMS2.2 LastReadRepository**  
* **Purpose & Responsibility:** Retrieves/stores last-read message ID per user/channel.  
* **Type:** Data Access

### Component: WYMS3.0 What You Missed Backend Service

**Class: WYMS3.1 WhatYouMissedService**  
* **Purpose & Responsibility:** Builds preview: checks access, resolves last-read anchor, fetches messages, generates highlights.  
* **Type:** Service (business logic)

### Rationale & Justification
The class list documents the building blocks needed to implement the feature and why each exists. Separating concerns keeps UI logic out of backend summarization, and reusing core classes across Manual Summary and WYMS ensures consistent behavior and easier maintenance.

---

## 5. State Diagrams

```text
Component: WYMS1.0 Server Channel List Page (What You Missed Summary Preview) — Primary Feature State Machine
────────────────────────────────────────────────────────────
State: WYMS.S0 (Initial) ChannelList_Ready_NoPreview
Fields
- isPreviewOpen : false
- isPreviewLoading : false
- previewCard : null
- errorMessage : ""
- channelIdentifierPendingEnter : ""
────────────────────────────────────────────────────────────
        │ onClickChannel(channelIdentifier)
        ▼
────────────────────────────────────────────────────────────
State: WYMS.S1 Preview_Open_Loading
Fields
- isPreviewOpen : true
- isPreviewLoading : true
- channelIdentifierPendingEnter : channelIdentifier
- previewCard : null
- errorMessage : ""
────────────────────────────────────────────────────────────
        │ resolveLastReadMessageIdentifier(channelIdentifier)
        ▼
────────────────────────────────────────────────────────────
State: WYMS.S2 LastRead_Resolved
Fields
- lastReadMessageIdentifier resolved (or fallback)
────────────────────────────────────────────────────────────
        │ fetchWhatYouMissedPreview(serverId, channelId, lastReadId)
        ▼
────────────────────────────────────────────────────────────
State: WYMS.S3 Awaiting_Preview_Response
Fields
- Pending network response : true
────────────────────────────────────────────────────────────
        │ responseSuccess == true
        ▼
────────────────────────────────────────────────────────────
State: WYMS.S4 Preview_Displayed
Fields
- isPreviewOpen : true
- isPreviewLoading : false
- previewCard : non-null
- errorMessage : ""
────────────────────────────────────────────────────────────
        │ userDecision == "enterChannel"
        ▼
State: WYMS.S6 Channel_Entered

        │ userDecision == "closePreview"
        └──────────────► back to WYMS.S0

        │ userDecision == "requestManualSummary"
        └──────────────► WYMS.S7 Dependency_ManualSummary_Handoff
────────────────────────────────────────────────────────────
        │ responseSuccess == false
        ▼
State: WYMS.S5 Preview_Error_Displayed
Fields
- isPreviewOpen : true
- isPreviewLoading : false
- previewCard : null
- errorMessage : non-empty
        │ retrySelected == true
        └──────────────► WYMS.S1
        │ retrySelected == false
        └──────────────► WYMS.S0

Component: WYMS Dependency on Manual Summary (Handoff State Only)
────────────────────────────────────────────────────────────
State: WYMS.S7 Dependency_ManualSummary_Handoff
Fields
- Navigation target : MSOD1.1 ChannelPageView
- Desired next UI state : manual summary panel open
        │ navigationSuccess == true
        ▼
State: WYMS.S8 ManualSummary_Opened_InChannel
Fields
- MSOD1.1 ChannelPageView.isSummaryPanelOpen : true
```

### Our Rationale & Justification
The state model makes the preview predictable by explicitly defining idle, loading, awaiting response, displayed, and error states, plus a dedicated handoff state to Manual Summary. This reduces race-condition bugs and clarifies what data must be valid at each transition.

---

## 6. Flow Charts (Scenario‑Based)

### Scenario: WYMS.FC1 — Preview Then Enter Channel
* **Starting State:** WYMS.S0 ChannelList_Ready_NoPreview  
* **Ending State:** WYMS.S6 Channel_Entered  

```text
(Start)
  │
  ▼
[Process] User views channel list with no preview open (WYMS.S0)
  │
  ▼
[Input/Output] User clicks a channel in the server list
  │
  ▼
[Process] Transition → WYMS.S1 Preview_Open_Loading (WYMS1.2)
  │
  ▼
[Process] Resolve last-read anchor via LastReadRepository(WYMS.S2)
  │
  ▼
[Process] Request preview (WYMS.S3) via WhatYouMissedApiClient
  │
  ▼
[Decision] responseSuccess == true ?
  ├── Yes ─► [Process] Transition → WYMS.S4 Preview_Displayed
  │           │
  │           ▼
  │        [Input/Output] User chooses “Enter Channel”
  │           │
  │           ▼
  │        [Process] Transition → WYMS.S6 Channel_Entered
  │           ▼
  │         (End)
  └── No  ─► [Process] Transition → WYMS.S5 Preview_Error_Displayed
              ▼
            (End)
```
Supporting explanation:
 This scenario covers the normal path where the user clicks a channel, the system loads the “what you missed” preview using the user’s last-read anchor, displays a short summary preview, and then the user decides to enter the channel. If the preview request fails, the flow ends in the error state instead of entering the channel.

### Scenario: WYMS.FC2 — Preview Then Close Without Entering
* **Starting State:** WYMS.S0  
* **Ending State:** WYMS.S0  

```text
(Start) → click channel → WYMS.S1 → WYMS.S2 → WYMS.S3
                 │
                 ▼
        [Decision] responseSuccess == true ?
          ├── Yes ─► WYMS.S4 → user closes preview → WYMS.S0 → (End)
          └── No  ─► WYMS.S5 → user closes preview → WYMS.S0 → (End)
```
Supporting explanation:
 This scenario matches the user-story goal: the preview helps the user decide whether the channel is worth attention. After viewing the preview, the user can close it and stay on the channel list—avoiding the cost of entering a busy channel.


### Scenario: WYMS.FC3 — Preview Then Open Manual Summary (Dependency Handoff)
* **Starting State:** WYMS.S0  
* **Ending State:** WYMS.S8 ManualSummary_Opened_InChannel  

```text
(Start) → click channel → WYMS.S1 → WYMS.S2 → WYMS.S3
                 │
                 ▼
        [Decision] responseSuccess == true ?
          ├── Yes ─► WYMS.S4 → user requests manual summary
          │                │
          │                ▼
          │             WYMS.S7 (handoff) → navigationSuccess == true → WYMS.S8 → (End)
          └── No  ─► WYMS.S5 → (End)
```
Supporting explanation:
 This scenario shows the explicit dependency: from the “what you missed” preview, the user can escalate to a deeper catch-up by jumping into the manual summary experience. The preview feature remains the primary workflow, while manual summary is an optional handoff path for power users who want a fuller catch-up after deciding the channel is important.


### Our Rationale & Justification
These scenarios cover the realistic user paths: preview then enter, preview then dismiss, and preview then escalate to a deeper manual summary. Explicit flow steps reduce ambiguity and make verification and testing more straightforward.

---

## 7. Development Risks and Failures

### Component: WYMS1.0 Server Channel List Page (View + Controller)

| Failure Mode | Description | Recovery Procedure | Likelihood | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **FM‑WYMS1‑01 Runtime Crash** | Preview overlay or controller throws an unhandled exception. | Reinitialize controller, reset to WYMS.S0, reload minimal view state. | Medium | High |
| **FM‑WYMS1‑02 Loss of Preview State** | `previewCard` or loading state lost during re-render/navigation. | Restore from cached response or recompute by transitioning back to WYMS.S1. | High | Medium |
| **FM‑WYMS1‑03 Unexpected State Transition** | Skips awaiting response validation; stale preview displayed. | Force back to WYMS.S3 and validate response before display. | Medium | Medium |
| **FM‑WYMS1‑04 Resource Exhaustion (Client)** | Rapid clicking triggers too many preview requests. | Debounce clicks; cancel in-flight requests when switching channels. | Medium | Medium |
| **FM‑WYMS1‑05 Event Flooding / Bot Abuse** | Automated triggers spam preview endpoint. | Client-side rate limiting + server request quotas. | Medium | Low |

### Component: WYMS3.0 What You Missed Backend Service

| Failure Mode | Description | Recovery Procedure | Likelihood | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **FM‑WYMS2‑01 Last‑Read Anchor Corruption** | Wrong anchor retrieved/stored → incorrect preview. | Validate anchor against MessageRepository; fallback to safe last-known. | Medium | High |
| **FM‑WYMS2‑02 Summary Generation Failure** | Summarization returns malformed/empty data. | Retry; fallback to heuristic summary (count + time range). | Medium | Medium |
| **FM‑WYMS2‑03 Message Retrieval Timeout** | `fetchMessagesAfter()` stalls → spinner hangs. | Enforce timeout; transition to error state and return error response. | Medium | Medium |
| **FM‑WYMS2‑04 Data Inconsistency** | Messages don’t align with anchor boundary (off-by-one). | Recompute boundary; validate ordering/index constraints. | Low | High |

### Connectivity Failures
* **FM‑CON‑01 Network Loss:** show error; retry on reconnect; optionally show cached metadata.
* **FM‑CON‑02 Summarization Provider Timeout:** fallback to simple summary and enforce provider timeout thresholds.
* **Diagnostics References:** TS-FM-CON-01/02
* **Likelihood:** Medium
* **Impact:** Medium


### Hardware / Configuration Failures
* **FM‑HW‑01 Backend Service Down:** failover to backup instances; alert monitoring.
* **Likelihood:** Low
* **Impact:** Critical
* **FM‑HW‑02 Misconfigured Deployment:** roll back deployment; restore API contract alignment.
* **Diagnostics References:** TS-FM-HW-01/02
* **Likelihood:** Medium
* **Impact:** High


### Intruder / Security Failures
* **FM‑SEC‑01 Denial of Service (DoS):** activate rate limits; autoscale preview service.
* **Likelihood:** Medium
* **Impact:** Critical
* **FM‑SEC‑02 Unauthorized Preview Access:** enforce strict membership checks; invalidate suspicious sessions.
* **FM‑SEC‑03 Data Exposure via Summary:** filter restricted message types before summarization.
* **Diagnostics References:** TS-FM-HW-01/02/03
* **Likelihood:** Low
* **Impact:** Critical

### Ranking Summary

| Rank Category | Typical Failures |
| :--- | :--- |
| **High Likelihood / Medium Impact** | Loss of Preview State, Message Retrieval Timeout |
| **Medium Likelihood / High Impact** | Runtime Crash, Last‑Read Anchor Corruption, Misconfigured Deployment |
| **Low Likelihood / Critical Impact** | Backend Service Down, Unauthorized Preview Access, Data Exposure |
| **Medium Likelihood / Critical Impact** | Denial of Service (DoS) |

### Our Rationale & Justification
This section identifies what can go wrong across UI, backend, networking, deployment, and security, plus concrete recovery steps. That improves reliability and helps the team proactively design safer, more stable behavior.

---

## 8. Technologies

| Technology | Version | Purpose | Justification vs Alternatives |
| :--- | :--- | :--- | :--- |
| **TypeScript** | 5.x | Client + server logic | Static typing reduces runtime errors in complex state transitions (WYMS state machine) vs plain JS. |
| **React** | 18.x | Frontend UI | Component model maps cleanly to views/overlays; state/hooks fit preview flow better than manual DOM manipulation. |
| **Node.js** | 20.x LTS | Backend runtime | Non-blocking I/O fits high-frequency preview requests; aligns well with TypeScript. |
| **Express.js** | 4.x | Backend framework | Lightweight routing + middleware supports REST endpoints and auth/rate limits. |
| **PostgreSQL** | 15.x | Persistent data store | Strong integrity + indexing for messages/anchors vs NoSQL for structured relationships. |
| **Prisma ORM** | 5.x | DB access layer | Type-safe queries reduce malformed SQL risk; improves maintainability. |
| **Axios** | 1.x | HTTP client | Interceptors + cancellation easier than native fetch for request/response mapping. |
| **LLM Provider API (e.g., OpenAI)** | v1 | Summarization engine | Higher-quality LLM-based summarization than heuristics; prompt control supports short preview format. |
| **Redis (optional)** | 7.x | Cache | Faster ephemeral caching for previews than repeated DB queries; useful for degraded mode. |
| **Docker** | 24.x | Containerization | Consistent environments across dev/staging/prod vs manual configuration. |
| **Git** | 2.x | Version control | Industry standard collaboration + traceability. |
| **GitHub** | SaaS | Hosting/PR/CI | Integrated collaboration + Actions for CI/CD. |
| **ESLint** | 8.x | Static analysis | Prevents common errors and inconsistent state logic. |
| **Jest** | 29.x | Testing | Unit/integration tests; supports TypeScript well. |
| **Nginx** | 1.24.x | Reverse proxy | High-performance proxy/load balancing; handles concurrency better than heavier servers. |

### Our Rationale & Justification
This stack supports a real-time preview experience with typed frontend logic, a reliable relational database, and optional caching for performance. Containerization and standard tooling reduce deployment drift and long-term maintenance overhead.

---

## 9. APIs

### Component: MS2.0 Message & Summarization Module (Reusable)

#### Class: MS2.1 SummaryService
* **Public Methods**
  * `generateBullets(messages : List<Message>, maxBullets : Integer) : List<SummaryBullet>`
  * `generateHighlights(messages : List<Message>, maxHighlights : Integer) : List<SummaryHighlight>`
  * `clampMaxBullets(requestedBullets : Integer) : Integer`
  * `clampMaxHighlights(requestedHighlights : Integer) : Integer`

#### Class: MS2.2 SummarizationProvider
* **Public Methods**
  * `summarize(messageTexts : List<String>, maxItems : Integer) : List<String>`

#### Class: MS2.3 MessageRepository
* **Public Methods**
  * `fetchMessagesAfter(serverIdentifier : String, channelIdentifier : String, lastReadMessageIdentifier : String, limit : Integer) : List<Message>`
  * `fetchMessagesWithinTimeWindow(serverIdentifier : String, channelIdentifier : String, timeWindowMinutes : Integer, limit : Integer) : List<Message>`
  * `getLastReadMessageIdentifier(userIdentifier : String, channelIdentifier : String) : String`
  * `setLastReadMessageIdentifier(userIdentifier : String, channelIdentifier : String, messageIdentifier : String) : void`

#### Class: MS2.6 MembershipService
* **Public Methods**
  * `assertUserHasChannelAccess(requesterUserIdentifier : String, serverIdentifier : String, channelIdentifier : String) : void`


* **No Private Methods or Overloads / Overrides**


### Manual Summary (MSOD)

#### Component: MSOD1.0 Channel Page (View + Controller)
**Class: MSOD1.1 ChannelPageView — Public Methods**
* `render() : void`
* `openSummaryPanel() : void`
* `closeSummaryPanel() : void`
* `setLoadingState(isLoading : Boolean) : void`
* `showSummary(summaryCard : SummaryCardModel) : void`
* `showError(errorMessage : String) : void`

**Class: MSOD1.2 ChannelPageController — Public Methods**
* `onClickOpenManualSummary() : void`
* `onClickRequestSummary(timeWindowMinutes : Integer) : void`
* `onClickCloseManualSummary() : void`
* `loadCachedSummaryIfAvailable() : void`
* `handleSummaryResponse(summaryCard : SummaryCardModel) : void`
* `handleSummaryError(errorMessage : String) : void`

#### Component: MSOD2.0 Manual Summary Data Module
**Class: MSOD2.1 SummaryCardModel — Public Methods**
* `hasContent() : Boolean`

**Class: MSOD2.2 SummaryBulletModel — Public Methods**
* `toDisplayString() : String`

**Class: MSOD2.3 SummaryApiClient — Public Methods**
* `fetchManualSummary(serverIdentifier : String, channelIdentifier : String, timeWindowMinutes : Integer) : Promise<SummaryCardModel>`

**Class: MSOD2.4 SummaryStateStore — Public Methods**
* `getCachedSummary(channelIdentifier : String) : SummaryCardModel`
* `setCachedSummary(channelIdentifier : String, summary : SummaryCardModel) : void`
* `markRequestInFlight(channelIdentifier : String) : void`
* `clearRequestInFlight(channelIdentifier : String) : void`
* `isRequestInFlight(channelIdentifier : String) : Boolean`
* `setLastRequestedAtIso(channelIdentifier : String, iso : String) : void`
* `getLastRequestedAtIso(channelIdentifier : String) : String`

#### Component: MSOD3.0 Manual Summary Backend
**Class: MSOD3.1 ManualSummaryController — Public Methods**
* `getManualSummary(requesterUserIdentifier : String, serverIdentifier : String, channelIdentifier : String, timeWindowMinutes : Integer) : SummaryCardResponseDto`

**Class: MSOD3.2 ManualSummaryService — Public Methods**
* `buildManualSummary(requesterUserIdentifier : String, serverIdentifier : String, channelIdentifier : String, timeWindowMinutes : Integer) : SummaryCard`
* `computeTimeRange(messages : List<Message>) : TimeRange`

**Class: MSOD3.3 SummaryCard — Public Methods**
* `toResponseDto() : SummaryCardResponseDto`

**Class: MSOD3.4 SummaryBullet — Public Methods**
* `normalizeForClient() : SummaryBullet`


### What You Missed (WYMS)

#### Component: WYMS1.0 Server Channel List Page (View + Controller)
**Class: WYMS1.1 ServerChannelListView — Public Methods**
* `render() : void`
* `openPreview(channelIdentifier : String) : void`
* `closePreview() : void`
* `showLoadingState(isLoading : Boolean) : void`
* `showPreview(previewCard : WhatYouMissedPreviewCardModel) : void`
* `showError(errorMessage : String) : void`
* `enterChannel(channelIdentifier : String) : void`

**Class: WYMS1.2 ServerChannelListController — Public Methods**
* `onClickChannel(channelIdentifier : String) : void`
* `onRequestPreview(channelIdentifier : String) : void`
* `resolveLastReadMessageIdentifier(channelIdentifier : String) : String`
* `handlePreviewResponse(previewCard : WhatYouMissedPreviewCardModel) : void`
* `handlePreviewError(errorMessage : String) : void`
* `onEnterChannelConfirmed(channelIdentifier : String) : void`

**Class: WYMS1.3 WhatYouMissedApiClient — Public Methods**
* `fetchWhatYouMissedPreview(serverIdentifier : String, channelIdentifier : String, lastReadMessageIdentifier : String) : Promise<WhatYouMissedPreviewCardModel>`

#### Component: WYMS2.0 Data Module
**Class: WYMS2.1 WhatYouMissedPreviewCardModel — Public Methods**
* `hasMeaningfulPreview() : Boolean`

**Class: WYMS2.2 LastReadRepository — Public Methods**
* `getLastReadMessageIdentifier(requesterUserIdentifier : String, channelIdentifier : String) : String`
* `setLastReadMessageIdentifier(requesterUserIdentifier : String, channelIdentifier : String, messageIdentifier : String) : void`

#### Component: WYMS3.0 Backend Service
**Class: WYMS3.1 WhatYouMissedService — Public Methods**
* `buildPreview(requesterUserIdentifier : String, serverIdentifier : String, channelIdentifier : String, lastReadMessageIdentifier : String) : WhatYouMissedPreviewCard`
* `resolveLastReadMessageIdentifier(requesterUserIdentifier : String, channelIdentifier : String, fallbackLastReadMessageIdentifier : String) : String`
* `computeMissedCount(messages : List<Message>) : Integer`
* `computeTimeRange(messages : List<Message>) : TimeRange`

### Our Rationale & Justification
The API section defines what functions are available, what data is passed between components, and how integration points line up. This reduces ambiguity and promotes consistent behavior across both WYMS and Manual Summary.

---

## 10. Public Interfaces

---

## Component: WYMS1.0 Server Channel List Page

### Class: WYMS1.1 ServerChannelListView — Public Methods

**Used Within Same Component (WYMS1.0):**
- `render()`
- `openPreview(channelIdentifier: string)`
- `closePreview()`
- `showLoadingState(isLoading: boolean)`
- `showPreview(previewCard: WhatYouMissedPreviewCardModel)`
- `showError(errorMessage: string)`
- `enterChannel(channelIdentifier: string)`

**Used Across Components in Same Module:**
- none

**Used Across Modules:**
- none

---

### Class: WYMS1.2 ServerChannelListController — Public Methods

**Used Within Same Component (WYMS1.0):**
- `onClickChannel(channelIdentifier: string): Promise<void>`
- `resolveLastReadMessageIdentifier(channelIdentifier: string): string`
- `handlePreviewResponse(previewCard: WhatYouMissedPreviewCardModel): void`
- `handlePreviewError(errorMessage: string): void`
- `onEnterChannelConfirmed(channelIdentifier: string): void`

**Used Across Components in Same Module:**
- none

**Used Across Modules:**
- none

---

### Class: WYMS1.3 WhatYouMissedApiClient — Public Methods

**Used Within Same Component (WYMS1.0):**
- `fetchWhatYouMissedPreview(serverIdentifier: string, channelIdentifier: string, lastReadMessageIdentifier: string): Promise<WhatYouMissedPreviewCardModel>`

**Used Across Components in Same Module:**
- none

**Used Across Modules:**
- none

---

## Component: WYMS2.0 Preview Domain Layer

### Class: WYMS2.1 WhatYouMissedPreviewCardModel — Public Methods

**Used Within Same Component (WYMS2.0):**
- `WhatYouMissedPreviewCardModel()`
- `hasMeaningfulPreview(): boolean`

**Used Across Components in Same Module:**
- none

**Used Across Modules:**
- none

---

### Class: WYMS2.2 LastReadRepository — Public Methods

**Used Within Same Component (WYMS2.0):**
- `getLastReadMessageIdentifier(requesterUserIdentifier: string, channelIdentifier: string): string`
- `setLastReadMessageIdentifier(requesterUserIdentifier: string, channelIdentifier: string, messageIdentifier: string): void`

**Used Across Components in Same Module:**
- none

**Used Across Modules:**
- none

---

## Component: WYMS3.0 What You Missed Service Layer

### Class: WYMS3.1 WhatYouMissedService — Public Methods

**Used Within Same Component (WYMS3.0):**
- `buildPreview(requesterUserIdentifier: string, serverIdentifier: string, channelIdentifier: string, lastReadMessageIdentifier: string): WhatYouMissedPreviewCard`
- `resolveLastReadMessageIdentifier(requesterUserIdentifier: string, channelIdentifier: string, fallbackLastReadMessageIdentifier: string): string`
- `computeMissedCount(messages: MessageRecord[]): number`
- `computeTimeRange(messages: MessageRecord[]): TimeRange`

**Used Across Components in Same Module:**
- none

**Used Across Modules:**
- Uses MS2.0 Message & Summarization Module

---

## External Dependencies — WYMS1.0 Uses

**Uses From MS2.0 Message & Summarization Module:**
- `MS2.3 MessageRepository.fetchMessagesAfter(serverIdentifier: string, channelIdentifier: string, lastReadMessageIdentifier: string, limit: number): Promise<MessageRecord[]>`
- `MS2.1 SummaryService.generateHighlights(messages: MessageRecord[], maxHighlights: number): SummaryHighlight[]`
- `MS2.6 MembershipService.assertUserHasChannelAccess(requesterUserIdentifier: string, serverIdentifier: string, channelIdentifier: string): void`
- `MS2.4 MessageRecord`

---

# MS2.0 Message & Summarization Module

## Component: MS2.0 Message & Summarization Module

### Class: MS2.1 SummaryService — Public Methods

**Used Within Same Component (MS2.0):**
- `generateBullets(messages: MessageRecord[], maxBullets: number): SummaryBullet[]`
- `generateHighlights(messages: MessageRecord[], maxHighlights: number): SummaryHighlight[]`

**Used Across Components in Same Module:**
- none

**Used Across Modules (WYMS1.0, MSOD1.0):**
- `generateBullets(...)`
- `generateHighlights(...)`

---

### Class: MS2.3 MessageRepository — Public Methods

**Used Within Same Component (MS2.0):**
- `fetchMessagesAfter(serverIdentifier: string, channelIdentifier: string, lastReadMessageIdentifier: string, limit: number): Promise<MessageRecord[]>`
- `fetchMessagesWithinTimeWindow(serverIdentifier: string, channelIdentifier: string, timeWindowMinutes: number, limit: number): Promise<MessageRecord[]>`
- `getLastReadMessageIdentifier(userIdentifier: string, channelIdentifier: string): Promise<string>`
- `setLastReadMessageIdentifier(userIdentifier: string, channelIdentifier: string, messageIdentifier: string): Promise<void>`

**Used Across Components in Same Module:**
- none

**Used Across Modules (WYMS1.0, MSOD1.0):**
- `fetchMessagesAfter(...)`
- `fetchMessagesWithinTimeWindow(...)`
- `getLastReadMessageIdentifier(...)` (Manual Summary; WYMS2.2 LastReadRepository may wrap or parallel this)
- `setLastReadMessageIdentifier(...)` (Manual Summary)

---

## Module-Level Dependencies

### Module: WYMS1.0 Server Channel List Page — Uses From Other Modules
- MS2.0 Message & Summarization Module
- MS2.3 MessageRepository
  - `fetchMessagesAfter(...)`
- MS2.1 SummaryService
  - `generateHighlights(...)`
- MS2.6 MembershipService
  - `assertUserHasChannelAccess(...)`
- MS2.4 MessageRecord

### Module: MS2.0 Message & Summarization Module — Uses From Other Modules
- none

---

## Our Rationale & Justification

Public interfaces define the explicit contracts between components and modules, ensuring responsibilities are clearly separated and independently testable. WYMS depends on MS2.0 strictly for access validation, message retrieval, and summarization logic, preventing duplication of core functionality. Because MS2.0 has no dependency on WYMS, it remains a reusable shared infrastructure module that can support multiple features without modification, maintaining architectural stability and reducing coupling.

---

## 11. Data Schemas

### DS‑01 MessageRecord
* **Primary Runtime Owner:** MS2.4 MessageRecord  
* **Description:** Persistent chat message record used as input for manual summaries and “what you missed” previews.

**Storage Estimate (per record):**
* `message_identifier` (UUID) → 16 bytes  
* `channel_identifier` (UUID) → 16 bytes  
* `author_user_identifier` (UUID) → 16 bytes  
* `author_display_name` (VARCHAR) → up to ~32 bytes + overhead  
* `content_text` (TEXT) → variable (avg 80–300 bytes typical)  
* `created_at` (TIMESTAMPTZ) → 8 bytes

**Approximate Size Formula:** RecordSize ≈ 56 + length(author_display_name) + length(content_text) + overhead


**Typical case:** ~200–500 bytes per message (excluding indexes)

### DS‑02 LastReadAnchorRecord
* **Primary Runtime Owner:** WYMS2.2 LastReadRepository  
* **Description:** Stores per-user, per-channel last-read anchor for missed-message computation.

**Storage Estimate (per record):**
* `requester_user_identifier` (UUID) → 16 bytes  
* `channel_identifier` (UUID) → 16 bytes  
* `last_read_message_identifier` (UUID) → 16 bytes  
* `updated_at` (TIMESTAMPTZ) → 8 bytes  

**Approximate Size Formula:** RecordSize ≈ 56 bytes + indexing overhead

**Typical case:** ~72–120 bytes per anchor (with indexes)

### DS‑03 ManualSummarySnapshotRecord (Optional)
* **Primary Runtime Owner:** MSOD2.4 SummaryStateStore  
* **Description:** Optional cached snapshot of manual summary results.

**Storage Estimate (per record):**
* `summary_snapshot_identifier` (UUID) → 16 bytes
* `requester_user_identifier` (UUID) → 16 bytes
* `channel_identifier` (UUID) → 16 bytes
* `time_window_minutes` (INTEGER) → 4 bytes
* `generated_at` (TIMESTAMPTZ) → 8 bytes
* `message_count_included` (INTEGER) → 4 bytes
* `time_range_start`(TIMESTAMPTZ) → 8 bytes
* `time_range_end` (TIMESTAMPTZ) → 8 bytes
* `bullets_json` (JSONB) → variable

**Approximate Size Formula:** RecordSize ≈ 80 + size(bullets_json) + overhead

**Typical case:** ~1–3 KB per snapshot (depends on bullet JSON size)

### DS‑04 WhatYouMissedPreviewSnapshotRecord (Optional)
* **Primary Runtime Owner:** WYMS2.1 WhatYouMissedPreviewCardModel / WYMS3.1 WhatYouMissedService  
* **Description:** Optional cached snapshot of “what you missed” preview results.

**Storage Estimate (per record):**
* `preview_snapshot_identifier` (UUID) → 16 bytes
* `requester_user_identifier`(UUID) → 16 bytes
* `channel_identifier`(UUID) → 16 bytes
* `last_read_message_identifier`(UUID) → 16 bytes
* `generated_at`(TIMESTAMPTZ) → 8 bytes
* `missed_message_count`(INTEGER) → 4 bytes
* `time_range_start`(TIMESTAMPTZ) → 8 bytes
* `time_range_end` (TIMESTAMPTZ) → 8 bytes
* `highlights_json` (JSONB) → variable
* `action_hint_text`(VARCHAR) → up to 160 bytes + overhead

**Approximate Size Formula:** RecordSize ≈ 100 + length(action_hint_text) + size(highlights_json) + overhead - If H = number of highlights and T = avg highlight text length:
 size(highlights_json) ≈ O(H × (T + metadata))

**Typical case:** ~1–4 KB per preview snapshot (depends on highlights JSON size)

### Schema Summary

| Label | Data Type | Primary Runtime Owner |
| :--- | :--- | :--- |
| **DS‑01** | MessageRecord | MS2.4 MessageRecord |
| **DS‑02** | LastReadAnchorRecord | WYMS2.2 LastReadRepository |
| **DS‑03** | ManualSummarySnapshotRecord | MSOD2.4 SummaryStateStore |
| **DS‑04** | WhatYouMissedPreviewSnapshotRecord | WYMS2.1 WhatYouMissedPreviewCardModel |

### Our Rationale & Justification
The schemas define how data is stored to support both features efficiently. Separating message records from last-read anchors keeps reads/writes clear and avoids overloading a single table with mixed responsibilities.

---

# 12. Security & Privacy

---

# Temporary Handling of PII  
(What You Missed Summary Preview Feature)

## PII Elements

- `user_identifier`
- `session_identifier`
- `ip_address`
- `device_metadata` (browser, operating system)
- `last_read_message_identifier` (user-scoped reading state)

---

## Justification

- **user_identifier:** Required to resolve channel memberships and validate access before generating preview summaries.
- **session_identifier:** Maintains authenticated session context for preview API requests.
- **ip_address:** Used for abuse detection, rate limiting, and anomaly monitoring.
- **device_metadata:** Supports diagnostics and UI compatibility validation.
- **last_read_message_identifier:** Required to compute the “missed messages since last read” window for preview generation.

---

## Data Flow

Client click on channel  
→ `WYMS1.3 WhatYouMissedApiClient` sends request  
→ Authentication middleware validates `session_identifier`  
→ `user_identifier` resolved  
→ `WYMS2.2 LastReadRepository` retrieves `last_read_message_identifier`  
→ `MS2.3 MessageRepository` fetches messages after anchor  
→ `MS2.1 SummaryService` produces preview highlights  
→ Response returned to client  
→ Request-scoped memory cleared

---

## Usage Points

- Authentication and authorization validation
- Preview summary generation
- Last-read anchor resolution
- Rate limiting and abuse prevention
- Operational logging and diagnostics

---

## Disposal & Retention

- Request metadata (`ip_address`, `device_metadata`) retained only in short-term logs per logging policy.
- Session identifiers expire via logout or timeout.
- Preview data stored in memory only unless snapshot caching is enabled.
- No PII written to client local storage beyond secure session cookies.

---

## Protection Mechanisms

- HTTPS / TLS encryption for all client-server traffic
- Secure, HTTP-only, SameSite cookies
- Request-scoped in-memory processing
- Strict role-based authorization via `MS2.6 MembershipService`
- Rate limiting on preview endpoints
- Input validation and controlled output serialization

---

# Long-Term Storage of PII

## Stored Data

- `user_identifier (UUID)`
- `channel_identifier (UUID)`
- `last_read_message_identifier (UUID)`
- Server membership relationships
- Message records (including `author_user_identifier` and `content_text`)

> Note: Message content may contain user-generated personal data but is not system-generated PII.

---

## Justification

- `user_identifier`: Required for membership validation and preview generation.
- `last_read_message_identifier`: Required to compute preview window.
- Membership relationships: Required to enforce access control.
- Message records: Required to generate accurate previews and summaries.

---

## Storage Method

- **Primary Storage:** PostgreSQL relational database
  - UUID identifiers with indexed lookup
  - Foreign key constraints for integrity  
    (e.g., `last_read_message_identifier` references `DS-01.message_identifier`)
  - Encrypted storage volumes at infrastructure level
- **Optional Redis Cache:** Non-authoritative store for preview snapshots

---

## Data Entry Paths

- Authentication system resolving `user_identifier`
- Channel read events updating `LastReadAnchorRecord`
- Message creation events inserting into `MessageRecord`
- Server membership updates

---

## Data Exit Paths

- `WYMS3.1 WhatYouMissedService` retrieving preview data
- `MSOD3.2 ManualSummaryService` retrieving message windows
- `ServerChannelListView` rendering `previewCard`
- Audit logging systems

---

# Security Responsibilities

## LS-01 Primary Application Database (PostgreSQL)

### Responsible Personnel

**Database Administrator**
- Database hardening
- Role-based access configuration
- Backup management
- Patch management

**Backend Services Maintainer**
- Secure query implementation
- Data exposure prevention
- Enforcement of `MembershipService` checks

**Security Owner**
- Schema-level PII review
- Approval of new storage fields
- Retention and encryption standards enforcement

---

## LS-02 Redis Preview Cache (If Enabled)

### Responsible Personnel

**Backend Services Maintainer**
- Cache scoping and expiration logic
- Prevention of cache-based data leakage

**Database Administrator**
- Network isolation configuration
- Access restriction policies

**Security Owner**
- Review of cache retention policy
- Validation that no long-term sensitive duplication occurs

---

# Security Oversight & Auditing

**Designated Security Officer:** Chief Security & Privacy Officer (CSPO)

### Responsibilities

- Audits database and cache access privileges
- Verifies encryption in transit and at rest
- Reviews logging and anomaly detection alerts
- Conducts periodic least-privilege audits
- Approves schema changes involving new PII fields
- Reviews third-party summarization provider data handling

---

# Access Control & Safeguards

- Role-restricted access to PostgreSQL database
- Service accounts scoped to minimal required privileges
- Preview endpoint protected by authentication middleware
- All privileged access logged and reviewable
- Periodic access review and revocation
- Separation between application runtime roles and database admin roles
- No unnecessary duplication of user identifiers

---

# Privacy Considerations

- Preview generation limited strictly to messages the user is authorized to access.
- No behavioral profiling beyond last-read anchor tracking.
- No additional personal attributes collected for this feature.
- Message summarization does not store expanded derived profiles.
- Minimal retention of network metadata.
- Conservative default visibility — previews generated only for authorized channels.
- Summarization provider receives message content only; no persistent identifiers (e.g., `user_identifier`) are transmitted externally.

---

# Our Rationale & Justification

Security and privacy controls are built around strict authorization enforcement, minimal necessary data usage, and separation between request-scoped processing and long-term storage. Role-based access, encryption, auditing, and retention governance reduce leakage risk and strengthen production readiness while maintaining feature functionality.

# 13. Risks to Completion

---

# Module-Level Risks

## MS2.0 Message & Summarization Module (Used by WYMS + MSOD)

- **Summarization Output Variability:** LLM/heuristic outputs may vary in quality and structure, making deterministic UI expectations difficult.
- **Verification Difficulty:** Summary correctness is subjective; testing must focus on output shape, limits, and contracts rather than semantic equality.
- **Performance Sensitivity:** Summarization can be the slowest step; message caps and timeouts are required to keep WYMS preview responsive.
- **Maintenance Risk:** Changes affect both WYMS and MSOD; regressions may break multiple features simultaneously.

---

## WYMS1.0 Server Channel List Page (Preview UI)

- **State Synchronization Complexity:** Rapid channel clicking may produce race conditions (stale previews shown for the wrong channel).
- **Verification Difficulty:** Many interaction paths (click, close, enter, retry, manual summary handoff) expand UI test surface.
- **UX Consistency Risk:** Balancing short previews with meaningful summaries may require iterative tuning.

---

## WYMS2.0 What You Missed Backend Service

- **Hidden Coupling Risk:** Tight coupling between last-read anchors and retrieval boundaries can cause subtle off-by-one bugs.
- **Scalability Risk:** High usage may require caching, indexing, throttling, and request caps.
- **Security Risk:** Any missing membership check could leak channel activity; access validation must be enforced consistently.

---

## MSOD Manual Summary Dependency Path

- **Integration Risk:** WYMS → Manual Summary handoff requires coordinated navigation and shared state; mismatch breaks flow.
- **Contract Drift Risk:** API or UI changes in MSOD can silently break WYMS dependency behavior.

---

# Class-Level Risks

## MS2.1 SummaryService
- **Implementation Complexity:** Must enforce limits, handle empty inputs, and maintain stable output shapes.
- **Testing Risk:** Requires strong contract tests (max items, formatting, fallback behavior).

## MS2.2 SummarizationProvider
- **Upgrade Risk:** Provider API or rate-limit changes may break summarization unexpectedly.
- **Cost/Latency Risk:** External calls are slow and potentially expensive; must implement retry, timeout, and degraded modes.

## MS2.3 MessageRepository
- **Query Boundary Risk:** “After last read” queries are prone to ordering/index errors.
- **Performance Risk:** Missing indexes (`channel_identifier`, `created_at`) degrade preview performance.

## MS2.6 MembershipService
- **Security Verification Risk:** Must be invoked on every preview/manual summary path.
- **Maintenance Risk:** Permission model changes may invalidate assumptions.

## WYMS1.1 ServerChannelListView
- **UI Edge Case Risk:** Empty states, loading spinners, and error overlays may flicker or render incorrectly.
- **Rendering Performance Risk:** Frequent overlay updates may cause lag in large server lists.

## WYMS1.2 ServerChannelListController
- **Race Condition Risk:** Multiple in-flight preview requests may resolve out of order.
- **State Coordination Risk:** Controller manages anchors, API calls, and view updates; desynchronization is easy.

## WYMS1.3 WhatYouMissedApiClient
- **Contract Drift Risk:** Backend response shape changes may break model mapping.
- **Retry/Timeout Risk:** Poor timeout handling can hang UI or flood the backend.

## WYMS2.2 LastReadRepository
- **Data Integrity Risk:** Incorrect anchor writes distort preview logic.
- **Concurrency Risk:** Multi-device updates require defined conflict resolution.

## MSOD Touchpoints (SummaryApiClient / ChannelPageController)
- **Integration Risk:** WYMS dependency handoff relies on these components; signature changes break flow.
- **Testing Scope Risk:** Requires full end-to-end tests across both features.

---

# Method-Level Risks

## `ServerChannelListController.onClickChannel(...)`
- **Out-of-Order Response Risk:** Only the latest channel click should update the view.
- **Load Spike Risk:** Repeated clicks may flood preview API; debounce/cancel strategy required.

## `ServerChannelListController.resolveLastReadMessageIdentifier(...)`
- **Fallback Logic Risk:** Missing or corrupt anchors affect preview correctness.
- **Cross-Device Consistency Risk:** Anchors may differ across devices.

## `WhatYouMissedApiClient.fetchWhatYouMissedPreview(...)`
- **Timeout/Retry Risk:** Poor retry strategy can spam backend or degrade UX.

## `WhatYouMissedService.buildPreview(...)`
- **Boundary Computation Risk:** Off-by-one errors may include already-read messages.
- **Latency Risk:** Must cap message fetch size for responsiveness.

## `SummaryService.generateHighlights(...)`
- **Format Stability Risk:** UI depends on stable highlight structure.

## `ChannelPageController.onClickOpenManualSummary()`
- **Navigation Timing Risk:** Manual summary panel may fail if invoked before mount completes.

---

# Schema-Level Risks

## DS-01 MessageRecord
- **Storage Growth Risk:** Message volume scales rapidly; may require partitioning or retention policies.
- **Indexing Risk:** Poor indexing degrades preview queries.
- **Privacy Risk:** User-generated content may contain PII; retention and access controls must be robust.

## DS-02 LastReadAnchorRecord
- **Consistency Risk:** Missing constraints or invalid references break preview logic.
- **Write Hotspot Risk:** Frequent updates may require batching or async writes.

## DS-03 ManualSummarySnapshotRecord (Optional Cache)
- **Correctness Risk:** Snapshot must reflect correct time window.
- **Upgrade Risk:** JSON structure changes require migration strategy.

## DS-04 WhatYouMissedPreviewSnapshotRecord (Optional Cache)
- **Staleness Risk:** Incorrect cache key may leak stale previews.
- **Storage Bloat Risk:** Requires expiration policy to prevent uncontrolled growth.

---

# Technology-Level Risks

## TypeScript (TECH-01) + React (TECH-02)
- **Async State Complexity:** Incorrect modeling of async state may cause stale UI bugs.
- **Upgrade Risk:** React lifecycle changes may affect overlay behavior.

## Node.js (TECH-03) + Express (TECH-04)
- **Middleware Ordering Risk:** Small changes can alter authentication/security behavior.
- **Validation Risk:** Must consistently validate request inputs (UUIDs, identifiers).

## PostgreSQL (TECH-05) + Prisma (TECH-06)
- **Migration Risk:** Schema changes require safe rollout/backfill.
- **ORM Performance Risk:** Generated queries may require raw SQL optimization.

## LLM Provider API (TECH-08)
- **Reliability Risk:** Rate limits or outages degrade preview quality and latency.
- **Cost Risk:** High usage may require caps, caching, and fallback logic.

## Redis (TECH-09) — Optional
- **Operational Complexity:** Adds monitoring and deployment overhead.
- **TTL Misconfiguration Risk:** Incorrect expiry leads to stale or ineffective caching.

## Docker (TECH-10) / Nginx (TECH-15)
- **Configuration Risk:** Routing, timeout, or TLS misconfiguration directly impacts preview responsiveness.

## Jest (TECH-14) + ESLint (TECH-13)
- **Verification Scope Risk:** Unit tests alone may miss async race conditions; integration/E2E tests required.

---

# Our Rationale & Justification

Documenting risks across modules, classes, methods, schemas, and technologies makes cross-cutting failure points explicit. This reduces the likelihood that changes in one layer silently break another, improves test planning, and enables proactive mitigation strategies before production deployment.

---




---

## 14. Shared Infrastructure Rationale (Modification Explanation for Third Dev Spec)

To support the “What You Missed” preview feature, the Manual Summary dev spec was modified so its message retrieval and summarization logic could be reused rather than duplicated. Specifically, **MessageRepository** and **SummaryService** were defined as shared reusable components within **MS2.0**, allowing WYMS to call the same summarization pipeline used by Manual Summary. SummaryService was adapted to support shorter preview-style outputs in addition to full summaries, making WYMS directly dependent on the Manual Summary infrastructure while keeping shared logic centralized and consistent.
