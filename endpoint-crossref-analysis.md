# Endpoint Cross-Reference Analysis

This document cross-references the endpoints documented in `index-frontend.md` against actual UI component usage to identify:
1. **Missing Endpoints** - Called from UI but not documented
2. **Legacy/Dead Code** - Documented but not used in UI

---

## Analysis Summary

| Category | Documented | Used in UI | Missing | Unused |
|----------|------------|------------|---------|--------|
| Authentication | 11 | 10 | 0 | 1 |
| Student Services | 48 | 42 | 0 ✓ | 9 |
| Quiz/Session | 14 | 12 | 0 ✓ | 2 |
| Exam Services | 8 | 6 | 0 ✓ | 4 |
| Content Services | 6 | 5 | 0 ✓ | 1 |
| Subscription Services | 6 | 6 | 0 | 0 |
| Cards/Layers | 11 | 10 | 0 | 1 |
| Admin Services | 35+ | 35+ | 0 | 2 |
| **Total** | **139+** | **126+** | **0** ✓ | **20** |

---

## 1. Missing Endpoints - ✅ RESOLVED

All previously missing endpoints have been added to `index-frontend.md`:

| Method | Endpoint | Status |
|--------|----------|--------|
| `getExamsByModule()` | `GET /exams/available?moduleId={id}` | ✅ Added |
| `getExamsByModuleAndYear()` | `GET /exams/by-module/{moduleId}/{year}` | ✅ Added |
| `getExamQuestions()` | `GET /exams/{examId}/questions` | ✅ Added |
| `getStudentStudyPackDetails()` | `GET /student/study-pack/{studyPackId}` | ✅ Added |
| `getQuestionsByUniteOrModule()` | `GET /quizzes/questions-by-unite-or-module` | ✅ Added |
| `getLabelDetails()` | `GET /students/labels/{labelId}` | ✅ Added |
| `getQuestionNotes()` | `GET /students/questions/{questionId}/notes` | ✅ Added |
| `getCourseProgress()` | `GET /students/courses/{courseId}/progress` | Already documented |

---

## 2. Legacy/Dead Code (Documented but NOT Called from UI)

### Authentication

| Endpoint | Status | Recommendation |
|----------|--------|----------------|
| `POST /auth/refresh` | ✅ Used internally by apiClient interceptor | KEEP |

### StudentService Methods with Zero UI Calls

| Method | Endpoint | Last Usage Evidence | Recommendation |
|--------|----------|---------------------|----------------|
| `getDashboardPerformance()` | `GET /students/dashboard/performance` | None found | ⚠️ CANDIDATE FOR REMOVAL (use getDashboardStats instead) |
| `generateCertificate()` | `POST /students/courses/{id}/certificate` | None found | ⚠️ CANDIDATE FOR REMOVAL |
| `getTimeBasedAnalytics()` (via date range) | Derived endpoint | Called but via wrapper | KEEP |
| `getModuleNotes()` | `GET /students/notes/module/{id}` | None found, getNotesByModule used | ⚠️ CANDIDATE FOR REMOVAL |
| `completeTodo()` | `PUT /students/todos/{id}/complete` | None, updateTodo with status used | ⚠️ CANDIDATE FOR REMOVAL |

### QuizService Methods with Zero UI Calls

| Method | Endpoint | Last Usage Evidence | Recommendation |
|--------|----------|---------------------|----------------|
| `getQuizFilters()` | `GET /quizzes/quiz-filters` | None, getQuizFiltersWithParams used | ⚠️ CANDIDATE FOR REMOVAL |
| `getSessionFilters()` | `GET /quizzes/session-filters` | Called via NewApiService | KEEP wrapper, remove duplicate |
| `submitAnswer()` (single) | Uses bulk internally | None direct | KEEP (wrapper for submitAnswersBulk) |
| `completeQuizSession()` | No-op placeholder | None found | ⚠️ REMOVE (marked as no-op) |

### ExamService Methods (from api-services.ts)

| Method | Endpoint | Status | Recommendation |
|--------|----------|--------|----------------|
| `getExamHistory()` | Unknown | Not found in UI | ⚠️ INVESTIGATE |
| `flagExamQuestion()` | Unknown | Not found in UI | ⚠️ INVESTIGATE |

### ContentService Duplicates

| Method | Endpoint | Notes | Recommendation |
|--------|----------|-------|----------------|
| `checkStudyPackAccess()` | Defined twice (lines 1536, 1566) | Duplicate definition | ⚠️ REMOVE DUPLICATE |
| `checkCourseAccess()` | Defined twice (lines 1551, 1573) | Duplicate definition | ⚠️ REMOVE DUPLICATE |

### Subscription Service

| Method | Endpoint | Status | Recommendation |
|--------|----------|--------|----------------|
| `getSubscriptionPlans()` | Throws error | Marked as not supported | ⚠️ REMOVE |

---

## 3. Endpoint Usage Heat Map

### Most Used Endpoints (High Priority)

| Rank | Endpoint | Call Count | Files Using |
|------|----------|------------|-------------|
| 1 | `NewApiService.getContentFilters()` | 8+ | hooks, pages, components |
| 2 | `StudentService.getSubscriptions()` | 5+ | hooks, pages |
| 3 | `QuizService.submitAnswersBulk()` | 5+ | quiz components |
| 4 | `QuizService.getQuizSession()` | 6+ | multiple pages/components |
| 5 | `StudentService.getTodos()` | 3+ | todos page |
| 6 | `StudentService.getLabels()` | 3+ | labels pages |
| 7 | `NewApiService.getPracticeSessions()` | 3+ | hooks, pages |

### Rarely Used Endpoints (Monitor)

| Endpoint | Call Count | Status |
|----------|------------|--------|
| `StudentService.compareSessionPerformance()` | 1 | Keep |
| `ExamService.createMultiModuleSession()` | 1 | Keep |
| `NewApiService.upsertCourseLayer()` | 1 | Keep |
| `AdminService.reviewQuestionReport()` | 1 | Keep |

---

## 4. Actionable Recommendations

### High Priority (Immediate)

1. **Add Missing Endpoints to Documentation**:
   - `GET /exams/available?moduleId={id}`
   - `GET /exams/by-module/{moduleId}/{year}`
   - `GET /exams/{examId}/questions`
   - `GET /student/study-pack/{studyPackId}`
   - `GET /students/courses/{courseId}/progress`

2. **Remove Dead Code**:
   ```typescript
   // api-services.ts - Remove these methods:
   - StudentService.getDashboardPerformance() // Replaced by getDashboardStats
   - StudentService.generateCertificate()     // Never used
   - StudentService.getModuleNotes()          // Use getNotesByModule instead
   - QuizService.completeQuizSession()        // No-op placeholder
   - SubscriptionService.getSubscriptionPlans() // Throws error
   ```

3. **Fix Duplicate Definitions**:
   - Remove duplicate `checkStudyPackAccess()` at line 1566
   - Remove duplicate `checkCourseAccess()` at line 1573

### Medium Priority

4. **Consolidate Similar Methods**:
   - `QuizService.getQuizFilters()` → Use `getQuizFiltersWithParams()` only
   - `QuizService.getSessionFilters()` → Delegate to `NewApiService.getQuizSessionFilters()`
   - `StudentService.completeTodo()` → Use `updateTodo({ status: 'COMPLETED' })`

5. **Add Deprecation Warnings**:
   - `ExamService.getExamSessionFilters()` - Already deprecated, ensure callers migrate

### Low Priority

6. **Investigate Orphaned Methods**:
   - `ExamService.getExamHistory()` - Confirm if needed
   - `ExamService.flagExamQuestion()` - Confirm if needed
   - `NewApiService.getQuestionsByUniteOrModule()` - Document endpoint

---

## 5. Files with Most API Imports

| File | Services Imported | Notes |
|------|-------------------|-------|
| `api-services.ts` | Defines all | Main service file |
| `new-api-services.ts` | Defines NewApiService | New endpoints |
| `use-subscription.tsx` | SubscriptionService, ContentService | Subscription hooks |
| `use-quiz-api.tsx` | QuizService | Quiz hooks |
| `use-practice-sessions.tsx` | NewApiService | Session hooks |
| `todos/page.tsx` | StudentService | Todo management |
| `labels/page.tsx` | StudentService, QuizService | Label management |
| `use-question-management.tsx` | AdminService | Admin questions |
| `use-admin-course-resources.tsx` | AdminCourseResourcesService | Admin resources |

---

## 6. Services Fully Utilized (No Dead Code)

✅ **SubscriptionService** - All methods used  
✅ **PaymentService** - All methods used  
✅ **AdminCourseResourcesService** - All methods used  
✅ **ResidencyQuestionsService** - All methods used  
✅ **UniversityService** - All methods used  
✅ **SettingsService** - All methods used  

---

## Appendix: Full Method Usage Matrix

### AuthService
| Method | Used | Location |
|--------|------|----------|
| `register()` | ✅ | auth-api.ts |
| `login()` | ✅ | auth-api.ts |
| `getProfile()` | ✅ | auth-api.ts, SettingsService |
| `refreshToken()` | ✅ | auth-api.ts, apiClient |
| `logout()` | ✅ | auth-api.ts |
| `updateProfile()` | ✅ | auth-api.ts, SettingsService |
| `changePassword()` | ✅ | auth-api.ts, change-password-dialog.tsx |
| `forgotPassword()` | ✅ | auth-api.ts |
| `resetPassword()` | ✅ | auth-api.ts |
| `getUniversities()` | ✅ | auth-api.ts, residency components |
| `getSpecialties()` | ✅ | auth-api.ts |

### NewApiService
| Method | Used | Location |
|--------|------|----------|
| `getContentFilters()` | ✅ | use-content-filters, tracker components, reading-todo-form |
| `getQuizSessionFilters()` | ✅ | use-content-filters |
| `getQuestionCount()` | ✅ | use-content-filters |
| `getSessionFilters()` | ✅ | use-content-filters, use-dashboard-stats |
| `getPracticeSessions()` | ✅ | use-practice-sessions, use-content-history |
| `getStudentNotes()` | ✅ | use-practice-sessions, notes/page |
| `getStudentLabels()` | ✅ | use-practice-sessions |
| `getStudentCourses()` | ✅ | use-practice-sessions, tracker-create-dialog, course-resources |
| `createCard()` | ✅ | tracker-create-dialog, tracker-create-page, enhanced-tracker-create-dialog |
| `updateCard()` | ✅ | trackers/page |
| `deleteCard()` | ✅ | trackers/page |
| `getCardById()` | ✅ | tracker/[id]/page |
| `getCardsByUnitOrModule()` | ✅ | trackers/page |
| `getCardProgress()` | ✅ | tracker/[id]/page, trackers/page |
| `upsertCourseLayer()` | ✅ | tracker/[id]/page |
| `getResidencyFilters()` | ✅ | residency/create/page |
| `getResidencySessionsOnly()` | ✅ | use-residency-history |
| `createResidencySession()` | ✅ | residency/create/page |
| `getQuestionsByUniteOrModule()` | ✅ | use-quiz-creation |
| `createQuizSession()` | ✅ | session-wizard |
| `getQuizSession()` | ✅ | session-wizard |
