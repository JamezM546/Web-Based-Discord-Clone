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
* **Implements Design Features:** Manual Summary On Demand, Dynamic UI state transitions.

**Class: MS1.2 ManualSummaryButtonView**
* **Purpose & Responsibility:** Represents the interactive UI element that allows users to request a manual summary. Manages enabled/disabled state and triggers summary generation requests.
* **Implements Design Features:** Manual Summary On Demand, User autonomy.

**Class: MS1.3 ChatChannelController**
* **Purpose & Responsibility:** Coordinates interactions between the view layer and backend services. Handles user-triggered summary requests, retrieves relevant messages, invokes summarization logic, and updates the UI accordingly.
* **Implements Design Features:** Manual Summary On Demand, Separation of concerns, Controlled data flow.

**Class: MS1.4 MessageViewModel**
* **Purpose & Responsibility:** Represents message data formatted specifically for UI rendering. Contains only fields necessary for visual presentation in the chat channel.
* **Implements Design Features:** Model-View separation, Efficient rendering.

**Class: MS1.5 SummaryViewModel**
* **Purpose & Responsibility:** Represents summarized content formatted for display within the chat interface. Contains summary text and minimal metadata required for UI presentation.
* **Implements Design Features:** Manual Summary On Demand, Lightweight summary display.

#### Component: MS2.0 Message & Summarization Module (Model + Service)

**Class: MS2.1 MessageRepository**
* **Purpose & Responsibility:** Handles retrieval and persistence of message data and last-read markers from the database. Acts as the data access layer for chat messages.
* **Implements Design Features:** Efficient retrieval, Persistence of read-state, Data abstraction.

**Class: MS2.2 SummaryService**
* **Purpose & Responsibility:** Processes message data and generates a condensed textual summary. Transforms raw message records into a summarized representation suitable for presentation.
* **Implements Design Features:** Manual Summary On Demand, Encapsulation of NLP, Data model transformation.

#### Data Storage Classes / Structs

**Class: MS2.3 SummaryResult**
* **Purpose & Responsibility:** Represents the structured result of a summarization operation before transformation into a UI-specific model.
* **Implements Design Features:** Intermediate summarization representation, Separation of concerns.

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
2.  **[Input]** User clicks "Manual Summary" button
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

**Explanation:** If the repository returns no new messages, the system transitions directly to the no-new-messages state, indicating no recent activity.

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

**Explanation:** Re-requesting a dismissed summary follows the standard loading/generation flow to ensure the content reflects the most recent unread activity.

### Rationale and Justification:
This flow chart gives a diagram-like view of the user’s experience and how the system behaves. It showcases how every user action should trigger a response from the system. Also by handling some edge cases such as “No New Messages”, it also makes sure that the system will be able to handle real-life use successfully without breaking or entering some sort of undefined state. This all helps makes sure that the feature is ready to be created.

### 7. Possible Threats and Failures

#### Component: MS1.0 Chat Channel Page (View + Controller)
* **FM‑MS1‑01 Runtime Crash:** UI or Controller logic triggers unrecoverable exception. (Likelihood: Medium, Impact: High)
* **FM‑MS1‑02 Loss of Runtime State:** State lost during refresh/rerender. (Likelihood: High, Impact: Medium)
* **FM‑MS1‑03 Unexpected State Transition:** System enters inconsistent state. (Likelihood: Medium, Impact: Medium)
* **FM‑MS1‑04 Resource Exhaustion (Client):** Large message sets cause lag. (Likelihood: Medium, Impact: High)
* **FM‑MS1‑05 Bot Abuse / Event Flooding:** Automated request triggering. (Likelihood: Medium, Impact: Medium)

#### Component: MS2.0 Message & Summarization Module
* **FM‑MS2‑01 Data Corruption:** Malformed MessageRecord objects. (Likelihood: Low, Impact: High)
* **FM‑MS2‑02 Data Loss:** Repository cache/markers cleared unexpectedly. (Likelihood: Medium, Impact: High)
* **FM‑MS2‑03 RPC Failure / Service Timeout:** Failed communication with NLP engine. (Likelihood: Medium, Impact: High)
* **FM‑MS2‑04 Database Access Failure:** Persistent store unavailable. (Likelihood: Low, Impact: High)
* **FM‑MS2‑05 Traffic Spike / Resource Exhaustion (Server):** Overloaded backend services. (Likelihood: Medium, Impact: High)

#### Connectivity, Hardware, and Security
* **FM‑CON‑01/02:** Network Loss / Third‑Party Service Failure.
* **FM‑HW‑01/02:** Server Down / Bad Configuration.
* **FM‑SEC‑01/02/03:** DoS, Session Hijacking, Database Theft.

#### Ranking Summary
| Rank Category | Typical Failures |
| :--- | :--- |
| High Likelihood / Medium Impact | Loss of Runtime State, Unexpected State Transition |
| Medium Likelihood / High Impact | Runtime Crash, Traffic Spike, Deployment Error, RPC Failure |
| Low Likelihood / Critical Impact | Server Down, Session Hijacking, Database Theft |
| Medium Likelihood / Critical Impact | Denial of Service (DoS) |

### Rationale and Justification:
This threat analysis looks into the different problems that could arise in this application because of the summarization service we are providing such as latency. We specifically categorized them into sections such as Runtime and Connectivity to make sure that there are certain recovery strategies that are already part of the design rather than the issues being treated as afterthoughts.

### 8. Technologies

| Tech | Version | Purpose | Justification |
| :--- | :--- | :--- | :--- |
| TypeScript | 5.x | Logic/State | Static typing improves maintainability over JS. |
| React | 18.x | Front‑end UI | Component-based, large ecosystem. |
| Node.js | 20.x LTS | Server runtime | Unified JS/TS stack simplifies development. |
| Express.js | 4.x | Backend Framework | Lightweight and flexible middleware. |
| PostgreSQL | 15.x | Database | ACID guarantees for relational integrity. |
| Prisma ORM | 5.x | Database Access | Type-safe queries, reduced runtime errors. |
| OpenAI API | v1 | Summarization | High-quality NLP without custom model maintenance. |
| REST API | 1.1/2 | Communication | Simpler and widely supported vs GraphQL. |
| Socket.IO | 4.x | Real‑time | Bidirectional communication for live updates. |
| Docker | 24.x | Containerization | Consistent deployment and scaling. |
| Nginx | 1.24.x | Proxy/Load Balancer| High-performance traffic handling. |
| Git | 2.x | Version Control | Industry standard for collaboration. |

### Rationale and Justification:
This technology stack uses standard technologies such as PostgreSQL, React, Node.js to make sure the data stays consistent across the full stack. By implementing OpenAI, we can implement better quality summarization features without having to train custom models, and Socket.IO can be used to find out what the “last read” text is to trigger the summarization.

### 9. APIs

#### Component: MS1.0 Chat Channel Page
* **MS1.1 ChatChannelView:** `render()`, `displayMessages()`, `showSummary()`, `hideSummary()`, `showLoadingIndicator()`, `hideLoadingIndicator()`.
* **MS1.2 ManualSummaryButtonView:** `render()`, `setEnabled()`, `bindClickHandler()`.
* **MS1.3 ChatChannelController:** `onManualSummaryRequested()`, `onSummaryDismissed()`, `resetSummaryState()`.
* **MS1.4 MessageViewModel / MS1.5 SummaryViewModel:** Constructors only.

#### Component: MS2.0 Message & Summarization Module
* **MS2.1 MessageRepository:** `fetchMessagesSince(lastReadMessageIdentifier : string) : Promise<MessageRecord[]>`.
* **MS2.2 SummaryService:** `generateSummary(messages : MessageRecord[]) : Promise<SummaryResult>`.
* **MS2.3 SummaryResult / MS2.4 MessageRecord:** Constructors only.

### Rationale and Justification:
This API makes sure that the different View Components (ChatChannelView, ManualSummaryButtonView) are for the UI, which the ChatControllerController handles the business logic. By using Promise for the methods, we make sure that the database fetches and AI generation are handled asynchronously for the most responsive user experience.

### 10. Public Interfaces

* **MS1.1/1.2/1.3/1.4/1.5:** Methods used primarily within the MS1.0 component.
* **External Dependencies:** MS1.0 uses `MessageRepository` and `SummaryService` from MS2.0.
* **MS2.1/2.2:** Methods used across modules (specifically by MS1.0).
* **Module Dependencies:** MS1.0 depends on MS2.0. MS2.0 has no external module dependencies.

### Rationale and Justification:
In these public interfaces, we make sure that the dependencies only go in one direction. The frontend layer (MS1.0) depends on the BLL (MS2.0) and never the other way around. The View methods are used in the internal components, which stops other random parts of the app from potentially messing up what the user sees.

### 11. Data Schemas

#### DS‑04 MessageRecord (PostgreSQL)
* `message_identifier` (UUID): Unique ID.
* `channel_identifier` (UUID): Partitioning/Filtering.
* `sender_identifier` (UUID): External join metadata.
* `message_content` (TEXT): Variable message size.
* `created_timestamp` (TIMESTAMPTZ): Consistency.
* `is_deleted` (BOOLEAN): Soft-delete.
* **Size:** ~307 bytes per message.

#### DS‑05 SummaryRecord (PostgreSQL)
* `summary_identifier` (UUID): Unique ID.
* `channel_identifier` (UUID): Channel owner.
* `generated_at` (TIMESTAMPTZ): UTC storage.
* `source_message_count` (INTEGER): Metadata.
* `summary_content` (TEXT): Variable length.
* **Size:** ~544 bytes per summary.

#### DS‑06 ChannelLastReadStateRecord (PostgreSQL)
* `user_identifier` (UUID) + `channel_identifier` (UUID): Composite PK.
* `last_read_message_identifier` (UUID): Marker.
* **Size:** ~56–80 bytes per pair.

### Rationale and Justification:
We used UUIds for all the identifiers to avoid the scaling limits. We also chose TEXT over VARCHAR for variable-length messages and being able to summarize without it being truncated. PostgreSQL has a TOAST mechanism that is able to handle large data by compressing it. ChannelLastReadStateRecord also uses a composite primary key to make sure that the user can only have one “last read” position per channel.

### 12. Risks to Completion

* **Module‑Level:** State synchronization complexity, Verification difficulty, Concurrency risk, Service coupling, Performance sensitivity, Observability gaps.
* **Class‑Level:** Rendering overhead (View), Interaction flooding (Button), Async complexity (Controller), Data consistency (Repository), External dependency variability (Service).
* **Method‑Level:** Reentrancy (Requested), Boundary conditions (Fetch), Input size limits (Generate).
* **Schema‑Level:** Index bloat, Storage growth, Migration complexity.
* **Tech‑Level:** Learning curve (TS), State management complexity (React), Operational complexity (Postgres), Service availability/cost (OpenAI).

### Rationale and Justification:
We categorized the risks from the module level down to the more specific methods and schemas to make sure that we’re aware of certain areas of issues we might run into before writing code. For example, by identifying that there is a possibility of a storage bloat (unnecessary consumption of storage capacity and inefficient data management) in MessageRecord, we can do extra testing when it comes to those areas. 

### 13. Security & Privacy

#### Temporary Handling of PII
* **Elements:** `user_identifier`, `session_identifier`, `ip_address`, `device_metadata`, `message_content`.
* **Protection:** HTTPS/TLS, Secure Cookies, RBAC, Rate Limiting, Request-scoped memory clearing.

#### Long‑Term Storage of PII
* **Stored Data:** `user_identifier`, `channel_identifier`, `sender_identifier`, `message_content`, `last_read_message_identifier`, `summary_content`.
* **Method:** Encrypted PostgreSQL volumes, UUID keys, Regular encrypted backups.

#### Security Responsibilities
* **LS‑01 (PostgreSQL):** DBA (Hardening), Backend (Safe queries), Security Owner (Auditing).
* **LS‑02 (Backup):** Infra Engineer (Key management), Security Owner (Recovery tests).
* **LS‑03 (Logging):** DevOps (Redaction), Security Owner (Anomaly review).

#### Oversight
* **Security Officer:** Audits privileges, reviews encryption, oversees incident response.

### Rationale and Justification:
The security and privacy considerations here reflect standard best practices for web applications. This feature doesn’t require additional personal information and only uses identifiers necessary to retrieve the servers list. Data retention is limited and secure defaults are applied which aligns with established security principles. Using request-scoped handling of metadata reduces long-term privacy risks. Overall, the security recommendations are appropriate and proportional for this feature.
