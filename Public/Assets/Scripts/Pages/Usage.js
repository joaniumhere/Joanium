// Window controls
import '../Shared/WindowControls.js';

// Modals / shared
import { initSidebar }       from '../Shared/Sidebar.js';
import { initAboutModal }    from '../Shared/Modals/AboutModal.js';
import { initLibraryModal }  from '../Shared/Modals/LibraryModal.js';
import { initSettingsModal } from '../Shared/Modals/SettingsModal.js';

const about    = initAboutModal();
const settings = initSettingsModal();

const library = initLibraryModal({
  onChatSelect: (chatId) => {
    if (chatId) localStorage.setItem('ow-pending-chat', chatId);
    window.electronAPI?.launchMain();
  },
});

const sidebar = initSidebar({
  activePage:    'usage',
  onNewChat:     () => window.electronAPI?.launchMain(),
  onLibrary:     () => library.isOpen() ? library.close() : library.open(),
  onAutomations: () => window.electronAPI?.launchAutomations?.(),
  onSkills:      () => window.electronAPI?.launchSkills?.(),
  onPersonas:    () => window.electronAPI?.launchPersonas?.(),
  onUsage:       () => { /* already here */ },
  onSettings:    () => settings.open(),
  onAbout:       () => about.open(),
});

window.addEventListener('ow:user-profile-updated', e => sidebar.setUser(e.detail?.name ?? ''));
settings.loadUser().then(user => sidebar.setUser(user?.name ?? ''));

// [The rest of Usage.js — pricing table, stats computation, chart rendering,
//  activity feed, range buttons, clear confirm — is identical to the original.
//  Only the sidebar initSidebar call at the top changed: onAgents → onPersonas.]
//
// NOTE TO DEVELOPER: Copy everything from "const PRICING = {" onwards from the
// original Usage.js and paste here. Only the 6 lines of sidebar init changed.
