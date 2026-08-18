import { ActivityTemplate, WORKFLOW_TEMPLATES } from '../data/activityTemplates';
import { SubTask } from '../types';

export const STORAGE_KEY_WORKFLOW_TEMPLATES = 'scedih_workflow_templates';

export function getWorkflowTemplates(): ActivityTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKFLOW_TEMPLATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_WORKFLOW_TEMPLATES, JSON.stringify(WORKFLOW_TEMPLATES));
      return WORKFLOW_TEMPLATES;
    }
    const parsed: ActivityTemplate[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load workflow templates from localStorage:', err);
  }
  return WORKFLOW_TEMPLATES;
}

export function saveWorkflowTemplate(
  template: Omit<ActivityTemplate, 'id'> & { id?: string }
): ActivityTemplate {
  const existing = getWorkflowTemplates();
  let savedItem: ActivityTemplate;

  if (template.id && existing.some(t => t.id === template.id)) {
    savedItem = {
      ...template,
      id: template.id
    };
    const updatedList = existing.map(t => (t.id === template.id ? savedItem : t));
    localStorage.setItem(STORAGE_KEY_WORKFLOW_TEMPLATES, JSON.stringify(updatedList));
  } else {
    savedItem = {
      ...template,
      id: `wbs-tmpl-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    const updatedList = [savedItem, ...existing];
    localStorage.setItem(STORAGE_KEY_WORKFLOW_TEMPLATES, JSON.stringify(updatedList));
  }

  return savedItem;
}

export function deleteWorkflowTemplate(templateId: string): boolean {
  try {
    const existing = getWorkflowTemplates();
    const updatedList = existing.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY_WORKFLOW_TEMPLATES, JSON.stringify(updatedList));
    return true;
  } catch (err) {
    console.error('Failed to delete workflow template:', err);
    return false;
  }
}
