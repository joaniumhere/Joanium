// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/Features/Composer/Composer.js
//  Manages the message input area: auto-resize, attachment
//  paste, composer hints, and the send button state.
//
//  Exposes:
//    init(onSend)   – wire up all events; onSend() is called when the user sends
//    reset()        – clear text + attachments after a send
//    canSend()      – whether the send button should be enabled
// ─────────────────────────────────────────────

import { state }              from '../../Shared/State.js';
import { generateId }         from '../../Shared/Utils.js';
import {
  textarea, sendBtn, attachmentBtn,
  composerAttachments as composerAttachmentsEl,
  composerHint,
}                             from '../../Shared/DOM.js';
import { modelSupportsInput, getModelInputs } from '../ModelSelector/ModelSelector.js';

/* ══════════════════════════════════════════
   INTERNAL
══════════════════════════════════════════ */
let _onSend = () => {};
let _hintTimer = null;

function getModelName() {
  return state.selectedProvider?.models?.[state.selectedModel]?.name ?? 'This model';
}

function hasUnsupportedImage() {
  return state.composerAttachments.some(
    a => a.type === 'image' && !modelSupportsInput('image'),
  );
}

/* ── Send button ── */
function updateSendBtn() {
  const ready =
    (textarea.value.trim().length > 0 || state.composerAttachments.length > 0) &&
    !state.isTyping &&
    !hasUnsupportedImage();
  sendBtn.classList.toggle('ready', ready);
  sendBtn.disabled = !ready;
}

/* ── Hint banner ── */
function showHint(message, tone = 'info', { sticky = false } = {}) {
  if (!composerHint) return;
  clearTimeout(_hintTimer);
  composerHint.textContent    = message;
  composerHint.className      = `composer-hint visible ${tone}`;
  composerHint.dataset.sticky = sticky ? 'true' : 'false';
  if (!sticky)
    _hintTimer = window.setTimeout(hideHint, 2800);
}

function hideHint(force = false) {
  if (!composerHint) return;
  if (!force && composerHint.dataset.sticky === 'true') return;
  clearTimeout(_hintTimer);
  composerHint.textContent    = '';
  composerHint.className      = 'composer-hint';
  composerHint.dataset.sticky = 'false';
}

function clearCapabilityHint() {
  if (!hasUnsupportedImage()) hideHint(true);
}

/* ── Auto-resize ── */
function autoResize() {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  updateSendBtn();
}

/* ── Composer attachments ── */
function buildImageFrame(attachment, className) {
  const frame = document.createElement('div');
  frame.className = className;
  frame.title     = attachment.name || 'Pasted image';
  const img = document.createElement('img');
  img.src     = attachment.dataUrl;
  img.alt     = attachment.name || 'Pasted image';
  img.loading = 'lazy';
  frame.appendChild(img);
  return frame;
}

function renderAttachments() {
  if (!composerAttachmentsEl) return;
  composerAttachmentsEl.innerHTML = '';
  composerAttachmentsEl.hidden    = state.composerAttachments.length === 0;

  state.composerAttachments.forEach(att => {
    const chip    = document.createElement('div');
    chip.className = 'composer-attachment';
    chip.title     = att.name || 'Attachment';

    let preview;
    if (att.type === 'image') {
      preview = buildImageFrame(att, 'composer-attachment-preview');
    } else {
      const extMatch = (att.name || '').match(/\.([^.]+)$/);
      const ext = extMatch ? extMatch[1].toUpperCase() : 'FILE';
      const linesText = att.lines ? `${att.lines} lines` : 'File';
      preview = document.createElement('div');
      preview.className = 'composer-file-preview';
      preview.innerHTML = `
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">${att.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${linesText}</div>
        <div style="margin-top:auto;font-size:10px;font-weight:bold;color:var(--text-secondary);border:1px solid var(--border-subtle);border-radius:4px;padding:2px 6px;align-self:flex-start;">${ext}</div>
      `;
      preview.style.display = 'flex';
      preview.style.flexDirection = 'column';
      preview.style.alignItems = 'flex-start';
      preview.style.justifyContent = 'flex-start';
      preview.style.width = '100%';
      preview.style.height = '100%';
      preview.style.padding = '12px';
      preview.style.boxSizing = 'border-box';
    }

    const removeBtn = document.createElement('button');
    removeBtn.type      = 'button';
    removeBtn.className = 'composer-attachment-remove';
    removeBtn.setAttribute('aria-label', `Remove ${att.name || 'image'}`);
    removeBtn.textContent = 'x';
    removeBtn.addEventListener('click', () => {
      state.composerAttachments = state.composerAttachments.filter(i => i.id !== att.id);
      renderAttachments();
      clearCapabilityHint();
      updateSendBtn();
      textarea.focus();
    });

    chip.append(preview, removeBtn);
    composerAttachmentsEl.appendChild(chip);
  });
}

/* ── Clipboard image paste ── */
function readClipboardImage(item, index) {
  return new Promise(resolve => {
    const file = item.getAsFile();
    if (!file) { resolve(null); return; }
    const reader = new FileReader();
    reader.onload  = () => resolve({
      id:       generateId('attachment'),
      type:     'image',
      mimeType: file.type || 'image/png',
      name:     file.name || `Pasted image ${index + 1}`,
      dataUrl:  String(reader.result ?? ''),
    });
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function handlePaste(event) {
  const items      = Array.from(event.clipboardData?.items ?? []);
  const imageItems = items.filter(i => i.type.startsWith('image/'));
  if (imageItems.length === 0) return;

  event.preventDefault();
  const pastedText = event.clipboardData?.getData('text/plain') ?? '';
  if (pastedText) {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end   = textarea.selectionEnd   ?? start;
    textarea.value = `${textarea.value.slice(0, start)}${pastedText}${textarea.value.slice(end)}`;
    textarea.setSelectionRange(start + pastedText.length, start + pastedText.length);
    autoResize();
  }

  if (!modelSupportsInput('image')) {
    showHint(`${getModelName()} does not support image input.`, 'warning');
    updateSendBtn();
    return;
  }

  const attachments = (await Promise.all(imageItems.map(readClipboardImage))).filter(Boolean);
  if (!attachments.length) {
    showHint('That image could not be added from the clipboard.', 'warning');
    return;
  }

  state.composerAttachments = [...state.composerAttachments, ...attachments];
  renderAttachments();
  showHint(attachments.length === 1 ? 'Image added.' : `${attachments.length} images added.`);
  updateSendBtn();
}

/* ── External Drag and Drop Support ── */
export async function addAttachments(files) {
  const newAttachments = [];
  let rejectedImages = false;

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      if (!modelSupportsInput('image')) {
        rejectedImages = true;
        continue;
      }
      const dataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
      if (dataUrl) {
        newAttachments.push({
          id: generateId('attachment'),
          type: 'image',
          mimeType: file.type || 'image/png',
          name: file.name,
          dataUrl
        });
      }
    } else {
      const textContent = await file.text().catch(() => null);
      if (textContent !== null) {
        newAttachments.push({
          id: generateId('attachment'),
          type: 'file',
          mimeType: file.type || 'text/plain',
          name: file.name,
          textContent,
          lines: textContent.split('\n').length
        });
      }
    }
  }
  
  if (rejectedImages) {
    showHint(`${getModelName()} does not support images. Ignoring image files.`, 'warning');
  }

  if (newAttachments.length) {
    state.composerAttachments = [...state.composerAttachments, ...newAttachments];
    renderAttachments();
    updateSendBtn();
  }
}

/* ══════════════════════════════════════════
   PUBLIC — SYNC CAPABILITIES
   Called whenever the model changes.
══════════════════════════════════════════ */
export function syncCapabilities() {
  const supportsImages = modelSupportsInput('image');
  if (attachmentBtn) {
    attachmentBtn.classList.toggle('is-disabled', !supportsImages);
    attachmentBtn.setAttribute('aria-disabled', String(!supportsImages));
    attachmentBtn.title = supportsImages
      ? 'Paste an image from clipboard'
      : `${getModelName()} does not support image input`;
  }

  if (!supportsImages) {
    const hasImages = state.composerAttachments.some(a => a.type === 'image');
    if (hasImages) {
      state.composerAttachments = state.composerAttachments.filter(a => a.type !== 'image');
      renderAttachments();
      showHint(`Switched to a model that does not support images. Images were removed.`, 'warning');
    } else {
      clearCapabilityHint();
    }
  } else {
    clearCapabilityHint();
  }
  updateSendBtn();
}

/* ══════════════════════════════════════════
   PUBLIC — RESET  (called after send)
══════════════════════════════════════════ */
export function reset() {
  textarea.value            = '';
  textarea.style.height     = 'auto';
  state.composerAttachments = [];
  renderAttachments();
  hideHint(true);
  autoResize();
}

/* ══════════════════════════════════════════
   PUBLIC — INIT
══════════════════════════════════════════ */
export function init(onSend) {
  _onSend = onSend;

  textarea.addEventListener('input', autoResize);
  textarea.addEventListener('paste', handlePaste);
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _onSend(); }
  });

  sendBtn.addEventListener('click', _onSend);

  attachmentBtn?.addEventListener('click', () => {
    textarea.focus();
    if (!modelSupportsInput('image')) {
      showHint(`${getModelName()} only accepts text.`, 'warning');
      return;
    }
    showHint('Copy an image and paste it into the message box.');
  });

  // Re-sync when model changes
  window.addEventListener('ow:model-selection-changed', syncCapabilities);

  autoResize();
}
