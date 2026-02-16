# Dev Specification Document
**Project:** Web‑Based Discord Clone with Enhanced Usability Features  
**Feature:** What You Missed Summary  
**Version:** v0.2

---

## 1. Document Version History

| Version | Date       | Editor        | Summary of Changes |
| :------ | :--------- | :------------ | :----------------- |
| **v0.1**| 2026‑02‑14 | James Mullins | Initial draft of Dev Spec header created. |
| **v0.2**| 2026‑02‑15 | James Mullins | Aligned preview feature to reuse manual summary infrastructure directly, along with rationales. |

### Authors & Contributors

| Name              | Role / Responsibility                    | Contributed Versions |
| :---------------- | :--------------------------------------- | :------------------- |
| **James Mullins** | Product Lead / Requirements Definition   | v1.0        |

### Rationale & Justification
The header section clearly identifies what feature the document covers and which project it belongs to as well. It also includes the changes to the documents and how it's tracked over time. This allows for traceability for revisions, and supports organization and maintainability throughout the development process.

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
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Class: SHS0.4 MembershipService              │
├──────────────────────────────────────────────┤
│ Methods                                      │
│ - assertUserHasChannelAccess(userId, serverId, channelId) │
└──────────────────────────────────────────────┘

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
 ├─ depends on → SHS0.4 MembershipService
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
 └─ sends requests to → WYMS2.1 WhatYouMissedService

────────────────────────────────────────────
Component: WYMS2.0 What You Missed Backend Service
(Extends Manual Summary Module)
────────────────────────────────────────────
Class: WYMS2.1 WhatYouMissedService
 ├─ depends on → SHS0.4 MembershipService
 ├─ depends on → MS2.3 MessageRepository      (reused from Manual Summary)
 ├─ depends on → MS2.1 SummaryService         (reused from Manual Summary)
 ├─ depends on → LastReadRepository
 └─ produces → preview bullet data

Class: LastReadRepository
 └─ provides last-read anchor → WYMS2.1 WhatYouMissedService

```
### Rationale & Justification
The system is designed in clear layers so that each part has one specific responsibility. The UI handles display and user interaction, controllers handle actions, API clients will handle networking, and backend handles the business logic. Both features, “Manual Summary” and the “What you Missed Preview” will use the same core process and logic so we can make sure they work as intended. All in all, this design keeps the system organized and easier to maintain as the project grows.

## 3. Class Diagrams

```text
Component: MS2.0 Message & Summarization Module (Manual Summary – Reused by WYMS)
Class: MS2.2 SummaryService
 ├─ depends on → MS2.5 SummarizationProvider
 ├─ operates on → MS2.1 MessageRepository
 ├─ generates → bullets/highlights for Manual Summary + WYMS
 └─ methods → generateBullets(...), generateHighlights(...)

Class: MS2.1 MessageRepository
 ├─ provides data to → MSOD3.2 ManualSummaryService
 ├─ provides data to → WYMS2.1 WhatYouMissedService
 └─ supports → fetchMessagesAfter(...), fetchMessagesWithinTimeWindow(...)

Class: SHS0.4 MembershipService
 ├─ validates access for → MSOD3.2 ManualSummaryService
 └─ validates access for → WYMS2.1 WhatYouMissedService
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
 ├─ depends on → SHS0.4 MembershipService
 ├─ depends on → MS2.1 MessageRepository
 ├─ depends on → MS2.2 SummaryService
 └─ produces → MSOD3.3 SummaryCard

Class: MSOD3.3 SummaryCard → contains summary bullet data
────────────────────────────────────────────
Component: WYMS1.0 Server Channel List (Dependent on MS2.0)

Class: WYMS1.2 ServerChannelListController
 ├─ interacts with → WYMS1.1 ServerChannelListView
 ├─ depends on → WYMS1.3 WhatYouMissedApiClient
 └─ produces → WYMS2.1 WhatYouMissedPreviewCardModel → updates view

Class: WYMS1.3 WhatYouMissedApiClient
 ├─ sends requests to → WYMS2.1 WhatYouMissedService
 └─ transforms response → WYMS2.1 WhatYouMissedPreviewCardModel

Class: WYMS2.1 WhatYouMissedService
 ├─ depends on → SHS0.4 MembershipService
 ├─ depends on → MS2.1 MessageRepository   (reused from Manual Summary)
 ├─ depends on → MS2.2 SummaryService      (reused from Manual Summary)
 ├─ depends on → WYMS2.2 LastReadRepository
 └─ produces → preview bullet data

Class: WYMS2.2 LastReadRepository
 └─ provides last-read anchor → WYMS2.1 WhatYouMissedService

```
### Rationale & Justification
The class diagram defines clear responsibilities and dependencies so each feature is easy to reason about. Shared classes such as the message retrieval, summarization and access checks, are reused by both the Manual Summary and What you Missed Preview, which keeps the logic consistent. This will reduce coupling and support future changes without breaking parts of the system.

## 4. List of Classes

### Component: MS2.0 Message & Summarization Module 

**MS2.1 SummaryService**
* **Purpose & Responsibility:** Orchestrates summary generation (bullets/highlights) from message text; enforces max limits.
* **Implements Design Features:** Shared summarization pipeline used by Manual Summary + WYMS; consistent formatting and size control.

**MS2.2 SummarizationProvider**
* **Purpose & Responsibility:** Adapter to underlying summarization engine (LLM or heuristic); returns condensed text items.
* **Implements Design Features:** Pluggable summarization backend; allows engine swap without feature logic changes.

**MS2.3 MessageRepository**
* **Purpose & Responsibility:** Fetches message data (after last-read anchor or within time window).
* **Implements Design Features:** Shared data retrieval for Manual Summary + WYMS.

**SHS0.4 MembershipService**
* **Purpose & Responsibility:** Validates user authorization before summaries/previews are generated.
* **Implements Design Features:** Access control guardrail for summarization endpoints.

### Component: MSOD1.0 Channel Page (Manual Summary)

**MSOD1.1 ChannelPageView**
* **Purpose & Responsibility:** Displays channel UI state and manual summary output.
* **Implements Design Features:** Manual “request summary” experience; summary presentation + loading/error feedback.

**MSOD1.2 ChannelPageController**
* **Purpose & Responsibility:** Handles manual summary requests; coordinates view state + API calls.
* **Implements Design Features:** Manual trigger control; timeWindowMinutes pacing input.

### Component: WYMS1.0 Server Channel List (Dependent on MS2.0)

**WYMS1.1 ServerChannelListView**
* **Purpose & Responsibility:** Displays channel list + “what you missed” preview before entering channel.
* **Implements Design Features:** Returning-user preview + attention triage.

**WYMS1.2 ServerChannelListController**
* **Purpose & Responsibility:** Handles channel click; requests preview; updates view.
* **Implements Design Features:** Preview gating flow using last-read anchor + shared summarization.

### Rationale & Justification
The list of classes documents the building blocks needed to implement the feature and shows why each one exists. By separating concerns across controllers, services, etc., the design keeps responsibilities controlled and avoids mixing UI logic with summarization logic. Reusing the core classes for both of the Manual Summary and What you Missed allows both features to behave consistently. All in all, this will make it easier to maintain and extend.

## 5. State Diagrams

```text
Component: WYMS1.0 Server Channel List Page (What You Missed Summary Preview)
────────────────────────────────────────────────────────────
State: WYMS.S0 ChannelList_Ready_NoPreview   [Initial State]
────────────────────────────────────────────────────────────
Fields
- isPreviewOpen : Boolean = false
- isPreviewLoading : Boolean = false
- previewCard : WhatYouMissedPreviewCardModel = null
- errorMessage : String = ""
- channelIdentifierPendingEnter : String = ""
────────────────────────────────────────────────────────────
            │
            │ WYMS1.2.ServerChannelListController.onClickChannel()
            ▼

────────────────────────────────────────────────────────────
State: WYMS.S1 Preview_Open_Loading
────────────────────────────────────────────────────────────
Fields
- isPreviewOpen : Boolean = true
- isPreviewLoading : Boolean = true
- channelIdentifierPendingEnter : String = channelIdentifier
────────────────────────────────────────────────────────────
            │
            │ WYMS1.2.resolveLastReadMessageIdentifier()
            ▼

────────────────────────────────────────────────────────────
State: WYMS.S2 LastRead_Resolved
────────────────────────────────────────────────────────────
            │
            │ WYMS2.3.WhatYouMissedApiClient.fetchWhatYouMissedPreview()
            ▼

────────────────────────────────────────────────────────────
State: WYMS.S3 Awaiting_Preview_Response
────────────────────────────────────────────────────────────
            │
            │ Predicate: responseSuccess == true
            ├───────────────────────────────────────────────►

────────────────────────────────────────────────────────────
State: WYMS.S4 Preview_Displayed
────────────────────────────────────────────────────────────
Fields
- isPreviewOpen : true
- isPreviewLoading : false
- previewCard : != null
────────────────────────────────────────────────────────────

```
### Rationale & Justification
The state diagram makes the preview features predictable by explicitly modeling each UI state such as idle, loading, awaiting response, displayed and error, and the exact transition between them. This will reduce any race conditions bugs from happening since the controller knows which state it is in and what data must be valid.

## 6. Flow Charts (Scenario‑Based)

### Scenario: WYMS.FC1 — “Preview Then Enter Channel”
* **Starting State:** WYMS.S0 ChannelList_Ready_NoPreview
* **Ending State:** WYMS.S6 Channel_Entered

```text
(Start)
   │
   ▼
[Process] User clicks a channel in the server list
   │
   ▼
[Process] Transition to WYMS.S1 Preview_Open_Loading
   │
   ▼
[Process] Resolve last-read anchor via LastReadRepository
   │
   ▼
[Process] Request preview from backend (State WYMS.S3)
   │
   ▼
[Decision] responseSuccess == true ?
   │
   ├── Yes ──► [Process] Transition to WYMS.S4 Preview_Displayed
   │               │
   │               ▼
   │           [Input] User chooses “Enter Channel”
   │               │
   │               ▼
   │           [Process] Transition to WYMS.S6 Channel_Entered
   │               │
   │               ▼
   │             (End)
   │
   └── No ──► [Process] Transition to WYMS.S5 Preview_Error_Displayed

```
### Rationale & Justification
The flow charts justify the design by showing the main user paths step by step, which makes it clear how the preview feature behaves in success, error, and handoff scenarios. This will help verify the logic and reduce ambiguity.

## 7. Possible Threats and Failures

| Failure Mode | Description | Recovery Procedure | Likelihood | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **FM-WYMS1-01 Runtime Crash** | Preview overlay rendering or controller logic throws an unhandled exception. | Reinitialize controller, reset to WYMS.S0, reload view state. | Medium | High |
| **FM-WYMS1-02 Loss of State** | previewCard or loading state lost during re-render. | Restore preview state from cached API response. | High | Medium |
| **FM-WYMS2-01 Anchor Corruption** | Incorrect lastReadMessageIdentifier retrieved or stored. | Validate anchor against MessageRepository, fallback to latest safe message. | Medium | High |
| **FM-WYMS2-03 Retrieval Timeout** | MessageRepository fetchMessagesAfter() stalls. | Timeout threshold enforcement; transition to WYMS.S5. | Medium | Medium |

### Rationale & Justification
Due to the detailed failures across every layer of the feature, it shows what could go wrong and how it handles it. It covers problems in every section of frontend, backend, network, deployment, and security. This feedback makes the feature more reliable and safer to run in production. This will also help us reduce unexpected behaviors, ultimately securing its stability.

## 8. Technologies

| Technology | Version | Purpose | Justification vs Alternatives |
| :--- | :--- | :--- | :--- |
| **TECH-01 TypeScript** | 5.x | Client-side logic | Static typing safety vs plain JS. |
| **TECH-02 React** | 18.x | Frontend UI framework | Component-based state consistency. |
| **TECH-05 PostgreSQL** | 15.x | Persistent relational database | Strong integrity for structured message data. |
| **TECH-08 OpenAI API** | v1 | External summarization provider | High-quality semantic results vs rule-based heuristics. |

### Rationale & Justification
The chosen technology stack supports a real time feature with a safe type of frontend and a reliable database. Caching will improve the preview speed, and the containerization helps with a more consistent deployment. All in all, it prioritizes performance and maintainability.

## 9. APIs

### Component: MS2.0 Message & Summarization Module

**Class: MS2.1 SummaryService**
* **Public Methods**
    * `generateBullets(messages : List<Message>, maxBullets : Integer) : List<SummaryBullet>`
    * `generateHighlights(messages : List<Message>, maxHighlights : Integer) : List<SummaryHighlight>`

**Class: MS2.3 MessageRepository**
* **Public Methods**
    * `fetchMessagesAfter(serverID, channelID, lastReadMsgID, limit) : List<Message>`
    * `fetchMessagesWithinTimeWindow(serverID, channelID, timeWindow, limit) : List<Message>`

### Component: WYMS1.0 Server Channel List Page

**Class: WYMS1.1 ServerChannelListView**
* **Public Methods**
    * `render() : void`
    * `openPreview(channelIdentifier : String) : void`
    * `showPreview(previewCard : WhatYouMissedPreviewCardModel) : void`

### Rationale & Justification
The API section clearly defines how different parts of the system react with each other. It clearly shows what functions are available and what data is passed between components. This will help promote consistent behavior across features and will make integration easier and more controlled.

## 10. Public Interfaces

### Component: WYMS1.0 Server Channel List Page

**External Dependencies — WYMS1.0 Uses:**
* **From MS2.0 Module:**
    * `MS2.3 MessageRepository.fetchMessagesAfter(...)`
    * `MS2.1 SummaryService.generateHighlights(...)`
    * `SHS0.4 MembershipService.assertUserHasChannelAccess(...)`

---

### Component: MS2.0 Message & Summarization Module

**Public Methods Exposed to WYMS & MSOD:**
* `MS2.1.generateBullets(...)`
* `MS2.3.fetchMessagesAfter(...)`
* `MS2.3.fetchMessagesWithinTimeWindow(...)`

### Rationale & Justification
The public interfaces define only the external accessible methods which allows the structure and dependencies to be transparent and testable. It reduces inconsistencies by sharing the logic into one common module. This keeps reusable backend logic separate from UI and controller code, which helps keep the system modular and easier to extend over time.

## 11. Data Schemas

### DS-01 MessageRecord
* **Runtime Owner:** MS2.4 MessageRecord
* **Description:** Persistent chat message record input for summaries and previews.
* **Size:** ~200–500 bytes per message typical.

### DS-02 LastReadAnchorRecord
* **Runtime Owner:** WYMS2.2 LastReadRepository
* **Description:** Per-user, per-channel last-read anchor for missed-message computation.
* **Size:** ~72–120 bytes per anchor typical.

### Rationale & Justification
The data schemas establish how information is stored and how it supports both features. By separating message and last-read anchors, it will keep the design efficient and data structured. The explicit runtime mappings will make sure that there is consistency between database records and application models.

## 12. Security & Privacy

### Temporary Handling of PII
* **PII Elements:** user_identifier, session_identifier, last_read_message_identifier.
* **Justification:** Required to resolve memberships, maintain authenticated context, and compute the missed message window.
* **Protection:** HTTPS/TLS encryption, Secure HTTP-only cookies, and memory-scoped processing.

### Long-Term Storage of PII
* **Stored Data:** user_identifier, channel_identifier, last_read_message_identifier, message records.
* **Method:** PostgreSQL relational database with UUID identifiers and indexed lookups.

### Rationale & Justification
The Security and Privacy section properly makes sure that the data is handled with clear bounds and built with strong protection designs. It goes into great detail about what, why and how PII is used to work through the system. It separates temporary data requests and long term stored records to reduce any risks using encryption and audit oversight. Overall, this will strengthen the system security and support proper production deployment.

## 13. Risks to Completion

### Module-Level Risks
* **Output Variability:** LLM/heuristic results vary in quality, making UI expectations harder to test.
* **State Sync Complexity:** Rapid channel clicking can create race conditions showing stale previews.
* **Scalability:** Preview should be fast under load; production may require heavy caching.

### Rationale & Justification
The risks to completion section finds potential failure points across modules, classes, etc. It properly states how it analyses performances and dependencies. Documenting these risks reduce the chances of a change in one area silently breaking another. Overall, this structure risks analysis improves reliability and promotes a safer system operation.


## 14. Shared Infrastructure Rationale

To support the “What You Missed” preview feature, the Manual Summary dev spec was slightly modified so that its message retrieval and summarization logic could be reused instead of duplicated. Specifically, the MessageRepository and SummaryService were defined as shared, reusable components within the MS2.0 module, which allowed the preview feature to call the same summarization logic used by the Manual Summary. The SummaryService was updated to support shorter preview-style outputs in addition to full summaries, and the MessageRespository was adjusted to share the same summarization logic, making the preview feature directly dependent on the Manual Summary infrastructure.
