# Team Hierarchy Feature - Frontend Integration Summary

## 🎯 Quick Overview

The backend now supports a **3-tier team hierarchy**:
- **Master Admin** → Manages everything
- **Sales Manager** → Leads a team of sales executives
- **Sales Executive** → Works on assigned leads

---

## 🚀 What Changed

### 1. **New Team Management System**
- Sales executives can be assigned to sales managers
- Sales managers can view and manage their team's leads
- Master admin controls all team assignments

### 2. **Updated Lead Assignment**
- Master can assign to managers OR executives directly
- Sales managers can redistribute leads within their team
- Sales executives work on their assigned leads

### 3. **New API Endpoints**
6 new team management endpoints + updates to existing user and lead endpoints

---

## 📋 Complete API Reference

### **TEAM MANAGEMENT ENDPOINTS**

#### 1. Assign Executives to Manager (Master Only)
```http
POST /api/teams/assign
Authorization: Bearer {master_token}
Content-Type: application/json

{
  "managerId": "uuid-of-sales-manager",
  "executiveIds": ["exec-uuid-1", "exec-uuid-2", "exec-uuid-3"]
}

Response 200:
{
  "data": {
    "message": "3 sales executive(s) assigned to John Manager",
    "executives": [...]
  }
}
```

#### 2. Remove Executive from Team (Master Only)
```http
DELETE /api/teams/unassign
Authorization: Bearer {master_token}
Content-Type: application/json

{
  "executiveId": "uuid-of-executive"
}

Response 200:
{
  "data": {
    "message": "Sales executive Alice removed from team",
    "executiveId": "uuid"
  }
}
```

#### 3. Reassign Executive to Different Manager (Master Only)
```http
PUT /api/teams/reassign
Authorization: Bearer {master_token}
Content-Type: application/json

{
  "executiveId": "uuid-of-executive",
  "newManagerId": "uuid-of-new-manager" // or null to remove
}

Response 200:
{
  "data": {
    "message": "Sales executive reassigned to new manager",
    "executive": {...}
  }
}
```

#### 4. Get Team Members for a Manager
```http
GET /api/teams/{managerId}/members
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "manager": {
      "id": "uuid",
      "fullName": "John Manager",
      "role": "sales_manager"
    },
    "teamMembers": [
      {
        "id": "uuid",
        "fullName": "Alice Executive",
        "email": "alice@example.com",
        "phone": "+1234567890",
        "role": "sales_executive",
        "employeeId": "EMP001",
        "department": "Sales",
        "designation": "Sales Executive",
        "isActive": true,
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "count": 5
  }
}
```

#### 5. Get My Team (Sales Manager Only)
```http
GET /api/teams/my-team
Authorization: Bearer {sales_manager_token}

Response 200:
{
  "data": {
    "teamMembers": [
      {
        "id": "uuid",
        "fullName": "Alice Executive",
        "email": "alice@example.com",
        "role": "sales_executive",
        "stats": {
          "totalLeads": 150,
          "activeLeads": 45,
          "convertedLeads": 12
        }
      }
    ],
    "count": 5
  }
}
```

#### 6. Get All Teams Overview (Master Only)
```http
GET /api/teams/all
Authorization: Bearer {master_token}

Response 200:
{
  "data": {
    "teams": [
      {
        "id": "uuid-manager",
        "fullName": "John Manager",
        "email": "john@example.com",
        "teamMembers": [
          {
            "id": "uuid-exec",
            "fullName": "Alice Executive",
            "email": "alice@example.com",
            "role": "sales_executive"
          }
        ],
        "stats": {
          "teamSize": 5,
          "managerLeads": 20,
          "teamLeads": 150,
          "totalLeads": 170
        }
      }
    ],
    "unassignedExecutives": [
      {
        "id": "uuid",
        "fullName": "Bob Executive",
        "email": "bob@example.com"
      }
    ],
    "totalTeams": 3,
    "totalUnassigned": 2
  }
}
```

---

### **UPDATED USER ENDPOINTS**

#### Create User (Now Supports managerId)
```http
POST /api/users
Authorization: Bearer {master_token}
Content-Type: application/json

{
  "fullName": "Alice Executive",
  "email": "alice@example.com",
  "password": "securePassword123",
  "role": "sales_executive",
  "managerId": "uuid-of-manager" // NEW FIELD (optional, only for sales_executive)
}
```

#### Update User (Now Supports managerId)
```http
PUT /api/users/{userId}
Authorization: Bearer {master_token}
Content-Type: application/json

{
  "fullName": "Alice Updated",
  "managerId": "uuid-of-new-manager" // NEW FIELD (can be updated or null)
}
```

#### List Users (Now Includes Team Info)
```http
GET /api/users
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "users": [
      {
        "id": "uuid",
        "fullName": "Alice Executive",
        "role": "sales_executive",
        "managerId": "uuid-of-manager", // NEW
        "manager": {                     // NEW
          "id": "uuid",
          "fullName": "John Manager"
        },
        "_count": {
          "teamMembers": 0               // NEW
        }
      }
    ],
    "roleCounts": {...}
  }
}
```

#### Get User by ID (Now Includes Manager & Team)
```http
GET /api/users/{userId}
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "id": "uuid",
    "fullName": "John Manager",
    "role": "sales_manager",
    "managerId": null,
    "manager": null,
    "teamMembers": [              // NEW - only for sales_manager
      {
        "id": "uuid",
        "fullName": "Alice Executive",
        "email": "alice@example.com",
        "role": "sales_executive"
      }
    ]
  }
}
```

#### List Assignable Users (Now Filtered by Team)
```http
GET /api/users/assignable
Authorization: Bearer {token}

Response 200:
{
  "data": {
    "users": [
      {
        "id": "uuid",
        "fullName": "Alice Executive",
        "role": "sales_executive",
        "managerId": "uuid-of-manager",  // NEW
        "manager": {                      // NEW
          "id": "uuid",
          "fullName": "John Manager"
        }
      }
    ]
  }
}

BEHAVIOR:
- Master: Returns all active sales managers + sales executives
- Sales Manager: Returns only themselves + their team members
- Sales Executive: Not applicable (cannot assign)
```

---

### **UPDATED LEAD ENDPOINTS**

#### List Leads (Team-Based Visibility)
```http
GET /api/leads?page=1&pageSize=20
Authorization: Bearer {token}

BEHAVIOR:
- Master: Sees ALL leads (can filter by assignedTo)
- Sales Manager: Sees leads assigned to self + team members
- Sales Executive: Sees only leads assigned to self

Query params unchanged, but filtering is automatic based on role
```

#### Get Lead by ID (Team-Based Access)
```http
GET /api/leads/{leadId}
Authorization: Bearer {token}

ACCESS CONTROL:
- Master: Can view any lead
- Sales Manager: Can view if assigned to self or team member
- Sales Executive: Can view only if assigned to self

Error 403 if no access
```

#### Update Lead (Team-Based Assignment)
```http
PUT /api/leads/{leadId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "leadStatus": "Interested",
  "assignedTo": "uuid-of-assignee",
  "comments": "Follow-up completed"
}

ACCESS CONTROL:
- Master: Can update any lead, assign to anyone
- Sales Manager: Can update team leads, assign ONLY to self or team members
- Sales Executive: Can update own leads, cannot reassign

Error 403: "Cannot assign lead to user outside your team" (for sales manager)
```

#### Bulk Assign Leads (Team-Based Assignment)
```http
POST /api/leads/bulk-assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "leadIds": ["uuid-1", "uuid-2", "uuid-3"],
  "assignedTo": "uuid-of-assignee"
}

ACCESS CONTROL:
- Master: Can assign to anyone
- Sales Manager: Can assign ONLY to self or team members

Error 403: "Cannot assign leads to user outside your team" (for sales manager)
```

---

## 🎨 Frontend UI Implementation Guide

### 1. **Team Management Page** (Master Only)

**Route**: `/teams` or `/admin/teams`

**Components Needed**:
- Team overview cards
- Unassigned executives list
- Team assignment modal
- Team details view

**API Calls**:
```javascript
// Load teams overview
const { data } = await api.get('/api/teams/all');
// data.teams - array of managers with team members
// data.unassignedExecutives - array of executives without manager

// Assign executives to manager
await api.post('/api/teams/assign', {
  managerId: selectedManagerId,
  executiveIds: selectedExecutiveIds
});

// Remove from team
await api.delete('/api/teams/unassign', {
  data: { executiveId: executiveId }
});

// Reassign to different manager
await api.put('/api/teams/reassign', {
  executiveId: executiveId,
  newManagerId: newManagerId // or null
});
```

**UI Example**:
```
┌─────────────────────────────────────────┐
│ Teams Overview                          │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ John Manager's Team                 │ │
│ │ Team Size: 5 | Total Leads: 170     │ │
│ │                                     │ │
│ │ Team Members:                       │ │
│ │ • Alice Executive (45 leads)        │ │
│ │ • Bob Executive (30 leads)          │ │
│ │ [View Details] [Manage Team]        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Unassigned Executives (2)               │
│ • Charlie Executive [Assign to Team]    │
│ • Diana Executive [Assign to Team]      │
└─────────────────────────────────────────┘
```

---

### 2. **User Management Updates**

**Create/Edit User Form**:
```javascript
// When role is 'sales_executive', show manager dropdown
const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  role: 'sales_executive',
  managerId: null // NEW FIELD
});

// Load managers for dropdown
const { data } = await api.get('/api/users?role=sales_manager&isActive=true');
const managers = data.users;

// On submit
await api.post('/api/users', {
  ...formData,
  managerId: formData.role === 'sales_executive' ? formData.managerId : null
});
```

**User List Table**:
```
┌──────────────┬──────────┬─────────────────┬───────────┐
│ Name         │ Role     │ Manager         │ Team Size │
├──────────────┼──────────┼─────────────────┼───────────┤
│ John Manager │ SM       │ -               │ 5         │
│ Alice Exec   │ SE       │ John Manager    │ -         │
│ Bob Exec     │ SE       │ John Manager    │ -         │
│ Charlie Exec │ SE       │ (Unassigned)    │ -         │
└──────────────┴──────────┴─────────────────┴───────────┘

SM = Sales Manager, SE = Sales Executive
```

---

### 3. **Lead Assignment Dropdown**

**Component Logic**:
```javascript
// Load assignable users (automatically filtered by backend)
const { data } = await api.get('/api/users/assignable');
const assignableUsers = data.users;

// For Master: Shows all managers + executives
// For Sales Manager: Shows only self + team members
// For Sales Executive: Dropdown disabled (read-only)

<Select
  options={assignableUsers.map(u => ({
    value: u.id,
    label: `${u.fullName} (${u.role === 'sales_manager' ? 'Manager' : 'Executive'})`
  }))}
  disabled={currentUser.role === 'sales_executive'}
/>
```

---

### 4. **Lead List/Dashboard**

**Sales Manager View**:
```javascript
// Add filter toggle
const [viewMode, setViewMode] = useState('all'); // 'all' | 'mine' | 'team'

// Leads are automatically filtered by backend
// Just display with assignee info
<LeadCard
  lead={lead}
  assignee={lead.assignedUser}
  isTeamLead={lead.assignedTo !== currentUser.id}
/>

// Show badge if team lead
{isTeamLead && <Badge>Team</Badge>}
```

**Lead Table Columns**:
```
┌─────────────┬────────┬──────────────┬────────────────┐
│ Lead Name   │ Status │ Assigned To  │ Last Activity  │
├─────────────┼────────┼──────────────┼────────────────┤
│ John Doe    │ Fresh  │ You          │ 2 hours ago    │
│ Jane Smith  │ Active │ Alice (Team) │ 1 day ago      │
│ Bob Johnson │ Hot    │ Bob (Team)   │ 3 hours ago    │
└─────────────┴────────┴──────────────┴────────────────┘
```

---

### 5. **Team Dashboard** (Sales Manager)

**Route**: `/dashboard/team` or `/my-team`

**API Call**:
```javascript
const { data } = await api.get('/api/teams/my-team');
const teamMembers = data.teamMembers;

// Display team performance
teamMembers.forEach(member => {
  console.log(`${member.fullName}:`, member.stats);
  // stats.totalLeads, stats.activeLeads, stats.convertedLeads
});
```

**UI Example**:
```
┌─────────────────────────────────────────┐
│ My Team Performance                     │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Alice Executive                     │ │
│ │ Total: 150 | Active: 45 | Conv: 12 │ │
│ │ ████████░░ 60% conversion rate      │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Bob Executive                       │ │
│ │ Total: 120 | Active: 30 | Conv: 8  │ │
│ │ ██████░░░░ 40% conversion rate      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔐 Access Control Summary

| Action | Master | Sales Manager | Sales Executive |
|--------|--------|---------------|-----------------|
| View all leads | ✅ | ❌ (only team) | ❌ (only own) |
| Assign to anyone | ✅ | ❌ (only team) | ❌ |
| Manage teams | ✅ | ❌ | ❌ |
| View team stats | ✅ | ✅ (own team) | ❌ |
| Assign executives to managers | ✅ | ❌ | ❌ |
| Update team leads | ✅ | ✅ | ❌ |
| Update own leads | ✅ | ✅ | ✅ |

---

## 🔄 Lead Assignment Workflows

### Workflow 1: Master → Sales Manager → Team Member
```
1. Master assigns 100 leads to Sales Manager John
   POST /api/leads/bulk-assign
   { leadIds: [...], assignedTo: "john-uuid" }

2. Sales Manager John views leads
   GET /api/leads
   (Sees all 100 leads)

3. Sales Manager John assigns 20 leads to Alice (team member)
   POST /api/leads/bulk-assign
   { leadIds: [...], assignedTo: "alice-uuid" }

4. Alice works on her 20 leads
   GET /api/leads
   (Sees only her 20 leads)

5. John can still VIEW Alice's leads (team visibility)
   GET /api/leads
   (Sees his 80 + Alice's 20 = 100 total)
```

### Workflow 2: Master → Sales Executive (Direct)
```
1. Master assigns 10 leads directly to Alice
   POST /api/leads/bulk-assign
   { leadIds: [...], assignedTo: "alice-uuid" }

2. Alice works on leads
   (No manager involvement)

3. If Alice has a manager, they can VIEW these leads
   (Team visibility still applies)
```

---

## 🧪 Testing Scenarios

### Test Case 1: Team Assignment
```javascript
// As Master
const response = await api.post('/api/teams/assign', {
  managerId: 'manager-uuid',
  executiveIds: ['exec-1', 'exec-2']
});
expect(response.status).toBe(200);
expect(response.data.data.executives).toHaveLength(2);
```

### Test Case 2: Sales Manager Lead Assignment
```javascript
// As Sales Manager
const response = await api.post('/api/leads/bulk-assign', {
  leadIds: ['lead-1', 'lead-2'],
  assignedTo: 'team-member-uuid' // Must be in team
});
expect(response.status).toBe(200);

// Try assigning outside team (should fail)
const failResponse = await api.post('/api/leads/bulk-assign', {
  leadIds: ['lead-1'],
  assignedTo: 'non-team-member-uuid'
});
expect(failResponse.status).toBe(403);
expect(failResponse.data.error).toContain('outside your team');
```

### Test Case 3: Lead Visibility
```javascript
// As Sales Manager
const response = await api.get('/api/leads');
const leads = response.data.data;

// Should see own leads + team members' leads
const assignees = [...new Set(leads.map(l => l.assignedTo))];
expect(assignees).toContain(currentUser.id); // Own leads
expect(assignees).toContain(teamMember1.id); // Team lead
```

---

## 📊 State Management Recommendations

### Redux/Zustand Store Structure
```javascript
{
  teams: {
    all: [],              // All teams (master only)
    myTeam: [],           // Current user's team (sales manager)
    unassigned: [],       // Unassigned executives
    loading: false,
    error: null
  },
  users: {
    list: [],
    assignable: [],       // Filtered by role
    current: {...}
  },
  leads: {
    list: [],             // Automatically filtered by backend
    filters: {...}
  }
}
```

### Actions
```javascript
// Team actions
fetchAllTeams()
fetchMyTeam()
assignExecutivesToManager(managerId, executiveIds)
removeExecutiveFromTeam(executiveId)
reassignExecutive(executiveId, newManagerId)

// User actions
fetchAssignableUsers() // Respects team boundaries
createUser(userData)    // Include managerId
updateUser(userId, updates)

// Lead actions
fetchLeads()            // Auto-filtered by role
assignLeads(leadIds, assignedTo) // Validates team membership
```

---

## 🚨 Error Handling

### Common Errors
```javascript
// 400 - Validation Error
{
  "error": "Only sales executives can be assigned to a manager"
}

// 403 - Permission Error
{
  "error": "Cannot assign leads to user outside your team"
}

// 404 - Not Found
{
  "error": "Manager not found"
}

// 409 - Conflict
{
  "error": "Sales executive is not assigned to any team"
}
```

### Frontend Error Handling
```javascript
try {
  await api.post('/api/teams/assign', data);
  toast.success('Team assigned successfully');
} catch (error) {
  if (error.response?.status === 403) {
    toast.error('You do not have permission for this action');
  } else if (error.response?.status === 400) {
    toast.error(error.response.data.error);
  } else {
    toast.error('An error occurred. Please try again.');
  }
}
```

---

## 📝 Migration Checklist for Frontend

- [ ] Add team management page (master only)
- [ ] Update user form to include manager dropdown
- [ ] Update user list to show manager/team info
- [ ] Filter assignable users dropdown by team
- [ ] Update lead list to show team indicators
- [ ] Add team dashboard for sales managers
- [ ] Update lead assignment to respect team boundaries
- [ ] Add error handling for team-related errors
- [ ] Test all workflows (master, manager, executive)
- [ ] Update navigation/menu for team pages
- [ ] Add team statistics to dashboards
- [ ] Test bulk operations with team constraints

---

## 🎯 Quick Start for Frontend Developers

1. **Backend is ready** - All endpoints are live after migration
2. **Start with** - Team overview page (`GET /api/teams/all`)
3. **Then update** - User management to include `managerId`
4. **Finally update** - Lead assignment dropdowns to use `/api/users/assignable`
5. **Test thoroughly** - Each role (master, manager, executive)

---

## 📞 Support

For questions or issues:
- Check `TEAMS_API_DOCUMENTATION.md` for detailed API specs
- Check `MIGRATION_GUIDE.md` for backend setup
- Contact backend team for API issues
- Test in development environment first

---

**Happy coding! 🚀**
