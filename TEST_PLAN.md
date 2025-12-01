# Test Plan for Laundry App

## Document Information
- **Date Created:** November 29, 2025
- **Project:** UWI Laundry App
- **Version:** 1.0

---

## Feature ID: 01 - Scheduling Appointments

**Team Owner:** Renardo Pine  
**Priority:** High  
**User Requirement:** The system shall allow the user to reserve a timeslot for washing and/or drying

### Acceptance Criteria
The appointment data should be visible in the User's reserved appointments after being saved and should persist even after the application is closed.

### Acceptance Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: Book a valid appointment with correct user credentials and timeslot | User: "person1", Service: "wash", Loads: 2, Time: "10:00 AM", Hall: "Chancellor Hall" | Acceptance Criteria | Appointment appears in user's reserved appointments and persists after app restart | | | |
| Case 2: Attempt to book appointment with invalid/unavailable timeslot | User: "person1", Service: "wash", Time: "10:00 AM" (all machines occupied) | Sys Req #1 | Booking denied, user shown "No machines available" message | | | |
| Case 3: View occupied and free times for upcoming days | User: "person1", Hall: "Chancellor Hall", Date: Next 7 days | Sys Req #1 | System displays all available and occupied slots for 7 days | | | |
| Case 4: Cancel an existing appointment | User: "person1", Existing Appointment ID: 1 | Sys Req #2 | Appointment removed from user's list, timeslot becomes available | | | |
| Case 5: Input number of loads for wash/dry | User: "person1", Loads: 3, Service: "wash_dry" | Sys Req #3 | System accepts load count and calculates correct duration (105 mins) and cost ($750) | | | |

### Integration Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: AppointmentRepository creates and retrieves appointment from database | userId: 1, hallId: 1, machineId: 1, datetime: "2025-12-01T10:00:00" | Acceptance Criteria | Appointment persisted to DB and retrieved with hall name join | | | |
| Case 2: SlotValidator checks machine availability against existing appointments | Hall: 1, Time: 10:00, Required Machines: 3, Existing overlapping: 2 | Sys Req #1 | Returns available (5 - 2 = 3 free >= 3 required) | | | |
| Case 3: MachineAssigner assigns N machines for N loads | Loads: 3, Available machines: 5, Busy machines: [1, 2] | Sys Req #3 | Assigns machines 3, 4, 5 to the 3 loads | | | |
| Case 4: Booking wash_dry service checks both washer and dryer availability | Loads: 2, Time: 10:00, Washers available: 3, Dryers available: 2 | Sys Req #1 | Booking succeeds (2 washers at 10:00, 2 dryers at 10:45) | | | |
| Case 5: Delete appointment updates database and frees machine | Appointment ID: 1 | Sys Req #2 | Appointment removed from DB, machine available for re-booking | | | |

### Unit Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: getServiceDetailsSync returns correct wash details | serviceType: "wash", washPrice: 100, dryPrice: 150, washDuration: 45, dryDuration: 60 | Sys Req #3 | {label: "Wash Only", price: 100, duration: 45} | | | |
| Case 2: getServiceDetailsSync returns correct wash_dry (pipelined) details | serviceType: "wash_dry", washPrice: 100, dryPrice: 150 | Sys Req #3 | {label: "Wash & Dry", price: 250, duration: 105} | | | |
| Case 3: generateNext7Days generates correct consecutive dates | startDate: "2025-12-01" | Sys Req #1 | Array of 7 dates: Dec 1-7, 2025 | | | |
| Case 4: formatCurrency formats number as JMD currency | amount: 1000 | UI display | String contains "1,000" | | | |
| Case 5: Overlap detection identifies conflicting appointments | ApptA: 10:00-10:45, ApptB: 10:30-11:30 | Sys Req #1 | Overlaps = true | | | |
| Case 6: Adjacent appointments (no gap) do not overlap | ApptA: 10:00-10:45, ApptB: 10:45-11:30 | Sys Req #1 | Overlaps = false | | | |
| Case 7: N loads wash_dry creates 2N machine reservations | loadCount: 3 | Sys Req #3 | expectedReservations = 6 (3 wash + 3 dry) | | | |
| Case 8: Slot unavailable when free machines < required | Total: 5, Occupied: 3, Required: 3 | Sys Req #1 | freeMachines = 2, isAvailable = false | | | |

---

## Feature ID: 03 - Pay for Washing/Drying

**Team Owner:** Renardo Pine  
**Priority:** High  
**User Requirement:** The system shall allow the user to use card payments and be directed to a payment gateway to securely pay.

### Acceptance Criteria
The system should withdraw funds of the desired amount from the user's account and initiate a transfer to the hall's account.

### Acceptance Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: User with sufficient wallet balance completes payment for appointment | User: "person1", walletBalance: 500, appointmentCost: 300 | Acceptance Criteria | Funds withdrawn from user account, payment recorded as "succeeded", new balance = 200 | | | |
| Case 2: User with insufficient wallet balance cannot complete payment | User: "person1", walletBalance: 100, appointmentCost: 300 | Acceptance Criteria | Payment rejected, error "Insufficient credits" shown, balance unchanged | | | |
| Case 3: User tops up wallet via payment gateway (card payment) | User: "person1", topUpAmount: 500, stripePaymentId: "pi_xxx" | Sys Req #2 | User directed to Stripe, payment processed, wallet balance increased by 500 | | | |
| Case 4: System calculates correct cost for wash service at selected hall | Hall: "Chancellor Hall", washerPrice: 100, loads: 3, service: "wash" | Sys Req #1 | Total cost calculated as $300 (100 × 3) | | | |
| Case 5: System calculates correct cost for wash_dry service | Hall: "Chancellor Hall", washerPrice: 100, dryerPrice: 150, loads: 2, service: "wash_dry" | Sys Req #1 | Total cost calculated as $500 ((100 + 150) × 2) | | | |
| Case 6: Payment status visible to user after booking | User: "person1", Appointment with payment status: "succeeded" | Sys Req #3 | Payment status displayed as "Paid" in appointment details | | | |

### Integration Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: PaymentRepository.deductCredits updates user wallet in database | userId: 1, amount: 300, currentBalance: 500 | Acceptance Criteria | User wallet updated to 200, payment record created with status "succeeded" | | | |
| Case 2: PaymentRepository.addCredits increases wallet balance | userId: 1, amount: 500, stripePaymentId: "pi_xxx" | Sys Req #2 | Wallet increased by 500, payment record created | | | |
| Case 3: PaymentRepository.validateBookingCredits checks balance before booking | userId: 1, currentBalance: 200, appointmentCost: 300 | Sys Req #1 | Returns {canBook: false, currentBalance: 200, shortfall: 100} | | | |
| Case 4: Payment transaction recorded with correct appointmentId | userId: 1, appointmentId: 5, amount: 300 | Acceptance Criteria | Payment record includes stripePaymentId: "appointment_5" | | | |
| Case 5: Booking flow integrates with payment validation | userId: 1, balance: 500, appointmentCost: 300 | Sys Req #1, #3 | Booking proceeds only after payment validation passes | | | |

### Unit Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: getUserBalance returns correct parsed balance | DB row: {walletBalance: "500.00"} | Sys Req #1 | Returns number 500 | | | |
| Case 2: getUserBalance returns 0 for null wallet balance | DB row: {walletBalance: null} | Sys Req #1 | Returns 0 | | | |
| Case 3: hasEnoughCredits returns true when balance >= amount | balance: 500, amount: 300 | Sys Req #1 | Returns true | | | |
| Case 4: hasEnoughCredits returns false when balance < amount | balance: 200, amount: 300 | Sys Req #1 | Returns false | | | |
| Case 5: deductCredits throws error for insufficient funds | balance: 100, amount: 300 | Acceptance Criteria | Throws "Insufficient credits" error | | | |
| Case 6: formatCurrency displays wallet balance correctly | amount: 1250.50 | UI display | Returns "$1,250.50" formatted string | | | |
| Case 7: Cost calculation for multiple loads is correct | price: 100, loads: 3 | Sys Req #1 | totalCost = 300 | | | |
| Case 8: Payment status enum values are valid | status: "succeeded" | Sys Req #3 | Status is one of: "pending", "succeeded", "failed" | | | |

---

## Feature ID: 05 - Send Reminders Regarding Upcoming Appointments

**Team Owner:** Reynear Douglas  
**Priority:** High  
**User Requirement:** The system shall allow the user to receive automated reminders for upcoming appointments via their desktop notifications

### Acceptance Criteria
- The user receives all reminders at the configured times without delay longer than 30 seconds 97% of the time.
- Reminders are delivered via the user's selected communication method.
- Changes to reminder preferences take effect within 1 minute of update.

### Acceptance Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: User receives reminder at configured time before appointment | User settings: reminderMins: 15, Appointment at 10:00 AM | AC: Reminders within 30s delay | Notification received at 9:45 AM (±30 seconds) | | | |
| Case 2: User receives reminder via selected communication method (desktop notification) | enabled: true, appointmentReminderMins: 15 | AC: Delivered via user's method | Desktop notification displayed | | | |
| Case 3: Changes to reminder preferences take effect immediately | Change reminderMins from 15 to 30 | AC: Changes effective within 1 minute | Next reminder check uses 30 minute window | | | |
| Case 4: User with notifications disabled receives no reminders | enabled: false, Appointment in 10 mins | AC: User preferences respected | No notification sent | | | |

### Integration Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: API returns upcoming appointments within reminder window | userId: 1, reminderMins: 15, Appointment in 10 mins | Sys Req #1 | API returns appointment with minutesUntil = 10 | | | |
| Case 2: API returns empty array when no appointments in window | userId: 1, reminderMins: 15, Next appointment in 2 hours | Sys Req #1 | API returns empty array | | | |
| Case 3: Settings persist across page reloads (localStorage) | Set enabled: true, reminderMins: 30 | Sys Req #1 | Settings retrieved correctly after reload | | | |
| Case 4: Notification handler polls API every 30 seconds | enabled: true, polling active | Sys Req #1 | API called at 30-second intervals | | | |

### Unit Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: Default notification settings are correct | None (default) | Sys Req #1 | {enabled: true, appointmentReminderMins: 15} | | | |
| Case 2: Valid reminder options (5, 15, 30, 60 mins) | options: [5, 15, 30, 60] | Sys Req #1 | All values > 0 and ≤ 60 | | | |
| Case 3: Duplicate prevention using Set | Notify appointment 1 twice | Sys Req #1 | Second notification blocked | | | |
| Case 4: minutesUntil calculation is accurate | appointmentTime: now + 10 mins | Sys Req #1 | minutesUntil = 10 | | | |
| Case 5: updateSettings merges with existing settings | current: {enabled: true}, update: {reminderMins: 30} | Sys Req #1 | Result: {enabled: true, appointmentReminderMins: 30} | | | |

---

## Feature ID: 06 - Post Notices to a Message Wall

**Team Owner:** Keona Perry  
**Priority:** Medium  
**User Requirement:** This system shall allow workers in the laundromat to post notices to all users

### Acceptance Criteria
- Messages appear on the message wall at least 15 seconds after being posted 99% of the time.
- Only authorized users are able to post, edit and delete messages.

### Acceptance Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: Staff posts a notice and it appears within 15 seconds | Staff user, title: "Maintenance", content: "Laundromat closed tomorrow" | AC: Message appears within 15s | Notice visible on message wall within 15 seconds | | | |
| Case 2: Non-authorized user cannot post notices | Client user (role: "student") attempts POST /notices | AC: Only authorized users can post | 403 Forbidden error returned | | | |
| Case 3: Staff can edit their hall's notices | Staff user (hallId: 1), notice hallId: 1 | AC: Authorized users can edit | Edit form displayed, changes saved | | | |
| Case 4: Staff cannot edit notices from other halls | Staff user (hallId: 1), notice hallId: 2 | AC: Only authorized users can edit | 403 Forbidden error | | | |
| Case 5: Staff can delete their hall's notices | Staff user (hallId: 1), notice hallId: 1 | AC: Authorized users can delete | Notice removed from wall | | | |

### Integration Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: POST /notices creates notice in database with timestamp | Staff: hallId 1, title: "New Notice", content: "Content" | Sys Req #3 | Notice created with publishedAt timestamp | | | |
| Case 2: GET /notices retrieves only notices for staff's hall | Staff hallId: 1, Notices: [hall 1, hall 2] | Sys Req #1 | Only hall 1 notices returned | | | |
| Case 3: PUT /notices/:id updates notice content | noticeId: 1, newTitle: "Updated Title" | Sys Req #2 | Notice updated in database | | | |
| Case 4: DELETE /notices/:id removes notice from database | noticeId: 1 | Sys Req #2 | Notice deleted | | | |
| Case 5: NoticeRepository filters expired notices | Notice with expiresAt in past | Sys Req #3 | Expired notice not returned | | | |

### Unit Tests

| Test Case | Test Data | Associated Requirement | Expected Result | Actual Result | Pass/Fail | Comment |
|-----------|-----------|------------------------|-----------------|---------------|-----------|---------|
| Case 1: mapToNotice correctly maps DB result to Notice type | DB row with authorFirstName, authorLastName, hallName | Sys Req #3 | Notice object with authorName joined | | | |
| Case 2: Priority "urgent" maps to type "alert" | formData priority: "urgent" | Sys Req #1 | Notice created with type: "alert" | | | |
| Case 3: Priority "info" maps to type "info" | formData priority: "info" | Sys Req #1 | Notice created with type: "info" | | | |
| Case 4: Hall authorization check validates hallId match | Staff hallId: 1, Notice hallId: 2 | AC: Authorization | isAuthorized = false | | | |
| Case 5: Date/time displayed for each message | Notice with publishedAt: "2025-11-29T10:00:00" | Sys Req #3 | publishedAt formatted and displayed | | | |

---

## Test Summary

| Feature | Acceptance Tests | Integration Tests | Unit Tests | Total |
|---------|------------------|-------------------|------------|-------|
| 01 - Scheduling Appointments | 5 | 5 | 8 | 18 |
| 03 - Pay for Washing/Drying | 6 | 5 | 8 | 19 |
| 05 - Send Reminders | 4 | 4 | 5 | 13 |
| 06 - Post Notices | 5 | 5 | 5 | 15 |
| **Total** | **20** | **19** | **26** | **65** |

---

## Test Guidelines

### Valid Data vs Invalid Data Testing
Each feature section includes:
1. **At least ONE valid data test case** - Demonstrates the system works correctly with proper input (e.g., Case 1 in each Acceptance Tests section)
2. **At least ONE invalid data test case** - Demonstrates proper error handling (e.g., Case 2 in Payment - insufficient funds, Case 2 in Notices - unauthorized user)

### Test Hierarchy
- **Unit Tests**: Test individual functions in isolation (e.g., `getUserBalance`, `formatCurrency`, `hasEnoughCredits`)
- **Integration Tests**: Test component interactions with database/API (e.g., Repository operations, API endpoints)
- **Acceptance Tests**: End-to-end validation of user requirements and acceptance criteria

### Traceability
All test cases are mapped to:
- System Requirements (Sys Req #1, #2, #3)
- Acceptance Criteria (AC)
- User Requirements

---

## Appendix: Database Schema Reference

### Payments Table
```sql
payments (
  id: serial PRIMARY KEY,
  userId: integer NOT NULL,
  amount: decimal(10, 2) NOT NULL,
  currency: varchar(3) DEFAULT 'USD',
  status: payment_status DEFAULT 'pending',  -- 'pending' | 'succeeded' | 'failed'
  stripePaymentId: varchar(255),
  createdAt: timestamp DEFAULT NOW()
)
```

### Users Wallet
```sql
users.walletBalance: decimal(10, 2) DEFAULT '0'
```

### Hall Pricing
```sql
halls.washerPrice: decimal(10, 2)
halls.dryerPrice: decimal(10, 2)
```
