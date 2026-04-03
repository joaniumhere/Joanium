function clonePage(page) {
  return {
    ...page,
  };
}

const BUILTIN_PAGES = Object.freeze([
  Object.freeze({
    id: 'chat',
    label: 'New chat',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
           <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
         </svg>`,
    css: null,
    order: 1,
    section: 'top',
    moduleUrl: new URL('./Chat/UI/Render/index.js', import.meta.url).href,
  }),
  Object.freeze({
    id: 'setup',
    label: 'Setup',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
           <circle cx="12" cy="12" r="3"/>
           <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
         </svg>`,
    css: '../Setup/UI/Styles/SetupPage.css',
    order: 5,
    section: 'top',
    showInSidebar: false,
    moduleUrl: new URL('./Setup/UI/Render/index.js', import.meta.url).href,
  }),
  Object.freeze({
    id: 'automations',
    label: 'Automations',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
           <path d="M13 2L4.5 13H11l-1 9L20.5 11H14L13 2z" stroke-linejoin="round"/>
         </svg>`,
    css: '../Automations/UI/Styles/AutomationsPage.css',
    order: 20,
    section: 'top',
    moduleUrl: new URL('./Automations/UI/Render/index.js', import.meta.url).href,
  }),
  Object.freeze({
    id: 'agents',
    label: 'Agents',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
           <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14Z" stroke-linecap="round"/>
           <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14Z" stroke-linecap="round"/>
         </svg>`,
    css: '../Agents/UI/Styles/AgentsPage.css',
    order: 30,
    section: 'top',
    moduleUrl: new URL('./Agents/UI/Render/index.js', import.meta.url).href,
  }),
  Object.freeze({
    id: 'skills',
    label: 'Skills',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
           <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                 stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`,
    css: '../Skills/UI/Styles/SkillsPage.css',
    order: 40,
    section: 'top',
    moduleUrl: new URL('./Skills/UI/Render/index.js', import.meta.url).href,
  }),
  Object.freeze({
    id: 'personas',
    label: 'Personas',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
           <circle cx="12" cy="8" r="4"/>
           <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke-linecap="round"/>
         </svg>`,
    css: '../Personas/UI/Styles/PersonasPage.css',
    order: 50,
    section: 'top',
    moduleUrl: new URL('./Personas/UI/Render/index.js', import.meta.url).href,
  }),
  Object.freeze({
    id: 'events',
    label: 'Events',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
           <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`,
    css: '../Events/UI/Styles/EventsPage.css',
    order: 60,
    section: 'bottom',
    moduleUrl: new URL('./Events/UI/Render/index.js', import.meta.url).href,
  }),
  Object.freeze({
    id: 'usage',
    label: 'Usage',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
           <rect x="2" y="3" width="20" height="14" rx="2"/>
           <path d="M8 21h8M12 17v4" stroke-linecap="round"/>
         </svg>`,
    css: '../Usage/UI/Styles/UsagePage.css',
    order: 70,
    section: 'bottom',
    moduleUrl: new URL('./Usage/UI/Render/index.js', import.meta.url).href,
  }),
]);

export function getBuiltinPage(id) {
  const page = BUILTIN_PAGES.find(item => item.id === id);
  return page ? clonePage(page) : null;
}

export function getBuiltinPages() {
  return BUILTIN_PAGES.map(clonePage);
}

export default getBuiltinPages;
