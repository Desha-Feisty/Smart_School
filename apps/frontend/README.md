# Frontend Documentation

## Overview

The frontend is a React 19 application built with Vite, TailwindCSS, and Zustand for state management.

## Architecture

```
frontend/src/
├── main.jsx              # Entry point
├── App.jsx               # Main app with routing
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx        # Navigation bar
│   │   └── PageWrapper.jsx   # Page layout wrapper
│   ├── student/
│   │   ├── StudentCoursesTab.jsx
│   │   ├── StudentQuizzesTab.jsx
│   │   ├── StudentGradesTab.jsx
│   │   ├── StudentChatsTab.jsx
│   │   ├── StudentCommunityTab.jsx
│   │   ├── StudentStatsCards.jsx
│   │   └── CourseContentModal.jsx
│   ├── teacher/
│   │   ├── CourseHeader.jsx
│   │   ├── CourseQuizzesTab.jsx
│   │   ├── CourseGradesTab.jsx
│   │   ├── CourseStudentsTab.jsx
│   │   └── CourseCommunityTab.jsx
│   ├── ChatWindow.jsx
│   ├── ChatPanel.jsx
│   ├── ChatConversationItem.jsx
│   ├── Leaderboard.jsx
│   ├── AnalyticsDashboard.jsx
│   ├── NoteForm.jsx
│   ├── NoteCard.jsx
│   ├── NoteDetail.jsx
│   ├── CommentForm.jsx
│   ├── CommentItem.jsx
│   ├── QuizSubmittedPage.jsx
│   ├── StudentQuizPage.jsx
│   └── QuizResultsPage.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── StudentPage.jsx
│   ├── TeacherPage.jsx
│   ├── TeacherCoursePage.jsx
│   ├── QuizQuestionsPage.jsx
│   └── AdminDashboard.jsx
├── stores/
│   ├── Authstore.js      # Authentication state
│   ├── Quizstore.js      # Quiz state
│   ├── Teacherstore.js   # Teacher data
│   ├── NotificationStore.js
│   ├── SocketStore.js    # Socket.io connection
│   └── ThemeStore.js     # Theme preferences
└── styles/
    └── index.css         # Global styles
```

## Routing

Routes are defined in `App.jsx` using React Router:

| Path | Component | Access |
|------|------------|--------|
| /login | LoginPage | Public |
| /student | StudentPage | Student |
| /student/quiz/:attemptId | StudentQuizPage | Student |
| /student/quiz/:attemptId/results | QuizResultsPage | Student |
| /student/quiz/:attemptId/submitted | QuizSubmittedPage | Student |
| /teacher | TeacherPage | Teacher |
| /teacher/course/:id | TeacherCoursePage | Teacher |
| /teacher/quiz/:id/questions | QuizQuestionsPage | Teacher |
| /note/:noteId | NoteDetail | Student/Teacher |
| /admin | AdminDashboard | Admin |

## State Management (Zustand)

### Authstore

```javascript
const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: async (email, password) => { /* ... */ },
  logout: () => { /* ... */ },
}));
```

**State:**
- `user` - Current user object
- `token` - JWT authentication token

**Actions:**
- `login(email, password)` - Authenticate user
- `logout()` - Clear session

### Quizstore

```javascript
const useQuizStore = create((set) => ({
  availableQuizzes: [],
  currentQuiz: null,
  currentAttempt: null,
  fetchAvailableQuizzes: () => { /* ... */ },
  startQuiz: (quizId) => { /* ... */ },
  submitQuiz: (attemptId, answers) => { /* ... */ },
}));
```

### Teacherstore

```javascript
const useTeacherStore = create((set) => ({
  courses: [],
  selectedCourse: null,
  students: [],
  fetchCourses: () => { /* ... */ },
  createCourse: (courseData) => { /* ... */ },
}));
```

### NotificationStore

```javascript
const useNotificationStore = create((set) => ({
  notifications: [],
  fetchNotifications: () => { /* ... */ },
  markAsRead: (id) => { /* ... */ },
}));
```

### SocketStore

```javascript
const useSocketStore = create((set) => ({
  socket: null,
  connect: (token) => { /* ... */ },
  disconnect: () => { /* ... */ },
}));
```

### ThemeStore

```javascript
const useThemeStore = create((set) => ({
  isDark: false,
  toggleTheme: () => { /* ... */ },
}));
```

## API Integration

### Base Configuration

```javascript
// Vite proxy configuration in vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

### API Calls

All API calls use the fetch API with JWT authentication:

```javascript
const token = useAuthStore.getState().token;

fetch('/api/courses', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Real-time Features

### Socket.io Connection

```javascript
// In SocketListener component (App.jsx)
useEffect(() => {
  if (token) {
    connect(token);
  }
}, [token, connect]);

// Listen for events
socket.on('new-quiz', (data) => {
  toast.success(`New Quiz: ${data.title}`);
  fetchNotifications();
});
```

### Events

| Event | Action |
|-------|--------|
| new-quiz | Show toast, refresh quizzes |
| new-note | Show toast, refresh notifications |
| chat-message | Show toast, update chat |

## Components

### Layout Components

#### Navbar
- Shows user name and role
- Logout button
- Theme toggle
- Notification indicator

#### PageWrapper
- Consistent page layout
- Loading states
- Error handling

### Student Components

#### StudentCoursesTab
- List of enrolled courses
- Progress indicators
- Continue learning button

#### StudentQuizzesTab
- Available quizzes
- Quiz status (available, closed, attempted)
- Start quiz button

#### StudentGradesTab
- Quiz scores
- Grade history

#### StudentChatsTab
- Chat with teacher
- Message history

#### StudentStatsCards
- Total courses
- Quizzes completed
- Average score

### Teacher Components

#### TeacherPage
- Course list
- Create course button

#### TeacherCoursePage
- Course details
- Tabs: Quizzes, Grades, Students, Community

#### QuizQuestionsPage
- Question management
- Add/edit/delete questions

### Shared Components

#### ChatWindow
- Real-time messaging
- Message history

#### Leaderboard
- Student rankings
- Points display

#### AnalyticsDashboard
- Course performance
- Student metrics

#### NoteCard / NoteForm
- Note display
- Note creation

#### CommentForm / CommentItem
- Comment display
- Add comment

## Styling

### TailwindCSS

The project uses TailwindCSS 4 for styling:

```jsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h1 className="text-2xl font-bold text-gray-800">Title</h1>
</div>
```

### Dark Mode

Theme can be toggled via ThemeStore:

```javascript
const isDark = useThemeStore((state) => state.isDark);
// Apply 'dark' class to root element
```

## User Flows

### Student Flow

1. **Login** → Enter credentials
2. **Dashboard** → View courses, quizzes, stats
3. **Take Quiz** → Answer questions, submit
4. **View Results** → See score and feedback
5. **Chat** → Message teacher
6. **Notes** → Read course notes

### Teacher Flow

1. **Login** → Enter credentials
2. **Dashboard** → View courses
3. **Create Course** → Add title, description, join code
4. **Manage Course** → Add quizzes, questions
5. **View Students** → See progress, grades
6. **Post Notes** → Share course materials
7. **Chat** → Communicate with students

## Error Handling

### API Errors

```javascript
try {
  const response = await fetch('/api/courses', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  const data = await response.json();
  setCourses(data);
} catch (error) {
  toast.error(error.message);
}
```

### Toast Notifications

Using react-hot-toast:

```javascript
import { toast } from 'react-hot-toast';

toast.success('Quiz submitted!');
toast.error('Failed to load courses');
```

## Performance

### Optimizations

- **Lazy Loading**: Routes loaded on demand
- **Memoization**: Expensive computations cached
- **Socket.io**: Real-time updates without polling

### Bundle Size

- Vite handles code splitting
- TailwindCSS purges unused styles

## Development

### Running Development Server

```bash
npm run dev
```

Runs on http://localhost:5173

### Building for Production

```bash
npm run build
```

Creates optimized build in `dist/`

### Linting

```bash
npm run lint
```

Runs ESLint on source files

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:3000 |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance