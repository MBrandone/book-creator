# E2E Testing with Playwright

Guide for writing and maintaining end-to-end tests using Playwright in the Book Creator application.

## Purpose

Ensure consistent, accessible, and maintainable E2E tests that validate user flows without flakiness. Tests run in isolated infrastructure with deterministic IA mocks.

## Test Environment

### Infrastructure Isolation
Tests use **dedicated infrastructure** via `.env.test`:
- **PostgreSQL**: port 5433, database `bookcreator_test`
- **MinIO**: ports 9010/9011, bucket `book-images-test`
- **IA Mocks**: `STORY_PROVIDER=mock` and `IMAGE_GENERATION_PROVIDER=mock`

All mocks are deterministic with **no external network calls**.

### Running Tests
```bash
npm run test:e2e        # Run E2E tests (auto-starts test infrastructure)
npm run test:e2e:ui     # Interactive Playwright UI mode
```

Test infrastructure is automatically started/stopped by the test command.

## Selector Conventions

**ALWAYS use accessible selectors** (Testing Library philosophy):

### Preferred Selectors (in order)
1. **Role-based**: `getByRole('button', { name: 'Créer une histoire' })`
2. **Label-based**: `getByLabel('Nom du personnage')`
3. **Text-based**: `getByText('Générer l\'histoire')`

### Avoid
- ❌ CSS classes: `.class-name`
- ❌ IDs: `#id`
- ❌ Test IDs: `[data-testid]` (last resort only)

**Why**: This convention **enforces application accessibility** — if you can't select it accessibly, users can't access it either.

## IA Provider Mocking

### Factory Pattern
IA generators are selected via factories:
- `StoryScenesDescriptionGeneratorFactory` → selects based on `STORY_PROVIDER`
- `SceneImageGeneratorFactory` → selects based on `IMAGE_GENERATION_PROVIDER`

### Environment Variables
- `STORY_PROVIDER`: `mock`, `ollama`, `replicate`
- `IMAGE_GENERATION_PROVIDER`: `mock`, `replicate`

### Mock Implementations
Located in:
- `webapp/src/lib/story-scenes-description-generator/in-memory/`
- `webapp/src/lib/scene-image-generator/in-memory/`

**Important**: Do NOT use `page.route()` to mock IA calls — mocks are configured via `.env.test`.

## Writing Tests

### File Structure
Create test files in `webapp/tests/e2e/*.spec.ts`

### Best Practices
1. **Use accessible selectors only** (see Selector Conventions)
2. **No mocking via `page.route`** except for testing loading states
3. **Deterministic mocks** are already configured via `.env.test`
4. **Test happy path first**, then edge cases
5. **One test file per user flow** (e.g., `create-a-story.spec.ts`)

### Example Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('user can create a story', async ({ page }) => {
  await page.goto('/');
  
  await page.getByRole('button', { name: 'Créer une histoire' }).click();
  
  await page.getByLabel('Nom du personnage').fill('Alice');
  await page.getByLabel('Âge du personnage').fill('5');
  
  await page.getByRole('button', { name: 'Générer l\'histoire' }).click();
  
  await expect(page.getByRole('heading', { name: 'Votre histoire' })).toBeVisible();
});
```

## Debugging

### Interactive Mode
```bash
npm run test:e2e:ui
```
Opens Playwright UI for step-by-step debugging with time-travel.

### Test Artifacts
- **Traces**: `webapp/test-results/` (gitignored)
- **Screenshots**: Auto-captured on failure
- **Videos**: Available in UI mode

### Common Issues

#### Selector Not Found
- ✅ Check element exists with correct role/label/text
- ✅ Verify element is visible (not `display: none`)
- ✅ Wait for navigation/loading to complete
- ❌ Don't fall back to CSS selectors — fix the accessibility instead

#### Timeout Errors
- ✅ Check if mock data is correct
- ✅ Verify test infrastructure is running (auto-started by npm script)
- ✅ Increase timeout only as last resort
- ❌ Don't add arbitrary `sleep()` — use proper waiters

#### Flaky Tests
- ✅ Use `waitFor` conditions instead of fixed delays
- ✅ Check for race conditions in async operations
- ✅ Ensure mocks return consistent data
- ❌ Don't retry failing tests — fix the root cause

## Anti-Patterns

### Anti-Pattern 1: Using CSS Selectors
```typescript
// ❌ Bad
await page.locator('.submit-button').click();
await page.locator('#character-name').fill('Alice');

// ✅ Good
await page.getByRole('button', { name: 'Soumettre' }).click();
await page.getByLabel('Nom du personnage').fill('Alice');
```

### Anti-Pattern 2: Mocking via page.route
```typescript
// ❌ Bad (except for testing loading states)
await page.route('**/api/stories/generate', route => {
  route.fulfill({ body: mockData });
});

// ✅ Good
// Mocks are configured via .env.test (STORY_PROVIDER=mock)
```

### Anti-Pattern 3: Fixed Delays
```typescript
// ❌ Bad
await page.click('button');
await page.waitForTimeout(5000);

// ✅ Good
await page.click('button');
await page.waitForSelector('[role="heading"]');
// Or better:
await expect(page.getByRole('heading')).toBeVisible();
```

### Anti-Pattern 4: Testing Implementation Details
```typescript
// ❌ Bad
await expect(page.locator('[data-state="loading"]')).toBeVisible();

// ✅ Good
await expect(page.getByText('Génération en cours...')).toBeVisible();
```

### Anti-Pattern 5: Multiple Assertions Without Context
```typescript
// ❌ Bad
await expect(page.locator('.title')).toBeVisible();
await expect(page.locator('.content')).toBeVisible();

// ✅ Good
await expect(page.getByRole('heading', { name: 'Titre de l\'histoire' })).toBeVisible();
await expect(page.getByText('Il était une fois...')).toBeVisible();
```

## Checklist for New Tests

Before submitting a new test:

- [ ] Uses only accessible selectors (role/label/text)
- [ ] No CSS classes, IDs, or data-testid (unless absolutely necessary)
- [ ] No `page.route()` mocking (unless testing loading states)
- [ ] No fixed `waitForTimeout()` delays
- [ ] Tests happy path first
- [ ] Includes meaningful edge cases
- [ ] Passes in both headless and UI modes
- [ ] Located in `webapp/tests/e2e/*.spec.ts`
- [ ] Uses `.env.test` configuration (not custom env setup)

## Integration with Development

### Before Committing Changes
```bash
npm run test:e2e
```

**NEVER skip tests** to "go faster" — they catch regressions before they reach production.

### Reading Test Failures
1. Open `webapp/test-results/` for detailed reports
2. Review screenshot/video artifacts
3. Run `npm run test:e2e:ui` to debug interactively
4. Fix root cause (don't just increase timeouts)

### Updating Tests After Changes
When modifying UI:
1. Update test selectors if labels/roles change
2. Verify accessibility wasn't degraded
3. Run full test suite before committing
4. Update mock data if API contracts change

## Reference

### Test Infrastructure Ports
- **Dev Environment**: Postgres 5432, MinIO 9000, Ollama 11434
- **Test Environment**: Postgres 5433, MinIO 9010/9011

### Configuration Files
- `.env.test`: Test environment variables (versioned)
- `.env.local`: Development environment (not versioned)
- `playwright.config.ts`: Playwright configuration
- `docker-compose.test.yml`: Test infrastructure

### Mock Locations
- Story generator mocks: `webapp/src/lib/story-scenes-description-generator/in-memory/`
- Image generator mocks: `webapp/src/lib/scene-image-generator/in-memory/`

## When to Use This Skill

Apply these conventions when:
- Writing new E2E tests
- Debugging failing tests
- Reviewing test code
- Adding new user flows
- Modifying existing test infrastructure
- Updating mocks or test data
