# Dev Specification Document
**Project:** Web‑Based Discord Clone with Enhanced Usability Features  
**Feature:** Manual Summary on Demand
**Version:** v0.1


## 1. Document Version History

| Version | Date | Editor | Summary of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-02-13 | Nafisa Ahmed | Initial document creation for Manual Summary On Demand user story |

### Authors & Contributors
| Name | Role / Responsibility | Contributed Versions |
| :--- | :--- | :--- |
| Nafisa Ahmed | Product Owner | v1.0 |

### Rationale & Justification:
Our header follows the professional outline given in the slides from our in class discussion. We were sure to update the header on every iteration of the document and include all others of each version. The format generated is readable and clear. The only refinements that had to be made was excluding ChatGPT including itself as an author/contributor to the document.

### 2. Architecture Diagram
```text
───────────────────────────────────────────────────────
Component: MS1.0 Chat Channel Page (View + Controller)
───────────────────────────────────────────────────────
┌──────────────────────────────────────────────────────────┐
│ Class: MS1.1 ChatChannelView                             │
├──────────────────────────────────────────────────────────┤
│ Fields                                                   │
│ - channelIdentifier : String                             │
│ - messages : List<MessageViewModel>                      │
│ - isSummaryVisible : Boolean                             │
├──────────────────────────────────────────────────────────┤
│ Methods                                                  │
│ - render()                                               │
│ - displaySummary(summary : SummaryViewModel)             │
│ - hideSummary()                                          │
│ - updateMessages(messages : List<MessageViewModel>)      │
└──────────────────────────────────────────────────────────┘
                     ▲
                     │ View updates
                     │
┌──────────────────────────────────────────────────────────┐
│ Class: MS1.3 ChatChannelController                       │
├──────────────────────────────────────────────────────────┤
│ Fields                                                   │
│ - chatChannelView : ChatChannelView                      │
│ - summaryButtonView : ManualSummaryButtonView            │
│ - messageRepository : MessageRepository                  │
│ - summaryService : SummaryService                        │
│ - channelIdentifier : String                             │
│ - userIdentifier : String                                │
│ - lastReadMessageIdentifier : String                     │
├──────────────────────────────────────────────────────────┤
│ Methods                                                  │
│ - onManualSummaryRequested()                             │
│ - fetchMessagesSinceLastRead() : List<MessageRecord>     │
│ - updateLastReadMessage(messageIdentifier : String)      │
│ - handleSummaryResponse(summary : SummaryViewModel)      │
└──────────────────────────────────────────────────────────┘
          ▲                                        │
          │ User input events           │ Summary request
          │                                        ▼
┌──────────────────────────────────────────────────────────┐
│ Class: MS1.2 ManualSummaryButtonView                     │
├──────────────────────────────────────────────────────────┤
│ Fields                                                   │
│ - channelIdentifier : String                             │
│ - isEnabled : Boolean                                    │
├──────────────────────────────────────────────────────────┤
│ Methods                                                  │
│ - render()                                               │
│ - onClick()                                              │
│ - setEnabled(isEnabled : Boolean)                        │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Class: MS1.4 MessageViewModel                            │
├──────────────────────────────────────────────────────────┤
│ Fields                                                   │
│ - messageIdentifier : String                             │
│ - senderDisplayName : String                             │
│ - messageContent : String                                │
│ - timestamp : DateTime                                   │
├──────────────────────────────────────────────────────────┤
│ Methods                                                  │
│ - MessageViewModel()                                     │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Class: MS1.5 SummaryViewModel                            │
├──────────────────────────────────────────────────────────┤
│ Fields                                                   │
│ - summaryText : String                                   │
│ - generatedAt : DateTime                                 │
│ - messageCountIncluded : Integer                         │
├──────────────────────────────────────────────────────────┤
│ Methods                                                  │
│ - SummaryViewModel()                                     │
└──────────────────────────────────────────────────────────┘
────────────────────────────────────────────────────────────
Component: MS2.0 Message & Summarization Module (Model + Service)
────────────────────────────────────────────────────────────
┌──────────────────────────────────────────────────────────┐
│ Class: MS2.1 MessageRepository                           │
├──────────────────────────────────────────────────────────┤
│ Fields                                                   │
│ - databaseConnection : DatabaseConnection                │
├──────────────────────────────────────────────────────────┤
│ Methods                                                  │
│ - fetchMessagesAfter(channelIdentifier : String,         │
│ messageIdentifier : String) : List<MessageRecord>        │
│ - fetchLastReadMessage(userIdentifier : String,          │
│ channelIdentifier : String) : String                     │
│ - persistLastReadMessage(userIdentifier : String,        │
│ channelIdentifier : String,                              │
│ messageIdentifier : String) : Void                       │
└──────────────────────────────────────────────────────────┘
            │ Provides message data
            ├──────────────────────────────► MS1.3 ChatChannelController
            │
            └──────────────────────────────► MS2.2 SummaryService
┌──────────────────────────────────────────────────────────┐
│ Class: MS2.2 SummaryService                              │
├──────────────────────────────────────────────────────────┤
│ Fields                                                   │
│ - naturalLanguageClient : NaturalLanguageClient          │
├──────────────────────────────────────────────────────────┤
│ Methods                                                  │
│ - generateSummary(messages : List<MessageRecord>)        │
│ : SummaryResult                                          │
│ - transformToViewModel(result : SummaryResult)           │
│ : SummaryViewModel                                       │
└──────────────────────────────────────────────────────────┘
            │ Generates summary
            ▼
┌──────────────────────────────────────────────────────────┐
│ Class: MS2.3 SummaryResult                               │
├──────────────────────────────────────────────────────────┤
│ Fields                                                   │
│ - summaryText : String                                   │
│ - messageCountIncluded : Integer                         │
│ - generatedTimestamp : DateTime                          │
├──────────────────────────────────────────────────────────┤
│ Methods                                                  │
│ - SummaryResult()                                        │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Class: MS2.4 MessageRecord                               │
├──────────────────────────────────────────────────────────┤
│ Fields                                                   │
│ - messageIdentifier : String                             │
│ - channelIdentifier : String                             │
│ - senderIdentifier : String                              │
│ - content : String                                       │
│ - timestamp : DateTime                                   │
├──────────────────────────────────────────────────────────┤
│ Methods                                                  │
│ - MessageRecord()                                        │
└──────────────────────────────────────────────────────────┘
────────────────────────────────────────────────────────────
Legend
────────────────────────────────────────────────────────────
▲ / ▼ / ►   Directional interaction or dependency
Fields       Persistent state owned by the class
Methods      Behaviors invoked through interactions

```
### Rationale and Justification:
This architecture uses a MVC pattern to make sure that the application stays responsive while the data is processing. It separates the database entities such as MessageRecord from the objects such as SummaryViewModel to keep the backend schema intact and also minimize the amount of the data sent to the client browser.

### 3. Class Diagrams

**Class: MS1.3 ChatChannelController**
* interacts with → Class: MS1.1 ChatChannelView
* interacts with → Class: MS1.2 ManualSummaryButtonView
* depends on → Class: MS2.1 MessageRepository
* depends on → Class: MS2.2 SummaryService
* operates on → Class: MS2.4 MessageRecord
* produces → Class: MS2.3 SummaryResult
* transforms into → Class: MS1.5 SummaryViewModel

**Class: MS1.1 ChatChannelView**
* displays → Class: MS1.4 MessageViewModel
* displays → Class: MS1.5 SummaryViewModel

**Class: MS1.2 ManualSummaryButtonView**
* triggers → Class: MS1.3 ChatChannelController

**Class: MS2.1 MessageRepository**
* provides data to → Class: MS1.3 ChatChannelController
* provides data to → Class: MS2.2 SummaryService
* reads → Class: MS2.4 MessageRecord

**Class: MS2.2 SummaryService**
* operates on → Class: MS2.4 MessageRecord
* produces → Class: MS2.3 SummaryResult
* transforms into → Class: MS1.5 SummaryViewModel

**Class: MS2.4 MessageRecord**  
**Class: MS2.3 SummaryResult**  
**Class: MS1.4 MessageViewModel**  
**Class: MS1.5 SummaryViewModel**  

### Rationale and Justification:
This class structure keeps different data entities such as the MessageRecord separate from the more UI-specific models (SummaryViewModel) so that if there are any changes to the database schema, it doesn’t break the frontend logic. It also keeps most of the interaction logic in the ChatChannelController.

### 4. List of Classes

#### Component: MS1.0 Chat Channel Page (View + Controller)

**Class: MS1.1 ChatChannelView**
* **Purpose & Responsibility:** Responsible for rendering the chat channel interface, including message history and the manual summary panel. Manages UI states such as summary visible/hidden and updated message lists.
* **Implements Design Features:** Manual Summary On Demand (user-controlled summary display), Dynamic UI state transitions (show/hide summary without disrupting chat flow).

**Class: MS1.2 ManualSummaryButtonView**
* **Purpose & Responsibility:** Represents the interactive UI element that allows users to request a manual summary. Manages enabled/disabled state and triggers summary generation requests.
* **Implements Design Features:** Manual Summary On Demand (explicit user-triggered action), User autonomy (summary not forced).

**Class: MS1.3 ChatChannelController**
* **Purpose & Responsibility:** Coordinates interactions between the view layer and backend services. Handles user-triggered summary requests, retrieves relevant messages, invokes summarization logic, and updates the UI accordingly.
* **Implements Design Features:** Manual Summary On Demand (end-to-end orchestration), Separation of concerns (UI vs business logic), Controlled data flow between modules.

**Class: MS1.4 MessageViewModel**
* **Purpose & Responsibility:** Represents message data formatted specifically for UI rendering. Contains only fields necessary for visual presentation in the chat channel.
* **Implements Design Features:** Model-View separation, Efficient rendering.

**Class: MS1.5 SummaryViewModel**
* **Purpose & Responsibility:** Represents summarized content formatted for display within the chat interface. Contains summary text and minimal metadata required for UI presentation.
* **Implements Design Features:** Manual Summary On Demand (UI presentation layer), Lightweight summary display without exposing raw backend structures.

#### Component: MS2.0 Message & Summarization Module (Model + Service)

**Class: MS2.1 MessageRepository**
* **Purpose & Responsibility:** Handles retrieval and persistence of message data and last-read markers from the database. Acts as the data access layer for chat messages.
* **Implements Design Features:** Efficient retrieval, Persistence of read-state tracking, Data abstraction from UI layer.

**Class: MS2.2 SummaryService**
* **Purpose & Responsibility:** Processes message data and generates a condensed textual summary. Transforms raw message records into a summarized representation suitable for presentation.
* **Implements Design Features:** Manual Summary On Demand (core summarization logic), Encapsulation of NLP integration, Data model transformation into view models.

#### Data Storage Classes / Structs

**Class: MS2.3 SummaryResult**
* **Purpose & Responsibility:** Represents the structured result of a summarization operation before transformation into a UI-specific model.
* **Implements Design Features:** Intermediate summarization representation, Separation between processing output and presentation model.

**Class: MS2.4 MessageRecord**
* **Purpose & Responsibility:** Represents persistent message data retrieved from the database. Contains full message metadata required for summarization and read-state calculations.
* **Implements Design Features:** Persistent storage representation, Data source for summarization, Incremental retrieval.

### Rationale and Justification:
This class list assigns different parts of the application their own responsibilities. Views are responsible for the UI, Controllers are responsible for the business logic, and Repositories are responsible for the data persistence. The MessageViewModel and SummaryViewModel make sure that the raw database entries like MessageRecord aren’t directly exposed to the client.

### 5. State Diagrams
```text
───────────────────────────────────────────────────────
State: MS1.0 ChannelIdleState [Initial State]
───────────────────────────────────────────────────────
Fields
messageList : List<MessageViewModel> = populated
summaryVisible : Boolean = false
summaryContent : SummaryViewModel = null
isSummaryLoading : Boolean = false
lastReadMessageIdentifier : String = persistedValue

──────────────────────────────────────────────────
│MS1.0.ChatChannelPage.MS1.3.ChatChannelController.onManualSummary
│Requested()
▼
──────────────────────────────────────────────────
State: MS1.1 SummaryLoadingState
──────────────────────────────────────────────────
Fields
messageList : List<MessageViewModel> = populated
summaryVisible : Boolean = false
summaryContent : SummaryViewModel = null
isSummaryLoading : Boolean = true
lastReadMessageIdentifier : String = persistedValue
──────────────────────────────────────────────────
│MS2.0.MessageAndSummarizationModule.MS2.1.MessageRepository.fetch
│ MessagesSince(lastReadMessageIdentifier : String)
│ Predicate: retrievedMessages.size > 0
├─────────────── Predicate Value: true ───────────────►

──────────────────────────────────────────────────
State: MS1.2 GeneratingSummaryState
──────────────────────────────────────────────────
Fields
messageList : List<MessageViewModel> = populated
summaryVisible : Boolean = false
summaryContent : SummaryViewModel = null
isSummaryLoading : Boolean = true
pendingMessages : List<MessageRecord> = size > 0

──────────────────────────────────────────────────
│MS2.0.MessageAndSummarizationModule.MS2.2.SummaryService.generate
│Summary(messages : List<MessageRecord>)
▼
──────────────────────────────────────────────────
State: MS1.3 SummaryVisibleState
──────────────────────────────────────────────────
Fields
messageList : List<MessageViewModel> = populated
summaryVisible : Boolean = true
summaryContent : SummaryViewModel = populated
isSummaryLoading : Boolean = false
lastReadMessageIdentifier : String = updatedToLatest

──────────────────────────────────────────────────
│
│ MS1.0.ChatChannelPage.MS1.3.ChatChannelController.onSummaryDismissed()
▼

──────────────────────────────────────────────────
State: MS1.4 SummaryDismissedState
──────────────────────────────────────────────────
Fields
messageList : List<MessageViewModel> = populated
summaryVisible : Boolean = false
summaryContent : SummaryViewModel = retained
isSummaryLoading : Boolean = false

──────────────────────────────────────────────────
│
│ MS1.0.ChatChannelPage.MS1.3.ChatChannelController.resetSummaryState()
▼

──────────────────────────────────────────────────
State: MS1.0 ChannelIdleState
──────────────────────────────────────────────────
MS1.1 SummaryLoadingState
│MS2.0.MessageAndSummarizationModule.MS2.1.MessageRepository.fetchMessages
│ Since(lastReadMessageIdentifier : String)
│ Predicate: retrievedMessages.size > 0
└──────────── Predicate Value: false ─────────────►

──────────────────────────────────────────────────────
State: MS1.5 NoNewMessagesState
───────────────────────────────────────────────────────
Fields
messageList : List<MessageViewModel> = populated
summaryVisible : Boolean = true
summaryContent : SummaryViewModel = containsNoNewActivityMessage
isSummaryLoading : Boolean = false
lastReadMessageIdentifier : String = unchanged

──────────────────────────────────────────────────
│
│ MS1.0.ChatChannelPage.MS1.3.ChatChannelController.onSummaryDismissed()
▼

──────────────────────────────────────────────────
State: MS1.4 SummaryDismissedState
──────────────────────────────────────────────────

───────────────────────────────────────────────────────
Legend
───────────────────────────────────────────────────────
▼ / ► Directed transition
Method Fully scoped operation causing transition
Predicate Conditional branching rule
Fields Data defining state
[Initial State] Entry state when user opens or returns to channel

```
### Rationale and Justification:
These states being defined show how to handle more asynchronous operations such as database retrieval and the summary generation through Loading and Generating phases. This provides more visual feedback to the user. By outlining the different possible states, we make sure that the application never enters an undefined state if the user closes the interface or there’s no new data. 

### 6. Flow Charts (Scenario‑Based)

#### Scenario: SC1.0 Manual Summary With New Messages Available
**Starting State:** MS1.0 ChannelIdleState
**Ending State:** MS1.3 SummaryVisibleState

1.  **[Start]** → **[State]** MS1.0 ChannelIdleState
2.  **[Input/Output]** User clicks "Manual Summary" button
3.  **[Process]** Transition to MS1.1 SummaryLoadingState
4.  **[Process]** Invoke `fetchMessagesSince`
5.  **[Decision]** `retrievedMessages.size > 0?`
    * **Yes** → **[Process]** Transition to MS1.2 GeneratingSummaryState
    * **[Process]** Invoke `generateSummary`
    * **[Process]** Transition to MS1.3 SummaryVisibleState → **(End)**
    * **No** → (Handled by SC1.1)

**Explanation:** The flow begins in the idle channel state. When the user manually requests a summary, the system transitions to the loading state and retrieves unread messages. If new messages exist, the system generates a summary and transitions to the summary visible state.

#### Scenario: SC1.1 Manual Summary With No New Messages
**Starting State:** MS1.0 ChannelIdleState
**Ending State:** MS1.5 NoNewMessagesState

1.  **[Start]** → **[State]** MS1.0 ChannelIdleState
2.  **[Input]** User clicks "Manual Summary" button
3.  **[Process]** Transition to MS1.1 SummaryLoadingState
4.  **[Process]** Invoke `fetchMessagesSince`
5.  **[Decision]** `retrievedMessages.size > 0?`
    * **Yes** → (Handled by SC1.0)
    * **No** → **[Process]** Transition to MS1.5 NoNewMessagesState → **(End)**

**Explanation:** If the repository returns no new messages, the predicate evaluates to false. The system transitions directly to the no-new-messages state, displaying a message indicating there has been no activity since the user was last present.

#### Scenario: SC1.2 Dismiss Visible Summary
**Starting State:** MS1.3 SummaryVisibleState
**Ending State:** MS1.0 ChannelIdleState

1.  **[Start]** → **[State]** MS1.3 SummaryVisibleState
2.  **[Input]** User dismisses summary panel
3.  **[Process]** Transition to MS1.4 SummaryDismissedState
4.  **[Process]** Invoke `resetSummaryState()`
5.  **[Process]** Transition to MS1.0 ChannelIdleState → **(End)**

**Explanation:** Once visible, the user may dismiss the summary. The system transitions to a dismissed state, resets flags, and returns to the idle state.

#### Scenario: SC1.3 Re‑Request Summary After Dismissal
**Starting State:** MS1.4 SummaryDismissedState
**Ending State:** MS1.3 SummaryVisibleState

1.  **[Start]** → **[State]** MS1.4 SummaryDismissedState
2.  **[Input]** User clicks "Manual Summary" button
3.  **[Process]** Transition to MS1.1 SummaryLoadingState
4.  **[Decision]** `retrievedMessages.size > 0?`
    * **Yes** → (Continue via SC1.0)
    * **No** → (Continue via SC1.1)

**Explanation:** If the user dismisses a summary but later decides to request it again, the system follows the same loading and generation flow as the initial request. This ensures consistent behavior and guarantees that the summary always reflects the most recent unread activity before being displayed again.

### Rationale and Justification:
This flow chart gives a diagram-like view of the user’s experience and how the system behaves. It showcases how every user action should trigger a response from the system. Also by handling some edge cases such as “No New Messages”, it also makes sure that the system will be able to handle real-life use successfully without breaking or entering some sort of undefined state. This all helps makes sure that the feature is ready to be created.


## 7. Possible Threats and Failures

### Component: MS1.0 Chat Channel Page (View + Controller)

| Failure Mode | Description / Effects | Recovery / Diagnostics | Likelihood | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **FM‑MS1‑01 Runtime Crash** | **Desc:** UI rendering or Controller logic triggers unrecoverable exception.<br>**User Effect:** Chat panel freezes, button unresponsive, or reload required.<br>**Internal:** Controller halted, state machine interrupted. | **Proc:** Restart client view, reinitialize controller, reload messages, reset to IdleState.<br>**Diag:** TS‑FM‑MS1‑01 | Medium | High |
| **FM‑MS1‑02 Loss of Runtime State** | **Desc:** State variables lost during refresh or rerender.<br>**User Effect:** Summary disappears or regenerates incorrectly.<br>**Internal:** Controller/view desync, incorrect read marker. | **Proc:** Rehydrate from storage, recompute eligibility, replay request.<br>**Diag:** TS‑FM‑MS1‑02 | High | Medium |
| **FM‑MS1‑03 Unexpected State Transition** | **Desc:** System enters inconsistent state (e.g., visible while loading).<br>**User Effect:** Duplicate panels or stuck spinner.<br>**Internal:** Predicate mis-evaluation or invariant violation. | **Proc:** Force state recomputation via `resetSummaryState()`.<br>**Diag:** TS‑FM‑MS1‑03 | Medium | Medium |
| **FM‑MS1‑04 Resource Exhaustion (Client)** | **Desc:** Large message sets cause excessive rendering.<br>**User Effect:** Laggy interface, delayed display.<br>**Internal:** High heap usage, blocked UI thread. | **Proc:** Paginate loading, cap input size, debounce rendering.<br>**Diag:** TS‑FM‑MS1‑04 | Medium | High |
| **FM‑MS1‑05 Bot Abuse / Event Flooding** | **Desc:** Automated triggering of manual summary requests.<br>**User Effect:** Slower responses for legitimate users.<br>**Internal:** Excess generation calls, queue saturation. | **Proc:** Rate‑limit requests, apply cooldowns.<br>**Diag:** TS‑FM‑MS1‑05 | Medium | Medium |

### Component: MS2.0 Message & Summarization Module (Services + Repository + Model)

| Failure Mode | Description / Effects | Recovery / Diagnostics | Likelihood | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **FM‑MS2‑01 Data Corruption** | **Desc:** MessageRecord objects contain malformed fields.<br>**User Effect:** Inaccurate or misleading summaries.<br>**Internal:** Service processes invalid data structures. | **Proc:** Validate records, enforce schema, restore from backup.<br>**Diag:** TS‑FM‑MS2‑01 | Low | High |
| **FM‑MS2‑02 Data Loss** | **Desc:** Repository cache or markers cleared unexpectedly.<br>**User Effect:** Summary misses new messages or includes old ones.<br>**Internal:** Repository state reset or stale references. | **Proc:** Re-fetch from persistence, rebuild cache, restore markers.<br>**Diag:** TS‑FM‑MS2‑02 | Medium | High |
| **FM‑MS2‑03 RPC Failure / Service Timeout** | **Desc:** Service fails to communicate with engine.<br>**User Effect:** Request stalls or fails with error.<br>**Internal:** Pending async operations unresolved. | **Proc:** Retry with exponential backoff, fallback to partial summary.<br>**Diag:** TS‑FM‑MS2‑03 | Medium | High |
| **FM‑MS2‑04 Database Access Failure** | **Desc:** Persistent store unavailable during fetch.<br>**User Effect:** Summary cannot be generated.<br>**Internal:** Repository fetch exceptions, null result sets. | **Proc:** Enter degraded mode (cached data), schedule reconnect.<br>**Diag:** TS‑FM‑MS2‑04 | Low | High |
| **FM‑MS2‑05 Traffic Spike (Server)** | **Desc:** High volume overloads backend.<br>**User Effect:** Delayed or timed‑out responses.<br>**Internal:** Elevated latency, queue buildup. | **Proc:** Autoscale workers, throttle requests, prioritize interactive work.<br>**Diag:** TS‑FM‑MS2‑05 | Medium | High |

### Connectivity Failures

* **FM‑CON‑01 Network Loss**
    * *User Effect:* Request fails or remains loading.
    * *Internal:* RPC failures, stale cache.
    * *Recovery:* Detect offline state, retry on reconnect.
    * *Diag:* TS‑FM‑CON‑01
    * *Likelihood:* Medium
    * *Impact:* Medium
* **FM‑CON‑02 Third‑Party Service Failure**
    * *User Effect:* Feature temporarily unavailable.
    * *Internal:* API timeouts.
    * *Recovery:* Switch to fallback method, retry async.
    * *Diag:* TS‑FM‑CON‑02
    * *Likelihood:* Medium
    * *Impact:* High

### Hardware / Configuration Failures

* **FM‑HW‑01 Server Down**
    * *User Effect:* Functionality unavailable.
    * *Internal:* Endpoints unreachable.
    * *Recovery:* Failover to backup, restore from redundant deployment.
    * *Diag:* TS‑FM‑HW‑01
    * *Likelihood:* Low
    * *Impact:* Critical
* **FM‑HW‑02 Bad Configuration / Deployment Error**
    * *User Effect:* Requests consistently fail/behave incorrectly.
    * *Internal:* Misconfigured variables/endpoints.
    * *Recovery:* Roll back deployment, restore known‑good config.
    * *Diag:* TS‑FM‑HW‑02
    * *Likelihood:* Medium
    * *Impact:* High

### Intruder / Security Failures

* **FM‑SEC‑01 Denial of Service (DoS)**
    * *User Effect:* Severe latency.
    * *Internal:* Resource exhaustion.
    * *Recovery:* Apply traffic filtering, scale defensively.
    * *Diag:* TS‑FM‑SEC‑01
    * *Likelihood:* Medium
    * *Impact:* Critical
* **FM‑SEC‑02 Session Hijacking**
    * *User Effect:* Unauthorized access/altered markers.
    * *Internal:* Compromised tokens.
    * *Recovery:* Invalidate sessions, audit logs.
    * *Diag:* TS‑FM‑SEC‑02
    * *Likelihood:* Low
    * *Impact:* Critical
* **FM‑SEC‑03 Database Theft / Compromise**
    * *User Effect:* Privacy breach notification.
    * *Internal:* Unauthorized extraction.
    * *Recovery:* Revoke credentials, rotate keys, isolate breach.
    * *Diag:* TS‑FM‑SEC‑03
    * *Likelihood:* Low
    * *Impact:* Critical

### Ranking Summary

| Rank Category | Typical Failures |
| :--- | :--- |
| **High Likelihood / Medium Impact** | Loss of Runtime State, Unexpected State Transition |
| **Medium Likelihood / High Impact** | Runtime Crash, Traffic Spike / Resource Exhaustion, Bad Configuration / Deployment Error, RPC Failure / Service Timeout |
| **Low Likelihood / Critical Impact** | Server Down, Session Hijacking, Database Theft / Compromise |
| **Medium Likelihood / Critical Impact** | Denial of Service (DoS) |

### Rationale and Justification:
This threat analysis looks into the different problems that could arise in this application because of the summarization service we are providing such as latency. We specifically categorized them into sections such as Runtime and Connectivity to make sure that there are certain recovery strategies that are already part of the design rather than the issues being treated as afterthoughts.

### 8. Technologies

**TECH‑01 TypeScript**
* **Version:** 5.x
* **Purpose:** Primary application language for client logic, controllers, and state management.
* **Justification vs Alternatives:** Static typing improves maintainability, refactoring safety, and reduces runtime errors compared to plain JavaScript. Strong tooling support over alternatives like Flow.
* **Documentation:** [https://www.typescriptlang.org/docs/](https://www.typescriptlang.org/docs/)

**TECH‑02 React**
* **Version:** 18.x
* **Purpose:** Front‑end UI library for building component‑based chat interfaces and summary panels.
* **Justification vs Alternatives:** Large ecosystem, declarative UI model, strong community support compared to Vue or Angular for large‑scale component reuse and predictable state rendering.
* **Documentation:** [https://react.dev/](https://react.dev/)

**TECH‑03 Node.js**
* **Version:** 20.x LTS
* **Purpose:** Server‑side runtime for API endpoints, summary orchestration, and message services.
* **Justification vs Alternatives:** Unified JavaScript/TypeScript stack across frontend and backend simplifies development and reduces context switching compared to Java/Spring or .NET stacks.
* **Documentation:** [https://nodejs.org/en/docs](https://nodejs.org/en/docs)

**TECH‑04 Express.js**
* **Version:** 4.x
* **Purpose:** Backend web framework for routing summary requests and message APIs.
* **Justification vs Alternatives:** Lightweight and flexible middleware architecture compared to heavier frameworks like NestJS or Koa for this medium‑sized feature.
* **Documentation:** [https://expressjs.com/](https://expressjs.com/)

**TECH‑05 PostgreSQL**
* **Version:** 15.x
* **Purpose:** Persistent relational database for message records and read markers.
* **Justification vs Alternatives:** Strong ACID guarantees and structured querying better suited than NoSQL alternatives (e.g., MongoDB) for relational message and user data integrity.
* **Documentation:** [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)

**TECH‑06 Prisma ORM**
* **Version:** 5.x
* **Purpose:** Type‑safe database access layer between Node.js services and PostgreSQL.
* **Justification vs Alternatives:** Auto‑generated typed queries integrate well with TypeScript, reducing runtime query errors compared to raw SQL or Sequelize.
* **Documentation:** [https://www.prisma.io/docs/](https://www.prisma.io/docs/)

**TECH‑07 OpenAI API**
* **Version:** v1 (REST API)
* **Purpose:** External summarization engine for generating manual message summaries.
* **Justification vs Alternatives:** High‑quality natural language summarization without maintaining custom NLP models internally; faster integration compared to building in‑house ML pipelines.
* **Documentation:** [https://platform.openai.com/docs/](https://platform.openai.com/docs/)

**TECH‑08 RESTful HTTP API**
* **Version:** HTTP/1.1 or HTTP/2
* **Purpose:** Communication protocol between frontend client and backend services.
* **Justification vs Alternatives:** Simpler and widely supported compared to GraphQL for this feature; easier debugging and caching strategies.
* **Documentation:** [https://developer.mozilla.org/en-US/docs/Web/HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)

**TECH‑09 WebSocket (Socket.IO)**
* **Version:** 4.x
* **Purpose:** Real‑time message updates and synchronization of read markers.
* **Justification vs Alternatives:** Enables bidirectional communication for live chat more efficiently than polling‑based REST updates.
* **Documentation:** [https://socket.io/docs/v4/](https://socket.io/docs/v4/)

**TECH‑10 Docker**
* **Version:** 24.x
* **Purpose:** Containerization of backend services and summarization worker processes.
* **Justification vs Alternatives:** Ensures consistent deployment environments and simplifies scaling compared to manual VM configuration.
* **Documentation:** [https://docs.docker.com/](https://docs.docker.com/)

**TECH‑11 Nginx**
* **Version:** 1.24.x
* **Purpose:** Reverse proxy and load balancer for routing traffic to backend services.
* **Justification vs Alternatives:** Lightweight, high‑performance traffic handling compared to Apache HTTP Server in microservice architectures.
* **Documentation:** [https://nginx.org/en/docs/](https://nginx.org/en/docs/)

**TECH‑12 Git**
* **Version:** 2.x
* **Purpose:** Version control system for collaborative development and version tracking.
* **Justification vs Alternatives:** Industry standard distributed version control with branching flexibility compared to centralized systems like Subversion.
* **Documentation:** [https://git-scm.com/docs](https://git-scm.com/docs)

### Rationale and Justification:
This technology stack uses standard technologies such as PostgreSQL, React, Node.js to make sure the data stays consistent across the full stack. By implementing OpenAI, we can implement better quality summarization features without having to train custom models, and Socket.IO can be used to find out what the “last read” text is to trigger the summarization.

### 9. APIs

## 9. APIs & Public Interfaces

### Component: MS1.0 Chat Channel Page

**Class: MS1.1 ChatChannelView**
* **Public Methods:**
    * `render() : void`
    * `displayMessages(messages : MessageViewModel[]) : void`
    * `showSummary(summary : SummaryViewModel) : void`
    * `hideSummary() : void`
    * `showLoadingIndicator() : void`
    * `hideLoadingIndicator() : void`
* **Private Methods:**
    * None
* **Overloads / Overrides:**
    * None

**Class: MS1.2 ManualSummaryButtonView**
* **Public Methods:**
    * `render() : void`
    * `setEnabled(isEnabled : boolean) : void`
    * `bindClickHandler(handler : () => void) : void`
* **Private Methods:**
    * None
* **Overloads / Overrides:**
    * None

**Class: MS1.3 ChatChannelController**
* **Public Methods:**
    * `onManualSummaryRequested() : Promise<void>`
    * `onSummaryDismissed() : void`
    * `resetSummaryState() : void`
* **Private Methods:**
    * None
* **Overloads / Overrides:**
    * None

**Class: MS1.4 MessageViewModel**
* **Public Methods:**
    * `MessageViewModel()`
* **Private Methods:**
    * None
* **Overloads / Overrides:**
    * None

**Class: MS1.5 SummaryViewModel**
* **Public Methods:**
    * `SummaryViewModel()`
* **Private Methods:**
    * None
* **Overloads / Overrides:**
    * None

### Component: MS2.0 Message & Summarization Module

**Class: MS2.1 MessageRepository**
* **Public Methods:**
    * `fetchMessagesSince(lastReadMessageIdentifier : string) : Promise<MessageRecord[]>`
* **Private Methods:**
    * None
* **Overloads / Overrides:**
    * None

**Class: MS2.2 SummaryService**
* **Public Methods:**
    * `generateSummary(messages : MessageRecord[]) : Promise<SummaryResult>`
* **Private Methods:**
    * None
* **Overloads / Overrides:**
    * None

### Data Storage Structure

**Class: MS2.3 SummaryResult**
* **Public Methods:**
    * `SummaryResult()`
* **Private Methods:**
    * None
* **Overloads / Overrides:**
    * None

**Class: MS2.4 MessageRecord**
* **Public Methods:**
    * `MessageRecord()`
* **Private Methods:**
    * None
* **Overloads / Overrides:**
    * None

### Rationale and Justification:
This API makes sure that the different View Components (ChatChannelView, ManualSummaryButtonView) are for the UI, which the ChatControllerController handles the business logic. By using Promise for the methods, we make sure that the database fetches and AI generation are handled asynchronously for the most responsive user experience.

### 10. Public Interfaces

### Component: MS1.0 Chat Channel Page

**Class: MS1.1 ChatChannelView — Public Methods**
* **Used Within Same Component (MS1.0):**
    * `render()`
    * `displayMessages(messages : MessageViewModel[])`
    * `showSummary(summary : SummaryViewModel)`
    * `hideSummary()`
    * `showLoadingIndicator()`
    * `hideLoadingIndicator()`
* **Used Across Components in Same Module:**
    * None
* **Used Across Modules:**
    * None

**Class: MS1.2 ManualSummaryButtonView — Public Methods**
* **Used Within Same Component (MS1.0):**
    * `render()`
    * `setEnabled(isEnabled : boolean)`
    * `bindClickHandler(handler : () => void)`
* **Used Across Components in Same Module:**
    * None
* **Used Across Modules:**
    * None

**Class: MS1.3 ChatChannelController — Public Methods**
* **Used Within Same Component (MS1.0):**
    * `onManualSummaryRequested() : Promise<void>`
    * `onSummaryDismissed() : void`
    * `resetSummaryState() : void`
* **Used Across Components in Same Module:**
    * None
* **Used Across Modules:**
    * None

**Class: MS1.4 MessageViewModel — Public Methods**
* **Used Within Same Component (MS1.0):**
    * `MessageViewModel()`
* **Used Across Components in Same Module:**
    * None
* **Used Across Modules:**
    * None

**Class: MS1.5 SummaryViewModel — Public Methods**
* **Used Within Same Component (MS1.0):**
    * `SummaryViewModel()`
* **Used Across Components in Same Module:**
    * None
* **Used Across Modules:**
    * None

### External Dependencies — MS1.0 Uses

* **Uses From MS2.0 Message & Summarization Module:**
    * `MS2.1 MessageRepository.fetchMessagesSince(lastReadMessageIdentifier : string) : Promise<MessageRecord[]>`
    * `MS2.2 SummaryService.generateSummary(messages : MessageRecord[]) : Promise<SummaryResult>`
    * `MS2.3 SummaryResult`
    * `MS2.4 MessageRecord`

### Component: MS2.0 Message & Summarization Module

**Class: MS2.1 MessageRepository — Public Methods**
* **Used Within Same Component (MS2.0):**
    * `fetchMessagesSince(lastReadMessageIdentifier : string) : Promise<MessageRecord[]>`
* **Used Across Components in Same Module:**
    * None
* **Used Across Modules (MS1.0):**
    * `fetchMessagesSince(lastReadMessageIdentifier : string) : Promise<MessageRecord[]>`

**Class: MS2.2 SummaryService — Public Methods**
* **Used Within Same Component (MS2.0):**
    * `generateSummary(messages : MessageRecord[]) : Promise<SummaryResult>`
* **Used Across Components in Same Module:**
    * None
* **Used Across Modules (MS1.0):**
    * `generateSummary(messages : MessageRecord[]) : Promise<SummaryResult>`

**Class: MS2.3 SummaryResult — Public Methods**
* **Used Within Same Component (MS2.0):**
    * `SummaryResult()`
* **Used Across Components in Same Module:**
    * None
* **Used Across Modules (MS1.0):**
    * `SummaryResult()`

**Class: MS2.4 MessageRecord — Public Methods**
* **Used Within Same Component (MS2.0):**
    * `MessageRecord()`
* **Used Across Components in Same Module:**
    * None
* **Used Across Modules (MS1.0):**
    * `MessageRecord()`

### Module‑Level Dependencies

**Module: MS1.0 Chat Channel Page — Uses From Other Modules:**
* **MS2.0 Message & Summarization Module**
    * **MS2.1 MessageRepository**
        * `fetchMessagesSince(lastReadMessageIdentifier : string)`
    * **MS2.2 SummaryService**
        * `generateSummary(messages : MessageRecord[])`
    * `MS2.3 SummaryResult`
    * `MS2.4 MessageRecord`

**Module: MS2.0 Message & Summarization Module — Uses From Other Modules:**
* None

### Rationale and Justification
In these public interfaces, we make sure that the dependencies only go in one direction. The frontend layer (MS1.0) depends on the BLL (MS2.0) and never the other way around. The View methods are used in the internal components, which stops other random parts of the app from potentially messing up what the user sees.

### 11. Data Schemas

#### Database Data Type: DS‑04 MessageRecord

**Runtime Class Mapping:**
* **MS2.4** MessageRecord
* Consumed by **MS2.1** MessageRepository
* Materialized into **MS1.4** MessageViewModel

**Description:**
Persistent representation of chat messages required for channel rendering and summarization.

**Columns:**
* **message_identifier : UUID**
    * *Mapping Note:* Corresponds to `messageIdentifier : string` in runtime. Stored as UUID (16 bytes) for indexing efficiency and uniqueness guarantees.
* **channel_identifier : UUID**
    * *Mapping Note:* Maps to `channelIdentifier : string`. Used for partitioning and query filtering.
* **sender_identifier : UUID**
    * *Mapping Note:* Maps to `senderIdentifier : string`. Enables join with user metadata tables (external).
* **message_content : TEXT**
    * *Mapping Note:* Maps to `content : string`. TEXT selected due to variable and potentially large message size.
* **created_timestamp : TIMESTAMP WITH TIME ZONE**
    * *Mapping Note:* Maps to `createdAt : Date`. Stored in UTC for consistency across regions.
* **is_deleted : BOOLEAN**
    * *Mapping Note:* Maps to `isDeleted : boolean`. Enables soft‑delete behavior without physical row removal.

**Storage Estimate (Per Record):**
* `message_identifier` (UUID) → 16 bytes
* `channel_identifier` (UUID) → 16 bytes
* `sender_identifier` (UUID) → 16 bytes
* `message_content` (TEXT) → length(message_content) bytes
* `created_timestamp` → 8 bytes
* `is_deleted` → 1 byte
* **Approximate Size Formula:** RecordSize ≈ 57 + length(message_content) + row overhead
* **Typical case (average 250 characters):** ≈ 57 + 250 ≈ **~307 bytes per message**

#### Database Data Type: DS‑05 SummaryRecord

**Runtime Class Mapping:**
* **MS2.3** SummaryResult
* Consumed by **MS2.2** SummaryService
* Rendered via **MS1.5** SummaryViewModel

**Description:**
Persistent representation of generated summaries for manual summary feature and possible reuse.

**Columns:**
* **summary_identifier : UUID**
    * *Mapping Note:* Corresponds to `summaryIdentifier : string` in runtime.
* **channel_identifier : UUID**
    * *Mapping Note:* Identifies which channel the summary belongs to.
* **generated_at : TIMESTAMP WITH TIME ZONE**
    * *Mapping Note:* Maps to `generatedAt : Date`. Stored in UTC.
* **source_message_count : INTEGER**
    * *Mapping Note:* Maps to `messageCount : number`. Tracks number of messages used for summary generation.
* **summary_content : TEXT**
    * *Mapping Note:* Maps to `summaryText : string`. TEXT selected due to variable length.

**Storage Estimate (Per Record):**
* `summary_identifier` (UUID) → 16 bytes
* `channel_identifier` (UUID) → 16 bytes
* `generated_at` → 8 bytes
* `source_message_count` → 4 bytes
* `summary_content` (TEXT) → length(summary_content) bytes
* **Approximate Size Formula:** RecordSize ≈ 44 + length(summary_content) + row overhead
* **Typical case (average 500 characters):** ≈ 44 + 500 ≈ **~544 bytes per summary**

#### Database Data Type: DS‑06 ChannelLastReadStateRecord

**Runtime Class Mapping:**
* Consumed by **MS2.1** MessageRepository
* Used by **MS1.3** ChatChannelController

**Description:**
Tracks last read message per user per channel to support incremental message fetching and summary generation scope.

**Columns:**
* **user_identifier : UUID**
* **channel_identifier : UUID**
* **last_read_message_identifier : UUID**
    * *Mapping Note:* Composite primary key (`user_identifier`, `channel_identifier`).
    * *Mapping Note:* `last_read_message_identifier` maps to `lastReadMessageIdentifier : string` at runtime.

**Storage Estimate (Per Record):**
* `user_identifier` (UUID) → 16 bytes
* `channel_identifier` (UUID) → 16 bytes
* `last_read_message_identifier` (UUID) → 16 bytes
* **Approximate Size:** RecordSize ≈ 48 bytes + indexing overhead
* **Typical case:** **~56–80 bytes per user‑channel pair**

#### Schema Summary

| Label | Data Type | Primary Runtime Owner |
| :--- | :--- | :--- |
| **DS‑04** | MessageRecord | MS2.4 MessageRecord |
| **DS‑05** | SummaryRecord | MS2.3 SummaryResult |
| **DS‑06** | ChannelLastReadStateRecord | MS2.1 MessageRepository |

### Rationale and Justification:
We used UUIds for all the identifiers to avoid the scaling limits. We also chose TEXT over VARCHAR for variable-length messages and being able to summarize without it being truncated. PostgreSQL has a TOAST mechanism that is able to handle large data by compressing it. ChannelLastReadStateRecord also uses a composite primary key to make sure that the user can only have one “last read” position per channel.

## 12. Risks to Completion

### Module‑Level Risks

**MS1.0 Chat Channel Page**
* **State Synchronization Complexity:** Coordinating message rendering, summary display, loading indicators, and dismissal flows may lead to subtle UI inconsistencies.
* **Verification Difficulty:** Multiple interaction paths (manual summary, repeated clicks, rapid channel switching) increase the combinatorial test surface.
* **Concurrency Risk:** Overlapping summary requests or delayed responses may result in race conditions affecting displayed content.
* **Maintenance Risk:** Future UI redesigns or feature additions (e.g., auto‑summary triggers) could break controller assumptions.

**MS2.0 Message & Summarization Module**
* **Service Coupling Risk:** MessageRepository and SummaryService may become tightly coupled if summary generation logic starts depending on repository internals.
* **Performance Sensitivity:** Summary generation cost grows with message count, potentially requiring batching, token limits, or incremental summarization strategies.
* **Scalability Risk:** Large channels with high message throughput may stress `fetchMessagesSince()` and summary pipelines.
* **Observability Gap:** Failures inside async operations (Promise chains) may be difficult to diagnose without structured logging and tracing.
* **Upgrade Risk:** Changes to summarization APIs or model behavior may alter output structure, affecting UI assumptions.

### Class‑Level Risks

**MS1.1 ChatChannelView**
* **Rendering Overhead:** Large message lists combined with summary display may increase DOM or virtual tree updates.
* **UI Edge Cases:** Handling deleted messages, empty channels, or partially loaded messages may produce inconsistent states.
* **Regression Risk:** Minor layout changes may break summary positioning or loading indicators.

**MS1.2 ManualSummaryButtonView**
* **Interaction Flooding:** Rapid repeated clicks may trigger duplicate summary requests if not properly guarded.
* **Accessibility Risk:** Missing keyboard or screen‑reader support could reduce usability compliance.
* **State Drift:** Button enabled/disabled state may desynchronize from controller logic.

**MS1.3 ChatChannelController**
* **Async Complexity:** Managing Promise lifecycles for `fetchMessagesSince()` and `generateSummary()` increases error‑handling complexity.
* **Race Conditions:** Channel switching during summary generation may cause stale data rendering.
* **Testability Risk:** Controller logic coordinating multiple services can be difficult to unit test without heavy mocking.
* **Feature Expansion Risk:** Adding auto‑summaries or background summarization may require refactoring state handling.

**MS2.1 MessageRepository**
* **Data Consistency Risk:** Incremental fetching based on `lastReadMessageIdentifier` depends on accurate state tracking.
* **Indexing Dependence:** Query performance relies heavily on proper database indexing (`channel_identifier`, `created_timestamp`).
* **Migration Risk:** Schema changes to `MessageRecord` may require careful migration planning.

**MS2.2 SummaryService**
* **External Dependency Risk:** If summarization relies on external AI services, availability and latency become external constraints.
* **Output Variability:** Summary structure and phrasing may vary, complicating UI formatting assumptions.
* **Cost Sensitivity:** Large message batches may increase compute or API costs.
* **Version Drift:** Model updates may subtly change output behavior, requiring regression validation.

**MS2.3 SummaryResult**
* **Schema Evolution Risk:** Adding metadata fields later (confidence score, token count) may require backward compatibility planning.
* **Serialization Risk:** If stored or transmitted as JSON, structural mismatches may break deserialization.

**MS2.4 MessageRecord**
* **Storage Growth Risk:** High message volume increases storage and indexing costs.
* **Data Retention Complexity:** Implementing retention policies or soft‑delete behavior requires careful query filtering.
* **Encoding Risk:** Handling multi‑byte characters affects storage estimation and performance.

### Method‑Level Risks

**onManualSummaryRequested()**
* **Reentrancy Risk:** Multiple invocations before completion may trigger overlapping async flows.
* **Error Propagation Risk:** Failure in `fetchMessagesSince()` or `generateSummary()` must be handled gracefully to prevent UI freeze.

**fetchMessagesSince(lastReadMessageIdentifier : string)**
* **Boundary Condition Risk:** Incorrect handling of null or outdated identifiers may cause duplicate or missing messages.
* **Performance Risk:** Large result sets may block rendering without pagination or streaming.

**generateSummary(messages : MessageRecord[])**
* **Input Size Risk:** Passing very large arrays may exceed processing limits or cause timeouts.
* **Determinism Risk:** Same input may produce slightly different summaries depending on backend model behavior.

### Schema‑Level Risks

**DS‑04 MessageRecord**
* **Index Bloat:** High insert frequency may degrade performance if indexes are not optimized.
* **Storage Explosion:** Unbounded TEXT fields may significantly increase database size.
* **Migration Risk:** Changing message schema (e.g., adding attachments) complicates backward compatibility.

**DS‑05 SummaryRecord**
* **Redundancy Risk:** Storing multiple summaries per channel may increase storage usage unnecessarily.
* **Cache Invalidation Complexity:** Determining when a stored summary is stale can be non‑trivial.

**DS‑06 ChannelLastReadStateRecord**
* **Consistency Risk:** Race conditions between read tracking updates and message fetches may produce inaccurate summary scopes.
* **Concurrency Risk:** Multi‑device usage may cause conflicting last‑read updates.

### Technology‑Level Risks

**TypeScript (5.x)**
* **Learning Curve:** Advanced type features (generics, conditional types) may slow onboarding.
* **Strict Mode Migration:** Enabling stricter compiler options later may require large refactors.

**Frontend Framework (e.g., React or equivalent)**
* **State Management Complexity:** Improper state design may cause unnecessary re‑renders.
* **Version Upgrade Risk:** Major framework updates may introduce breaking changes.

**Database System (e.g., PostgreSQL)**
* **Operational Complexity:** Requires backup, replication, and monitoring strategies.
* **Schema Migration Risk:** Production migrations may introduce downtime if not carefully managed.

**External AI / Summarization API**
* **Service Availability Risk:** Outages directly impact summary feature availability.
* **Cost Variability:** Usage‑based pricing may exceed projections under high activity.
* **Compliance Risk:** Storing or transmitting message content externally may raise privacy or regulatory considerations.

### Overall Completion Risk Themes

* **High Complexity Areas:** Async orchestration, summary generation, and state synchronization.
* **Hardest to Verify:** Concurrency behavior and cross‑component async flows.
* **Most Likely Maintenance Burden:** SummaryService integration and evolving database schema.
* **Most Sensitive to Scale:** MessageRepository performance and summary generation workload.

### Rationale and Justification:
We categorized the risks from the module level down to the more specific methods and schemas to make sure that we’re aware of certain areas of issues we might run into before writing code. For example, by identifying that there is a possibility of a storage bloat (unnecessary consumption of storage capacity and inefficient data management) in MessageRecord, we can do extra testing when it comes to those areas. 

## 13. Security & Privacy

### Temporary Handling of PII

**PII Elements**
* `user_identifier`
* `session_identifier`
* `ip_address`
* `device_metadata` (browser, operating system)
* `message_content` (may contain user‑provided personal information)
* `channel_identifier`

**Justification**
* **user_identifier:** Required to resolve channel access, message visibility, and summary scope.
* **session_identifier:** Maintains authenticated session state.
* **ip_address:** Abuse detection, rate limiting, anomaly detection.
* **device_metadata:** Compatibility handling and operational diagnostics.
* **message_content:** Required for rendering messages and generating summaries (may contain incidental PII provided by users).
* **channel_identifier:** Determines which authorized conversation is being accessed.

**Data Flow**
Client request → HTTPS transport → authentication middleware validates `session_identifier`
→ `user_identifier` resolved
→ `MessageRepository.fetchMessagesSince()` queries authorized messages
→ `SummaryService.generateSummary()` processes `message_content` in memory
→ `SummaryResult` returned to controller
→ Response rendered to client
→ Request‑scoped metadata discarded

**Usage Points**
* Authentication & session validation
* Channel authorization checks
* Message retrieval & rendering
* Summary generation
* Rate limiting / abuse monitoring
* Operational logging (non‑content metadata only)

**Disposal & Retention**
* Request‑scoped memory cleared after response lifecycle completes
* Session identifiers expire via timeout or logout
* No raw message content written to temporary logs
* Transient summary generation buffers destroyed after Promise resolution
* Client‑side storage limited to secure cookies or in‑memory state

**Protection Mechanisms**
* HTTPS / TLS encryption in transit
* Secure, HTTP‑only, SameSite session cookies
* Role‑based authorization checks before repository access
* Input validation & output encoding
* Rate limiting & anomaly detection
* Content not persisted outside defined database schemas
* Structured logging without sensitive payload data

### Long‑Term Storage of PII

**Stored Data**
* `user_identifier`
* `channel_identifier`
* `sender_identifier`
* `message_content`
* channel membership relationships
* `last_read_message_identifier`
* `summary_content` (derived from user messages)

**Justification**
* **user_identifier:** Required for authentication, authorization, and access control.
* **channel_identifier & membership:** Required to enforce channel isolation and visibility.
* **sender_identifier:** Required for message attribution.
* **message_content:** Core product functionality (communication).
* **last_read_message_identifier:** Supports incremental fetch & summary scope.
* **summary_content:** Enables persistent manual summaries and reuse.

**Storage Method**
* Relational storage (PostgreSQL)
* UUID primary keys with indexed lookup
* Foreign key constraints enforcing referential integrity
* Encrypted storage volumes at infrastructure layer
* Regular backups with encryption at rest
* Strict schema constraints preventing invalid mappings

**Data Entry Paths**
* Authenticated message submission
* Channel membership updates
* Summary generation persistence
* Read‑state updates

**Data Exit Paths**
* `MessageRepository.fetchMessagesSince()`
* `SummaryService.generateSummary()` (in‑memory processing)
* Controller rendering to authenticated clients
* Administrative audit queries (restricted access)

**Retention & Minimization**
* Messages retained per platform retention policy
* Soft‑delete supported via `is_deleted` flag
* Summaries retained only if explicitly generated
* No collection of unnecessary demographic attributes
* No secondary profiling based on summary usage

### Security Responsibilities

**LS‑01 Primary Application Database (PostgreSQL)**
* **Database Administrator**
    * Hardening configuration
    * Access control enforcement
    * Backup & restore validation
    * Patch management
* **Backend Services Maintainer**
    * Safe query construction
    * Prevention of over‑exposure of `message_content`
    * Validation of authorization logic
* **Security Owner (Application Level)**
    * Review schema changes
    * Approve data retention rules
    * Validate encryption standards

**LS‑02 Backup Storage System**
* **Infrastructure Engineer**
    * Encrypted backup storage
    * Secure key management
    * Access restriction to backup archives
* **Security Owner**
    * Backup audit verification
    * Recovery test oversight

**LS‑03 Log & Monitoring Storage**
* **DevOps Engineer**
    * Log pipeline configuration
    * Removal/redaction of sensitive content
    * Log retention enforcement
* **Security Owner**
    * Audit of privileged access logs
    * Anomaly review

### Security Oversight & Auditing

**Designated Security Officer**
* Chief Information Security Officer (CISO) or appointed Security Lead

**Responsibilities:**
* Audits access privileges across all storage systems
* Reviews encryption configuration (in transit & at rest)
* Conducts periodic access reviews
* Verifies least‑privilege enforcement
* Oversees incident response procedures
* Reviews anomalous access patterns
* Ensures regulatory compliance alignment

**All personnel with access to production data are subject to:**
* Role‑based access control (RBAC)
* Logged and reviewable privileged actions
* Mandatory access reviews
* Immediate revocation upon role change or termination

### Access Control & Safeguards

* Role‑restricted database accounts
* Separation of development and production environments
* Multi‑factor authentication for administrative access
* Encrypted secrets management system
* Principle of least privilege enforced across services
* Regular penetration testing and vulnerability scanning

### Minor Data Handling Policies

* No intentional collection of age or minor status data
* If minors use the platform, their data receives the same protection level
* No behavioral profiling for summarization feature
* No sale or external sharing of user message content
* Clear privacy policy describing:
    * What data is collected
    * Why it is collected
    * How long it is retained
    * How users may request deletion

### Privacy Policy Exposure

* Privacy policy publicly accessible via application footer
* Terms of service define retention and usage boundaries
* Data subject request mechanism (access / deletion) documented
* Transparent explanation of summarization processing

### Overall Security Posture

* Data minimization enforced by schema design
* Sensitive identifiers treated as confidential data
* All persistent storage encrypted at rest
* Transport encryption mandatory
* Administrative actions auditable
* Security governance centralized under designated Security Officer
* Clear ownership defined for each storage unit

### Rationale and Justification:
The security and privacy considerations here reflect standard best practices for web applications. This feature doesn’t require additional personal information and only uses identifiers necessary to retrieve the servers list. Data retention is limited and secure defaults are applied which aligns with established security principles. Using request-scoped handling of metadata reduces long-term privacy risks. Overall, the security recommendations are appropriate and proportional for this feature.
