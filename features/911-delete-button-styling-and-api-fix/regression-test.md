# Regression Test: Bug 911

**Purpose**: Prove bug exists, validate fix, prevent future regressions

**Test Type**: Regression Test
**Created**: 2025-10-15

---

## Test Objective

Write tests that:
1. ✅ **Fail before fix** (proves bugs exist)
2. ✅ **Pass after fix** (proves bugs fixed)
3. ✅ **Prevent regression** (catches if bugs reintroduced)

---

## Test Specification

### Test 1: DeleteConfirmationModal Button Visibility

**Purpose**: Verify delete button has proper styling (red background, white text)

#### Test Setup
- Render DeleteConfirmationModal component
- Pass props: `isOpen=true`, `tweetContent="Test tweet"`, mock callbacks, `isDeleting=false`

#### Test Execution
1. Render modal
2. Query for delete button by text "Delete"
3. Get computed styles of button

#### Test Assertions
- ✅ Button exists and is visible
- ✅ Button has red/failure color styling (background contains red color)
- ✅ Button text is visible (not white-on-white)
- ✅ Button is clickable (not disabled)

#### Test Teardown
- Unmount component

---

### Test 2: Delete Button API Integration

**Purpose**: Verify delete button successfully calls DELETE API and handles response

#### Test Setup
- Create test database with user and tweet
- Mock authenticated session
- Render DeleteButton component with real tweet ID

#### Test Execution
1. Click trash icon to open modal
2. Click "Delete" button in modal
3. Wait for API response
4. Verify optimistic UI update

#### Test Assertions
- ✅ DELETE /api/tweets/:id called with correct ID
- ✅ Request includes authentication credentials
- ✅ Response is 204 No Content (success)
- ✅ onDeleteSuccess callback invoked
- ✅ Modal closes
- ✅ No error displayed

#### Test Teardown
- Clean up test database
- Clear mocks

---

### Test 3: Delete Button Error Handling

**Purpose**: Verify proper error handling when delete fails

#### Test Setup
- Mock DELETE API to return 404 error
- Render DeleteButton component

#### Test Execution
1. Click delete button
2. Confirm in modal
3. Wait for error response

#### Test Assertions
- ✅ Error logged to console
- ✅ Modal remains open on error
- ✅ No page refresh occurs
- ✅ onDeleteSuccess NOT called

---

## Test Implementation

### Test File Locations

**Component Tests**:
- File: `tests/components/DeleteConfirmationModal.test.tsx`
- Test Name: `test_bug_911_delete_button_visible`

**Integration Tests**:
- File: `tests/integration/tweets-delete.test.ts`
- Test Name: `test_bug_911_delete_api_succeeds`

### Test Validation Criteria

**Before Fix**:
- ❌ Test 1 MUST fail (button styling not visible)
- ❌ Test 2 MUST fail (API call not working)
- ✅ Test 3 may pass (error handling already implemented)

**After Fix**:
- ✅ All tests MUST pass
- ✅ All existing tests still pass (no regressions)

---

## Edge Cases to Test

1. **Delete button disabled during deletion**: Verify button shows "Deleting..." and is disabled
2. **Cancel button works**: Clicking cancel closes modal without deleting
3. **ESC key closes modal**: Pressing ESC closes modal without deleting
4. **Multiple rapid clicks**: Clicking delete multiple times doesn't cause race conditions
5. **Network timeout**: Long API response doesn't break UI

---

## Manual Testing Checklist

After automated tests pass, manually verify:

- [ ] Delete button in modal is clearly visible (red background)
- [ ] Delete button text is white and readable
- [ ] Clicking delete removes tweet immediately (optimistic UI)
- [ ] Tweet is removed from database (verify with database query or refresh)
- [ ] No error messages appear on successful delete
- [ ] Error toast appears if delete fails (e.g., unauthorized)
- [ ] Modal closes after successful delete
- [ ] Page does not refresh unexpectedly

---

## Metadata

**Workflow**: Bugfix (regression-test-first)
**Created By**: SpecLab Plugin v1.0.0
