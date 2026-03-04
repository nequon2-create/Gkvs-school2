🚨 ERROR HANDLING & DEBUGGING PROTOCOL
⚠️ CRITICAL: WHAT TO DO WHEN THINGS GO WRONG
This protocol defines EXACTLY how the AI agent must behave when encountering errors, bugs, or unexpected behavior.

📋 FUNDAMENTAL PRINCIPLES
PRINCIPLE 1: NEVER IGNORE ERRORS
EVERY error must be acknowledged
EVERY error must be handled
EVERY error must be logged appropriately
NEVER use empty catch blocks
NEVER suppress errors silently
PRINCIPLE 2: FAIL FAST, FAIL LOUD
Detect errors as early as possible
Make errors visible immediately
DON'T let errors propagate silently
DON'T hide errors from developers
PRINCIPLE 3: DEFENSIVE PROGRAMMING
Assume everything can fail
Validate all inputs
Check all assumptions
Add guards for edge cases
PRINCIPLE 4: USER-FIRST ERROR MESSAGES
Users see friendly messages
Developers see technical details
NEVER show technical errors to users
ALWAYS provide actionable guidance

🔍 WHEN ERRORS OCCUR - IMMEDIATE RESPONSE
STEP 1: STOP IMMEDIATELY
When any error occurs:
STOP writing more code
DON'T continue to next feature
DON'T assume it will fix itself
DON'T try to work around it
STEP 2: IDENTIFY THE ERROR TYPE
Categorize the error into one of these types:
TYPE A: SYNTAX ERRORS
TypeScript compilation errors
ESLint errors
Import/export errors
Missing dependencies
Response:
Read the EXACT error message
Identify the file and line number
Fix the syntax error immediately
Verify fix with compilation
DO NOT proceed until all syntax errors are resolved
TYPE B: RUNTIME ERRORS
Undefined variables
Null/undefined access
Type mismatches
Function not found
Response:
Identify where error occurs (stack trace)
Add null checks
Add type guards
Add proper error boundaries
Test the fix thoroughly
TYPE C: LOGIC ERRORS
Wrong calculations
Incorrect data flow
Missing conditions
Wrong state updates
Response:
Review the logic step by step
Add console logs to trace data flow
Write down expected vs actual behavior
Fix the logic
Test with multiple scenarios
TYPE D: API/DATABASE ERRORS
Connection failures
Query errors
Authentication errors
Data validation errors
Response:
Check error response from API/database
Verify credentials and permissions
Check network connectivity
Validate request data
Add proper error handling
Test error scenarios
TYPE E: BUILD/DEPLOYMENT ERRORS
Build failures
Missing environment variables
Configuration errors
Dependency conflicts
Response:
Read build logs carefully
Check all environment variables
Verify configuration files
Check dependency versions
Test build locally before deploying

🛠️ SYSTEMATIC DEBUGGING PROCESS
PHASE 1: REPRODUCE THE ERROR
Step 1.1: Understand the Context
Ask yourself:
What was I trying to do?
What was the expected behavior?
What actually happened?
Can I reproduce this consistently?
Step 1.2: Create Minimal Reproduction
Remove unrelated code
Isolate the problematic section
Create simplest case that shows error
Document steps to reproduce
Step 1.3: Verify It's Actually an Error
Is this actually a bug or expected behavior?
Check documentation
Review requirements
Confirm with user if unclear
PHASE 2: GATHER INFORMATION
Step 2.1: Read Error Messages Carefully
Read ENTIRE error message (don't skim)
Note exact error text
Note file name and line number
Note stack trace
Copy error message for reference
Step 2.2: Check Console/Logs
Browser console (for web)
Metro logs (for React Native)
Supabase logs (for database)
Network tab (for API calls)
Server logs (if applicable)
Step 2.3: Inspect State and Data
Add debugging logs to check:
What is the current state?
What data is being passed?
What are the function parameters?
What is being returned?
Example:
console.log('=== DEBUG: fetchStudents ===');
console.log('Input classId:', classId);
console.log('Query result:', data);
console.log('Error:', error);
console.log('========================');

Step 2.4: Check Network Requests
For API/database calls:
Check request URL
Check request headers
Check request body
Check response status
Check response body
Check response time
PHASE 3: FORM HYPOTHESIS
Step 3.1: Analyze the Evidence
Based on gathered information:
What could be causing this?
What changed recently?
What assumptions did I make?
What did I overlook?
Step 3.2: List Possible Causes
Write down 3-5 possible causes:
Most likely cause
Second most likely
Third possibility
Edge case possibilities
Environmental issues
Step 3.3: Prioritize Investigation
Start with most likely cause Then move to less likely causes Don't jump to conclusions
PHASE 4: TEST HYPOTHESIS
Step 4.1: Test One Thing at a Time
Change ONE variable
Test the result
Document what you changed
Document what happened
Step 4.2: Add Validation Checks
// Add type checks
if (!student) {
  console.error('Student is null or undefined');
  return;
}

// Add data validation
if (!Array.isArray(students)) {
  console.error('Students is not an array:', typeof students);
  return;
}

// Add bounds checking
if (index < 0 || index >= students.length) {
  console.error('Index out of bounds:', index);
  return;
}

Step 4.3: Use Type Guards
// Check if object has required properties
function isValidStudent(obj: any): obj is Student {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.full_name === 'string' &&
    typeof obj.class_id === 'string'
  );
}

if (!isValidStudent(data)) {
  console.error('Invalid student data:', data);
  return;
}

PHASE 5: IMPLEMENT FIX
Step 5.1: Write the Fix
Make smallest change possible
Don't refactor while fixing
Focus on fixing the error first
Comment why fix is needed
Step 5.2: Add Error Handling
Every fix should include proper error handling:
For API Calls:
try {
  const { data, error } = await supabase
    .from('students')
    .select('*');
  
  if (error) {
    console.error('Supabase error:', error);
    throw new Error(`Failed to fetch students: ${error.message}`);
  }
  
  if (!data) {
    console.warn('No students data returned');
    return [];
  }
  
  return data;
} catch (error) {
  console.error('Unexpected error in fetchStudents:', error);
  throw error;
}

For User Input:
const handleSubmit = async (formData: FormData) => {
  try {
    // Validate input
    const validatedData = studentSchema.parse(formData);
    
    // Process data
    const result = await createStudent(validatedData);
    
    // Success feedback
    showSuccessMessage('Student created successfully');
    
  } catch (error) {
    if (error instanceof ZodError) {
      // Validation error - show to user
      showErrorMessage('Please check the form for errors');
      setFormErrors(error.errors);
    } else {
      // Unexpected error
      console.error('Error creating student:', error);
      showErrorMessage('Failed to create student. Please try again.');
    }
  }
};

For Component Errors:
// Create Error Boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error);
    console.error('Error info:', errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

Step 5.3: Add Preventive Checks
Prevent the error from happening again:
// Before
const studentName = student.name;

// After - prevent null/undefined errors
const studentName = student?.name ?? 'Unknown';

// Or with explicit check
if (!student || !student.name) {
  console.error('Invalid student object:', student);
  return 'Unknown';
}
const studentName = student.name;

PHASE 6: VERIFY THE FIX
Step 6.1: Test the Fix
Test in this order:
Happy path - Does it work normally?
Error path - Does error handling work?
Edge cases - Empty data, null, undefined, very large numbers
Boundary conditions - Min/max values, first/last items
Different scenarios - Different user roles, different data
Step 6.2: Test Related Features
What else might be affected?
Test features that use same data
Test features that call same functions
Test parent and child components
Step 6.3: Regression Testing
Did the fix break anything else?
Test all features in the same area
Verify previous working features still work
Step 6.4: Performance Check
Is the fix performant?
Does it cause re-renders?
Does it slow down the app?
Are there memory leaks?
PHASE 7: CLEAN UP
Step 7.1: Remove Debug Code
Remove all console.log statements used for debugging
Remove test/dummy data
Remove commented-out code
Remove temporary variables
Step 7.2: Improve Code Quality
After fixing the error:
Can the code be clearer?
Should you add comments?
Should you refactor for maintainability?
Should you add TypeScript types?
Step 7.3: Document the Fix
If the error was tricky or important:
Add comment explaining the fix
Document in code review
Update documentation if needed
Share knowledge with team

🎯 ERROR HANDLING PATTERNS
PATTERN 1: TRY-CATCH WRAPPER
Use this pattern for all async operations:
async function safeOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    // Log to error tracking service
    return null;
  }
}

// Usage
const students = await safeOperation(
  () => fetchStudents(classId),
  'Failed to fetch students'
);

if (!students) {
  showErrorMessage('Unable to load students');
  return;
}

PATTERN 2: RESULT TYPE
Use Result type to handle errors functionally:
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchStudentsResult(
  classId: string
): Promise<Result<Student[]>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId);
    
    if (error) {
      return { success: false, error: new Error(error.message) };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

// Usage
const result = await fetchStudentsResult(classId);

if (!result.success) {
  console.error('Error:', result.error);
  showErrorMessage('Failed to load students');
  return;
}

// TypeScript knows result.data exists here
const students = result.data;

PATTERN 3: ERROR BOUNDARY FOR COMPONENTS
Wrap error-prone components:
<ErrorBoundary fallback={<ErrorFallback />}>
  <StudentProfile studentId={id} />
</ErrorBoundary>

PATTERN 4: CUSTOM ERROR CLASSES
Create specific error types:
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DatabaseError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Usage
if (!email.includes('@')) {
  throw new ValidationError('Invalid email', 'email');
}

// Catch specific errors
try {
  await createStudent(data);
} catch (error) {
  if (error instanceof ValidationError) {
    setFieldError(error.field, error.message);
  } else if (error instanceof DatabaseError) {
    showErrorMessage('Database error. Please contact support.');
  } else {
    showErrorMessage('An unexpected error occurred.');
  }
}

PATTERN 5: GRACEFUL DEGRADATION
Provide fallback when features fail:
function StudentProfile({ studentId }: Props) {
  const { data: student, error } = useStudent(studentId);
  
  // Error state
  if (error) {
    return (
      <ErrorState 
        message="Unable to load student profile"
        retry={() => refetch()}
      />
    );
  }
  
  // Loading state
  if (!student) {
    return <LoadingSpinner />;
  }
  
  // Success state
  return <ProfileContent student={student} />;
}

PATTERN 6: RETRY LOGIC
For transient failures:
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`Attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// Usage
const data = await withRetry(() => fetchStudents(classId));


🚨 COMMON ERROR SCENARIOS & SOLUTIONS
SCENARIO 1: "Cannot read property 'X' of undefined"
Cause: Accessing property on null/undefined object
Solution:
// ❌ WRONG
const name = student.full_name;

// ✅ CORRECT - Optional chaining
const name = student?.full_name;

// ✅ CORRECT - With fallback
const name = student?.full_name ?? 'Unknown';

// ✅ CORRECT - Explicit check
if (!student) {
  console.error('Student is undefined');
  return;
}
const name = student.full_name;

SCENARIO 2: "X is not a function"
Cause: Variable is not a function or is undefined
Solution:
// Check before calling
if (typeof callback !== 'function') {
  console.error('Callback is not a function:', callback);
  return;
}
callback();

// Or use optional call
callback?.();

SCENARIO 3: "Cannot read property 'map' of undefined"
Cause: Array is undefined/null
Solution:
// ❌ WRONG
{students.map(student => <Card key={student.id} />)}

// ✅ CORRECT - Default empty array
{(students || []).map(student => <Card key={student.id} />)}

// ✅ CORRECT - Conditional rendering
{students && students.map(student => <Card key={student.id} />)}

// ✅ CORRECT - Early return
if (!students || !Array.isArray(students)) {
  return <EmptyState />;
}
return students.map(student => <Card key={student.id} />);

SCENARIO 4: Network/API Errors
Cause: API call failed
Solution:
try {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  if (error instanceof TypeError) {
    // Network error
    console.error('Network error:', error);
    showErrorMessage('Network connection failed. Please check your internet.');
  } else {
    // Other error
    console.error('API error:', error);
    showErrorMessage('Failed to fetch data. Please try again.');
  }
  throw error;
}

SCENARIO 5: Async/Await Errors
Cause: Promise rejection not handled
Solution:
// ❌ WRONG - Unhandled rejection
const data = await fetchData();

// ✅ CORRECT - With try-catch
try {
  const data = await fetchData();
  processData(data);
} catch (error) {
  console.error('Error fetching data:', error);
  handleError(error);
}

// ✅ CORRECT - With .catch()
fetchData()
  .then(data => processData(data))
  .catch(error => {
    console.error('Error:', error);
    handleError(error);
  });

SCENARIO 6: Form Validation Errors
Cause: Invalid user input
Solution:
const handleSubmit = async (data: FormData) => {
  try {
    // Validate with Zod
    const validated = studentSchema.parse(data);
    
    // Submit
    await createStudent(validated);
    
    showSuccessMessage('Student created!');
    navigate('/students');
    
  } catch (error) {
    if (error instanceof ZodError) {
      // Show field-specific errors
      error.errors.forEach(err => {
        setFieldError(err.path.join('.'), err.message);
      });
      showErrorMessage('Please fix the errors in the form');
    } else {
      console.error('Unexpected error:', error);
      showErrorMessage('Failed to create student');
    }
  }
};

SCENARIO 7: Database/Supabase Errors
Cause: Database operation failed
Solution:
const { data, error } = await supabase
  .from('students')
  .insert(studentData)
  .select()
  .single();

if (error) {
  console.error('Supabase error:', error);
  
  // Handle specific error codes
  if (error.code === '23505') {
    // Unique constraint violation
    showErrorMessage('A student with this registration number already exists');
  } else if (error.code === '23503') {
    // Foreign key violation
    showErrorMessage('Invalid class or parent selected');
  } else {
    // Generic error
    showErrorMessage('Failed to create student. Please try again.');
  }
  
  return null;
}

return data;

SCENARIO 8: File Upload Errors
Cause: File upload failed
Solution:
const handleFileUpload = async (file: File) => {
  // Validate file
  if (!file) {
    showErrorMessage('Please select a file');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showErrorMessage('File size must be less than 5MB');
    return;
  }
  
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    showErrorMessage('Only JPEG and PNG images are allowed');
    return;
  }
  
  try {
    const { data, error } = await supabase.storage
      .from('student-photos')
      .upload(`${studentId}/${file.name}`, file);
    
    if (error) {
      console.error('Upload error:', error);
      showErrorMessage('Failed to upload file');
      return;
    }
    
    return data.path;
  } catch (error) {
    console.error('Unexpected upload error:', error);
    showErrorMessage('File upload failed');
  }
};

SCENARIO 9: State Update Errors
Cause: Invalid state update
Solution:
// ❌ WRONG - Mutating state
students.push(newStudent);
setStudents(students);

// ✅ CORRECT - Immutable update
setStudents([...students, newStudent]);

// ✅ CORRECT - With validation
setStudents(prev => {
  if (!Array.isArray(prev)) {
    console.error('Previous state is not an array:', prev);
    return [newStudent];
  }
  return [...prev, newStudent];
});

SCENARIO 10: Infinite Loop/Re-render
Cause: useEffect dependencies causing infinite loop
Solution:
// ❌ WRONG - Missing dependencies
useEffect(() => {
  fetchStudents();
}, []);

// ❌ WRONG - Object in dependencies
useEffect(() => {
  fetchStudents(filter);
}, [filter]); // filter is object, causes infinite loop

// ✅ CORRECT - Proper dependencies
useEffect(() => {
  fetchStudents();
}, [classId, academicYear]); // Primitive values

// ✅ CORRECT - Memoized object
const filter = useMemo(() => ({ 
  classId, 
  academicYear 
}), [classId, academicYear]);

useEffect(() => {
  fetchStudents(filter);
}, [filter]);


📊 ERROR LOGGING STRATEGY
WHAT TO LOG
ALWAYS Log:
All errors caught in try-catch
API/Database errors
Authentication failures
Validation failures
Unexpected null/undefined
Performance issues
NEVER Log:
User passwords
API keys
Personal information (except in dev mode)
Sensitive data
HOW TO LOG
Development Mode:
if (process.env.NODE_ENV === 'development') {
  console.log('=== DEBUG ===');
  console.log('Input:', input);
  console.log('State:', state);
  console.log('Result:', result);
  console.log('=============');
}

Production Mode:
// Use error tracking service
try {
  await operation();
} catch (error) {
  // Log to Sentry/LogRocket/etc
  errorTracker.captureException(error, {
    extra: {
      userId: user.id,
      operation: 'createStudent',
      timestamp: new Date().toISOString()
    }
  });
  
  // Generic message to user
  showErrorMessage('An error occurred. Our team has been notified.');
}

ERROR LOG FORMAT
Structure logs consistently:
function logError(
  operation: string,
  error: Error,
  context?: Record<string, any>
) {
  console.error({
    timestamp: new Date().toISOString(),
    operation,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    user: getCurrentUser()?.id,
    environment: process.env.NODE_ENV
  });
}

// Usage
try {
  await createStudent(data);
} catch (error) {
  logError('createStudent', error as Error, { 
    studentData: data,
    classId: data.class_id 
  });
}


🎯 DEBUGGING TOOLS & TECHNIQUES
BROWSER DEVTOOLS
Console:
Use console.group() for organized logs
Use console.table() for arrays/objects
Use console.time() for performance
Use console.trace() for call stack
console.group('Student Creation');
console.log('Input data:', data);
console.time('Database Insert');
await createStudent(data);
console.timeEnd('Database Insert');
console.groupEnd();

Network Tab:
Check request/response
Check headers
Check timing
Check status codes
React DevTools:
Inspect component props
Inspect component state
Track re-renders
Profile performance
Redux/Zustand DevTools:
Inspect state
Track state changes
Time-travel debugging
MOBILE DEBUGGING
React Native Debugger:
Remote JS debugging
Redux DevTools
Network inspection
Flipper:
Network inspector
Layout inspector
Database viewer
Logs viewer
Console Logs:
// Color-coded logs (Metro)
console.log('%c Success!', 'color: green');
console.log('%c Error!', 'color: red');
console.log('%c Warning!', 'color: orange');


🚫 WHAT NOT TO DO WHEN DEBUGGING
DON'T:
Change multiple things at once


Change ONE thing
Test
Then change another
Assume the error message is wrong


Error messages are usually correct
Read them carefully
Skip reproduction steps


Always reproduce first
Then fix
Fix without understanding


Understand WHY it broke
Then fix properly
Leave debug code


Remove all console.logs
Remove test data
Clean up before committing
Ignore warnings


Warnings become errors
Fix them immediately
Test only happy path


Test error cases
Test edge cases
Test edge-edge cases
Deploy without testing


Test locally first
Test in staging
Then deploy
Blame tools/libraries first


Usually it's your code
Check your code first
Then check dependencies
Give up


Every error can be fixed
Take a break if stuck
Come back fresh

✅ DEBUGGING CHECKLIST
Before declaring "I can't find the bug":
[ ] Have I read the ENTIRE error message?
[ ] Have I checked the console/logs?
[ ] Have I inspected the network tab?
[ ] Have I added debug logs?
[ ] Have I checked the data types?
[ ] Have I checked for null/undefined?
[ ] Have I verified the data flow?
[ ] Have I checked the documentation?
[ ] Have I searched for similar errors online?
[ ] Have I tested with different data?
[ ] Have I tested edge cases?
[ ] Have I taken a break and come back?

🎓 ERROR HANDLING BEST PRACTICES SUMMARY
DO:
✅ Handle ALL errors explicitly
 ✅ Provide user-friendly error messages
 ✅ Log errors with context
 ✅ Validate all inputs
 ✅ Use TypeScript for type safety
 ✅ Add loading and error states
 ✅ Test error scenarios
 ✅ Use error boundaries
 ✅ Implement retry logic where appropriate
 ✅ Fail gracefully with fallbacks
DON'T:
❌ Ignore errors silently
 ❌ Show technical errors to users
 ❌ Use empty catch blocks
 ❌ Assume data is valid
 ❌ Skip error handling "for now"
 ❌ Let errors crash the app
 ❌ Forget to remove debug code
 ❌ Skip testing error cases
 ❌ Deploy without testing
 ❌ Give up when debugging

🚨 WHEN TO ASK FOR HELP
Ask for help when:
After 30 minutes of no progress


Stuck on same error
Tried multiple solutions
No closer to solution
Error in external system


Supabase error you don't understand
Third-party library issue
Infrastructure problem
Security concern


Potential security vulnerability
Authentication issue
Data exposure risk
Performance problem


App is slow
Memory leak suspected
Database queries timing out
Design decision needed


Multiple ways to fix
Unsure which is best
Need architectural guidance

📝 ERROR HANDLING TEMPLATE
Use this template for consistent error handling:
/**
 * [OPERATION_NAME]
 * [Brief description of what this does]
 */
async function operationName(param: Type): Promise<Result> {
  try {
    // 1. Validate inputs
    if (!param) {
      throw new Error('Invalid parameter');
    }
    
    // 2. Perform operation
    const result = await performOperation(param);
    
    // 3. Validate output
    if (!result) {
      throw new Error('Operation returned no result');
    }
    
    // 4. Return success
    return result;
    
  } catch (error) {
    // 5. Log error with context
    console.error('Error in operationName:', error, {
      param,
      timestamp: new Date().toISOString()
    });
    
    // 6. Handle specific errors
    if (error instanceof SpecificError) {
      // Handle specifically
    }
    
    // 7. Throw or return error
    throw error;
  }
}


Remember: Errors are not failures. They are opportunities to make the code more robust! 🛡️
Every error caught and handled properly makes the system better! 💪

