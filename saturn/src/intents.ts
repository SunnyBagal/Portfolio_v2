import type { RingId } from './content';

export type Intent =
  | { kind: 'overview' }
  | { kind: 'ring'; ring: RingId }
  | { kind: 'story'; id: string }
  | { kind: 'unknown' };

const MOON_STORY = 'wispr-flow-india';

// Checked in order: the first match wins. Specific story names come before broad categories.
const RULES: ReadonlyArray<[RegExp, Intent]> = [
  [/\b(back|overview|home|close|exit|zoom out|reset)\b/, { kind: 'overview' }],
  [/\b(campaign|pitch|moon|wispr|whisper)\b/, { kind: 'story', id: MOON_STORY }],
  [/\blinea\b|\bwhiteboard\b/, { kind: 'story', id: 'linea' }],
  [/\brecall\b/, { kind: 'story', id: 'recall' }],
  [/\bgeo ?grid\b/, { kind: 'story', id: 'geogrid' }],
  [/\btrace ?hound\b/, { kind: 'story', id: 'tracehound' }],
  [/\bneural ?compress\b|\bcompression\b/, { kind: 'story', id: 'neuralcompress' }],
  [/\b(gpa|grades?|cgpa)\b/, { kind: 'story', id: 'gpa' }],
  [/\btracker\b|\bapplications?\b/, { kind: 'story', id: 'no-tracker' }],
  [/\btechnical head\b|\binternship\b/, { kind: 'story', id: 'technical-head' }],
  [/\bcompetitors?\b/, { kind: 'story', id: 'competitor-day-5' }],
  [/\b(mistakes?|chances?|risks?)\b/, { kind: 'ring', ring: 'middle' }],
  [/\bhow (do|does) (you|he|sunny) think\b|\bthink(ing)?\b|\blower.level\b/, { kind: 'ring', ring: 'outer' }],
  [/\b(built|build|made|make|projects?|shipped|work)\b/, { kind: 'ring', ring: 'inner' }],
];

/** Shared by voice and typed input. */
export function parseIntent(text: string): Intent {
  const t = text.toLowerCase().replace(/[^\w\s-]/g, ' ');
  for (const [re, intent] of RULES) if (re.test(t)) return intent;
  return { kind: 'unknown' };
}
