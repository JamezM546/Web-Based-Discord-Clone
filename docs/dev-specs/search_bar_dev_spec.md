# Dev Specification Document
**Project:** Web‑Based Discord Clone with Enhanced Usability Features  
**Feature:** Clear Server Search Bar  
**Version:** v0.2

---

## 1. Document Version History

| Version | Date       | Editor      | Summary of Changes |
| :------ | :--------- | :---------- | :----------------- |
| **v0.1**| 2026‑02‑11 | Salma Ghazi | Initial Draft; Document created; header established |
| **v0.2**| 2026‑02‑15 | Elvis Valcarcel | Draft revision to add architecture/techstack rationale |

### Authors & Contributors

| Name            | Role / Responsibility | Contributed Versions |
| :-------------- | :-------------------- | :------------------- |
| **Salma Ghazi** | Product / Spec Author | v0.1                 |
| **Elvis Valcarcel** | Editor | v0.2                 |

---

### Our Rationale & Justification
Our header follows the professional outline given in the slides from our in class discussion. We were sure to update the header on every iteration of the document and include all others of each version. The format generated is readable and clear. The only refinements that had to be made were to exclude some non-relevant notes first generated to ensure only the information needed is included. 

## 2. Architecture Diagram

```text
Component: SB1.0 Server Sidebar Page (View + Controller)
┌──────────────────────────────────────────────┐
│ Class: SB1.1 ServerSidebarView               │
├──────────────────────────────────────────────┤
│ Fields                                       │
│ - serverList : List<ServerSummary>           │
│ - searchQuery : String                       │
│ - filteredServers : List<ServerSummary>      │
│ - isSearchActive : Boolean                   │
├──────────────────────────────────────────────┤
│ Methods                                      │
│ - render()                                   │
│ - updateServerList(servers : List<ServerSum>)│
│ - displayFilteredServers(servers : List<Sum>)│
│ - showEmptyState()                           │
└──────────────────────────────────────────────┘
                     ▲
                     │ View updates
                     │
┌──────────────────────────────────────────────┐
│ Class: SB1.3 ServerSidebarController         │
├──────────────────────────────────────────────┤
│ Fields                                       │
│ - sidebarView : ServerSidebarView            │
│ - searchBarView : ServerSearchBarView        │
│ - searchService : ServerSearchService        │──────────┐
├──────────────────────────────────────────────┤          │
│ Methods                                      │          │
│ - onSearchInputChanged(query : String)       │          │
│ - onSearchCleared()                          │          │ Logic / Search Requests
│ - onServerListUpdated(servers : List<Sum>)   │          │ (to SB2.2 below)
│ - applySearchFilter(query : String)          │          │
└──────────────────────────────────────────────┘          │
          ▲                                               │
          │ User input events                             │
                                                          │
┌──────────────────────────────────────────────┐          │
│ Class: SB1.2 ServerSearchBarView             │          │
├──────────────────────────────────────────────┤          │
│ Fields                                       │          │
│ - placeholderText : String                   │          │
│ - inputText : String                         │          │
│ - isFocused : Boolean                        │          │
├──────────────────────────────────────────────┤          │
│ Methods                                      │          │
│ - render()                                   │          │
│ - captureInput()                             │          │
│ - clearInput()                               │          │
│ - showActiveState()                          │          │
└──────────────────────────────────────────────┘          │
                                                          │
                                                          │
Component: SB2.0 Server Data Module (Model + Service)     │
                                                          │
┌──────────────────────────────────────────────┐          │
│ Class: SB2.2 ServerSearchService             │<─────────┘
├──────────────────────────────────────────────┤
│ Fields                                       │
│ - availableServers : List<ServerSummary>     │
├──────────────────────────────────────────────┤
│ Methods                                      │
│ - filterServersByName(query : String)        │
│ - normalizeSearchQuery(query : String)       │
└──────────────────────────────────────────────┘
            │ Filters / Reads
            ▼
┌──────────────────────────────────────────────┐
│ Class: SB2.1 ServerSummary                   │
├──────────────────────────────────────────────┤
│ Fields                                       │
│ - serverIdentifier : String                  │
│ - serverName : String                        │
│ - serverIconUrl : String                     │
├──────────────────────────────────────────────┤
│ Methods                                      │
│ - ServerSummary()                            │
└──────────────────────────────────────────────┘


┌──────────────────────────────────────────────┐
│ Class: SB2.3 ServerRepository                │
├──────────────────────────────────────────────┤
│ Fields                                       │
│ - cachedServers : List<ServerSummary>        │
├──────────────────────────────────────────────┤
│ Methods                                      │
│ - fetchUserServers(userIdentifier : String)  │
│ - refreshServerCache()                       │
└──────────────────────────────────────────────┘
            │ Provides data
            ├──────────────────────────► SB2.2 ServerSearchService
            │
            └──────────────────────────► SB1.3 ServerSidebarController
```

**Legend**
* **▲ / ▼ / ►**: Directional interaction or dependency
* **Fields**: Persistent state owned by the class
* **Methods**: Behaviors invoked through interactions

### Deployment and Where Components Run

| Component | Runtime Location | Rationale |
| :-------- | :---------------- | :-------- |
| **SB1.0 Server Sidebar Page** (SB1.1 ServerSidebarView, SB1.2 ServerSearchBarView, SB1.3 ServerSidebarController) | **Client** (browser) | The sidebar and search bar are interactive UI; they must run in the client to capture input, render filtered lists, and keep search state without round-trips for every keystroke. |
| **SB2.0 Server Data Module** — SB2.2 ServerSearchService, SB2.1 ServerSummary | **Client** (browser) | Filtering and normalization operate on the in-memory server list already loaded for the sidebar; keeping them on the client avoids latency and server load for each search. |
| **SB2.0 Server Data Module** — SB2.3 ServerRepository | **Client** (browser) with **server/API** calls | The repository runs in the client but calls backend APIs to fetch and refresh server data; persistence (PostgreSQL) and optional caching (Redis) live on the server. |

**Information flow (summary):** User input flows from ServerSearchBarView → ServerSidebarController, which calls ServerSearchService to filter; ServerSearchService reads from Repository-held data (and Repository pulls from server/API). Results flow back: Controller → ServerSidebarView (and search bar state). No search-specific data is sent to the server per keystroke; only initial load and explicit refresh hit the backend.

---

### Our Rationale & Justification
By defining the sidebar view, sidebar control, and server search as separate components that make up our feature, the code is kept modular. The architectural structure also takes into account the MVC architecture model we discussed in class. By having a class also focused on providing data to our controller class, it ensures that changes made to our database or schema can be kept independent from the other modules in the feature. The module structure will also help to simplify debugging or feature addition in the future if needed. 





## 3. Class Diagrams

```text
Class: SB1.3 ServerSidebarController
│
├── interacts with → Class: SB1.1 ServerSidebarView
│
├── interacts with → Class: SB1.2 ServerSearchBarView
│
└── depends on → Class: SB2.2 ServerSearchService
                      │
                      └── operates on → Class: SB2.1 ServerSummary



Class: SB2.3 ServerRepository
│
├── provides data to → Class: SB2.2 ServerSearchService
│
└── provides data to → Class: SB1.3 ServerSidebarController
```

---

### Our Rationale & Justification
The class diagram takes the structure of classes directly from the previous section of the dev spec document. We had to refine the architecture diagram section after generating this section, as some of the relationships here were not clearly defined in the visual diagram above. The relationships here help to show the modularity between our different classes and how data travels from our database all the way up to the sidebar view for the user to see, as well as vice versa, in how the user’s search gets down to the data level to perform the query. 


## 4. List of Classes

### Component: SB1.0 Server Sidebar Page (View + Controller)

**Class: SB1.1 ServerSidebarView**
* **Purpose & Responsibility:** Responsible for rendering the server list UI within the sidebar and reflecting search results. Manages visual states such as default list display, filtered results, and empty states.
* **Implements Design Features:**
    * Clear Server Search Bar (discoverability & usability)
    * Dynamic UI updates based on search state

**Class: SB1.2 ServerSearchBarView**
* **Purpose & Responsibility:** Represents the visible search bar element. Captures user input, manages focus state, and communicates search text changes to the controller.
* **Implements Design Features:**
    * Clear Server Search Bar (primary interaction point)
    * Immediate feedback & interaction clarity

**Class: SB1.3 ServerSidebarController**
* **Purpose & Responsibility:** Coordinates interactions between views and business logic. Processes search input events, triggers filtering, and updates views accordingly.
* **Implements Design Features:**
    * Clear Server Search Bar (search behavior & coordination)
    * UI responsiveness & state synchronization

### Component: SB2.0 Server Data Module (Model + Service)

**Class: SB2.2 ServerSearchService**
* **Purpose & Responsibility:** Contains the logic for server filtering and search normalization. Applies search rules and produces filtered server collections.
* **Implements Design Features:**
    * Clear Server Search Bar (search & filtering logic)
    * Input normalization & matching rules

**Class: SB2.3 ServerRepository**
* **Purpose & Responsibility:** Acts as the data access layer for retrieving and caching user server data. Supplies server collections to controllers and services.
* **Implements Design Features:**
    * Clear Server Search Bar (data provisioning)
    * Client‑side performance optimization via caching

### Data Storage Classes / Structures

**Class: SB2.1 ServerSummary**
* **Purpose & Responsibility:** Lightweight data structure representing server information required by the sidebar UI. Designed to minimize view dependencies and payload size.
* **Implements Design Features:**
    * Clear Server Search Bar (display & filtering data model)
    * Efficient UI rendering and comparisons

---

### Our Rationale & Justification
Each class here maps to a class defined earlier in the document. They are grouped by component to ensure the purpose and relationships between each are clear. Each class mentions its purpose and responsibility to make sure its functionality is necessary and cannot be done by another already existing class. This minimizes the chances of our feature becoming unnecessarily complicated or difficult to develop. 



## 5. State Diagrams

```text
────────────────────────────────────────────────────────────
State: SS1.0 DefaultSidebarState   [Initial State]
────────────────────────────────────────────────────────────
Fields
- searchQuery : String = empty
- isSearchActive : Boolean = false
- serverList : List<ServerSummary> = populated
- filteredServers : List<ServerSummary> = serverList
────────────────────────────────────────────────────────────
            │
            │ SB1.3.ServerSidebarController.onSearchInputChanged()
            ▼

────────────────────────────────────────────────────────────
State: SS1.1 SearchActiveState
────────────────────────────────────────────────────────────
Fields
- searchQuery : String = userProvidedValue
- isSearchActive : Boolean = true
- serverList : List<ServerSummary> = populated
- filteredServers : List<ServerSummary> = dynamicallyComputed
────────────────────────────────────────────────────────────
        │
        │ SB2.2.ServerSearchService.filterServersByName()
        │ Predicate: filteredServers.size > 0
        ├─────────────── Predicate Value: true ───────────────►

────────────────────────────────────────────────────────────
State: SS1.2 FilteredResultsState
────────────────────────────────────────────────────────────
Fields
- searchQuery : String = nonEmpty
- isSearchActive : Boolean = true
- filteredServers : List<ServerSummary> = size > 0
────────────────────────────────────────────────────────────
        │
        │ SB1.3.ServerSidebarController.onSearchCleared()
        ▼

────────────────────────────────────────────────────────────
State: SS1.4 SearchClearedState
────────────────────────────────────────────────────────────
Fields
- searchQuery : String = empty
- isSearchActive : Boolean = false
- filteredServers : List<ServerSummary> = serverList
────────────────────────────────────────────────────────────
        │
        │ SB1.3.ServerSidebarController.applySearchFilter()
        ▼

────────────────────────────────────────────────────────────
State: SS1.0 DefaultSidebarState
────────────────────────────────────────────────────────────



SS1.1 SearchActiveState
│
│ SB2.2.ServerSearchService.filterServersByName()
│ Predicate: filteredServers.size > 0
└──────────── Predicate Value: false ─────────────►

────────────────────────────────────────────────────────────
State: SS1.3 EmptyResultsState
────────────────────────────────────────────────────────────
Fields
- searchQuery : String = nonEmpty
- isSearchActive : Boolean = true
- filteredServers : List<ServerSummary> = empty
────────────────────────────────────────────────────────────
        │
        │ SB1.3.ServerSidebarController.onSearchCleared()
        ▼

────────────────────────────────────────────────────────────
State: SS1.4 SearchClearedState
────────────────────────────────────────────────────────────
```

**Legend**
* **▼ / ►**: Directed transition
* **Method**: Fully scoped operation causing transition
* **Predicate**: Conditional branching rule
* **Fields**: Data defining state

---
### Our Rationale & Justification
The state diagrams generated aligned well with the format of the feature defined in earlier sections. The LLM was able to generate diagrams that handle possible states of the search bar from empty to active search and ending in cleared search. It also created states for the server results, including filtered and empty results, covering the range of possible states that could occur. 

## 6. Flow Charts (Scenario‑Based)

### Scenario: SC2.0 Server Search With Matching Results
* **Starting State:** SS1.0 DefaultSidebarState
* **Ending State:** SS1.2 FilteredResultsState

```text
(Start)
   │
   ▼
[Process] Render sidebar with full server list
   │
   ▼
[Input / Output] User enters text into search bar
   │
   ▼
[Process] Transition to SS1.1 SearchActiveState
   │
   ▼
[Process] Invoke ServerSearchService.filterServersByName()
   │
   ▼
[Decision] filteredServers.size > 0 ?
   │
   ├── Yes ──► [Process] Transition to SS1.2 FilteredResultsState
   │               │
   │               ▼
   │             (End)
   │
   └── No ──► (Handled by SC2.1)
```
**Explanation:** The system begins in the default sidebar state displaying all servers. User input activates search behavior, moving the interface into the search active state. The filtering logic executes, and because matches exist, the decision branch leads to the filtered results state.

### Scenario: SC2.1 Server Search With No Matching Results
* **Starting State:** SS1.0 DefaultSidebarState
* **Ending State:** SS1.3 EmptyResultsState

```text
(Start)
   │
   ▼
[Process] Render sidebar with full server list
   │
   ▼
[Input / Output] User enters text into search bar
   │
   ▼
[Process] Transition to SS1.1 SearchActiveState
   │
   ▼
[Process] Invoke ServerSearchService.filterServersByName()
   │
   ▼
[Decision] filteredServers.size > 0 ?
   │
   ├── Yes ──► (Handled by SC2.0)
   │
   └── No ──► [Process] Transition to SS1.3 EmptyResultsState
                   │
                   ▼
                 (End)
```
**Explanation:** This flow follows the same interaction path as a successful search, but the decision predicate evaluates false. The system transitions into the empty results state, ensuring clear user feedback rather than preserving stale UI data.

### Scenario: SC2.2 Clearing an Active Search
* **Starting State:** SS1.2 FilteredResultsState OR SS1.3 EmptyResultsState
* **Ending State:** SS1.0 DefaultSidebarState

```text
(Start)
   │
   ▼
[Process] Current state = SS1.2 OR SS1.3
   │
   ▼
[Input / Output] User clears search input
   │
   ▼
[Process] Invoke ServerSidebarController.onSearchCleared()
   │
   ▼
[Process] Transition to SS1.4 SearchClearedState
   │
   ▼
[Process] Restore full server list
   │
   ▼
[Process] Transition to SS1.0 DefaultSidebarState
   │
   ▼
(End)
```
**Explanation:** Clearing the search always follows a deterministic reset path. Regardless of prior results, the system normalizes internal data, restores the complete server list, and returns to the default sidebar state, preventing inconsistent UI behavior.

---
### Our Rationale & Justification
Our search bar feature is pretty narrow, so we believe that the shown scenarios cover all possible and realistic use cases of the features. The first two situations show possible flows after a user types in a search (either a search with matches or a search without matches). While these could be combined into one flow chart, keeping them separate will help with future feature development if we want to add more specific functionality in either case. The last case deals with clearing an active search, which is the only other scenario we saw fit to add. 


## 7. Possible Threats and Failures

### Component: SB1.0 Server Sidebar Page (View + Controller)

| Failure Mode | Description | Recovery Procedure | Likelihood | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **FM‑SB1‑01 Runtime Crash** | UI rendering or controller logic triggers an unrecoverable exception. | Restart client view lifecycle, reinitialize controller state, reload server list from repository cache. | Medium | High |
| **FM‑SB1‑02 Loss of Runtime State** | Active search query or filtered results lost during UI updates. | Rehydrate state from last known controller snapshot, replay search input event. | High | Medium |
| **FM‑SB1‑03 Unexpected State Transition** | UI enters incorrect state (e.g., empty results despite matches). | Force state recomputation via ServerSearchService, refresh filteredServers collection. | Medium | Medium |
| **FM‑SB1‑04 Resource Exhaustion (Client)** | Excessive DOM updates or event handling degrades performance. | Throttle render cycles, debounce search events, trigger garbage collection hints. | Medium | Medium |
| **FM‑SB1‑05 Bot Abuse / Event Flooding** | Automated inputs spam search interactions. | Rate‑limit input events, apply client interaction cooldowns. | Medium | Low |

### Component: SB2.0 Server Data Module (Services + Repository + Model)

| Failure Mode | Description | Recovery Procedure | Likelihood | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **FM‑SB2‑01 Data Corruption** | Cached server data becomes inconsistent or malformed. | Invalidate cache, refetch server data, rebuild ServerSummary objects. | Low | High |
| **FM‑SB2‑02 Data Loss** | Server list cache cleared or overwritten unexpectedly. | Trigger `fetchUserServers()`, rebuild cache from persistent storage or API. | Medium | High |
| **FM‑SB2‑03 RPC Failure / Service Timeout** | Search or repository calls fail or stall. | Retry with exponential backoff, fallback to cachedServers snapshot. | Medium | Medium |
| **FM‑SB2‑04 Database Access Failure** | Persistent server data source unavailable. | Enter degraded mode using cached data, schedule background reconnection attempts. | Low | High |
| **FM‑SB2‑05 Traffic Spike** | High load delays data retrieval or filtering services. | Autoscale services, apply request throttling, prioritize interactive queries. | Medium | High |

### Connectivity Failures

* **FM‑CON‑01 Network Loss:** Sidebar fails to refresh. *Recovery:* Switch to offline cache mode, retry on reconnect.
* **FM‑CON‑02 Third‑Party Service Failure:** Missing icons. *Recovery:* Use placeholder assets.

### Hardware / Configuration Failures

* **FM‑HW‑01 Server Down:** Server list unavailable. *Recovery:* Failover to backup instances.
* **FM‑HW‑02 Bad Configuration:** Broken search behavior. *Recovery:* Roll back deployment.

### Intruder / Security Failures

* **FM‑SEC‑01 Denial of Service (DoS):** Severe latency. *Recovery:* Apply traffic filtering.
* **FM‑SEC‑02 Session Hijacking:** Unauthorized mutations. *Recovery:* Invalidate sessions, enforce reauthentication.
* **FM‑SEC‑03 Database Theft:** Privacy breach. *Recovery:* Revoke credentials, isolate breach.

### Ranking Summary

| Rank Category | Typical Failures |
| :--- | :--- |
| **High Likelihood / Medium Impact** | Loss of Runtime State, Unexpected State Transition |
| **Medium Likelihood / High Impact** | Runtime Crash, Traffic Spike, Bad Configuration |
| **Low Likelihood / Critical Impact** | Server Down, Session Hijacking, Database Theft |
| **Medium Likelihood / Critical Impact** | Denial of Service (DoS) |

---
## 8. Technologies

| Technology | Version | Purpose | Justification vs Alternatives |
| :--- | :--- | :--- | :--- |
| **[TECH‑01 TypeScript](https://www.typescriptlang.org/docs/)** | 5.x | Client logic/UI | Static typing improves maintainability vs plain JS and aligns with the spec’s class/method signatures (e.g. `ServerSummary[]`, `query : string`), reducing integration errors between views, controller, and services. |
| **[TECH‑02 React](https://react.dev/)** | 18.x | UI Framework | Component model maps cleanly to ServerSidebarView and ServerSearchBarView; state (search query, filtered list) fits React state/hooks; strong ecosystem supports debouncing and controlled inputs required by the flow charts. |
| **[TECH‑03 Node.js](https://nodejs.org/en/docs)** | 20.x | Backend Runtime | Unified JavaScript/TypeScript across client and server; efficient async model supports ServerRepository’s `fetchUserServers` and `refreshServerCache` without blocking; LTS aligns with long-term maintenance. |
| **[TECH‑04 Express.js](https://expressjs.com/)** | 4.x | Backend Framework | Lightweight, flexible for REST endpoints that serve server-list and membership data (see Data Schemas); middleware supports auth and rate limiting referenced in Security & Privacy and failure modes. |
| **[TECH‑05 PostgreSQL](https://www.postgresql.org/docs/)** | 15.x | Database | Stores ServerSummaryRecord and UserServerMembershipRecord; strong relational integrity and indexing support the membership and server lookups that feed the sidebar and search; fits the schema definitions in this spec. |
| **[TECH‑06 Redis](https://redis.io/docs/)** | 7.x | Caching | Optional cache for server-list snapshots (DS‑03 ServerCacheSnapshotRecord) and session data; reduces load on PostgreSQL when ServerRepository refreshes or multiple clients request server lists; supports the “degraded mode using cached data” recovery in FM‑SB2‑04. |
| **[TECH‑07 RESTful API](https://restfulapi.net/)** | Arch. | Communication | REST is used for server-list and membership endpoints consumed by SB2.3 ServerRepository (e.g. fetch user’s servers, refresh); simpler than GraphQL for this feature’s read-focused, resource-oriented needs and aligns with the Public Interfaces. |
| **[TECH‑08 CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS)** | CSS3 | Styling | Web standard for sidebar layout, search bar, and empty/filtered states (SS1.0–SS1.4); no extra framework needed for the described UI states. |
| **[TECH‑09 Vite](https://vitejs.dev/guide/)** | 5.x | Build Tool | Fast dev startup and HMR support rapid iteration on views and controller; TypeScript and React supported out of the box; lighter than Webpack for this client-heavy feature. |
| **[TECH‑10 Git](https://git-scm.com/docs)** | 2.x | Version Control | Industry standard for tracking spec and code changes; supports the version history and multi-contributor workflow implied by the document header. |
| **[TECH‑11 GitHub](https://docs.github.com/)** | Platform | Hosting | Hosting and CI/CD for the repo; integrates with Git and supports the collaborative and deployment workflow for client and server. |
| **[TECH‑12 ESLint](https://eslint.org/docs/latest/)** | 9.x | Linting | Catches logic and consistency issues in controller and service code; reduces risk of state-transition and API-signature errors called out in Risks to Completion. |
| **[TECH‑13 Prettier](https://prettier.io/docs/en/)** | 3.x | Formatting | Keeps code style consistent across views and modules; lowers friction when multiple developers work on the same classes and interfaces. |

### Our Rationale & Justification
With our project being a web application, this tech stack follows what many standard developers use in their web applications. All libraries used are common and known by most of our team, allowing for easier development down the line. Because this project will rely heavily on AI, it may also be helpful to stick with a technology stack, of which there are many examples and training data. 


## 9. APIs

### Component: SB1.0 Server Sidebar Page

#### Class: SB1.1 ServerSidebarView
* **Public Methods**
    * `render() : void`
    * `updateServerList(servers : ServerSummary[]) : void`
    * `displayFilteredServers(servers : ServerSummary[]) : void`
    * `showEmptyState() : void`
* **Private Methods**
    * *none*

#### Class: SB1.2 ServerSearchBarView
* **Public Methods**
    * `render() : void`
    * `captureInput() : string`
    * `clearInput() : void`
    * `showActiveState() : void`
* **Private Methods**
    * *none*

#### Class: SB1.3 ServerSidebarController
* **Public Methods**
    * `onSearchInputChanged(query : string) : void`
    * `onSearchCleared() : void`
    * `onServerListUpdated(servers : ServerSummary[]) : void`
    * `applySearchFilter(query : string) : void`
* **Private Methods**
    * *none*

### Component: SB2.0 Server Data Module

#### Class: SB2.2 ServerSearchService
* **Public Methods**
    * `filterServersByName(query : string) : ServerSummary[]`
    * `normalizeSearchQuery(query : string) : string`
* **Private Methods**
    * *none*

#### Class: SB2.3 ServerRepository
* **Public Methods**
    * `fetchUserServers(userIdentifier : string) : Promise<ServerSummary[]>`
    * `refreshServerCache() : void`
* **Private Methods**
    * *none*

### Data Storage Structure

#### Class: SB2.1 ServerSummary
* **Public Methods**
    * `ServerSummary()`
* **Private Methods**
    * *none*

---

### Our Rationale & Justification
This section maps directly from previously established classes earlier in the document. We have already discussed our justification for the class structure and its methods earlier, and this section simply pulls and redefines those same methods. The methods defined here allow for a modular structure to the feature and keep data and UI methods separate but able to communicate with eachother, allowing for easier debugging and readable code. 


## 10. Public Interfaces

<!-- ### Component: SB1.0 Server Sidebar Page

**External Dependencies — SB1.0 Uses:**
* **From SB2.0 Server Data Module:**
    * `SB2.2 ServerSearchService.filterServersByName(query : string)`
    * `SB2.2 ServerSearchService.normalizeSearchQuery(query : string)`
    * `SB2.3 ServerRepository.fetchUserServers(userIdentifier : string)`
    * `SB2.3 ServerRepository.refreshServerCache()`

### Component: SB2.0 Server Data Module

**Public Methods Used Across Modules (by SB1.0):**
* `SB2.2.filterServersByName(query : string)`
* `SB2.2.normalizeSearchQuery(query : string)`
* `SB2.3.fetchUserServers(userIdentifier : string)`
* `SB2.3.refreshServerCache()`
* `SB2.1.ServerSummary()` -->


### Component: SB1.0 Server Sidebar Page

**External Dependencies — SB1.0 Uses:**
* **From SB2.0 Server Data Module:**
    * `SB2.2 ServerSearchService.filterServersByName(query : string)`
    * `SB2.2 ServerSearchService.normalizeSearchQuery(query : string)`
    * `SB2.3 ServerRepository.fetchUserServers(userIdentifier : string)`
    * `SB2.3 ServerRepository.refreshServerCache()`

---

### Component: SB2.0 Server Data Module

**Public Methods Exposed to SB1.0:**
* `SB2.2.filterServersByName(query : string)` — Primary logic for sidebar filtering.
* `SB2.2.normalizeSearchQuery(query : string)` — Pre-processing for search input.
* `SB2.3.fetchUserServers(userIdentifier : string)` — Initial data load for the sidebar.
* `SB2.3.refreshServerCache()` — Forces a background data sync.

## 11. Data Schemas

### Database Data Type: DS‑01 ServerSummaryRecord
* **Primary Runtime Owner:** SB2.1 ServerSummary
* **Description:** Persistent representation of servers required for sidebar rendering and search operations.

**Columns:**
* `server_identifier` (UUID): 16 bytes. Maps to `serverIdentifier`.
* `server_name` (VARCHAR 100): Direct mapping from `serverName`.
* `server_icon_url` (TEXT): ~60–200 bytes. Direct mapping from `serverIconUrl`.

**Storage Estimate:** ~120–320 bytes per server.

### Database Data Type: DS‑02 UserServerMembershipRecord
* **Primary Runtime Owner:** SB2.3 ServerRepository
* **Description:** Defines which servers belong to which users.

**Columns:**
* `user_identifier` (UUID): 16 bytes.
* `server_identifier` (UUID): 16 bytes.

**Storage Estimate:** ~40–72 bytes per membership.

### Database Data Type: DS‑03 ServerCacheSnapshotRecord
* **Primary Runtime Owner:** SB2.3 ServerRepository
* **Description:** Optional persistence layer for caching server lists.

**Columns:**
* `snapshot_identifier` (UUID)
* `user_identifier` (UUID)
* `serialized_servers` (JSONB): Variable size.

**Storage Estimate:** ~32 bytes + (N servers × S size). E.g., 20 KB for 100 servers.

---

## 12. Risks to Completion

### Module‑Level Risks

**SB1.0 Server Sidebar Page**
* **State Synchronization Complexity:** Maintaining consistent UI states across rapid input events may introduce subtle bugs (incorrect filtering, flickering states).
* **Verification Difficulty:** UI correctness depends on many interaction paths (typing speed, clearing input, server updates), increasing test surface.
* **Maintenance Risk:** Future UI customizations may conflict with search behavior or layout constraints.

**SB2.0 Server Data Module**
* **Hidden Coupling Risk:** Search logic, caching, and repository behavior may become tightly coupled, making changes error‑prone.
* **Performance Sensitivity:** Filtering efficiency degrades as server counts grow, potentially requiring redesign (indexing, memoization).
* **Scalability Adjustments:** Early implementations may not anticipate production‑scale workloads.

### Class‑Level Risks

**SB1.1 ServerSidebarView**
* **Rendering Overhead:** Frequent re‑renders from search updates may cause performance issues.
* **UI Edge Cases:** Empty states, delayed data, or partial updates may produce inconsistent visuals.

**SB1.2 ServerSearchBarView**
* **Event Handling Errors:** Improper input debouncing or focus management can degrade UX.
* **Browser Variability:** Input behavior and focus events differ subtly across browsers.

**SB1.3 ServerSidebarController**
* **Logic Centralization Risk:** Controller may accumulate excessive responsibilities, complicating debugging.
* **State Transition Bugs:** Incorrect transition ordering can produce invalid UI states.

**SB2.2 ServerSearchService**
* **Algorithmic Assumptions:** Naive filtering approaches may not scale with large datasets.
* **Normalization Ambiguity:** Case sensitivity, whitespace rules, and locale handling may introduce inconsistencies.

**SB2.3 ServerRepository**
* **Caching Invalidations:** Incorrect cache refresh logic can cause stale or inconsistent server lists.
* **Concurrency Issues:** Parallel updates or fetches may corrupt runtime assumptions.

**SB2.1 ServerSummary**
* **Schema Drift Risk:** Changes to stored fields require coordinated updates across UI, services, and database layers.

### Method‑Level Risks

* **Search‑Triggered Methods:** High invocation frequency increases risk of performance regressions.
* **Filtering Methods:** Small logic errors lead to highly visible UI failures.
* **Asynchronous Fetch Methods:** Timing issues and race conditions complicate reproducibility and debugging.

### Schema‑Level Risks

**ServerSummaryRecord**
* **Indexing Decisions:** Poor indexing strategies may degrade search responsiveness.
* **Field Length Constraints:** Underestimated limits (names, URLs) may cause truncation or migration needs.

**UserServerMembershipRecord**
* **Growth Characteristics:** Membership tables scale quickly; inefficient queries may require redesign.
* **Integrity Constraints:** Incorrect key definitions risk orphaned or duplicate relationships.

**ServerCacheSnapshotRecord**
* **Storage Expansion:** Snapshot sizes grow linearly with server counts, affecting storage planning.
* **Invalidation Complexity:** Cache coherence rules are difficult to validate under load.

### Technology Risks

**TypeScript / React**
* **Learning Curve:** Developers unfamiliar with strict typing or hooks may introduce architectural inconsistencies.
* **Upgrade Volatility:** Major version upgrades can require non‑trivial refactors.

**Node.js / Express**
* **Async Error Handling:** Improper promise management leads to silent failures or crashes.
* **Middleware Complexity:** Growth of cross‑cutting concerns (auth, logging) increases fragility.

**PostgreSQL**
* **Migration Overhead:** Schema changes require careful coordination and downtime strategies.
* **Query Optimization:** Poorly designed queries may not appear problematic until scale increases.

**Redis**
* **Consistency Pitfalls:** Cache vs database mismatches create difficult debugging scenarios.
* **Eviction Policies:** Misconfigured policies may produce unpredictable runtime behavior.

**Build & Tooling (Vite, ESLint, Prettier)**
* **Configuration Drift:** Toolchain inconsistencies across environments may break builds.
* **Upgrade Friction:** Dependency updates may introduce unexpected compatibility issues.

### Cross‑Cutting Risks

* **Verification & Testing Effort:** Interaction‑heavy features have disproportionately high QA costs relative to implementation size.
* **Incremental Feature Growth:** Small UI features tend to accumulate dependencies, increasing long‑term complexity.
* **Upgrade & Maintenance Burden:** Libraries and frameworks evolve faster than application logic, requiring continuous adaptation.

---

## 13. Security & Privacy

### Temporary Handling of PII

**PII Elements**
* `user_identifier`
* `session_identifier`
* `ip_address`
* `device_metadata` (browser, operating system)

**Justification**
* **user_identifier:** Required to retrieve server memberships and filter visible servers.
* **session_identifier:** Maintains authenticated state.
* **ip_address:** Abuse prevention and rate limiting.
* **device_metadata:** UI compatibility and diagnostics.

**Data Flow**
1.  Client request → authentication middleware validates session.
2.  `user_identifier` resolved → ServerRepository queries memberships.
3.  `ip_address` & `device_metadata` captured → security / throttling checks.
4.  Response generated → request‑scoped data discarded.

**Usage Points**
* Authentication & session validation
* Server list retrieval
* Abuse detection / rate limiting
* Operational diagnostics

**Disposal & Retention**
* Request metadata discarded after response.
* Sessions expire via timeout or logout.
* No persistent client storage beyond secure cookies.

**Protection Mechanisms**
* HTTPS / TLS transport encryption.
* Secure, HTTP‑only session cookies.
* Memory‑scoped request lifecycle.
* Strict input validation & serialization controls.

### Long‑Term Storage of PII

**Stored Data**
* `user_identifier`
* Server membership relationships
* *(Search feature does not require additional personal attributes.)*

**Justification**
* Supports server retrieval and filtering for sidebar search.

**Storage Method**
* PostgreSQL relational storage.
* UUID identifiers with indexed lookup.
* Integrity constraints preventing invalid mappings.

**Data Entry Paths**
* Authentication resolution.
* Server membership updates.

**Data Exit Paths**
* ServerRepository fetch operations.
* Sidebar rendering & filtering logic.

### Security Responsibilities

* **LS‑01 Primary Application Database (PostgreSQL):**
    * **Database Administrator:** Hardening, access control, backups, patching.
    * **Backend Services Maintainer:** Safe queries, data exposure prevention.
    * **Security Owner:** Protection standards & schema review.

### Security Oversight & Auditing

* **Designated Security Officer:**
    * Audits access privileges and configurations.
    * Verifies encryption, retention, and logging controls.
    * Reviews anomalous access patterns.
    * Ensures least‑privilege enforcement.

### Access Control & Safeguards

* Role‑restricted access to persistent storage.
* Privileged actions logged and reviewable.
* Periodic permission audits and revocation.
* No unnecessary duplication of identifiers.

### Privacy Considerations for This Feature

* Data collection limited to functional requirements.
* No behavioral profiling for search usage.
* Identifiers treated as sensitive data.
* Minimal retention of diagnostic metadata.
* Conservative defaults for visibility and storage.
