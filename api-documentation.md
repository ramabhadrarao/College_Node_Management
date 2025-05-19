# College Management System API Documentation

## Authentication Routes
All authentication-related endpoints for user registration, login, and password management.

### Register User
Creates a new user account.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "Pass@123"
  }'
```

### Login
Authenticates a user and returns a JWT token.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'
```

### Get Current User Profile
Returns the profile of the currently logged-in user.

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Logout
Logs out the current user.

```bash
curl -X GET http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Forgot Password
Initiates the password reset process by sending a reset token to the user's email.

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com"
  }'
```

### Reset Password
Resets a user's password using a reset token.

```bash
curl -X PATCH http://localhost:3000/api/auth/reset-password/RESET_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPass@123",
    "passwordConfirm": "NewPass@123"
  }'
```

### Update Password
Updates the password for the currently logged-in user.

```bash
curl -X PATCH http://localhost:3000/api/auth/update-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Admin@123",
    "newPassword": "NewPass@123",
    "passwordConfirm": "NewPass@123"
  }'
```

### Verify Email
Verifies a user's email address using a verification token.

```bash
curl -X GET http://localhost:3000/api/auth/verify-email/VERIFICATION_TOKEN
```

## Faculty Routes
Endpoints for managing faculty members and their information.

### Register Faculty
Registers a new faculty member.

```bash
curl -X POST http://localhost:3000/api/faculty/register \
  -H "Content-Type: multipart/form-data" \
  -F "regdno=F00123" \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "email=faculty@example.com" \
  -F "contactNo=9876543210" \
  -F "gender=Male" \
  -F "department=DEPARTMENT_ID" \
  -F "designation=Assistant Professor" \
  -F "joinDate=2023-01-15" \
  -F "photo=@/path/to/photo.jpg" \
  -F "aadhar=@/path/to/aadhar.pdf" \
  -F "pan=@/path/to/pan.pdf"
```

### Get All Faculty
Returns a list of all faculty members.

```bash
curl -X GET http://localhost:3000/api/faculty \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Faculty By ID
Returns details of a specific faculty member.

```bash
curl -X GET http://localhost:3000/api/faculty/FACULTY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Faculty Profile
Updates a faculty member's profile information.

```bash
curl -X PATCH http://localhost:3000/api/faculty/FACULTY_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "firstName=John" \
  -F "lastName=Smith" \
  -F "contactNo=9876543210" \
  -F "qualification=Ph.D" \
  -F "specialization=Machine Learning"
```

### Change Faculty Status
Updates the status of a faculty member (active, inactive, etc.).

```bash
curl -X PATCH http://localhost:3000/api/faculty/FACULTY_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "reason": "Faculty member has joined"
  }'
```

### Toggle Edit Status
Enables or disables profile editing for a faculty member.

```bash
curl -X PATCH http://localhost:3000/api/faculty/FACULTY_ID/toggle-edit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Academic Information
Adds academic information to a faculty profile (qualifications, publications, etc.).

```bash
curl -X POST http://localhost:3000/api/faculty/FACULTY_ID/academics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "infoType=qualification" \
  -F "degree=Ph.D" \
  -F "specialization=Computer Science" \
  -F "institution=Example University" \
  -F "passingYear=2020" \
  -F "attachment=@/path/to/certificate.pdf"
```

### Get Academic Information
Returns academic information for a faculty member.

```bash
curl -X GET http://localhost:3000/api/faculty/FACULTY_ID/academics/qualifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Faculty Statistics
Returns statistical information about faculty members.

```bash
curl -X GET http://localhost:3000/api/faculty/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Student Routes
Endpoints for managing students and their information.

### Register Student
Registers a new student.

```bash
curl -X POST http://localhost:3000/api/students/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "admissionNo=S00123" \
  -F "name=Jane Doe" \
  -F "email=student@example.com" \
  -F "mobile=9876543210" \
  -F "gender=Female" \
  -F "dob=2000-05-15" \
  -F "batch=BATCH_ID" \
  -F "program=PROGRAM_ID" \
  -F "branch=BRANCH_ID" \
  -F "regulation=REGULATION_ID" \
  -F "studentType=Day Scholar" \
  -F "photo=@/path/to/photo.jpg"
```

### Bulk Register Students
Registers multiple students from a CSV/Excel file.

```bash
curl -X POST http://localhost:3000/api/students/register-bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/students.csv"
```

### Get All Students
Returns a list of all students.

```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Student By ID
Returns details of a specific student.

```bash
curl -X GET http://localhost:3000/api/students/STUDENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Student Profile
Updates a student's profile information.

```bash
curl -X PATCH http://localhost:3000/api/students/STUDENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "name=Jane Smith" \
  -F "mobile=9876543210" \
  -F "address=123 Main St, City"
```

### Change Student Status
Updates the status of a student (active, inactive, graduated, etc.).

```bash
curl -X PATCH http://localhost:3000/api/students/STUDENT_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "graduated",
    "reason": "Completed all requirements"
  }'
```

### Get Student Statistics
Returns statistical information about students.

```bash
curl -X GET http://localhost:3000/api/students/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Admin Routes
Admin-specific endpoints for system management.

### List Backups
Lists all database backups.

```bash
curl -X GET http://localhost:3000/api/admin/backups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Backup
Creates a new database backup.

```bash
curl -X POST http://localhost:3000/api/admin/backups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Restore Backup
Restores the database from a backup.

```bash
curl -X POST http://localhost:3000/api/admin/backups/BACKUP_FILENAME/restore \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete Backup
Deletes a database backup.

```bash
curl -X DELETE http://localhost:3000/api/admin/backups/BACKUP_FILENAME \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get System Settings
Returns system settings.

```bash
curl -X GET http://localhost:3000/api/admin/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update System Setting
Updates a system setting.

```bash
curl -X PUT http://localhost:3000/api/admin/settings/SETTING_KEY \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "setting_value": "New Value"
  }'
```

### Get Notification Templates
Returns notification templates.

```bash
curl -X GET http://localhost:3000/api/admin/notifications/templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Notification Template
Creates a new notification template.

```bash
curl -X POST http://localhost:3000/api/admin/notifications/templates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "New Template",
    "templateCode": "NEW_TEMPLATE",
    "subject": "Subject Line",
    "body": "Template body with {{variable}} placeholders"
  }'
```

### Update Notification Template
Updates a notification template.

```bash
curl -X PUT http://localhost:3000/api/admin/notifications/templates/TEMPLATE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "Updated Template",
    "subject": "Updated Subject Line",
    "body": "Updated template body"
  }'
```

### Delete Notification Template
Deletes a notification template.

```bash
curl -X DELETE http://localhost:3000/api/admin/notifications/templates/TEMPLATE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Send Bulk Notification
Sends a notification to multiple users.

```bash
curl -X POST http://localhost:3000/api/admin/notifications/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Announcement",
    "message": "This is an important announcement for all users",
    "targetType": "all",
    "sendEmail": true
  }'
```

## Notification Routes
User notification management endpoints.

### Get User Notifications
Returns notifications for the current user.

```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mark Notifications as Read
Marks specific notifications as read.

```bash
curl -X PATCH http://localhost:3000/api/notifications/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationIds": ["NOTIFICATION_ID_1", "NOTIFICATION_ID_2"]
  }'
```

### Mark All Notifications as Read
Marks all notifications for the current user as read.

```bash
curl -X PATCH http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete Notifications
Deletes specific notifications.

```bash
curl -X DELETE http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notificationIds": ["NOTIFICATION_ID_1", "NOTIFICATION_ID_2"]
  }'
```

### Get Unread Notifications Count
Returns the count of unread notifications for the current user.

```bash
curl -X GET http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Health Check
System health check endpoint.

### Health Check
Returns the current status of the server.

```bash
curl -X GET http://localhost:3000/health
```
