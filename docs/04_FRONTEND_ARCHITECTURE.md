# Frontend Architecture & Component Lifecycle

## Overview

Agri-Connect frontend is built with **React 18** + **Redux Toolkit** for state management and **Tailwind CSS** for styling. This document outlines the component architecture, data flow, and lifecycle.

---

## Application Startup Lifecycle

```mermaid
graph TD
    A["index.js:<br/>ReactDOM.render"] --> B["App Component<br/>Mounts"]
    B --> C["useEffect Hook<br/>Runs on Mount"]
    C --> D["Check localStorage<br/>for accessToken"]
    
    D --> E{"Token<br/>Found?"}
    E -->|Yes| F["Dispatch<br/>fetchCurrentUser"]
    E -->|No| G["Dispatch<br/>setInitialised"]
    
    F --> H["API Call to<br/>/users/me"]
    H --> I{"Valid<br/>Token?"}
    I -->|Yes| J["Redux: Update<br/>Auth State"]
    I -->|No| K["Clear localStorage<br/>Logout"]
    
    J --> L["Dispatch<br/>setInitialised"]
    K --> L
    
    L --> M["BrowserRouter<br/>Ready"]
    M --> N["Render Routes"]
    N --> O["App Interactive"]
```

---

## Component Architecture

### Directory Structure and Component Hierarchy

```
src/components/
├── shared/                    (Reusable across app)
│   ├── Navbar.jsx            (Top navigation)
│   ├── OfflineBanner.jsx      (Offline indicator)
│   ├── ProtectedRoute.jsx     (Route protection)
│   └── ContentCard.jsx        (Reusable card)
│
├── auth/                      (Authentication)
│   ├── ProfilePage.jsx        (User profile)
│   └── (LoginPage in pages/)
│
├── dashboard/                 (Dashboard feature)
│   └── Dashboard.jsx
│
├── content/                   (Content management)
│   ├── ArticleViewer.jsx      (View articles)
│   ├── CreateContent.jsx      (Create articles)
│   └── SavedPage.jsx          (Saved articles)
│
├── community/                 (Community Q&A)
│   ├── CommunityPage.jsx      (Q&A list)
│   └── QuestionDetail.jsx     (Single question)
│
├── search/                    (Search feature)
│   └── SearchPage.jsx
│
└── admin/                     (Admin features)
    └── AdminDashboard.jsx
```

### Component Tree

```mermaid
graph TD
    App["<App />"]
    
    App --> BrowserRouter["<BrowserRouter>"]
    BrowserRouter --> Routes["<Routes>"]
    
    Routes --> PublicLogin["<LoginPage />"]
    Routes --> PublicRegister["<RegisterPage />"]
    
    Routes --> ProtectedDash["<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>"]
    Routes --> ProtectedContent["<ProtectedRoute><AppLayout><ArticleViewer /></AppLayout></ProtectedRoute>"]
    Routes --> ProtectedCommunity["<ProtectedRoute><AppLayout><CommunityPage /></AppLayout></ProtectedRoute>"]
    Routes --> ProtectedProfile["<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>"]
    Routes --> ProtectedAdmin["<ProtectedRoute><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>"]
    
    AppLayout["<AppLayout>"] --> Navbar["<Navbar />"]
    AppLayout --> OfflineBanner["<OfflineBanner />"]
    AppLayout --> Main["<main>children</main>"]
    
    Main --> Dashboard["Dashboard"]
    Main --> ArticleViewer["ArticleViewer"]
    Main --> CommunityPage["CommunityPage"]
    
    Dashboard --> ContentCard["<ContentCard />"]
    
    style App fill:#FFE4E1
    style Navbar fill:#FFE4B5
    style Dashboard fill:#90EE90
    style ContentCard fill:#87CEEB
```

---

## Redux State Management

### Redux Store Structure

```javascript
store = {
  auth: {
    user: {
      _id: string,
      email: string,
      fullName: string,
      role: string,
      preferences: object
    },
    accessToken: string,
    refreshToken: string,
    isAuthenticated: boolean,
    isInitialised: boolean,
    loading: boolean,
    error: string | null
  },
  
  content: {
    items: [
      {
        _id: string,
        title: string,
        description: string,
        author: object,
        category: string,
        views: number,
        likes: number,
        savedBy: [string],
        status: string
      }
    ],
    selectedContent: object | null,
    filters: {
      category: string,
      search: string,
      sort: string
    },
    pagination: {
      page: number,
      limit: number,
      total: number
    },
    loading: boolean,
    error: string | null
  }
}
```

### Redux Data Flow

```mermaid
sequenceDiagram
    participant Component as React Component
    participant Dispatch as Redux Dispatch
    participant Reducer as Reducer
    participant Store as Store
    participant Selector as Selector
    
    Component ->> Dispatch: dispatch(fetchContent())
    Dispatch ->> Reducer: Action: FETCH_CONTENT_START
    Reducer ->> Store: Update state.loading = true
    Store -->> Component: Selector triggers re-render
    
    Note over Component: Thunk executes async call
    
    Component ->> Dispatch: API response received
    Dispatch ->> Reducer: Action: FETCH_CONTENT_SUCCESS
    Reducer ->> Store: Update state.items, state.loading = false
    Store -->> Component: Selector triggers re-render
    Component ->> Component: Component updates with new data
```

---

## Redux Slices

### authSlice

```javascript
// State
{
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialised: false,
  loading: false,
  error: null
}

// Async Thunks
fetchCurrentUser()           // GET /users/me
loginUser(email, password)   // POST /auth/login
registerUser(data)           // POST /auth/register
logoutUser()                 // Clear state

// Synchronous Actions
setInitialised()
updateUser(userData)
clearError()
```

### contentSlice

```javascript
// State
{
  items: [],
  selectedContent: null,
  filters: {
    category: 'all',
    search: '',
    sort: '-createdAt'
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  },
  loading: false,
  error: null
}

// Async Thunks
fetchContent(filters)        // GET /content
fetchSingleContent(id)       // GET /content/:id
createContent(data)          // POST /content
updateContent(id, data)      // PATCH /content/:id
saveContent(contentId)       // POST /content/:id/save

// Synchronous Actions
setFilters(filters)
setPagination(pagination)
clearError()
```

---

## Component Lifecycle Patterns

### Page Component Lifecycle Example (Dashboard)

```mermaid
graph TD
    A["Component Mount"] --> B["Read Redux State"]
    B --> C["useEffect:<br/>componentDidMount"]
    C --> D["Check Auth"]
    D --> E{"User<br/>Authenticated?"}
    
    E -->|No| F["Redirect to Login"]
    E -->|Yes| G["Fetch Dashboard Data"]
    
    G --> H["Dispatch fetchContent"]
    H --> I["API Call"]
    I --> J["Redux Update"]
    J --> K["useSelector Triggers"]
    K --> L["Component Re-render"]
    
    L --> M["Display Content"]
    
    M --> N["User Interaction<br/>Click, Scroll"]
    N --> O["Event Handler"]
    O --> P["Dispatch Action"]
    P --> J
    
    Q["Component Unmount"] --> R["Cleanup useEffect"]
    R --> S["Cancel Pending<br/>Requests"]
```

### Card Component Lifecycle Example (ContentCard)

```mermaid
graph TD
    A["Props Change:<br/>content object"] --> B["Component Render"]
    B --> C["Display Content<br/>Title, Image, Author"]
    C --> D["User Hovers<br/>Save Button"]
    D --> E["Show Tooltip"]
    E --> F["User Clicks<br/>Save Button"]
    F --> G["Dispatch<br/>saveContent Action"]
    G --> H["API Call:<br/>POST /content/:id/save"]
    H --> I["Redux Update<br/>Add to savedBy"]
    I --> J["useSelector Triggers"]
    J --> K["Component Re-render<br/>Show Saved State"]
```

---

## Data Flow: User Login Example

Complete flow from user interaction to UI update:

```mermaid
sequenceDiagram
    actor User
    participant LoginPage as LoginPage.jsx
    participant Redux as Redux Store
    participant API as api.js (Axios)
    participant Backend as Backend /auth/login
    participant Storage as localStorage
    
    User ->> LoginPage: Enter email & password
    LoginPage ->> LoginPage: Validate input
    
    User ->> LoginPage: Click "Login"
    LoginPage ->> Redux: dispatch(loginUser({email, password}))
    
    Redux ->> API: Call api.post('/auth/login', data)
    API ->> Backend: POST /auth/login
    
    Backend ->> Backend: Validate credentials
    Backend ->> Backend: Generate JWT tokens
    Backend -->> API: {accessToken, refreshToken, user}
    
    API -->> Redux: Response received
    Redux ->> Storage: localStorage.setItem('accessToken', token)
    Redux ->> Redux: Update auth state
    Redux ->> Redux: Set isAuthenticated = true
    
    LoginPage ->> Redux: useSelector(state => state.auth)
    LoginPage ->> LoginPage: Re-render
    
    LoginPage ->> LoginPage: Redirect to /dashboard
    User ->> User: Dashboard loads
```

---

## Offline Functionality

### Offline Queue Lifecycle

```mermaid
graph TD
    A["User Online"] --> B["Make API Request"]
    B --> C["Request Succeeds"]
    C --> D["Update Redux<br/>& UI"]
    
    E["Connection Lost<br/>Network Error"] --> F["Check isOnline"]
    F --> G{"Offline<br/>Mode?"}
    
    G -->|Yes| H["Save to<br/>offlineQueue"]
    H --> I["Queue JSON in<br/>localStorage"]
    I --> J["Show OfflineBanner"]
    J --> K["User Works<br/>in App"]
    
    K --> L["Connection<br/>Restored"]
    L --> M["Get Queued<br/>Requests"]
    M --> N["Replay Requests<br/>in Order"]
    N --> O["Sync State<br/>with Server"]
    O --> P["Clear Queue"]
    P --> Q["Show Success<br/>Banner"]
```

### Service Worker Offline Caching

```mermaid
graph TD
    A["Service Worker<br/>Installed"] --> B["Cache Static<br/>Assets"]
    B --> C["Cache App Shell"]
    C --> D["Cache Routes"]
    
    E["User Online<br/>Makes Request"] --> F["Network First"]
    F --> G["Try Network"]
    G --> H{"Success?"}
    H -->|Yes| I["Return Network<br/>Response"]
    H -->|No| J["Fall back to<br/>Cache"]
    J --> K["Return Cached<br/>Response"]
    
    I --> L["Update Cache"]
    L --> M["Serve to User"]
    
    N["User Offline<br/>Makes Request"] --> O["Try Network"]
    O --> P{"Success?"}
    P -->|No| Q["Use Cache"]
    Q --> M
    P -->|Yes| I
```

---

## Protected Route Component Lifecycle

```mermaid
graph TD
    A["ProtectedRoute<br/>Render"] --> B["Get Auth State<br/>from Redux"]
    B --> C{"User<br/>Authenticated?"}
    
    C -->|No| D{"isInitialised?"}
    D -->|No| E["Show Loading"]
    E --> F["Wait for Auth<br/>Check"]
    F --> C
    
    D -->|Yes| G["Redirect to<br/>Login"]
    
    C -->|Yes| H["Check User<br/>Role"}
    H --> I{"Role<br/>Allowed?"}
    
    I -->|No| J["Show Forbidden<br/>403"]
    I -->|Yes| K["Render<br/>Protected Component"]
```

---

## Hooks Overview

### useOfflineStatus Hook

```javascript
// Custom hook for offline detection
const isOnline = useOfflineStatus();

// Monitors:
// - window.navigator.onLine
// - 'online' / 'offline' events
// - Periodic heartbeat to backend

// Returns: boolean (true = online, false = offline)
```

**Hook Lifecycle:**
```mermaid
graph TD
    A["useOfflineStatus()<br/>Called"] --> B["Initialize State<br/>isOnline = true"]
    B --> C["useEffect: Setup<br/>Event Listeners"]
    C --> D["Listen for<br/>online event"]
    C --> E["Listen for<br/>offline event"]
    
    F["window 'online'<br/>Event"] --> G["setState isOnline = true"]
    H["window 'offline'<br/>Event"] --> I["setState isOnline = false"]
    
    G --> J["Component<br/>Re-renders"]
    I --> J
    
    K["Component<br/>Unmount"] --> L["Cleanup<br/>Event Listeners"]
```

---

## Component Communication Patterns

### Parent → Child (Props Drilling)
```mermaid
graph TD
    Parent["Parent Component<br/>Dashboard"]
    Parent -->|contentData| Child1["ContentCard"]
    Parent -->|onSave| Child1
    Child1 -->|contentData| GrandChild["CardHeader"]
```

### Child → Parent (Callbacks)
```mermaid
graph TD
    Parent["Parent<br/>CommunityPage"]
    Child["Child<br/>QuestionForm"]
    Parent -->|onSubmit| Child
    Child -->|newQuestion| Parent
```

### Global State (Redux)
```mermaid
graph TD
    Store["Redux Store<br/>contentSlice"]
    C1["Component A"]
    C2["Component B"]
    C3["Component C"]
    
    C1 -->|useDispatch| Store
    C2 -->|useDispatch| Store
    C3 -->|useDispatch| Store
    
    Store -->|useSelector| C1
    Store -->|useSelector| C2
    Store -->|useSelector| C3
```

---

## Performance Optimization

### Code Splitting Strategy

```mermaid
graph TD
    A["App.jsx<br/>Entry Point"] --> B["React.lazy"]
    
    B --> C["Dashboard<br/>Route"]
    B --> D["Content<br/>Route"]
    B --> E["Community<br/>Route"]
    B --> F["Admin<br/>Route"]
    
    C --> G["Suspense<br/>with Loading"]
    D --> G
    E --> G
    
    G --> H["Async Load<br/>on Route"]
    H --> I["Render Component"]
```

### Selector Memoization

```javascript
// Avoid re-renders from unrelated state changes
const selectUserPreferences = (state) => state.auth.user.preferences;

// In component:
const preferences = useSelector(selectUserPreferences);
// Component only re-renders when preferences change
```

---

## Error Boundaries

```mermaid
graph TD
    A["Component Tree"] --> B["Error Thrown"]
    B --> C["Error Boundary<br/>Catches Error"]
    C --> D{"Error<br/>Logged?"}
    D -->|Yes| E["Display Error UI"]
    E --> F["Show Fallback<br/>Component"]
    F --> G["Option to<br/>Reload/Navigate"]
```

---

## Complete User Journey

```mermaid
graph TD
    A["User Visits<br/>localhost:3000"] --> B["App Initializes"]
    B --> C["Check Auth Token"]
    C --> D{"Token<br/>Found?"}
    
    D -->|No| E["Redirect to<br/>Login Page"]
    D -->|Yes| F["Verify Token<br/>with /users/me"]
    
    F --> G{"Valid?"}
    G -->|No| H["Logout<br/>Clear Token"]
    G -->|Yes| I["Load Dashboard"]
    
    E --> J["User Enters<br/>Credentials"]
    J --> K["POST /auth/login"]
    K --> L["Tokens Received"]
    L --> M["Save to<br/>localStorage"]
    M --> I
    
    H --> E
    
    I --> N["Redux Loads<br/>Content"]
    N --> O["Display Feed"]
    O --> P["User Interactions"]
    
    P --> Q{"Action<br/>Type?"}
    Q -->|Click Article| R["Navigate to<br/>ArticleViewer"]
    Q -->|Ask Question| S["Navigate to<br/>Community"]
    Q -->|Search| T["Navigate to<br/>SearchPage"]
    Q -->|Profile| U["Navigate to<br/>ProfilePage"]
    
    R --> V["Fetch Article<br/>Details"]
    S --> W["Fetch Questions"]
    T --> X["Search API"]
    U --> Y["Load User Data"]
    
    V --> Z["Display Page"]
    W --> Z
    X --> Z
    Y --> Z
    
    style A fill:#FFE4E1
    style I fill:#90EE90
    style Z fill:#87CEEB
```

---

## Testing Component Lifecycle

### Common Testing Scenarios

```javascript
// Test component mounting and initial state
describe('Dashboard Component', () => {
  test('renders loading state on mount', () => {
    const { getByText } = render(<Dashboard />);
    expect(getByText('Loading...')).toBeInTheDocument();
  });

  test('displays content after API call', async () => {
    const { getByText } = render(<Dashboard />);
    await waitFor(() => {
      expect(getByText('Article Title')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    const { getByText } = render(<Dashboard />);
    await waitFor(() => {
      expect(getByText('Error loading content')).toBeInTheDocument();
    });
  });

  test('redirects unauthenticated users', () => {
    const { navigate } = renderWithRouter(<ProtectedRoute><Dashboard /></ProtectedRoute>);
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
```

---

*Frontend documentation created for development and research reference.*
*Last updated: 2026-06-19*
