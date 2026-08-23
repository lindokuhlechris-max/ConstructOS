import { Activity, SubTask, Project } from '../types';

export interface DispatchOptions {
  supervisorName?: string;
  supervisorPhone?: string;
  shiftDate?: string;
  customInstructions?: string;
  projectName?: string;
  selectedSubtaskIds?: string[];
}

export interface ParsedSupervisorReport {
  shiftDate?: string;
  weather?: string;
  temperature?: string;
  siteConditions?: string;
  subtaskUpdates: {
    subtaskId?: string;
    subtaskIndex?: number;
    title?: string;
    shiftOutput?: number;
    cumulativeOutput?: number;
    status?: 'Not Started' | 'In Progress' | 'Completed';
    holdPointApproved?: boolean;
    inspectorName?: string;
    notes?: string;
  }[];
  supervisorNotes?: string;
  delayReason?: string;
  rawText?: string;
}

/**
 * Formats a clean, high-impact WhatsApp dispatch work order message
 */
export function generateWhatsAppDispatchText(activity: Activity, options: DispatchOptions = {}): string {
  const dateStr = options.shiftDate || new Date().toISOString().split('T')[0];
  const allSubtasks = activity.subtasks || [];
  const subtasks = options.selectedSubtaskIds && options.selectedSubtaskIds.length > 0
    ? allSubtasks.filter(st => options.selectedSubtaskIds!.includes(st.id))
    : allSubtasks;
  
  const subtasksText = subtasks.length > 0
    ? subtasks.map((st, idx) => {
        const originalIdx = allSubtasks.findIndex(s => s.id === st.id);
        const num = originalIdx >= 0 ? originalIdx + 1 : idx + 1;
        const holdTag = st.isHoldPoint ? ' 🔒 [QA HOLD POINT]' : '';
        const msTag = st.isMilestone ? ' 🎯 [MILESTONE]' : '';
        const qtyStr = st.targetQuantity ? ` (Target: ${st.targetQuantity} ${st.unit || 'units'})` : '';
        const priorStr = (st.completedQuantity || 0) > 0 ? ` [Prior: ${st.completedQuantity} ${st.unit || ''}]` : '';
        return `${num}. [ ] *${st.title}*${qtyStr}${priorStr}${holdTag}${msTag}`;
      }).join('\n')
    : '• No detailed subtasks configured. Record master activity volume.';

  const crewText = (activity.assignedLabour || []).length > 0
    ? (activity.assignedLabour || []).map(l => `  • ${l.role || 'Worker'}: ${l.name || 'Worker'} (${l.hours || 8}h)`).join('\n')
    : '  • Standard allocated site crew.';

  const plantText = (activity.assignedEquipment || []).length > 0
    ? (activity.assignedEquipment || []).map(e => `  • ${e.name || e.equipmentId} (${e.operator ? `Operator: ${e.operator}` : 'Operating'})`).join('\n')
    : '  • Standard tools & plant.';

  return `*🚧 CONSTRUCTOS FIELD WORK ORDER*
*Date:* ${dateStr}
${options.supervisorName ? `*Assigned Supervisor:* ${options.supervisorName}\n` : ''}*Activity:* ${activity.name} (${activity.id})
*Discipline / Package:* ${activity.workPackage || 'General'} | ${activity.discipline || 'All'}
*Target Output:* ${activity.targetQuantity ? `${activity.targetQuantity} ${activity.unit || 'units'}` : 'As per drawings'}
*Location / Chainage:* ${activity.location || activity.chainage || 'Site Work Zone'}

*📋 METHOD SUBTASKS TO EXECUTE TODAY:*
${subtasksText}

*👷 ALLOCATED WORKFORCE:*
${crewText}

*🚜 ALLOCATED MACHINERY:*
${plantText}
${options.customInstructions ? `\n*⚠️ SPECIAL INSTRUCTIONS / SAFETY:* \n${options.customInstructions}\n` : ''}
----------------------------------------
*👉 HOW TO REPORT BACK AT SHIFT END:*
Reply to this message with:
1. Output achieved per subtask (e.g. "Subtask 1: 150m")
2. QA Hold point inspection status & Inspector Name
3. Weather / delays encountered & daily site remarks.`;
}

/**
 * Generates a clean template that the supervisor can fill in and send back
 */
export function generateSupervisorReturnTemplate(activity: Activity, options: DispatchOptions = {}): string {
  const dateStr = options.shiftDate || new Date().toISOString().split('T')[0];
  const allSubtasks = activity.subtasks || [];
  const subtasks = options.selectedSubtaskIds && options.selectedSubtaskIds.length > 0
    ? allSubtasks.filter(st => options.selectedSubtaskIds!.includes(st.id))
    : allSubtasks;

  const subtaskLines = subtasks.length > 0
    ? subtasks.map((st, idx) => {
        const originalIdx = allSubtasks.findIndex(s => s.id === st.id);
        const num = originalIdx >= 0 ? originalIdx + 1 : idx + 1;
        const holdNotice = st.isHoldPoint ? ' [QA Inspector Name: ________]' : '';
        return `#${num} ${st.title}: [ +___ ${st.unit || 'units'} ] Status: [Completed / In Progress]${holdNotice}`;
      }).join('\n')
    : `Master Output: [ +___ ${activity.unit || 'units'} ]`;

  return `*📋 SHIFT PROGRESS RETURN: ${activity.id} - ${activity.name}*
*Date:* ${dateStr}
*Supervisor:* ${options.supervisorName || 'Site Supervisor'}
*Weather:* [ Sunny / Rain / Overcast ] Temp: [ 24°C ]

*SUBTASK OUTPUTS ACHIEVED:*
${subtaskLines}

*DELAY / BLOCKER (If any):* [ None / Weather / Plant / Materials ]
*SUPERVISOR REMARKS:* [ Enter shift notes, pegs/chainage covered, soil conditions... ]`;
}

/**
 * Generates an interactive, standalone, self-contained single .html mobile shift form
 * Runs 100% offline in any phone browser with zero external network or CDN calls!
 */
export function generateStandaloneMobileHtml(activity: Activity, options: DispatchOptions = {}): string {
  const dateStr = options.shiftDate || new Date().toISOString().split('T')[0];
  const allSubtasks = activity.subtasks || [];
  const subtasks = options.selectedSubtaskIds && options.selectedSubtaskIds.length > 0
    ? allSubtasks.filter(st => options.selectedSubtaskIds!.includes(st.id))
    : allSubtasks;
  
  const subtasksForScript = subtasks.map(st => {
    const originalIdx = allSubtasks.findIndex(s => s.id === st.id);
    return {
      ...st,
      seqIndex: originalIdx >= 0 ? originalIdx + 1 : 1
    };
  });

  const escapedActivity = JSON.stringify({
    ...activity,
    subtasks: subtasksForScript
  });
  const escapedOptions = JSON.stringify(options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Shift Form: ${activity.id} - ${activity.name}</title>
  <style>
    :root {
      --primary: #0B5FFF;
      --primary-dark: #0047cc;
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --text: #0F172A;
      --text-muted: #64748B;
      --border: #E2E8F0;
      --success: #10B981;
      --success-bg: #ECFDF5;
      --danger: #EF4444;
      --danger-bg: #FEF2F2;
      --warning: #F59E0B;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F172A;
        --card-bg: #1E293B;
        --text: #F8FAFC;
        --text-muted: #94A3B8;
        --border: #334155;
        --success-bg: #064E3B;
        --danger-bg: #7F1D1D;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 14px; padding-bottom: 90px; max-width: 600px; margin: 0 auto; -webkit-tap-highlight-color: transparent; }
    .header { background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 18px; margin-bottom: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #DBEAFE; color: #1D4ED8; margin-right: 6px; }
    .title { font-size: 18px; font-weight: 800; margin-top: 8px; line-height: 1.3; }
    .meta { font-size: 12px; color: var(--text-muted); margin-top: 6px; display: flex; flex-wrap: wrap; gap: 8px; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin: 18px 0 10px; display: flex; justify-content: space-between; align-items: center; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 18px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .subtask-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
    .subtask-num { width: 28px; height: 28px; border-radius: 8px; background: var(--primary); color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; font-family: monospace; }
    .subtask-title { font-size: 14px; font-weight: 700; line-height: 1.3; }
    .qty-box { display: flex; align-items: center; gap: 8px; margin: 12px 0; }
    .qty-input { flex: 1; height: 44px; padding: 0 12px; border-radius: 12px; border: 2px solid var(--border); background: var(--bg); color: var(--text); font-size: 16px; font-weight: bold; }
    .qty-btn { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); font-size: 20px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .qty-btn:active { background: var(--border); }
    .hold-box { background: var(--danger-bg); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 14px; padding: 12px; margin: 10px 0; font-size: 12px; }
    .select, .input, .textarea { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 13px; margin-top: 6px; }
    .textarea { resize: vertical; min-height: 70px; }
    .sticky-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--card-bg); border-top: 1px solid var(--border); padding: 12px 16px; display: flex; gap: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 -4px 10px rgba(0,0,0,0.05); }
    .btn-main { flex: 1; height: 48px; border-radius: 14px; background: #25D366; color: white; border: none; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; text-decoration: none; }
    .btn-secondary { height: 48px; padding: 0 16px; border-radius: 14px; background: var(--bg); color: var(--text); border: 1px solid var(--border); font-size: 13px; font-weight: bold; cursor: pointer; }
    .progress-bar-wrap { height: 8px; background: var(--border); border-radius: 9999px; overflow: hidden; margin-top: 6px; display: flex; }
    .progress-fill { height: 100%; background: var(--primary); }
    .progress-gain { height: 100%; background: var(--success); }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <span class="badge">${activity.id}</span>
      <span class="badge" style="background:#ECFDF5; color:#065F46;">Offline Shift Form</span>
      ${options.selectedSubtaskIds && options.selectedSubtaskIds.length < allSubtasks.length ? `<span class="badge" style="background:#F3E8FF; color:#7E22CE;">${subtasks.length} of ${allSubtasks.length} Subtasks</span>` : ''}
    </div>
    <div class="title">${activity.name}</div>
    <div class="meta">
      <span>📍 ${activity.location || activity.chainage || 'Site Area'}</span>
      <span>•</span>
      <span>📦 ${activity.workPackage || 'Package'}</span>
      <span>•</span>
      <span>🎯 Target: ${activity.targetQuantity || 0} ${activity.unit || 'units'}</span>
    </div>
  </div>

  <div class="card">
    <div style="font-weight:bold; font-size:13px; margin-bottom:8px;">Shift & Site Details</div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
      <div>
        <label style="font-size:11px; color:var(--text-muted);">Shift Date</label>
        <input type="date" id="fieldDate" class="input" value="${dateStr}">
      </div>
      <div>
        <label style="font-size:11px; color:var(--text-muted);">Weather</label>
        <select id="fieldWeather" class="select">
          <option value="Sunny">☀️ Sunny / Clear</option>
          <option value="Partly Cloudy">⛅ Partly Cloudy</option>
          <option value="Overcast">☁️ Overcast</option>
          <option value="Rain">🌧️ Rain / Wet</option>
          <option value="Windy">💨 High Winds</option>
        </select>
      </div>
    </div>
    <div style="margin-top:10px;">
      <label style="font-size:11px; color:var(--text-muted);">Supervisor Name</label>
      <input type="text" id="fieldSupervisor" class="input" placeholder="e.g. John Foreman" value="${options.supervisorName || ''}">
    </div>
  </div>

  <div class="section-title">
    <span>Subtask Shift Quantities</span>
    <span>${subtasks.length} Subtask${subtasks.length === 1 ? '' : 's'} Included</span>
  </div>

  <div id="subtasksContainer">
    ${subtasks.length === 0 ? `
      <div class="card" style="text-align:center; padding:24px; color:var(--text-muted);">
        No subtasks selected. Enter overall shift remarks below.
      </div>
    ` : subtasks.map((st, idx) => {
      const originalIdx = allSubtasks.findIndex(s => s.id === st.id);
      const num = originalIdx >= 0 ? originalIdx + 1 : idx + 1;
      return `
      <div class="card" id="st_card_${st.id || idx}">
        <div class="subtask-header">
          <div style="display:flex; gap:10px; align-items:flex-start;">
            <div class="subtask-num">#${num}</div>
            <div>
              <div class="subtask-title">${st.title}</div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                ${st.category || 'General'} • Target: ${st.targetQuantity || 0} ${st.unit || 'units'} (Prior: ${st.completedQuantity || 0})
              </div>
            </div>
          </div>
          <select id="status_${st.id || idx}" class="select" style="width:auto; padding:4px 8px; font-size:11px; font-weight:bold; margin-top:0;">
            <option value="In Progress" ${st.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${st.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Not Started" ${st.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
          </select>
        </div>

        <div style="font-size:11px; font-weight:bold; color:var(--text-muted); margin-top:6px;">
          Today's Output (${st.unit || 'units'})
        </div>
        <div class="qty-box">
          <button class="qty-btn" onclick="adjustQty('${st.id || idx}', -10)">-</button>
          <input type="number" id="qty_${st.id || idx}" class="qty-input" placeholder="0" step="any" min="0" oninput="updateCalculations()">
          <button class="qty-btn" onclick="adjustQty('${st.id || idx}', 10)">+</button>
        </div>

        ${st.isHoldPoint ? `
          <div class="hold-box">
            <div style="font-weight:bold; color:#B91C1C; display:flex; align-items:center; gap:6px;">
              🔒 QA Hold Point Inspection Gate
            </div>
            <div style="margin-top:6px; display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="hold_${st.id || idx}" style="width:18px; height:18px;" ${st.holdPointSignOff?.approved ? 'checked' : ''}>
              <label for="hold_${st.id || idx}" style="font-weight:bold;">Inspector Sign-Off Approved</label>
            </div>
            <input type="text" id="inspector_${st.id || idx}" class="input" placeholder="QA/QC Inspector Name" value="${st.holdPointSignOff?.signedBy || ''}" style="margin-top:6px;">
          </div>
        ` : ''}

        <input type="text" id="notes_${st.id || idx}" class="input" placeholder="Subtask remarks (e.g. Chainage CH 0+150 to 0+250)...">
      </div>
    `;
    }).join('')}
  </div>

  <div class="section-title">Overall Shift Remarks & Blockers</div>
  <div class="card">
    <label style="font-size:11px; color:var(--text-muted);">Delays / Blockers Encountered (Optional)</label>
    <input type="text" id="fieldDelay" class="input" placeholder="e.g. 1.5 hr rain stoppage, excavator track repair">
    
    <label style="font-size:11px; color:var(--text-muted); margin-top:10px; display:block;">General Supervisor Remarks</label>
    <textarea id="fieldRemarks" class="textarea" placeholder="Overall shift execution notes, safety toolbox talk completed, contractor handover..."></textarea>
  </div>

  <div class="sticky-bar">
    <button class="btn-secondary" onclick="copyReportCode()">📋 Copy</button>
    <button class="btn-main" onclick="sendViaWhatsApp()">
      <span>💬 Send via WhatsApp</span>
    </button>
  </div>

  <script>
    const activity = ${escapedActivity};
    const options = ${escapedOptions};

    function adjustQty(id, delta) {
      const input = document.getElementById('qty_' + id);
      const current = parseFloat(input.value) || 0;
      input.value = Math.max(0, current + delta);
      updateCalculations();
    }

    function updateCalculations() {
      // live updates if needed
    }

    function compileReportText() {
      const date = document.getElementById('fieldDate').value || new Date().toISOString().split('T')[0];
      const weather = document.getElementById('fieldWeather').value;
      const supervisor = document.getElementById('fieldSupervisor').value || 'Site Supervisor';
      const delay = document.getElementById('fieldDelay').value;
      const remarks = document.getElementById('fieldRemarks').value;

      let subtaskLines = [];
      const subtasks = activity.subtasks || [];

      subtasks.forEach((st, idx) => {
        const id = st.id || idx;
        const seqNum = st.seqIndex || (idx + 1);
        const qty = parseFloat(document.getElementById('qty_' + id)?.value) || 0;
        const status = document.getElementById('status_' + id)?.value || st.status;
        const notes = document.getElementById('notes_' + id)?.value || '';
        const holdChecked = document.getElementById('hold_' + id)?.checked;
        const inspector = document.getElementById('inspector_' + id)?.value;

        if (qty > 0 || status !== st.status || notes || holdChecked) {
          let line = '#' + seqNum + ' ' + st.title + ': [+' + qty + ' ' + (st.unit || 'units') + '] Status: ' + status;
          if (holdChecked) {
            line += ' (🔒 QA Cleared by ' + (inspector || 'Site Engineer') + ')';
          }
          if (notes) {
            line += ' - Remarks: "' + notes + '"';
          }
          subtaskLines.push(line);
        }
      });

      if (subtaskLines.length === 0) {
        subtaskLines.push('No specific subtask changes entered.');
      }

      return '*📋 SHIFT PROGRESS RETURN: ' + activity.id + ' - ' + activity.name + '*\\n' +
        '*Date:* ' + date + '\\n' +
        '*Supervisor:* ' + supervisor + '\\n' +
        '*Weather:* ' + weather + '\\n\\n' +
        '*SUBTASK OUTPUTS ACHIEVED:*\\n' +
        subtaskLines.join('\\n') + '\\n\\n' +
        (delay ? '*DELAY / BLOCKER:* ' + delay + '\\n' : '') +
        (remarks ? '*SUPERVISOR REMARKS:* ' + remarks : '*SUPERVISOR REMARKS:* Targets completed per method statement.');
    }

    function sendViaWhatsApp() {
      const text = compileReportText();
      const encoded = encodeURIComponent(text);
      window.open('https://api.whatsapp.com/send?text=' + encoded, '_blank');
    }

    function copyReportCode() {
      const text = compileReportText();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          alert('Report summary copied to clipboard! You can now paste it into WhatsApp or ConstructOS.');
        });
      } else {
        alert('Text:\\n\\n' + text);
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Triggers browser download of the standalone single-file mobile HTML shift ticket
 */
export function downloadStandaloneMobileHtml(activity: Activity, options: DispatchOptions = {}) {
  const htmlContent = generateStandaloneMobileHtml(activity, options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const filename = `${activity.id}_Shift_${options.shiftDate || new Date().toISOString().split('T')[0]}.html`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Intelligently parses a supervisor WhatsApp text return into structured inputs
 * so the admin can auto-populate the Quick Log Progress modal in 1 click!
 */
export function parseSupervisorProgressReply(rawText: string, activity: Activity): ParsedSupervisorReport {
  const result: ParsedSupervisorReport = {
    subtaskUpdates: [],
    rawText
  };

  if (!rawText || !rawText.trim()) return result;

  // Extract Date
  const dateMatch = rawText.match(/Date:\*?\s*([0-9]{4}[-/][0-9]{2}[-/][0-9]{2})/i);
  if (dateMatch) result.shiftDate = dateMatch[1].replace(/\//g, '-');

  // Extract Weather
  const weatherMatch = rawText.match(/Weather:\*?\s*([^•\n\r]+)/i);
  if (weatherMatch) result.weather = weatherMatch[1].replace(/[[\]]/g, '').trim();

  // Extract Delay / Blocker
  const delayMatch = rawText.match(/DELAY\s*\/\s*BLOCKER:\*?\s*([^\n\r]+)/i);
  if (delayMatch) {
    const dVal = delayMatch[1].replace(/[[\]]/g, '').trim();
    if (dVal.toLowerCase() !== 'none') {
      result.delayReason = dVal;
    }
  }

  // Extract Supervisor Remarks
  const remarksMatch = rawText.match(/SUPERVISOR REMARKS:\*?\s*([\s\S]+?)$/i);
  if (remarksMatch) {
    result.supervisorNotes = remarksMatch[1].replace(/[[\]]/g, '').trim();
  }

  const subtasks = activity.subtasks || [];

  // Parse each subtask line (e.g. "#1 Trench excavation: [+150 m] Status: Completed (🔒 QA Cleared by John)")
  subtasks.forEach((st, idx) => {
    const num = idx + 1;
    // Regex matching `#1 ...` or `1. ...`
    const regex = new RegExp(`(?:#|\\b)${num}[.:]\\s*([^\\n\\r]+)`, 'i');
    const match = rawText.match(regex);

    if (match) {
      const line = match[1];
      const update: ParsedSupervisorReport['subtaskUpdates'][0] = {
        subtaskId: st.id,
        subtaskIndex: idx,
        title: st.title
      };

      // Extract Shift Output +XXX or Total XXX
      const shiftQtyMatch = line.match(/\+([0-9]+(?:\.[0-9]+)?)/);
      if (shiftQtyMatch) {
        update.shiftOutput = parseFloat(shiftQtyMatch[1]);
      } else {
        const anyNumMatch = line.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:m|m2|m3|units|pcs|m²|m³)?/i);
        if (anyNumMatch) {
          update.shiftOutput = parseFloat(anyNumMatch[1]);
        }
      }

      // Extract Status
      if (/Completed|Done|Finished/i.test(line)) {
        update.status = 'Completed';
      } else if (/In Progress|Ongoing|Started/i.test(line)) {
        update.status = 'In Progress';
      }

      // Extract QA Hold Point clearance
      if (/QA Cleared|QA Approved|Signed off/i.test(line) || /🔒/i.test(line)) {
        update.holdPointApproved = true;
        const inspectorMatch = line.match(/by\s+([A-Za-z0-9\s]+?)(?:\)|-|\n|\r|$)/i);
        if (inspectorMatch) {
          update.inspectorName = inspectorMatch[1].trim();
        }
      }

      // Extract subtask notes
      const notesMatch = line.match(/Remarks:\s*"([^"]+)"/i) || line.match(/Notes?:\s*([^\n\r)]+)/i);
      if (notesMatch) {
        update.notes = notesMatch[1].trim();
      }

      result.subtaskUpdates.push(update);
    }
  });

  return result;
}
