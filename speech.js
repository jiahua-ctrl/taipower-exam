(() => {
  const synth = window.speechSynthesis;
  if (!synth || !('SpeechSynthesisUtterance' in window)) return;

  function clean(text){
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function optionText(letter){
    const btn = document.querySelector(`#options .option[data-answer="${letter}"]`);
    if (!btn) return '';
    const text = btn.querySelector('span:last-child');
    return clean(text ? text.textContent : btn.textContent);
  }

  function currentQuestionSpeech(){
    const q = document.getElementById('questionText');
    if (!q || !clean(q.textContent)) return '';
    const parts = [`題目。${clean(q.textContent)}`];
    ['A','B','C','D'].forEach(letter => {
      const text = optionText(letter);
      if (text) parts.push(`${letter}。${text}`);
    });
    return parts.join('。');
  }

  function chooseVoice(){
    const voices = synth.getVoices();
    return voices.find(v => /zh-TW/i.test(v.lang)) ||
      voices.find(v => /zh-Hant/i.test(v.lang)) ||
      voices.find(v => /^zh/i.test(v.lang)) || null;
  }

  function speak(){
    const text = currentQuestionSpeech();
    if (!text) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.88;
    utterance.pitch = 1;
    const voice = chooseVoice();
    if (voice) utterance.voice = voice;
    const btn = document.getElementById('readQuestionBtn');
    if (btn){ btn.textContent = '⏹ 停止朗讀'; btn.setAttribute('aria-pressed','true'); }
    utterance.onend = utterance.onerror = () => {
      if (btn){ btn.textContent = '🔊 念題目'; btn.setAttribute('aria-pressed','false'); }
    };
    synth.speak(utterance);
  }

  function toggle(){
    if (synth.speaking){
      synth.cancel();
      const btn = document.getElementById('readQuestionBtn');
      if (btn){ btn.textContent = '🔊 念題目'; btn.setAttribute('aria-pressed','false'); }
      return;
    }
    speak();
  }

  function mount(){
    const meta = document.querySelector('#quizView .question-meta');
    if (!meta || document.getElementById('readQuestionBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'readQuestionBtn';
    btn.type = 'button';
    btn.className = 'ghost read-question-btn';
    btn.textContent = '🔊 念題目';
    btn.setAttribute('aria-label','朗讀目前題目與四個選項');
    btn.setAttribute('aria-pressed','false');
    btn.addEventListener('click', toggle);
    meta.appendChild(btn);
  }

  document.addEventListener('DOMContentLoaded', mount);
  window.addEventListener('beforeunload', () => synth.cancel());
})();
