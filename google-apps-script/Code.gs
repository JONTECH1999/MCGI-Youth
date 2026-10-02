/**
 * ============================================================================
 * MCGI YOUTH MEMBERSHIP, ATTENDANCE & REPORTING SYSTEM
 * Google Apps Script API & Database Backend
 * Version 1.0.0
 * 
 * ARCHITECTURE:
 * React Application <---> Google Apps Script Web App <---> Google Sheets
 * 
 * INSTRUCTIONS TO DEPLOY:
 * 1. Open your Google Spreadsheet (or create a new one: sheets.new).
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any existing code and paste this entire file (Code.gs).
 * 4. Run `initializeSpreadsheetStructure()` once from the Apps Script toolbar.
 *    (Authorize the script when prompted by Google).
 * 5. Click "Deploy" (top right) -> "New deployment".
 * 6. Click the gear icon -> Select "Web app".
 * 7. Set:
 *    - Description: MCGI Youth API
 *    - Execute as: Me (<your email>)
 *    - Who has access: Anyone (required so the frontend can communicate with it)
 * 8. Click "Deploy" and copy the "Web app URL" (ends in /exec).
 * 9. Paste the Web App URL into the React Web App under Settings -> Google Sheets!
 * ============================================================================
 */

// Global Sheet Tab Names
var SHEETS = {
  MEMBERS: 'MEMBERS',
  ATTENDANCE_EVENTS: 'ATTENDANCE_EVENTS',
  EVENT_SCHEDULES: 'EVENT_SCHEDULES',
  ATTENDANCE_RECORDS: 'ATTENDANCE_RECORDS',
  COMMITTEES: 'COMMITTEES',
  DEMOGRAPHICS: 'DEMOGRAPHICS',
  MEMBERSHIP_STATISTICS: 'MEMBERSHIP_STATISTICS',
  ATTENDANCE_STATISTICS: 'ATTENDANCE_STATISTICS',
  REPORTS: 'REPORTS',
  SETTINGS: 'SETTINGS',
  ACTIVITY_LOG: 'ACTIVITY_LOG',
  MEMBER_STATUS_HISTORY: 'MEMBER_STATUS_HISTORY',
  ANNOUNCEMENTS: 'ANNOUNCEMENTS',
  LANDING_PAGE: 'LANDING_PAGE',
  OFFICIAL_SUMMARY: 'OFFICIAL_SUMMARY'
};

/**
 * Handle GET Requests
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  
  try {
    var result;
    switch (action) {
      case 'ping':
        result = handlePing();
        break;
      case 'getAllData':
        result = handleGetAllData();
        break;
      case 'getMembers':
        result = getSheetDataAsJson(SHEETS.MEMBERS);
        break;
      case 'getEvents':
        result = getSheetDataAsJson(SHEETS.ATTENDANCE_EVENTS);
        break;
      case 'getSchedules':
        result = getSheetDataAsJson(SHEETS.EVENT_SCHEDULES);
        break;
      case 'getAttendance':
        result = getSheetDataAsJson(SHEETS.ATTENDANCE_RECORDS);
        break;
      case 'getSettings':
        result = getSheetDataAsJson(SHEETS.SETTINGS);
        break;
      case 'getLogs':
        result = getSheetDataAsJson(SHEETS.ACTIVITY_LOG);
        break;
      case 'getAnnouncements':
        result = getSheetDataAsJson(SHEETS.ANNOUNCEMENTS);
        break;
      case 'getLandingPage':
        result = getSheetDataAsJson(SHEETS.LANDING_PAGE);
        break;
      default:
        result = { success: false, message: 'Unknown GET action: ' + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString(), stack: err.stack });
  }
}

/**
 * Handle POST Requests
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, message: 'No payload received' });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    var result;

    switch (action) {
      case 'initSpreadsheet':
        initializeSpreadsheetStructure();
        result = { success: true, message: 'Spreadsheet structure initialized successfully' };
        break;

      case 'saveMember':
        result = saveOrUpdateMember(data);
        break;

      case 'deleteMember':
        result = deleteMemberRecord(data);
        break;

      case 'saveEvent':
        result = saveOrUpdateEvent(data);
        break;

      case 'deleteEvent':
        result = deleteEventRecord(data);
        break;

      case 'saveSchedule':
        result = saveOrUpdateSchedule(data);
        break;

      case 'deleteSchedule':
        result = deleteScheduleRecord(data);
        break;

      case 'saveAttendanceBatch':
        result = saveAttendanceBatch(data);
        break;

      case 'saveAnnouncement':
        result = handleSaveAnnouncement(data);
        break;

      case 'deleteAnnouncement':
        result = handleDeleteAnnouncement(data);
        break;

      case 'saveLandingPageConfig':
        result = handleSaveLandingPageConfig(data);
        break;

      case 'saveSettings':
        result = saveSettings(data);
        break;

      case 'logActivity':
        result = recordActivityLog(data);
        break;

      case 'saveReportSnapshot':
        result = saveReportSnapshot(data);
        break;

      case 'saveOfficialSummary':
        result = saveOfficialSummary(data);
        break;

      case 'pushAllData':
        result = handlePushAllData(data);
        break;

      default:
        result = { success: false, message: 'Unknown POST action: ' + action };
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString(), stack: err.stack });
  }
}

/**
 * Response Formatter
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ping / Test Connection
 */
function handlePing() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    success: true,
    message: 'MCGI Youth API Connected',
    spreadsheetTitle: ss.getName(),
    spreadsheetId: ss.getId(),
    timestamp: new Date().toISOString(),
    sheetsFound: ss.getSheets().map(function(s) { return s.getName(); })
  };
}

/**
 * Get all essential dataset in one call for high performance
 */
function handleGetAllData() {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      members: getSheetDataAsJson(SHEETS.MEMBERS).data || [],
      events: getSheetDataAsJson(SHEETS.ATTENDANCE_EVENTS).data || [],
      schedules: getSheetDataAsJson(SHEETS.EVENT_SCHEDULES).data || [],
      attendance: getSheetDataAsJson(SHEETS.ATTENDANCE_RECORDS).data || [],
      settings: getSheetDataAsJson(SHEETS.SETTINGS).data || [],
      activityLogs: getSheetDataAsJson(SHEETS.ACTIVITY_LOG).data || [],
      statusHistory: getSheetDataAsJson(SHEETS.MEMBER_STATUS_HISTORY).data || [],
      reports: getSheetDataAsJson(SHEETS.REPORTS).data || []
    }
  };
}

/**
 * Read any sheet and transform to JSON objects
 */
function getSheetDataAsJson(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return { success: false, message: 'Sheet not found: ' + sheetName, data: [] };
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, data: [] };
  }

  var headers = data[0].map(function(h) {
    // Camelcase header for standard JSON
    return toCamelCase(String(h).trim());
  });

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    var hasContent = false;
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      obj[headers[j]] = val;
      if (val !== '' && val !== null && val !== undefined) {
        hasContent = true;
      }
    }
    if (hasContent) {
      // Parse arrays if stored as comma-separated (e.g. committees)
      if (obj.committees && typeof obj.committees === 'string') {
        obj.committees = obj.committees.split(',').map(function(c) { return c.trim(); }).filter(Boolean);
      }
      rows.push(obj);
    }
  }

  return { success: true, data: rows };
}

/**
 * Save or Update Member
 */
function saveOrUpdateMember(member) {
  if (!member.memberId || !member.firstName) {
    return { success: false, message: 'Validation error: Member ID and First Name are required.' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(SHEETS.MEMBERS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return toCamelCase(String(h).trim()); });

  var idColIdx = headers.indexOf('memberId');
  if (idColIdx === -1) idColIdx = 0;

  var rowIndex = -1;
  var oldStatus = '';

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(member.memberId)) {
      rowIndex = i + 1; // 1-indexed row
      var statusCol = headers.indexOf('membershipStatus');
      if (statusCol !== -1) oldStatus = String(data[i][statusCol]);
      break;
    }
  }

  var now = new Date().toISOString();
  member.updatedAt = now;
  if (!member.createdAt) member.createdAt = now;

  // Format committees array as comma-separated
  var committeesStr = Array.isArray(member.committees) ? member.committees.join(', ') : (member.committees || '');

  var rowValues = [
    member.memberId,
    member.firstName,
    member.middleName || '',
    member.lastName || '',
    member.fullName || (member.firstName + (member.middleName ? ' ' + member.middleName : '') + (member.lastName ? ' ' + member.lastName : '')),
    member.birthday || '',
    member.age || '',
    member.gender || 'Male',
    member.contactNumber || '',
    member.email || '',
    member.address || '',
    member.membershipStatus || 'Active',
    member.memberCategory || 'Senior',
    member.studentStatus || 'Non-Student',
    member.employmentStatus || 'Unemployed',
    member.registeredVoter ? 'TRUE' : 'FALSE',
    member.workingStudent ? 'TRUE' : 'FALSE',
    member.outOfSchoolYouth ? 'TRUE' : 'FALSE',
    member.parentBaptismStatus || 'Unbaptized Parent/s',
    committeesStr,
    member.dateRegistered || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    member.lastAttendanceDate || '',
    member.attendanceCount || 0,
    member.attendancePercentage || 0,
    member.activityStatus || 'Active',
    member.activityReason || '',
    member.notes || '',
    member.createdAt,
    member.updatedAt
  ];

  if (rowIndex > 0) {
    // Update existing member
    sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    
    // Check if status changed
    if (oldStatus && oldStatus !== member.membershipStatus) {
      logStatusHistory(member.memberId, oldStatus, member.membershipStatus, member.notes || 'Status changed by Admin', 'System');
    }
  } else {
    // Append new member
    sheet.appendRow(rowValues);
    logStatusHistory(member.memberId, 'NEW', member.membershipStatus || 'Active', 'Member registered', 'System');
  }

  return { success: true, message: 'Member saved successfully.', data: member };
}

/**
 * Archive / Delete Member (Safe Archive preferred)
 */
function deleteMemberRecord(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.MEMBERS);
  if (!sheet) return { success: false, message: 'Members sheet not found.' };

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.memberId)) {
      if (data.hardDelete) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Member deleted permanently.' };
      } else {
        // Archive by setting status to Inactive
        sheet.getRange(i + 1, 12).setValue('Inactive');
        sheet.getRange(i + 1, 29).setValue(new Date().toISOString());
        logStatusHistory(data.memberId, String(rows[i][11]), 'Inactive', 'Archived by administrator', 'Admin');
        return { success: true, message: 'Member archived as Inactive to protect attendance history.' };
      }
    }
  }
  return { success: false, message: 'Member not found.' };
}

/**
 * Save Attendance Batch (High Performance & Duplicate Protection)
 */
function saveAttendanceBatch(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { success: false, message: 'No attendance records provided.' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(SHEETS.ATTENDANCE_RECORDS);
  var memberSheet = ss.getSheetByName(SHEETS.MEMBERS);

  var existingData = sheet.getDataRange().getValues();
  var existingMap = {}; // Key: memberId + '_' + scheduleId -> row index
  for (var i = 1; i < existingData.length; i++) {
    var mId = String(existingData[i][3]);
    var sId = String(existingData[i][2]);
    existingMap[mId + '_' + sId] = i + 1;
  }

  var now = new Date().toISOString();
  var newRows = [];
  var updatedCount = 0;
  var createdCount = 0;

  for (var r = 0; r < records.length; r++) {
    var rec = records[r];
    var key = rec.memberId + '_' + rec.scheduleId;

    var rowVals = [
      rec.attendanceId || ('ATT-' + Utilities.getUuid().substring(0, 8)),
      rec.eventId,
      rec.scheduleId,
      rec.memberId,
      rec.memberName,
      rec.eventName,
      rec.eventDate,
      rec.schedule,
      rec.attendanceStatus,
      rec.recordedBy || 'Officer',
      rec.recordedAt || now,
      now,
      rec.notes || ''
    ];

    if (existingMap[key]) {
      // Overwrite/update existing attendance record
      var existingRow = existingMap[key];
      sheet.getRange(existingRow, 1, 1, rowVals.length).setValues([rowVals]);
      updatedCount++;
    } else {
      newRows.push(rowVals);
      createdCount++;
    }
  }

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  return {
    success: true,
    message: 'Attendance saved: ' + createdCount + ' recorded, ' + updatedCount + ' updated.',
    createdCount: createdCount,
    updatedCount: updatedCount
  };
}

/**
 * Save or Update Event
 */
function saveOrUpdateEvent(event) {
  var sheet = getOrCreateSheet(SHEETS.ATTENDANCE_EVENTS);
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(event.eventId)) {
      rowIndex = i + 1;
      break;
    }
  }

  var now = new Date().toISOString();
  var row = [
    event.eventId || ('EVT-' + Utilities.getUuid().substring(0, 8)),
    event.eventName,
    event.eventType,
    event.startDate,
    event.endDate,
    event.location || '',
    event.description || '',
    event.attendanceRule || 'Default',
    event.status || 'Upcoming',
    event.createdBy || 'Admin',
    event.createdAt || now,
    now
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return { success: true, message: 'Event saved successfully.', data: event };
}

/**
 * Save or Update Schedule
 */
function saveOrUpdateSchedule(sched) {
  var sheet = getOrCreateSheet(SHEETS.EVENT_SCHEDULES);
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(sched.scheduleId)) {
      rowIndex = i + 1;
      break;
    }
  }

  var now = new Date().toISOString();
  var row = [
    sched.scheduleId || ('SCH-' + Utilities.getUuid().substring(0, 8)),
    sched.eventId,
    sched.date,
    sched.startTime,
    sched.endTime || '',
    sched.scheduleLabel,
    sched.location || '',
    sched.status || 'Active',
    sched.createdAt || now,
    now
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return { success: true, message: 'Schedule saved successfully.', data: sched };
}

/**
 * Delete Schedule
 */
function deleteScheduleRecord(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.EVENT_SCHEDULES);
  if (!sheet) return { success: false, message: 'Sheet not found.' };

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.scheduleId)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Schedule deleted.' };
    }
  }
  return { success: false, message: 'Schedule not found.' };
}

/**
 * Delete Event & associated schedules
 */
function deleteEventRecord(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.ATTENDANCE_EVENTS);
  if (!sheet) return { success: false, message: 'Sheet not found.' };

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.eventId)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Event deleted.' };
    }
  }
  return { success: false, message: 'Event not found.' };
}

/**
 * Log Member Status Change History
 */
function logStatusHistory(memberId, prevStatus, newStatus, reason, changedBy) {
  var sheet = getOrCreateSheet(SHEETS.MEMBER_STATUS_HISTORY);
  sheet.appendRow([
    'HST-' + Utilities.getUuid().substring(0, 8),
    memberId,
    prevStatus,
    newStatus,
    reason,
    changedBy,
    new Date().toISOString()
  ]);
}

/**
 * Record Activity Log
 */
function recordActivityLog(log) {
  var sheet = getOrCreateSheet(SHEETS.ACTIVITY_LOG);
  sheet.appendRow([
    log.logId || ('LOG-' + Utilities.getUuid().substring(0, 8)),
    log.user || 'Officer',
    log.action || 'ACTION',
    log.module || 'SYSTEM',
    log.recordId || '',
    log.description || '',
    new Date().toISOString()
  ]);
  return { success: true, message: 'Logged.' };
}

/**
 * Save Report Snapshot
 */
function saveReportSnapshot(report) {
  var sheet = getOrCreateSheet(SHEETS.REPORTS);
  sheet.appendRow([
    report.snapshotId || ('SNP-' + Utilities.getUuid().substring(0, 8)),
    report.title,
    report.periodType,
    report.periodLabel,
    report.startDate,
    report.endDate,
    report.createdBy,
    report.createdAt || new Date().toISOString(),
    JSON.stringify(report.membershipStats || {}),
    JSON.stringify(report.demographicStats || {}),
    JSON.stringify(report.attendanceSummary || {}),
    report.notes || ''
  ]);
  return { success: true, message: 'Snapshot saved to Google Sheets REPORTS tab.' };
}

/**
 * Save Official MCGI Youth Membership Statistics & Demographics Summary Table
 */
function saveOfficialSummary(data) {
  var sheet = getOrCreateSheet(SHEETS.OFFICIAL_SUMMARY);
  sheet.clear();

  // Row 1: Grand Categories
  var row1 = [];
  for (var i = 0; i < 20; i++) row1.push('MEMBERSHIP STATISTICS');
  for (var j = 0; j < 28; j++) row1.push('DEMOGRAPHICS');

  // Row 2: Major Section Groupings
  var row2 = [
    '(AUTO) NUMBER OF REGISTERED MEMBERS',
    'ACTIVE MEMBERS', '', '',
    'ON & OFF', '', '',
    'INACTIVE MEMBERS', '', '',
    'SUSPENDED', '', '', '',
    'BILANG NG NAPATAWAD',
    'MISSING',
    'NBB Youth - 2nd Quarter', '', '', '',
    'WITH COMMITTEE', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'WITHOUT COMMITTEE',
    'TOTAL NUMBER OF STUDENTS',
    'TOTAL NUMBER OF YOUTH MEMBERS WITH WORK',
    'TOTAL NUMBER OF REGISTERED VOTERS (18 YEARS & ABOVE)',
    'TOTAL NUMBER OF WORKING STUDENTS',
    'TOTAL NUMBER OF OUT OF SCHOOL YOUTH',
    'NUMBER OF YOUTH WITH BAPTIZED PARENT/S', '', '',
    'TOTAL NUMBER OF MCGI YOUTH WITH UNBAPTIZED PARENT/S'
  ];

  // Row 3: Sub-Headers / Column Titles
  var row3 = [
    '(AUTO) NUMBER OF REGISTERED MEMBERS',
    '(AUTO) TOTAL ACTIVE MEMBERS (JUNIOR + SENIOR)',
    'JUNIOR (14 TO 24 YEARS OLD)',
    'SENIOR (25 YEARS OLD & ABOVE)',
    '(AUTO) TOTAL ON & OFF MEMBERS (JUNIOR + SENIOR)',
    'JUNIOR (14 TO 24 YEARS OLD)',
    'SENIOR (25 YEARS OLD & ABOVE)',
    '(AUTO) TOTAL INACTIVE MEMBERS (JUNIOR + SENIOR)',
    'JUNIOR (14 TO 24 YEARS OLD)',
    'SENIOR (25 YEARS OLD & ABOVE)',
    '(AUTO) TOTAL SUSPENDED MEMBERS (ACTIVE + ON & OFF + INACTIVE/RFA)',
    'ACTIVE SUSPENDED',
    'ON & OFF SUSPENDED',
    'INACTIVE / RFA',
    'BILANG NG NAPATAWAD',
    'MISSING',
    '(AUTO) OVERALL TOTAL',
    'JUNE',
    'JULY',
    'AUGUST',
    '(AUTO) OVERALL TOTAL',
    'MULTIPLE COMMITTEE',
    'ARTIST GUILD',
    'BROADCAST',
    'CORE GROUP',
    'MCGI DRRT',
    'GUEST COORDINATORS',
    'LKD',
    'MCGI BIBLE READERS',
    'MUSIC MINISTRY',
    'NAR',
    'OFFICERS (YOUTH, GS, LOCALE/DISTRICT)',
    'PHOTOVILLE',
    'RACS',
    'SERVANTS MINISTRY',
    'TEATRO KRISTIANO',
    'T.O.C. (THANKSGIVING COMMITTEE)',
    'OTHERS',
    'WITHOUT COMMITTEE',
    'TOTAL NUMBER OF STUDENTS',
    'TOTAL NUMBER OF YOUTH MEMBERS WITH WORK',
    'TOTAL NUMBER OF REGISTERED VOTERS (18 YEARS & ABOVE)',
    'TOTAL NUMBER OF WORKING STUDENTS',
    'TOTAL NUMBER OF OUT OF SCHOOL YOUTH',
    'MOTHER ONLY',
    'FATHER ONLY',
    'BOTH MOTHER & FATHER',
    'TOTAL NUMBER OF MCGI YOUTH WITH UNBAPTIZED PARENT/S'
  ];

  // Row 4: Values (Either passed in data or live Google Sheet formulas)
  var row4 = data && data.values && data.values.length === 48 ? data.values : [
    '=COUNTA(MEMBERS!A2:A)',
    '=C4+D4',
    '=COUNTIFS(MEMBERS!L2:L, "Active", MEMBERS!G2:G, ">=14", MEMBERS!G2:G, "<=24")',
    '=COUNTIFS(MEMBERS!L2:L, "Active", MEMBERS!G2:G, ">=25")',
    '=F4+G4',
    '=COUNTIFS(MEMBERS!L2:L, "On & Off", MEMBERS!G2:G, ">=14", MEMBERS!G2:G, "<=24")',
    '=COUNTIFS(MEMBERS!L2:L, "On & Off", MEMBERS!G2:G, ">=25")',
    '=I4+J4',
    '=COUNTIFS(MEMBERS!L2:L, "Inactive", MEMBERS!G2:G, ">=14", MEMBERS!G2:G, "<=24")',
    '=COUNTIFS(MEMBERS!L2:L, "Inactive", MEMBERS!G2:G, ">=25")',
    '=L4+M4+N4',
    '=COUNTIFS(MEMBERS!L2:L, "Suspended", MEMBERS!Y2:Y, "Active")',
    '=COUNTIFS(MEMBERS!L2:L, "Suspended", MEMBERS!Y2:Y, "At Risk")',
    '=COUNTIFS(MEMBERS!L2:L, "Suspended", MEMBERS!Y2:Y, "Inactive")',
    '=COUNTIF(MEMBERS!AA2:AA, "*Napatawad*")',
    '=COUNTIF(MEMBERS!L2:L, "Missing")',
    '=R4+S4+T4',
    '=COUNTIFS(MEMBERS!AA2:AA, "*June*")',
    '=COUNTIFS(MEMBERS!AA2:AA, "*July*")',
    '=COUNTIFS(MEMBERS!AA2:AA, "*August*")',
    '=COUNTA(MEMBERS!A2:A)-AM4',
    '=COUNTIF(MEMBERS!T2:T, "*,*")',
    '=COUNTIF(MEMBERS!T2:T, "*Artist Guild*")',
    '=COUNTIF(MEMBERS!T2:T, "*Broadcast*")',
    '=COUNTIF(MEMBERS!T2:T, "*Core Group*")',
    '=COUNTIF(MEMBERS!T2:T, "*DRRT*")',
    '=COUNTIF(MEMBERS!T2:T, "*Guest Coordinators*")',
    '=COUNTIF(MEMBERS!T2:T, "*LKD*")',
    '=COUNTIF(MEMBERS!T2:T, "*Bible Readers*")',
    '=COUNTIF(MEMBERS!T2:T, "*Music Ministry*")',
    '=COUNTIF(MEMBERS!T2:T, "*NAR*")',
    '=COUNTIF(MEMBERS!T2:T, "*Officers*")',
    '=COUNTIF(MEMBERS!T2:T, "*Photoville*")',
    '=COUNTIF(MEMBERS!T2:T, "*RACS*")',
    '=COUNTIF(MEMBERS!T2:T, "*Servants Ministry*")',
    '=COUNTIF(MEMBERS!T2:T, "*Teatro Kristiano*")',
    '=COUNTIF(MEMBERS!T2:T, "*T.O.C.*")',
    '=COUNTIF(MEMBERS!T2:T, "*Others*")',
    '=COUNTIF(MEMBERS!T2:T, "")',
    '=COUNTIF(MEMBERS!N2:N, "Student")',
    '=COUNTIF(MEMBERS!O2:O, "Employed")',
    '=COUNTIFS(MEMBERS!P2:P, "TRUE", MEMBERS!G2:G, ">=18")',
    '=COUNTIF(MEMBERS!Q2:Q, "TRUE")',
    '=COUNTIF(MEMBERS!R2:R, "TRUE")',
    '=COUNTIF(MEMBERS!S2:S, "Mother Only")',
    '=COUNTIF(MEMBERS!S2:S, "Father Only")',
    '=COUNTIF(MEMBERS!S2:S, "Both Mother & Father")',
    '=COUNTIF(MEMBERS!S2:S, "Unbaptized Parent/s")'
  ];

  sheet.getRange(1, 1, 1, row1.length).setValues([row1]);
  sheet.getRange(2, 1, 1, row2.length).setValues([row2]);
  sheet.getRange(3, 1, 1, row3.length).setValues([row3]);
  sheet.getRange(4, 1, 1, row4.length).setValues([row4]);

  // Style Header Rows
  sheet.getRange(1, 1, 1, 20).setBackground('#1e3a8a').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange(1, 21, 1, 28).setBackground('#065f46').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');

  sheet.getRange(2, 1, 1, 48).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
  sheet.getRange(3, 1, 1, 48).setBackground('#f1f5f9').setFontColor('#0f172a').setFontWeight('bold').setFontSize(9);
  sheet.getRange(4, 1, 1, 48).setFontWeight('bold').setHorizontalAlignment('center').setFontSize(11);

  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(1);

  return { success: true, message: 'Official MCGI Youth Summary sheet updated in Google Sheets!' };
}

/**
 * Save System Settings
 */
function saveSettings(settings) {
  var sheet = getOrCreateSheet(SHEETS.SETTINGS);
  sheet.clear();
  sheet.appendRow(['Key', 'Value', 'Updated At']);
  formatHeaderRow(sheet, 3);

  var now = new Date().toISOString();
  var entries = Object.keys(settings).map(function(k) {
    return [k, typeof settings[k] === 'object' ? JSON.stringify(settings[k]) : settings[k], now];
  });
  if (entries.length > 0) {
    sheet.getRange(2, 1, entries.length, 3).setValues(entries);
  }
  return { success: true, message: 'Settings saved.' };
}

/**
 * Save or Update Announcement
 */
function handleSaveAnnouncement(ann) {
  var sheet = getOrCreateSheet(SHEETS.ANNOUNCEMENTS);
  var rows = sheet.getDataRange().getValues();
  var rowIndex = -1;
  var now = new Date().toISOString();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(ann.announcementId)) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    ann.announcementId,
    ann.title || '',
    ann.description || '',
    ann.image || '',
    ann.publishDate || '',
    ann.startDisplayDate || '',
    ann.endDisplayDate || '',
    ann.location || '',
    ann.eventDate || '',
    ann.linkedEventId || '',
    ann.status || 'Published',
    ann.featured ? true : false,
    ann.createdBy || 'Admin',
    ann.createdAt || now,
    now
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { success: true, message: 'Announcement updated in Google Sheets.' };
  } else {
    sheet.appendRow(rowData);
    return { success: true, message: 'Announcement created in Google Sheets.' };
  }
}

/**
 * Delete Announcement
 */
function handleDeleteAnnouncement(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.ANNOUNCEMENTS);
  if (!sheet) return { success: false, message: 'Sheet not found.' };

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.announcementId)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Announcement deleted.' };
    }
  }
  return { success: false, message: 'Announcement not found.' };
}

/**
 * Save Landing Page Configuration
 */
function handleSaveLandingPageConfig(config) {
  var sheet = getOrCreateSheet(SHEETS.LANDING_PAGE);
  sheet.clear();
  sheet.appendRow(['Config Key', 'Value', 'Updated At']);
  formatHeaderRow(sheet, 3);

  var now = new Date().toISOString();
  var entries = Object.keys(config).map(function(k) {
    return [k, typeof config[k] === 'object' ? JSON.stringify(config[k]) : String(config[k]), now];
  });

  if (entries.length > 0) {
    sheet.getRange(2, 1, entries.length, 3).setValues(entries);
  }
  return { success: true, message: 'Landing page configuration saved to Google Sheets.' };
}

/**
 * Direct Test Function
 * You can select this function in the Apps Script toolbar and click "Run" ▶️
 * to verify permissions and instantly create all 15 formatted sheets!
 */
function testScriptDirectly() {
  Logger.log('Starting direct test: initializing spreadsheet structure...');
  initializeSpreadsheetStructure();
  Logger.log('Spreadsheet successfully initialized! Check your spreadsheet tabs.');
}

/**
 * Bulk Push All Data from Web App to Google Sheets
 */
function handlePushAllData(data) {
  if (!data) return { success: false, message: 'No data provided.' };
  
  // 1. Initialize all sheets and headers
  initializeSpreadsheetStructure();
  
  var counts = { members: 0, events: 0, schedules: 0, attendance: 0, announcements: 0 };
  
  // 2. Members
  if (data.members && Array.isArray(data.members) && data.members.length > 0) {
    var memSheet = getOrCreateSheet(SHEETS.MEMBERS);
    if (memSheet.getLastRow() > 1) {
      memSheet.getRange(2, 1, memSheet.getLastRow() - 1, memSheet.getLastColumn()).clearContent();
    }
    
    var memberRows = data.members.map(function(m) {
      var commStr = Array.isArray(m.committees) ? m.committees.join(', ') : (m.committees || '');
      return [
        m.memberId || '',
        m.firstName || '',
        m.middleName || '',
        m.lastName || '',
        m.fullName || ((m.firstName || '') + ' ' + (m.lastName || '')),
        m.birthday || '',
        m.age || '',
        m.gender || 'Male',
        m.contactNumber || '',
        m.email || '',
        m.address || '',
        m.membershipStatus || 'Active',
        m.memberCategory || 'Junior',
        m.studentStatus || 'Non-Student',
        m.employmentStatus || 'Unemployed',
        m.registeredVoter ? 'TRUE' : 'FALSE',
        m.workingStudent ? 'TRUE' : 'FALSE',
        m.outOfSchoolYouth ? 'TRUE' : 'FALSE',
        m.parentBaptismStatus || 'Unbaptized Parent/s',
        commStr,
        m.dateRegistered || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        m.lastAttendanceDate || '',
        m.attendanceCount || 0,
        m.attendancePercentage || 0,
        m.activityStatus || 'Active',
        m.activityReason || '',
        m.notes || '',
        m.createdAt || new Date().toISOString(),
        m.updatedAt || new Date().toISOString()
      ];
    });
    
    memSheet.getRange(2, 1, memberRows.length, memberRows[0].length).setValues(memberRows);
    counts.members = memberRows.length;
  }
  
  // 3. Events
  if (data.events && Array.isArray(data.events) && data.events.length > 0) {
    var evtSheet = getOrCreateSheet(SHEETS.ATTENDANCE_EVENTS);
    if (evtSheet.getLastRow() > 1) {
      evtSheet.getRange(2, 1, evtSheet.getLastRow() - 1, evtSheet.getLastColumn()).clearContent();
    }
    var eventRows = data.events.map(function(e) {
      return [
        e.eventId || '',
        e.eventName || '',
        e.eventType || '',
        e.startDate || '',
        e.endDate || '',
        e.location || '',
        e.description || '',
        e.attendanceRule || '',
        e.status || 'Active',
        e.createdBy || 'Admin',
        e.createdAt || new Date().toISOString(),
        e.updatedAt || new Date().toISOString()
      ];
    });
    evtSheet.getRange(2, 1, eventRows.length, eventRows[0].length).setValues(eventRows);
    counts.events = eventRows.length;
  }
  
  // 4. Schedules
  if (data.schedules && Array.isArray(data.schedules) && data.schedules.length > 0) {
    var schSheet = getOrCreateSheet(SHEETS.EVENT_SCHEDULES);
    if (schSheet.getLastRow() > 1) {
      schSheet.getRange(2, 1, schSheet.getLastRow() - 1, schSheet.getLastColumn()).clearContent();
    }
    var schRows = data.schedules.map(function(s) {
      return [
        s.scheduleId || '',
        s.eventId || '',
        s.date || '',
        s.startTime || '',
        s.endTime || '',
        s.scheduleLabel || '',
        s.location || '',
        s.status || 'Active',
        s.createdAt || new Date().toISOString(),
        s.updatedAt || new Date().toISOString()
      ];
    });
    schSheet.getRange(2, 1, schRows.length, schRows[0].length).setValues(schRows);
    counts.schedules = schRows.length;
  }
  
  // 5. Attendance
  if (data.attendance && Array.isArray(data.attendance) && data.attendance.length > 0) {
    var attSheet = getOrCreateSheet(SHEETS.ATTENDANCE_RECORDS);
    if (attSheet.getLastRow() > 1) {
      attSheet.getRange(2, 1, attSheet.getLastRow() - 1, attSheet.getLastColumn()).clearContent();
    }
    var attRows = data.attendance.map(function(a) {
      return [
        a.attendanceId || '',
        a.eventId || '',
        a.scheduleId || '',
        a.memberId || '',
        a.memberName || '',
        a.eventName || '',
        a.eventDate || '',
        a.schedule || '',
        a.attendanceStatus || 'Present',
        a.recordedBy || 'System',
        a.recordedAt || new Date().toISOString(),
        a.updatedAt || new Date().toISOString(),
        a.notes || ''
      ];
    });
    attSheet.getRange(2, 1, attRows.length, attRows[0].length).setValues(attRows);
    counts.attendance = attRows.length;
  }
  
  // 6. Announcements
  if (data.announcements && Array.isArray(data.announcements) && data.announcements.length > 0) {
    var annSheet = getOrCreateSheet(SHEETS.ANNOUNCEMENTS);
    if (annSheet.getLastRow() > 1) {
      annSheet.getRange(2, 1, annSheet.getLastRow() - 1, annSheet.getLastColumn()).clearContent();
    }
    var annRows = data.announcements.map(function(a) {
      return [
        a.announcementId || '',
        a.title || '',
        a.description || '',
        a.image || '',
        a.publishDate || '',
        a.startDisplayDate || '',
        a.endDisplayDate || '',
        a.location || '',
        a.eventDate || '',
        a.linkedEventId || '',
        a.status || 'Published',
        a.featured ? true : false,
        a.createdBy || 'Admin',
        a.createdAt || new Date().toISOString(),
        new Date().toISOString()
      ];
    });
    annSheet.getRange(2, 1, annRows.length, annRows[0].length).setValues(annRows);
    counts.announcements = annRows.length;
  }
  
  // 7. Official Summary
  if (data.officialSummary) {
    saveOfficialSummary(data.officialSummary);
  } else {
    saveOfficialSummary();
  }
  
  return {
    success: true,
    message: 'Successfully populated Google Sheets! Pushed ' + counts.members + ' members, ' + counts.events + ' events, ' + counts.attendance + ' attendance records, and formatted all official summary tabs.',
    counts: counts
  };
}

/**
 * Auto-Initialize all 15 Worksheets with professional headers, frozen rows, and formulas
 */
function initializeSpreadsheetStructure() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. MEMBERS
  var membersSheet = getOrCreateSheet(SHEETS.MEMBERS);
  if (membersSheet.getLastRow() === 0) {
    membersSheet.appendRow([
      'Member ID', 'First Name', 'Middle Name', 'Last Name', 'Full Name',
      'Birthday', 'Age', 'Gender', 'Contact Number', 'Email',
      'Address', 'Membership Status', 'Member Category', 'Student Status', 'Employment Status',
      'Registered Voter', 'Working Student', 'Out of School Youth', 'Parent Baptism Status', 'Committees',
      'Date Registered', 'Last Attendance Date', 'Attendance Count', 'Attendance Percentage',
      'Activity Status', 'Activity Reason', 'Notes', 'Created At', 'Updated At'
    ]);
  }
  formatHeaderRow(membersSheet, 29);

  // 2. ATTENDANCE_EVENTS
  var eventsSheet = getOrCreateSheet(SHEETS.ATTENDANCE_EVENTS);
  if (eventsSheet.getLastRow() === 0) {
    eventsSheet.appendRow([
      'Event ID', 'Event Name', 'Event Type', 'Start Date', 'End Date',
      'Location', 'Description', 'Attendance Rule', 'Status', 'Created By',
      'Created At', 'Updated At'
    ]);
  }
  formatHeaderRow(eventsSheet, 12);

  // 3. EVENT_SCHEDULES
  var schedSheet = getOrCreateSheet(SHEETS.EVENT_SCHEDULES);
  if (schedSheet.getLastRow() === 0) {
    schedSheet.appendRow([
      'Schedule ID', 'Event ID', 'Date', 'Start Time', 'End Time',
      'Schedule Label', 'Location', 'Status', 'Created At', 'Updated At'
    ]);
  }
  formatHeaderRow(schedSheet, 10);

  // 4. ATTENDANCE_RECORDS
  var attSheet = getOrCreateSheet(SHEETS.ATTENDANCE_RECORDS);
  if (attSheet.getLastRow() === 0) {
    attSheet.appendRow([
      'Attendance ID', 'Event ID', 'Schedule ID', 'Member ID', 'Member Name',
      'Event Name', 'Event Date', 'Schedule', 'Attendance Status',
      'Recorded By', 'Recorded At', 'Updated At', 'Notes'
    ]);
  }
  formatHeaderRow(attSheet, 13);

  // 5. COMMITTEES
  var commSheet = getOrCreateSheet(SHEETS.COMMITTEES);
  if (commSheet.getLastRow() === 0) {
    commSheet.appendRow(['Committee Name', 'Description', 'Status']);
    var commList = [
      ['Artist Guild', 'Visual arts, graphic design, and staging decor', 'Active'],
      ['Broadcast', 'Live stream, audio video engineering, and camera operations', 'Active'],
      ['Core Group', 'District youth leadership and coordination', 'Active'],
      ['MCGI DRRT', 'Disaster risk reduction, first aid, emergency response', 'Active'],
      ['Guest Coordinators', 'Visitor reception, ushering, and documentation', 'Active'],
      ['LKD', 'Kabataan directory and member follow-up', 'Active'],
      ['MCGI Bible Readers', 'Scripture reading and topical research', 'Active'],
      ['Music Ministry', 'Choir, instrumentalists, and special musical numbers', 'Active'],
      ['NAR', 'New additions and newly baptized youth reception', 'Active'],
      ['Officers', 'Appointed youth executives and team leaders', 'Active'],
      ['Photoville', 'Official photography and multimedia documentation', 'Active'],
      ['RACS', 'Radio and community communications network', 'Active'],
      ['Servants Ministry', 'Hall maintenance, setup, and logistics', 'Active'],
      ['Teatro Kristiano', 'Interpretative praise and theatrical presentations', 'Active'],
      ['T.O.C.', 'Technical operations center', 'Active'],
      ['Others', 'Other auxiliary youth committees', 'Active']
    ];
    commSheet.getRange(2, 1, commList.length, 3).setValues(commList);
  }
  formatHeaderRow(commSheet, 3);

  // 6. MEMBERSHIP_STATISTICS (With Official Google Sheet Formulas)
  var memStatSheet = getOrCreateSheet(SHEETS.MEMBERSHIP_STATISTICS);
  memStatSheet.clear();
  memStatSheet.appendRow(['Membership Category / Breakdown', 'Formula Count', 'Notes']);
  var statRows = [
    ['Total Registered Members', '=COUNTA(MEMBERS!A2:A)', 'Total rows registered in MEMBERS tab'],
    ['Active Members (Total)', '=COUNTIF(MEMBERS!L2:L, "Active")', 'Active membership status'],
    ['Active - Junior', '=COUNTIFS(MEMBERS!L2:L, "Active", MEMBERS!M2:M, "Junior")', 'Age below 18'],
    ['Active - Senior', '=COUNTIFS(MEMBERS!L2:L, "Active", MEMBERS!M2:M, "Senior")', 'Age 18 and above'],
    ['On & Off Members (Total)', '=COUNTIF(MEMBERS!L2:L, "On & Off")', 'Irregular attendance'],
    ['On & Off - Junior', '=COUNTIFS(MEMBERS!L2:L, "On & Off", MEMBERS!M2:M, "Junior")', ''],
    ['On & Off - Senior', '=COUNTIFS(MEMBERS!L2:L, "On & Off", MEMBERS!M2:M, "Senior")', ''],
    ['Inactive Members (Total)', '=COUNTIF(MEMBERS!L2:L, "Inactive")', 'Inactive status'],
    ['Inactive - Junior', '=COUNTIFS(MEMBERS!L2:L, "Inactive", MEMBERS!M2:M, "Junior")', ''],
    ['Inactive - Senior', '=COUNTIFS(MEMBERS!L2:L, "Inactive", MEMBERS!M2:M, "Senior")', ''],
    ['Suspended Members', '=COUNTIF(MEMBERS!L2:L, "Suspended")', 'Currently suspended'],
    ['Missing Members', '=COUNTIF(MEMBERS!L2:L, "Missing")', 'Relocated or unaccounted']
  ];
  memStatSheet.getRange(2, 1, statRows.length, 3).setValues(statRows);
  formatHeaderRow(memStatSheet, 3);

  // 7. DEMOGRAPHICS (With Official Google Sheet Formulas)
  var demoSheet = getOrCreateSheet(SHEETS.DEMOGRAPHICS);
  demoSheet.clear();
  demoSheet.appendRow(['Demographic Classification', 'Formula Count', 'Reference']);
  var demoRows = [
    ['Junior Youths (< 18)', '=COUNTIF(MEMBERS!M2:M, "Junior")', 'MEMBERS tab Member Category'],
    ['Senior Youths (>= 18)', '=COUNTIF(MEMBERS!M2:M, "Senior")', 'MEMBERS tab Member Category'],
    ['Total Students', '=COUNTIF(MEMBERS!N2:N, "Student")', 'Student Status'],
    ['Working Students', '=COUNTIF(MEMBERS!Q2:Q, "TRUE")', 'Working Student flag'],
    ['Out-of-School Youth (OSY)', '=COUNTIF(MEMBERS!R2:R, "TRUE")', 'OSY flag'],
    ['Youth With Work (Employed)', '=COUNTIF(MEMBERS!O2:O, "Employed")', 'Employment Status'],
    ['Not Working', '=COUNTIF(MEMBERS!O2:O, "Unemployed")', 'Employment Status'],
    ['Registered Voters', '=COUNTIF(MEMBERS!P2:P, "TRUE")', 'Voter registration flag'],
    ['Both Mother & Father Baptized', '=COUNTIF(MEMBERS!S2:S, "Both Mother & Father")', 'Parent status'],
    ['Mother Only Baptized', '=COUNTIF(MEMBERS!S2:S, "Mother Only")', 'Parent status'],
    ['Father Only Baptized', '=COUNTIF(MEMBERS!S2:S, "Father Only")', 'Parent status'],
    ['Unbaptized Parent/s', '=COUNTIF(MEMBERS!S2:S, "Unbaptized Parent/s")', 'Parent status']
  ];
  demoSheet.getRange(2, 1, demoRows.length, 3).setValues(demoRows);
  formatHeaderRow(demoSheet, 3);

  // 8. ATTENDANCE_STATISTICS
  var attStatSheet = getOrCreateSheet(SHEETS.ATTENDANCE_STATISTICS);
  attStatSheet.clear();
  attStatSheet.appendRow(['Attendance Metric', 'Formula Calculation', 'Description']);
  var attStatRows = [
    ['Total Attendance Records', '=COUNTA(ATTENDANCE_RECORDS!A2:A)', 'Total marked records'],
    ['Total Present', '=COUNTIF(ATTENDANCE_RECORDS!I2:I, "Present")', 'Present marks'],
    ['Total Absent', '=COUNTIF(ATTENDANCE_RECORDS!I2:I, "Absent")', 'Absent marks'],
    ['Total Excused', '=COUNTIF(ATTENDANCE_RECORDS!I2:I, "Excused")', 'Excused marks'],
    ['Total Late', '=COUNTIF(ATTENDANCE_RECORDS!I2:I, "Late")', 'Late marks'],
    ['Overall Attendance Rate', '=IFERROR(B3 / (B3 + B4 + B6), 0)', 'Present / Total Qualifying (Formula)']
  ];
  attStatSheet.getRange(2, 1, attStatRows.length, 3).setValues(attStatRows);
  formatHeaderRow(attStatSheet, 3);

  // 9. REPORTS
  var repSheet = getOrCreateSheet(SHEETS.REPORTS);
  if (repSheet.getLastRow() === 0) {
    repSheet.appendRow([
      'Snapshot ID', 'Title', 'Period Type', 'Period Label', 'Start Date', 'End Date',
      'Created By', 'Created At', 'Membership Stats JSON', 'Demographics JSON', 'Attendance JSON', 'Notes'
    ]);
  }
  formatHeaderRow(repSheet, 12);

  // 10. SETTINGS
  var settSheet = getOrCreateSheet(SHEETS.SETTINGS);
  if (settSheet.getLastRow() === 0) {
    settSheet.appendRow(['Key', 'Value', 'Updated At']);
    settSheet.appendRow(['regularThresholdPercent', '75', new Date().toISOString()]);
    settSheet.appendRow(['activeThresholdPercent', '50', new Date().toISOString()]);
    settSheet.appendRow(['missedEventsBeforeAtRisk', '3', new Date().toISOString()]);
    settSheet.appendRow(['missedEventsBeforeInactive', '5', new Date().toISOString()]);
    settSheet.appendRow(['daysWithoutAttendanceBeforeInactive', '30', new Date().toISOString()]);
    settSheet.appendRow(['countingMethod', 'event_level', new Date().toISOString()]);
  }
  formatHeaderRow(settSheet, 3);

  // 11. ACTIVITY_LOG
  var logSheet = getOrCreateSheet(SHEETS.ACTIVITY_LOG);
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(['Log ID', 'User', 'Action', 'Module', 'Record ID', 'Description', 'Timestamp']);
  }
  formatHeaderRow(logSheet, 7);

  // 12. MEMBER_STATUS_HISTORY
  var histSheet = getOrCreateSheet(SHEETS.MEMBER_STATUS_HISTORY);
  if (histSheet.getLastRow() === 0) {
    histSheet.appendRow(['History ID', 'Member ID', 'Previous Status', 'New Status', 'Reason', 'Changed By', 'Changed At']);
  }
  formatHeaderRow(histSheet, 7);

  // 13. ANNOUNCEMENTS
  var annSheet = getOrCreateSheet(SHEETS.ANNOUNCEMENTS);
  if (annSheet.getLastRow() === 0) {
    annSheet.appendRow([
      'Announcement ID', 'Title', 'Description', 'Image URL', 'Publish Date',
      'Start Display Date', 'End Display Date', 'Location', 'Event Date',
      'Linked Event ID', 'Status', 'Featured', 'Created By', 'Created At', 'Updated At'
    ]);
  }
  formatHeaderRow(annSheet, 15);

  // 14. LANDING_PAGE
  var landSheet = getOrCreateSheet(SHEETS.LANDING_PAGE);
  if (landSheet.getLastRow() === 0) {
    landSheet.appendRow(['Config Key', 'Value', 'Updated At']);
    landSheet.appendRow(['chapterName', 'MCGI YOUTH • LOCAL OF ASCOVILLE', new Date().toISOString()]);
    landSheet.appendRow(['heroTitle', 'Welcome, Youth!', new Date().toISOString()]);
    landSheet.appendRow(['heroSubtitle', 'Stay connected with our upcoming activities, announcements, and your attendance.', new Date().toISOString()]);
    landSheet.appendRow(['heroImageUrl', 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1920&q=80', new Date().toISOString()]);
    landSheet.appendRow(['colorTheme', 'beige', new Date().toISOString()]);
    landSheet.appendRow(['verificationMethod', 'member_id', new Date().toISOString()]);
  }
  formatHeaderRow(landSheet, 3);

  // 15. OFFICIAL_SUMMARY (Official MCGI Youth Multi-Level Header Reporting Format)
  saveOfficialSummary();
}

/**
 * Format headers nicely: dark navy blue (#1E3A8A), bold white text, frozen row
 */
function formatHeaderRow(sheet, numCols) {
  sheet.setFrozenRows(1);
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground('#1E3A8A');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
}

/**
 * Helper: get or create worksheet
 */
function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Helper: string to camelCase
 */
function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
}
