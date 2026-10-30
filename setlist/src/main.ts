import './style.css';
import { aboutSection, heroSection } from './sections/hero';
import { trajectorySection } from './sections/trajectory';
import { portfolioSection } from './sections/portfolio';
import { skillsSection } from './sections/skills';
import { educationSection } from './sections/education';
import { storiesSection } from './sections/stories';
import { contactSection } from './sections/contact';
import { navBar, nowPlaying, wireChrome } from './ui/chrome';
import { h } from './ui/dom';

const app = document.getElementById('app')!;
const { bar, links } = navBar();

const about = aboutSection();
about.dataset.nav = 'preview';

const sections = [
  heroSection(),
  about,
  trajectorySection(),
  portfolioSection(),
  skillsSection(),
  educationSection(),
  storiesSection(),
  contactSection(),
];

app.append(bar, h('main', {}, ...sections));
wireChrome(sections, links, nowPlaying());

document.fonts.ready.then(() => {
  // Section heights change once the display fonts land.
  dispatchEvent(new Event('resize'));
  document.body.dataset.ready = '1';
});
