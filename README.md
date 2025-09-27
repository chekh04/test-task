## Starting the App

Run `npm i` to install dependencies first, and then run `ng s` to start the app.

## Form Application Features

This Angular application provides a dynamic form system with the following features:

### Components
- **Dynamic Form**: Manages multiple forms using FormArray
- **Country Input**: Autocomplete input with country suggestions
- **Text Input**: Reusable text input component
- **Datepicker**: Date input with validation for past dates only

### Validation
- **Country**: Must be from the predefined Country enum
- **Username**: Backend validation via `/api/checkUsername` endpoint
  - Username must contain 'new' to be available
  - Debounced validation (500ms delay)
- **Birthday**: Cannot be in the future
- **Visual Feedback**: Invalid forms show error messages and are highlighted

### Features
- Add/remove forms dynamically
- Real-time validation feedback
- Invalid form counter next to submit button
- Responsive Bootstrap styling
- Mock backend for username validation

### Usage
1. Start with one form by default
2. Use "Add new form" button to create additional forms
3. Fill in all required fields
4. Country field provides autocomplete suggestions
5. Username field validates against backend (must contain 'new')
6. Birthday cannot be in the future
7. Submit button shows count of invalid forms
8. All forms must be valid to submit
