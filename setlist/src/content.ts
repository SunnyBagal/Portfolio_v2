// All copy for the Setlist portfolio lives here. Swap in real text freely;
// anything wrapped in PLACEHOLDER() renders with a dashed underline on screen.

export interface Placeholder {
  readonly placeholder: string;
}
export interface Link {
  readonly href: string;
  readonly text: string;
}
export interface Strong {
  readonly strong: string;
}
export type Inline = string | Placeholder | Link | Strong;
/** A paragraph or fact: plain text, or a run of inline pieces. */
export type Rich = string | readonly Inline[];

export const PLACEHOLDER = (what: string): Placeholder => ({ placeholder: what });
const link = (href: string, text: string): Link => ({ href, text });
const b = (strong: string): Strong => ({ strong });

export type Hue = 'lime' | 'pink' | 'red' | 'cyan' | 'green' | 'orange' | 'paper' | 'ink' | 'navy';

export const person = {
  name: 'Sunny Bagal',
  handle: 'Sunny',
  email: 'sunnybagal.1110@gmail.com',
  github: 'https://github.com/SunnyBagal',
  githubLabel: 'github.com/SunnyBagal',
  location: 'Navi Mumbai',
  /** Leave as a placeholder until a CV PDF is dropped into public/. */
  cv: PLACEHOLDER('link to your CV PDF'),
};

export const nav = [
  { id: 'preview', label: 'The Preview' },
  { id: 'trajectory', label: 'Trajectory' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'stories', label: 'Stories' },
  { id: 'contact', label: 'Contact' },
] as const;

export const hero = {
  greeting: 'HEY YO',
  callMe: 'they call me',
  title: ['Backend engineer', 'who goes', 'one level down'] as const,
  tags: ['Raw WebSockets', 'RAG', 'Canvas 2D', 'Drizzle'],
  intro:
    'B.Tech Computer Engineering at NMIMS Navi Mumbai, class of 2026. I reach for the layer under the abstraction: raw ws over Socket.IO, Drizzle over Prisma, my own RAG over LangChain. If your problem lives one level down, let’s build the set together.',
  /** Drop a photo at public/sunny.jpg and it replaces the placeholder art. */
  photo: '/sunny.jpg',
  stickers: [
    { text: 'SUNNY', hue: 'paper', font: 'marker', x: '-2%', y: '6%', r: -6 },
    { text: '4 ENGINEERS LED', hue: 'lime', font: 'display', x: '47%', y: '12%', r: -5, wideOnly: true },
    { text: 'OPEN TO BANGALORE', hue: 'cyan', font: 'display', x: '88%', y: '8%', r: 6, wideOnly: true },
    { text: 'LET’S BUILD ONE LEVEL DOWN', hue: 'pink', font: 'display', x: '60%', y: '58%', r: -6 },
    { text: 'RAG', hue: 'red', font: 'display', x: '52%', y: '76%', r: 4, wideOnly: true },
  ] as { text: string; hue: Hue; font: 'marker' | 'display'; x: string; y: string; r: number; wideOnly?: boolean }[],
  stats: [
    { value: 5, suffix: '', label: 'Projects built and shipped', hue: 'red' },
    { value: 4, suffix: '', label: 'Engineers led at InteleCorp', hue: 'orange' },
    { value: 100, suffix: '+', label: 'Applications before I built a tracker', hue: 'green' },
    { value: 2, suffix: '', label: 'Apps live on sunnybagal.com', hue: 'cyan' },
  ] as { value: number; suffix: string; label: string; hue: Hue }[],
  tape: [
    'Backend',
    'Raw WebSockets',
    'Hybrid retrieval',
    'Canvas 2D',
    'Geospatial',
    'Drizzle',
    'ML compression',
    'Code review',
  ],
};

export const about = {
  heading: 'From the idea to',
  script: 'the layer below',
  columns: [
    [
      'Backend engineer graduating in 2026 from NMIMS Navi Mumbai. As Technical Head at InteleCorp Software India I led ',
      b('4 engineers for 4 months'),
      ' building GeoGrid, a geospatial lead-generation platform.',
    ],
    [
      'On my own I built a collaborative whiteboard on raw WebSockets and Canvas 2D, a RAG link organizer with hybrid retrieval, a repo-graph repair agent that became a PR reviewer, and ML image compression research. ',
      b('I like knowing what the library is doing for me.'),
    ],
  ] as Rich[],
  pills: [
    'Raw WebSockets',
    'Canvas 2D',
    'Custom RAG pipelines',
    'Hybrid retrieval',
    'Drizzle over Prisma',
    'Leading small teams',
  ],
  note: {
    title: 'Open to backend roles in Bangalore',
    body: 'Graduating 2026. Based in Navi Mumbai and happy to relocate to Bangalore.',
    cta: 'Let’s talk',
  },
};

export interface Track {
  readonly side: string;
  readonly name: string;
  readonly role: string;
  readonly when: Rich;
  readonly cardTitle: string;
  readonly cardMeta: string;
  readonly bullets: readonly Rich[];
}

export const trajectory = {
  intro: [
    'Every project, every team and every dead end added something to the way I think. Some tracks were hits. Others left lessons. ',
    b('Press play on my story.'),
  ] as Rich,
  bpm: 90,
  tracks: [
    {
      side: 'A1',
      name: 'InteleCorp Software India',
      role: 'Technical Head (internship)',
      when: '4 months',
      cardTitle: 'Technical Head',
      cardMeta: 'InteleCorp Software India · Internship · 4 months',
      bullets: [
        ['Led a team of ', b('4 engineers'), ' for ', b('4 months'), '.'],
        ['Built ', b('GeoGrid'), ', a geospatial lead-generation platform.'],
        ['Lesson: ', PLACEHOLDER('the lesson you took from leading the team')],
      ],
    },
    {
      side: 'A2',
      name: 'Linea',
      role: 'Collaborative whiteboard',
      when: 'Live',
      cardTitle: 'Linea',
      cardMeta: 'Side project · Live',
      bullets: [
        ['A collaborative whiteboard on ', b('raw WebSockets'), ' and ', b('Canvas 2D'), '.'],
        'No Socket.IO and no canvas library: the sync and the drawing are both written by hand.',
        ['Live at ', link('https://linea.sunnybagal.com', 'linea.sunnybagal.com')],
      ],
    },
    {
      side: 'B1',
      name: 'Recall',
      role: 'RAG link organizer',
      when: 'Live',
      cardTitle: 'Recall',
      cardMeta: 'Side project · Live',
      bullets: [
        ['A link organizer built on ', b('RAG with hybrid retrieval'), '.'],
        'Custom retrieval pipeline, no LangChain.',
        ['Live at ', link('https://recall.sunnybagal.com', 'recall.sunnybagal.com')],
      ],
    },
    {
      side: 'B2',
      name: 'TraceHound',
      role: 'Repo graph → PR reviewer',
      when: 'Pivoted',
      cardTitle: 'TraceHound',
      cardMeta: 'Side project · Pivoted',
      bullets: [
        ['Started as a ', b('repo graph plus repair agent'), '.'],
        ['On ', b('day 5'), ' I found CodeRabbit and Greptile already covered most of it.'],
        ['Finished it anyway, then pivoted it into a ', b('PR reviewer scored on a public code-review benchmark'), '.'],
      ],
    },
    {
      side: 'B3',
      name: 'NeuralCompress',
      role: 'ML image compression research',
      when: 'Research',
      cardTitle: 'NeuralCompress',
      cardMeta: 'Research',
      bullets: [
        ['Research into ', b('machine-learned image compression'), '.'],
        ['Result: ', PLACEHOLDER('what the research found')],
      ],
    },
    {
      side: 'B4',
      name: 'The Gmail tracker',
      role: 'Tool built out of a job hunt',
      when: '2–3 weeks',
      cardTitle: 'The Gmail tracker',
      cardMeta: 'Side project · Job hunt',
      bullets: [
        ['Sent ', b('100–130 applications in 2–3 weeks'), ' with no tracker.'],
        ['Around ', b('30 rejections'), ' later, I built a tracker from my Gmail.'],
        ['Lesson: ', PLACEHOLDER('the lesson from the application sprint')],
      ],
    },
  ] as Track[],
};

export interface Project {
  readonly id: 'linea' | 'recall' | 'tracehound';
  readonly kicker: string;
  readonly overlay: string;
  readonly title: string;
  readonly meta: string;
  readonly href: string;
  readonly frame: Hue;
  readonly tilt: number;
}

export const portfolio = {
  intro: [
    'From hand-rolled sync over WebSockets to retrieval without a framework. ',
    b('The library is the medium. Understanding it is the goal.'),
  ] as Rich,
  projects: [
    {
      id: 'linea',
      kicker: 'Raw ws · Canvas 2D',
      overlay: 'Whiteboard',
      title: 'Linea',
      meta: 'Live · linea.sunnybagal.com',
      href: 'https://linea.sunnybagal.com',
      frame: 'lime',
      tilt: -3,
    },
    {
      id: 'recall',
      kicker: 'RAG · Hybrid retrieval',
      overlay: 'Link Organizer',
      title: 'Recall',
      meta: 'Live · recall.sunnybagal.com',
      href: 'https://recall.sunnybagal.com',
      frame: 'ink',
      tilt: 2,
    },
    {
      id: 'tracehound',
      kicker: 'Repo graph · Agents',
      overlay: 'PR Reviewer',
      title: 'TraceHound',
      meta: 'Pivoted · GitHub',
      href: 'https://github.com/SunnyBagal',
      frame: 'orange',
      tilt: -1.5,
    },
  ] as Project[],
  allLabel: 'See everything on GitHub',
  /** The logo strip: places and projects, set as wordmarks. */
  marks: ['NMIMS', 'InteleCorp', 'GeoGrid', 'Linea', 'Recall', 'TraceHound', 'NeuralCompress'],
};

export interface Sticker {
  readonly text: string;
  readonly hue: Hue;
  readonly shape: 'rect' | 'pill' | 'circle';
  readonly font: 'display' | 'marker';
  /** Position in % of the board, rotation in degrees. */
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly w?: number;
}

export const skills = {
  intro: 'Every sticker is a skill. Drag them, rearrange them, stick them wherever you like.',
  reset: 'Re-stick',
  stickers: [
    { text: 'Backend engineering', hue: 'lime', shape: 'rect', font: 'display', x: 2, y: 14, r: -6 },
    { text: 'Raw WebSockets', hue: 'cyan', shape: 'pill', font: 'display', x: 22, y: 6, r: 5 },
    { text: 'Hybrid retrieval', hue: 'pink', shape: 'circle', font: 'display', x: 41, y: 8, r: 0 },
    { text: '• Going one level down', hue: 'paper', shape: 'rect', font: 'marker', x: 55, y: 1, r: 8, w: 230 },
    { text: 'Canvas 2D', hue: 'green', shape: 'rect', font: 'display', x: 83, y: 16, r: -3 },
    { text: 'Drizzle ORM', hue: 'red', shape: 'pill', font: 'display', x: 5, y: 40, r: 4 },
    { text: '• Custom RAG', hue: 'orange', shape: 'rect', font: 'marker', x: 22, y: 36, r: -9 },
    { text: 'Real-time sync', hue: 'cyan', shape: 'circle', font: 'display', x: 42, y: 39, r: 0 },
    { text: 'Geospatial platforms', hue: 'paper', shape: 'rect', font: 'display', x: 56, y: 37, r: -2 },
    { text: 'Leading small teams', hue: 'lime', shape: 'pill', font: 'display', x: 77, y: 44, r: 10 },
    { text: '• Repo graphs', hue: 'pink', shape: 'rect', font: 'marker', x: 2, y: 66, r: -4, w: 220 },
    { text: 'ML image compression', hue: 'lime', shape: 'circle', font: 'display', x: 24, y: 64, r: 0 },
    { text: 'Code review agents', hue: 'red', shape: 'rect', font: 'display', x: 37, y: 76, r: -5 },
    { text: 'Shipping anyway', hue: 'green', shape: 'pill', font: 'display', x: 56, y: 63, r: 3 },
    { text: '• Building my own tools', hue: 'cyan', shape: 'rect', font: 'marker', x: 72, y: 73, r: -6, w: 240 },
  ] as Sticker[],
  /** Two stickers that have "fallen off" to the bottom edge, like the original. */
  fallen: [
    { text: 'Lower-level tools', hue: 'green', shape: 'rect', font: 'display', x: 12, y: 97, r: 3 },
    { text: 'Benchmarks', hue: 'pink', shape: 'pill', font: 'display', x: 76, y: 96, r: -4 },
  ] as Sticker[],
};

export type Pattern = 'solid' | 'stripes' | 'bars' | 'rings' | 'dots' | 'checks';

export interface CrateRecord {
  readonly spine: string;
  readonly year: string;
  readonly title: string;
  readonly where: string;
  readonly body: Rich;
  readonly hue: Hue;
  readonly ink: Hue;
  readonly pattern: Pattern;
}

export const education = {
  dig: 'Diggin’ in the crates.',
  intro: [
    ' Every record holds something I learned. One came with a degree. The rest I taught myself by building, and a few reminded me that ',
    b('sometimes you have to go down a level to move forward.'),
  ] as Rich,
  label: 'Sunny · Records',
  records: [
    {
      spine: '2026',
      year: '2026',
      title: 'B.Tech, Computer Engineering',
      where: 'NMIMS Navi Mumbai',
      body: 'Bachelor of Technology in Computer Engineering. GPA 7.38 / 10 (2.95 / 4.0).',
      hue: 'lime',
      ink: 'ink',
      pattern: 'rings',
    },
    {
      spine: 'LEAD',
      year: 'Internship',
      title: 'Leading four engineers',
      where: 'InteleCorp Software India',
      body: ['Four months as Technical Head, building GeoGrid with a team of four. ', PLACEHOLDER('what leading taught you')],
      hue: 'pink',
      ink: 'ink',
      pattern: 'stripes',
    },
    {
      spine: 'WS',
      year: 'Self-taught',
      title: 'Raw WebSockets & Canvas 2D',
      where: 'Linea',
      body: 'Real-time collaboration written against the bare ws library and the Canvas 2D API, with no framework doing the sync or the drawing.',
      hue: 'cyan',
      ink: 'ink',
      pattern: 'solid',
    },
    {
      spine: 'RAG',
      year: 'Self-taught',
      title: 'Retrieval without a framework',
      where: 'Recall',
      body: 'A RAG pipeline with hybrid retrieval, written from scratch without LangChain.',
      hue: 'red',
      ink: 'paper',
      pattern: 'bars',
    },
    {
      spine: 'AGENT',
      year: 'Self-taught',
      title: 'Repo graphs & review agents',
      where: 'TraceHound',
      body: 'A repo graph and repair agent, later turned into a PR reviewer scored on a public code-review benchmark.',
      hue: 'paper',
      ink: 'red',
      pattern: 'solid',
    },
    {
      spine: 'ML',
      year: 'Research',
      title: 'ML image compression',
      where: 'NeuralCompress',
      body: ['Research into machine-learned image compression. ', PLACEHOLDER('what you studied or found')],
      hue: 'green',
      ink: 'ink',
      pattern: 'dots',
    },
    {
      spine: 'GEO',
      year: 'Internship',
      title: 'Geospatial lead generation',
      where: 'GeoGrid',
      body: 'A geospatial lead-generation platform, built during the InteleCorp internship.',
      hue: 'orange',
      ink: 'ink',
      pattern: 'checks',
    },
  ] as CrateRecord[],
};

export interface Single {
  readonly side: string;
  readonly cover: 'pink' | 'lime' | 'cyan';
  readonly art: 'inbox' | 'hound' | 'wave';
  readonly meta: string;
  readonly title: string;
  readonly blurb: Rich;
  readonly tags: readonly string[];
  readonly href?: string;
}

export const stories = {
  intro: 'Three stories from building things. Three singles, side A.',
  more: 'More on GitHub',
  singles: [
    {
      side: 'Side A · 1',
      cover: 'pink',
      art: 'inbox',
      meta: 'Story · Job hunt',
      title: '100+ applications, no tracker. So I built one from my Gmail.',
      blurb: '100–130 applications in 2–3 weeks, about 30 rejections, and no way to tell which was which.',
      tags: ['job-hunt', 'tooling', 'gmail'],
    },
    {
      side: 'Side A · 2',
      cover: 'lime',
      art: 'hound',
      meta: 'Story · TraceHound',
      title: 'Day 5: CodeRabbit and Greptile already did it. I finished anyway.',
      blurb: 'Then I pivoted it into a PR reviewer scored on a public code-review benchmark.',
      tags: ['tracehound', 'pivot', 'code-review'],
    },
    {
      side: 'Side A · 3',
      cover: 'cyan',
      art: 'wave',
      meta: 'Campaign pitch · Wispr Flow India',
      title: 'Keep talking. Send the text.',
      blurb: 'People hate receiving 4-minute voice notes. Flow turns your voice note into the text you should’ve sent.',
      tags: ['campaign', 'wispr-flow', 'india'],
    },
  ] as Single[],
};

export const contact = {
  lines: [
    [
      { t: 'Build ', script: false },
      { t: 'the', script: true },
    ],
    [
      { t: 'next set', script: true },
      { t: '?', script: false },
    ],
  ],
  body: [
    'A backend problem nobody has managed to crack? A system that needs someone to go one level down? A team in Bangalore that needs another engineer? ',
    b('Let’s talk.'),
  ] as Rich,
  copy: 'Copy email',
  copied: 'Copied!',
  wall: {
    hint: 'Leave your tag here',
    download: 'Take your tag',
  },
};

export const footer = {
  blurb: 'Backend engineering that goes one level down. From the abstraction to the layer below.',
  setlist: 'Setlist',
  talk: 'Let’s talk',
  copyright: `© ${new Date().getFullYear()} Sunny Bagal · Navi Mumbai`,
  top: 'Back to top',
};
