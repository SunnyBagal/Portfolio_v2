// All copy for the Saturn portfolio lives here. Swap in real text freely;
// anything wrapped in PLACEHOLDER() renders with a dashed underline on screen.

export type RingId = 'inner' | 'middle' | 'outer';
export type Orbit = RingId | 'moon';
export type StoryKind =
  | 'built'
  | 'chance taken'
  | 'mistake'
  | 'decision'
  | 'known issue'
  | 'design'
  | 'campaign';

export interface Placeholder {
  readonly placeholder: string;
}
export interface Link {
  readonly href: string;
  readonly text: string;
}
export type Inline = string | Placeholder | Link;
/** A paragraph or fact: plain text, or a run of inline pieces. */
export type Rich = string | readonly Inline[];

export const PLACEHOLDER = (what: string): Placeholder => ({ placeholder: what });
const link = (href: string, text: string): Link => ({ href, text });

export interface Story {
  readonly id: string;
  readonly orbit: Orbit;
  /** Short name shown on the rock's label. */
  readonly label: string;
  readonly title: string;
  readonly kind: StoryKind;
  readonly status?: string;
  readonly facts: readonly Rich[];
  readonly summary: readonly Rich[];
  readonly whatHappened?: readonly Rich[];
  readonly whatChanged?: readonly Rich[];
  /** Overrides for the three section headings. */
  readonly headings?: { summary?: string; whatHappened?: string; whatChanged?: string };
  /** Raw voice transcript the section was written from. */
  readonly rawDictation: readonly Rich[];
  /** Another story worth reading next. */
  readonly related?: string;
}

export const profile = {
  name: 'Sunny Bagal',
  tagline: 'Sunny Bagal: backend engineer who goes one level down.',
  github: link('https://github.com/SunnyBagal', 'github.com/SunnyBagal'),
  email: link('mailto:sunnybagal.1110@gmail.com', 'sunnybagal.1110@gmail.com'),
  location: 'Navi Mumbai, open to relocating to Bangalore.',
} as const;

export const rings: Record<RingId, { name: string }> = {
  inner: { name: 'Things I built' },
  middle: { name: 'Chances and mistakes' },
  outer: { name: 'How I think' },
};

export const moon = { name: 'Campaign pitch' } as const;

const RAW: readonly Rich[] = [[PLACEHOLDER('paste the raw Wispr Flow transcript for this section')]];

const linea = link('https://linea.sunnybagal.com', 'linea.sunnybagal.com');
const recall = link('https://recall.sunnybagal.com', 'recall.sunnybagal.com');

export const stories: readonly Story[] = [
  // Inner ring: things I built
  {
    id: 'linea',
    orbit: 'inner',
    label: 'Linea',
    title: 'Linea',
    kind: 'built',
    facts: [[linea], 'Raw WebSockets', 'Canvas 2D'],
    summary: ['Collaborative whiteboard on raw WebSockets and Canvas 2D.'],
    rawDictation: RAW,
  },
  {
    id: 'recall',
    orbit: 'inner',
    label: 'Recall',
    title: 'Recall',
    kind: 'built',
    facts: [[recall], 'RAG', 'Hybrid retrieval'],
    summary: ['RAG link organizer with hybrid retrieval.'],
    rawDictation: RAW,
  },
  {
    id: 'geogrid',
    orbit: 'inner',
    label: 'GeoGrid',
    title: 'GeoGrid',
    kind: 'built',
    facts: ['InteleCorp internship', 'Geospatial lead generation'],
    summary: ['Geospatial lead-generation platform, built during the InteleCorp internship.'],
    rawDictation: RAW,
    related: 'technical-head',
  },
  {
    id: 'tracehound',
    orbit: 'inner',
    label: 'TraceHound',
    title: 'TraceHound',
    kind: 'built',
    facts: ['Repo graph + repair agent', 'Pivoted to PR reviewer'],
    summary: [
      'Repo graph plus repair agent, pivoted to a PR reviewer scored on a public code-review benchmark.',
    ],
    rawDictation: RAW,
    related: 'competitor-day-5',
  },
  {
    id: 'neuralcompress',
    orbit: 'inner',
    label: 'NeuralCompress',
    title: 'NeuralCompress',
    kind: 'built',
    facts: ['Research', 'ML image compression'],
    summary: ['ML image compression research.'],
    rawDictation: RAW,
  },

  // Middle ring: chances and mistakes
  {
    id: 'technical-head',
    orbit: 'middle',
    label: 'Technical Head',
    title: 'Took Technical Head on my first internship',
    kind: 'chance taken',
    facts: ['InteleCorp Software India', '4 months', 'Led 4 engineers', 'GeoGrid'],
    summary: ['On my first internship, I took the Technical Head role.'],
    whatHappened: [
      'At InteleCorp Software India I led 4 engineers for 4 months, building GeoGrid, a geospatial lead-generation platform.',
    ],
    whatChanged: [['Lesson: ', PLACEHOLDER('the lesson you took from leading the team')]],
    rawDictation: RAW,
  },
  {
    id: 'gpa',
    orbit: 'middle',
    label: 'GPA 2.95',
    title: 'GPA 2.95 / 4.0',
    kind: 'known issue',
    status: 'won’t fix',
    facts: ['2.95 / 4.0', '7.38 / 10', 'B.Tech Computer Engineering', 'NMIMS Navi Mumbai', '2026'],
    summary: ['My GPA is 2.95 / 4.0. Known issue, won’t fix.'],
    whatHappened: ['7.38 / 10 in B.Tech Computer Engineering at NMIMS Navi Mumbai (2026).'],
    whatChanged: [
      [
        'Shipped and deployed projects you can open right now: ',
        link(linea.href, 'Linea'),
        ' and ',
        link(recall.href, 'Recall'),
        '.',
      ],
    ],
    headings: { whatChanged: 'Mitigation' },
    rawDictation: RAW,
  },
  {
    id: 'no-tracker',
    orbit: 'middle',
    label: 'No tracker',
    title: 'Sent 100+ applications with no tracker',
    kind: 'mistake',
    facts: ['100–130 applications', '2–3 weeks', '~30 rejections', 'No tracker kept'],
    summary: ['I sent 100+ applications and kept no tracker.'],
    whatHappened: ['100–130 applications in 2–3 weeks. Around 30 rejections. No tracker kept.'],
    whatChanged: [
      'Built a tracker from my Gmail, and started asking people who got in how they did it.',
      ['Lesson: ', PLACEHOLDER('the lesson from the application sprint')],
    ],
    rawDictation: RAW,
  },
  {
    id: 'competitor-day-5',
    orbit: 'middle',
    label: 'Competitor on day 5',
    title: '5 days in, a competitor already existed',
    kind: 'decision',
    facts: ['TraceHound', 'Repo graph + repair agent', 'Day 5', 'CodeRabbit, Greptile'],
    summary: ['Five days into TraceHound, research showed a competitor already existed. I decided to finish anyway.'],
    whatHappened: [
      'TraceHound was a repo graph plus repair agent. On day 5, research showed CodeRabbit and Greptile already covered most of it.',
    ],
    whatChanged: [
      'I finished it anyway and pivoted it to a PR reviewer, scored on a public code-review benchmark.',
      'Root cause: I started building before checking what existed.',
    ],
    rawDictation: RAW,
    related: 'tracehound',
  },

  // Outer ring: how I think
  {
    id: 'lower-level',
    orbit: 'outer',
    label: 'Lower-level tools',
    title: 'I pick the lower-level tool on purpose',
    kind: 'design',
    facts: ['Drizzle over Prisma', 'Raw ws over Socket.IO', 'Custom RAG, no LangChain', 'Raw Canvas 2D'],
    summary: ['I pick the lower-level tool on purpose.'],
    whatHappened: [
      'Drizzle over Prisma.',
      'Raw ws over Socket.IO.',
      'Custom RAG without LangChain.',
      'Raw Canvas 2D.',
    ],
    whatChanged: [[PLACEHOLDER('why you reach for the lower-level tool')]],
    headings: { whatHappened: 'The choices', whatChanged: 'Why' },
    rawDictation: RAW,
  },

  // Moon: campaign pitch
  {
    id: 'wispr-flow-india',
    orbit: 'moon',
    label: 'Wispr Flow India',
    title: 'Campaign proposal: Wispr Flow India',
    kind: 'campaign',
    facts: ['Wispr Flow', 'India', '“Keep talking. Send the text.”', ['Channels: ', PLACEHOLDER('channels')]],
    summary: ['India sends voice notes all day, and the people receiving 4-minute voice notes hate them.'],
    whatHappened: ['Flow turns your voice note into the text you should’ve sent.'],
    whatChanged: ['Line: “Keep talking. Send the text.”', ['Channels: ', PLACEHOLDER('channels')]],
    headings: { summary: 'Insight', whatHappened: 'The idea', whatChanged: 'Line and channels' },
    rawDictation: RAW,
  },
];

export const kindLabel = (s: Story) => (s.status ? `${s.kind} · ${s.status}` : s.kind);
