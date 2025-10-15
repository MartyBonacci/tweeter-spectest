# Quality Standards - Tweeter SpecTest Project

**Version**: 1.0.0
**Created**: 2025-10-14
**Last Updated**: 2025-10-14

<!--
This file defines the quality gates and testing standards for the Tweeter SpecTest project.
All features must meet these standards before merging to main.
-->

---

## Quality Gates

### Overall Requirements

```yaml
min_test_coverage: 85
min_quality_score: 80
block_merge_on_failure: false
```

**Explanation**:
- `min_test_coverage`: Minimum percentage of code covered by tests (85%)
- `min_quality_score`: Minimum quality score (0-100) required (80/100)
- `block_merge_on_failure`: If `false`, allows merge with warnings; if `true`, blocks merge

---

## Test Requirements

### Unit Tests

```yaml
unit_tests_required: true
framework: vitest
command: npx vitest run
```

**Coverage Targets**:
- Overall project: **85%**
- Critical business logic: **95%** (auth, tweets, likes, profiles)
- New features: **90%**

**What to Test**:
- Authentication logic (JWT, sessions)
- Database operations (users, tweets, likes, profiles)
- API route handlers
- Data validation schemas (Zod)
- Utility functions (formatTimestamp, sanitizeContent)

### Integration Tests

```yaml
integration_tests_required: true
min_integration_coverage: 70
```

**What to Test**:
- API endpoint workflows (signup → signin → post tweet)
- Database transactions (create user → create profile → create tweet)
- Authentication flows (signup, signin, signout, session management)
- Tweet interactions (post, like, unlike)

### Browser Tests

```yaml
browser_tests_required: true
browser_test_framework: playwright
browsers:
  - chromium
  - firefox
```

**What to Test**:
- User signup and signin flows
- Tweet posting and feed display
- Like/unlike interactions
- Profile viewing and editing
- Navigation between pages
- Error states (invalid input, network errors)

---

## Visual Validation

### Spec Alignment

```yaml
spec_alignment_required: true
min_visual_score: 75
```

**What to Validate**:
- Feed page displays tweets correctly
- Tweet cards show all required elements
- Profile pages match spec design
- Forms have proper validation messages
- Navigation is intuitive

### Screenshot Analysis

```yaml
screenshot_validation: true
screenshot_on_failure: true
visual_regression_enabled: false  # Phase 2 feature
```

**Screenshots Captured**:
- Signup/signin flows
- Feed page (empty and with tweets)
- Tweet posting interaction
- Like/unlike interaction
- Profile viewing and editing
- Error states

---

## Accessibility Standards

### WCAG Compliance

```yaml
accessibility_required: true
wcag_level: AA
wcag_version: 2.1
```

**Required Checks**:
- ✅ All images have alt text or role="presentation"
- ✅ All form inputs have labels or aria-label
- ✅ All buttons have accessible names
- ✅ Color contrast meets WCAG AA (4.5:1 for text)
- ✅ Keyboard navigation works for all interactive elements
- ✅ Proper heading hierarchy (single h1, logical h2-h6)
- ✅ Links have descriptive text or aria-label

### Semantic HTML

```yaml
semantic_html_required: true
```

**Best Practices**:
- Use semantic elements (`<nav>`, `<main>`, `<article>`, `<form>`)
- Proper form structure with labels and fieldsets
- Meaningful heading hierarchy
- Lists for tweet feeds (`<ul>`, `<li>`)

---

## Quality Scoring

Quality score is calculated from five components:

| Component | Weight | Pass Criteria | Points |
|-----------|--------|---------------|--------|
| Unit Tests | 25% | All tests passing | 0-25 |
| Integration Tests | 20% | All tests passing | 0-20 |
| Code Coverage | 25% | ≥ 85% | 0-25 |
| Browser Tests | 15% | All tests passing | 0-15 |
| Visual Alignment | 15% | ≥ 75% | 0-15 |

**Total**: 0-100 points

---

## Feature-Specific Exemptions

### Backend-Only Features

For features with no UI (API endpoints, database migrations, workers):

```yaml
browser_tests_required: false
visual_validation_required: false
accessibility_required: false
```

**Examples**:
- Database schema changes
- API endpoint additions
- Background workers
- Server configuration

### UI-Only Features

For features with no backend logic (static pages, UI components):

```yaml
integration_tests_required: false
```

**Examples**:
- Landing page redesign
- Component library additions
- CSS/styling updates

---

## Test Environment

### Development

```yaml
test_database: sqlite_memory
test_port: 5173
api_mock_mode: false  # Use real API during tests
```

### CI/CD

```yaml
test_database: sqlite_memory
parallel_execution: true
max_workers: 4
```

---

## Performance Budgets

### Page Load Times

```yaml
max_initial_load: 3000ms  # First page load
max_route_change: 1000ms  # Client-side navigation
max_api_response: 500ms   # API endpoint response
```

### Bundle Sizes

```yaml
max_js_bundle: 250kb   # gzipped
max_css_bundle: 50kb   # gzipped
max_total_size: 500kb  # gzipped
```

---

## Security Requirements

### Dependency Scanning

```yaml
vulnerability_scanning: true
max_severity_allowed: medium
auto_update_patches: true
```

### Code Scanning

```yaml
eslint_security_rules: true
no_hardcoded_secrets: true
csrf_protection_required: true
```

---

## Project-Specific Requirements

### Tweeter Application Standards

**Authentication**:
- JWT tokens must expire
- Session management required
- Secure cookie handling (httpOnly, sameSite)

**Data Validation**:
- All user input validated with Zod
- SQL injection prevention (parameterized queries)
- XSS prevention (content sanitization)

**Tweet Requirements**:
- Character limit enforcement (280 chars)
- Timestamp formatting consistent
- Like counts accurate
- Author attribution always present

**Profile Requirements**:
- Display name and bio editable
- Avatar upload functional
- User's own profile editable only by them

---

## Continuous Improvement

### Review Schedule

```yaml
review_frequency: monthly
update_process: team_discussion
version_control: git_commits
```

### Metrics Tracking

Quality metrics are saved to `/memory/metrics.json` for each feature.

---

## Tools and Configuration

### Test Frameworks

- **Unit/Integration**: Vitest
- **Browser**: Playwright
- **Coverage**: Vitest --coverage (c8)

### Local Development

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run browser tests
npm run test:browser

# Run specific test file
npm test path/to/test.ts
```

---

## Version History

### 1.0.0 (2025-10-14)

- Initial quality standards
- Configured for Tweeter SpecTest project
- Vitest + Playwright stack
- Set baseline: 85% coverage, 80/100 quality score
- Soft failures (warnings only, merge allowed)

---

## Notes

**Philosophy**: Quality gates help us ship features with confidence, not slow us down.

**Testing Strategy**:
- Unit tests for business logic
- Integration tests for API workflows
- Browser tests for user flows
- Visual validation for UI correctness

**Current Focus**: Build quality habits early, adjust thresholds as project matures.

---

**Questions?** Update this file based on team feedback and project evolution.
