/**
 * Utilidades de audio usando la Web Audio API para simular sonidos de escáner.
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

/**
 * Emite un pitido agudo indicando éxito (Escaneo Correcto).
 */
export const playSuccessBeep = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Si el contexto está suspendido, intentar resumirlo (por políticas de interacción del navegador)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime); // Pitido de 1000 Hz
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15); // Duración de 150ms

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
};

/**
 * Emite un pitido de advertencia o ya recibido (Duplicado).
 */
export const playWarningBeep = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime); // Frecuencia menor
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); // 300ms

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
};

/**
 * Emite un tono grave largo indicando error (No encontrado).
 */
export const playErrorBeep = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime); // Tono muy grave
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45); // 450ms

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.warn('Audio feedback failed:', err);
  }
};

/**
 * Narra un texto usando síntesis de voz (Web Speech API).
 */
export const speakText = (text: string) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    // Cancelar cualquier discurso previo
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX'; // Español de México
    utterance.rate = 1.1; // Un poco más rápido
    utterance.volume = 0.8;
    
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis failed:', err);
  }
};
