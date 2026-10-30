// Voice + typed command bar. Both paths hand plain text to the same callback.

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

/** `onCommand` returns a short description of where the command went, shown under the bar. */
export function createCommandBar(onCommand: (text: string) => string) {
  const form = document.getElementById('cmd') as HTMLFormElement;
  const input = form.querySelector('input')!;
  const mic = form.querySelector<HTMLButtonElement>('.mic')!;
  const heard = document.getElementById('heard')!;

  const show = (text: string, result?: string) => {
    heard.replaceChildren();
    const q = document.createElement('span');
    q.className = 'q';
    q.textContent = `“${text}”`;
    heard.append(q);
    if (result) {
      const r = document.createElement('b');
      r.textContent = ` → ${result}`;
      heard.append(r);
    }
  };

  const run = (text: string) => {
    const trimmed = text.trim();
    if (trimmed) show(trimmed, onCommand(trimmed));
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value);
    input.value = '';
  });

  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) {
    mic.disabled = true;
    mic.title = 'Voice needs Chrome. Type a command instead.';
    return;
  }

  let rec: Recognition | null = null;
  const setListening = (on: boolean) => mic.setAttribute('aria-pressed', String(on));

  mic.addEventListener('click', () => {
    if (rec) {
      rec.stop();
      return;
    }
    rec = new Ctor();
    rec.lang = navigator.language || 'en-IN';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = '';
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        final ||= e.results[i].isFinal;
      }
      if (final) run(text);
      else show(text);
    };
    rec.onerror = (e) => {
      heard.textContent =
        e.error === 'not-allowed' ? 'Microphone blocked. Type a command instead.' : `Voice error: ${e.error}`;
    };
    rec.onend = () => {
      rec = null;
      setListening(false);
    };
    rec.start();
    setListening(true);
    heard.textContent = 'Listening…';
  });
}
