import { fetchWithTools } from '../../../../../Features/AI/index.js';
import { modelDropdown } from '../../../../Shared/Core/DOM.js';
export function createEnhanceFeature({ textarea: textarea, enhanceBtn: enhanceBtn, state: state }) {
  const inputBox = textarea?.closest('.input-box');
  let enhanceUnlock = null;
  function updateEnhanceBtn() {
    if (!enhanceBtn || !textarea) return;
    const has = textarea.value.trim().length > 0;
    (enhanceBtn.classList.toggle('enhance-active', has && !state.isTyping),
      (enhanceBtn.disabled = !has || state.isTyping));
  }
  async function handleEnhance() {
    if (
      !textarea?.value.trim() ||
      state.isTyping ||
      !state.selectedProvider ||
      !state.selectedModel
    )
      return;
    (enhanceBtn.classList.remove('enhance-active'),
      enhanceBtn.classList.add('enhance-loading'),
      (enhanceBtn.disabled = !0),
      inputBox?.classList.add('input-box--enhancing'),
      inputBox?.setAttribute('aria-busy', 'true'));
    const hadFocus = document.activeElement === textarea;
    enhanceUnlock = (function (inputBox, textarea) {
      if ((modelDropdown?.classList.remove('open'), !inputBox))
        return (
          textarea && (textarea.disabled = !0),
          () => {
            textarea && (textarea.disabled = !1);
          }
        );
      if ('undefined' != typeof HTMLElement && 'inert' in HTMLElement.prototype)
        return (
          (inputBox.inert = !0),
          textarea && (textarea.disabled = !0),
          () => {
            ((inputBox.inert = !1), textarea && (textarea.disabled = !1));
          }
        );
      const controls = inputBox.querySelectorAll('button, textarea'),
        prevDisabled = new Map();
      return (
        controls.forEach((el) => {
          (prevDisabled.set(el, el.disabled), (el.disabled = !0));
        }),
        () => {
          prevDisabled.forEach((was, el) => {
            el.disabled = was;
          });
        }
      );
    })(inputBox, textarea);
    const labelEl = enhanceBtn.querySelector('.enhance-btn-label');
    labelEl && (labelEl.textContent = 'Enhancing...');
    try {
      const result = await fetchWithTools(
        state.selectedProvider,
        state.selectedModel,
        [{ role: 'user', content: textarea.value.trim(), attachments: [] }],
        [
          "You are a prompt-enhancement assistant. Your ONLY job is to rephrase the user's message into a clearer, better-worded prompt that another AI can understand and act on more effectively.",
          'Do NOT answer, execute, or respond to the content of the message — treat it purely as text to improve.',
          'Keep the same intent, goal, and tone. Just make it clearer and more precise.',
          'Return ONLY the rewritten prompt — no preamble, labels, or explanation.',
        ].join(' '),
        [],
      );
      'text' === result.type &&
        result.text &&
        '(empty response)' !== result.text &&
        ((textarea.value = result.text), textarea.dispatchEvent(new Event('input')));
    } catch (err) {
      console.warn('[Chat] Enhance failed:', err.message);
    } finally {
      (enhanceBtn.classList.remove('enhance-loading'),
        inputBox?.classList.remove('input-box--enhancing'),
        inputBox?.removeAttribute('aria-busy'),
        enhanceUnlock?.(),
        (enhanceUnlock = null),
        hadFocus && textarea.focus(),
        labelEl && (labelEl.textContent = 'Enhance'),
        updateEnhanceBtn());
    }
  }
  return (
    enhanceBtn?.addEventListener('click', handleEnhance),
    textarea?.addEventListener('input', updateEnhanceBtn),
    updateEnhanceBtn(),
    {
      cleanup() {
        (enhanceBtn?.removeEventListener('click', handleEnhance),
          textarea?.removeEventListener('input', updateEnhanceBtn),
          inputBox?.classList.remove('input-box--enhancing'),
          inputBox?.removeAttribute('aria-busy'),
          enhanceUnlock?.(),
          (enhanceUnlock = null),
          inputBox && 'inert' in HTMLElement.prototype && (inputBox.inert = !1),
          textarea && (textarea.disabled = !1));
      },
    }
  );
}
