(function () {
'use strict';

//  THE LONG ROAD — Core Engine v2
// ════════════════════════════════════════════════════════

const SAVE_KEY  = 'tlr_save_v2';
const LOG_MAX   = 500;
const LOG_PAGE_SIZE = 40;
const Core = window.OLFLongRoadCore;
const appRoot   = document.querySelector('.tlr-app');
const saveUrl   = appRoot ? appRoot.dataset.saveUrl : '';
const serverRevision = appRoot ? Math.max(0, Number(appRoot.dataset.stateRevision) || 0) : 0;
let serverStateRead = false;
let saveTimer = null;
const uiPhrase = (key, fallback) => appRoot?.dataset[key] || fallback;
const rewardTracker = Core.createRewardActivityTracker(() => {
  if (state) updateUI();
});

// ── Shared game rules ─────────────────────────────────
const {
  LOCATIONS, AFFINITY_THRESHOLDS, SKILLS, TITLES, ITEMS,
  expToNext, maxHP, maxMP, maxSP
} = Core;

// ── Events ────────────────────────────────────────────
// Each event has: type, weight, affinity, text(state), rewards()
const EVENTS = [
  // ENDURANCE
  { weight: 8, affinity: 'endurance',
    text: () => `You find a good walking stick by the road. You carry it for a while before leaving it somewhere else deserving.`,
    rewards: () => ({ exp: 4, sp: 15 }) },
  { weight: 7, affinity: 'endurance',
    text: () => `Rain arrives without clouds. You walk through it anyway. It smells like somewhere you have not been yet.`,
    rewards: () => ({ exp: 8, hp: 5 }) },
  { weight: 6, affinity: 'endurance',
    text: () => `A steep hill you did not see coming. You crest it breathing hard, and the view from the top costs nothing extra.`,
    rewards: () => ({ exp: 12, sp: -10 }) },
  { weight: 5, affinity: 'endurance',
    text: () => `You rest under a tree for a while. When you stand, the bark behind you is carved with a name you almost recognise.`,
    rewards: () => ({ exp: 5, sp: 20 }) },
  { weight: 4, affinity: 'endurance',
    text: () => `The road turns to mud for a long stretch. You arrive at the other end heavier, slower, and somehow more certain.`,
    rewards: () => ({ exp: 18, sp: -15 }) },
  { weight: 3, affinity: 'endurance',
    text: () => `A stone in your boot for three miles. You finally stop to remove it and feel almost philosophical about the experience.`,
    rewards: () => ({ exp: 10 }) },
{ weight: 3, affinity: 'endurance',
    text: () => `You walk through the tail end of someone else's campfire smoke. Whoever made it is long gone. The smell stays with you for the rest of the afternoon — woodsmoke and something cooking — and you find it unexpectedly comforting.`,
    rewards: () => ({ exp: 12, sp: 12 }) },

  // LUCK
  { weight: 8, affinity: 'luck',
    text: () => `A coin on the road. You pick it up. On the way down you noticed it does not have two sides.`,
    rewards: () => ({ exp: 6 }) },
  { weight: 6, affinity: 'luck',
    text: () => `A thin mist rolls in from nowhere. When it clears you are half a mile further than you expected to be.`,
    rewards: () => ({ exp: 30, sp: 20 }) },
  { weight: 5, affinity: 'luck',
    text: () => `Someone has left a loaf of bread on a milestone. Fresh. You eat half and leave the rest.`,
    rewards: () => ({ exp: 10, hp: 20 }) },
  { weight: 4, affinity: 'luck',
    text: () => `You trip on a root and catch yourself on a fence post. Behind the fence is an orchard. The gate is unlocked.`,
    rewards: () => ({ exp: 14, hp: 15 }) },
  { weight: 3, affinity: 'luck',
    text: () => `A hawk drops something from the sky directly into your path. It is not interesting, but the odds were remarkable.`,
    rewards: () => ({ exp: 8 }) },
  { weight: 2, affinity: 'luck',
    text: () => `A fork in the road that appears on no map. You take the left path. An hour later both roads arrive at the same place.`,
    rewards: () => ({ exp: 25 }) },
{ weight: 4, affinity: 'luck',
    text: () => `You find a coin, then another, then another. A trail of them leading off the road into the grass. You follow three more before deciding you have somewhere to be.`,
    rewards: () => ({ exp: 18, hp: 10 }) },

  // ARCANE
  { weight: 7, affinity: 'arcane',
    text: () => `You hear singing from somewhere off the road. Following it leads only to an empty clearing and a faint smell of smoke.`,
    rewards: () => ({ exp: 12, mp: 10 }) },
  { weight: 6, affinity: 'arcane',
    text: () => `A fire on a distant hill goes out the moment you notice it.`,
    rewards: () => ({ exp: 8 }) },
  { weight: 5, affinity: 'arcane',
    text: () => `The road ahead shimmers for a moment and shows you a version of itself with no traveler on it. Then it is ordinary again.`,
    rewards: () => ({ exp: 20, mp: 15 }) },
  { weight: 4, affinity: 'arcane',
    text: () => `A shadow crosses the road with no source above it. It moves against the wind.`,
    rewards: () => ({ exp: 15 }) },
  { weight: 3, affinity: 'arcane',
    text: () => `Your reflection in a puddle blinks a half-second after you do.`,
    rewards: () => ({ exp: 18, mp: 10 }) },
  { weight: 2, affinity: 'arcane',
    text: () => `At a crossroads, all four directions show the same view. You choose one anyway and it resolves into somewhere new.`,
    rewards: () => ({ exp: 35, mp: 20 }) },
{ weight: 3, affinity: 'arcane',
    text: () => `A section of road that you are certain you have walked before, despite having never been here. The feeling fades after a mile. The unease does not.`,
    rewards: () => ({ exp: 20, mp: -12 }) },

  // NATURE
  { weight: 10, affinity: 'nature',
    text: () => `A cat crosses the road ahead of you and sits watching until you pass. It does not blink.`,
    rewards: () => ({ exp: 2 }) },
  { weight: 8, affinity: 'nature',
    text: () => `A bird follows you for a mile. When it finally turns back it seems disappointed.`,
    rewards: () => ({ exp: 6 }) },
  { weight: 6, affinity: 'nature',
    text: () => `A deer on the road. You both stop. It regards you with complete calm before walking into the trees.`,
    rewards: () => ({ exp: 8, hp: 5 }) },
  { weight: 5, affinity: 'nature',
    text: () => `Wildflowers on the verge, a colour you cannot name. You sit with them for a while and feel restored.`,
    rewards: () => ({ exp: 6, hp: 15, sp: 10 }) },
  { weight: 4, affinity: 'nature',
    text: () => `A fox trots alongside you for a quarter mile as if it has somewhere to be in the same direction.`,
    rewards: () => ({ exp: 10 }) },
  { weight: 3, affinity: 'nature',
    text: () => `A section of road entirely covered in butterflies. You slow down. They do not move. You eventually walk through them gently.`,
    rewards: () => ({ exp: 14, hp: 10 }) },
{ weight: 5, affinity: 'nature',
    text: () => `The road passes through a short tunnel of overgrown hedgerow, completely enclosed for twenty paces. When you emerge on the other side everything looks slightly more itself than before.`,
    rewards: () => ({ exp: 10, hp: 8, sp: 8 }) },

  // SOCIAL
  { weight: 8, affinity: 'social',
    text: () => `A merchant heading the other way stops to warn you about the road ahead. He cannot say exactly what is wrong with it.`,
    rewards: () => ({ exp: 5 }) },
  { weight: 7, affinity: 'social',
    text: () => `A child runs past going the other direction, laughing at nothing. You watch until the sound fades.`,
    rewards: () => ({ exp: 2 }) },
  { weight: 6, affinity: 'social',
    text: () => `An old man at a crossroads offers advice. It is deeply unhelpful, but delivered with such conviction you thank him anyway.`,
    rewards: () => ({ exp: 8 }) },
  { weight: 5, affinity: 'social',
    text: () => `You stop to help a cart that has lost a wheel. The driver says nothing the entire time. When you finish, the cart is already gone.`,
    rewards: () => ({ exp: 20, hp: 10 }) },
  { weight: 4, affinity: 'social',
    text: () => `A woman leans from an upstairs window and tells you the road ahead is kind today. She says nothing else.`,
    rewards: () => ({ exp: 6 }) },
  { weight: 3, affinity: 'social',
    text: () => `Two travellers pass you going both directions. They are clearly together. You do not ask.`,
    rewards: () => ({ exp: 8 }) },
  { weight: 2, affinity: 'social',
    text: () => `A village celebrates something as you pass through. You are pulled in, fed, and set back on the road an hour later with no explanation given.`,
    rewards: () => ({ exp: 40, hp: 30, sp: 20 }) },
{ weight: 4, affinity: 'social',
    text: () => `A letter addressed to you is pinned to a milestone. You did not tell anyone you would be passing this way. The handwriting is your own.`,
    rewards: () => ({ exp: 22, mp: -15 }) },

  // ── RISK EVENTS ───────────────────────────────────
  // HP costs
  { weight: 5, affinity: 'endurance',
    text: () => `You slip on a wet stone crossing a stream and go down hard. Nothing broken. Everything bruised.`,
    rewards: () => ({ exp: 15, hp: -20, sp: -10 }) },
  { weight: 4, affinity: 'endurance',
    text: () => `A low branch you did not see. You continue, blinking, with a long scratch across your cheek and a dent in your dignity.`,
    rewards: () => ({ exp: 8, hp: -12 }) },
  { weight: 3, affinity: 'endurance',
    text: () => `The sun is merciless today. By midday you are red, dazed, and moving slower than you would like to admit.`,
    rewards: () => ({ exp: 20, hp: -25, sp: -20 }) },
  { weight: 3, affinity: 'nature',
    text: () => `Something bites you in the long grass — you never see what. Your ankle swells slightly. You walk it off, slowly.`,
    rewards: () => ({ exp: 12, hp: -18 }) },
  { weight: 2, affinity: 'nature',
    text: () => `You eat something from a bush that looked edible. It was not. You spend an uncomfortable hour by the road and resolve to be less optimistic.`,
    rewards: () => ({ exp: 10, hp: -30 }) },
  { weight: 2, affinity: 'endurance',
    text: () => `A section of road gives way beneath you — an old culvert, rotten through. You haul yourself out of a cold ditch, winded and wet.`,
    rewards: () => ({ exp: 25, hp: -35, sp: -15 }) },

  // SP costs
  { weight: 6, affinity: 'endurance',
    text: () => `The road climbs without warning and does not stop. You arrive at the top breathing hard, legs burning, grateful only that it is over.`,
    rewards: () => ({ exp: 18, sp: -25 }) },
  { weight: 5, affinity: 'endurance',
    text: () => `Headwinds for two miles. Every step costs twice what it should. You arrive somewhere with nothing left in reserve.`,
    rewards: () => ({ exp: 14, sp: -30 }) },
  { weight: 4, affinity: 'social',
    text: () => `A traveller in distress. You spend an hour helping them sort themselves out. They are grateful. You are tired.`,
    rewards: () => ({ exp: 22, sp: -20 }) },
  { weight: 3, affinity: 'endurance',
    text: () => `You take a wrong turn and walk an extra mile before realising it. The road back is the same distance. You do not complain, but you think about it.`,
    rewards: () => ({ exp: 8, sp: -35 }) },

  // MP costs
  { weight: 5, affinity: 'arcane',
    text: () => `A stretch of road where the light bends wrong and the sounds come from the wrong directions. You get through it, but something in you is quieter than before.`,
    rewards: () => ({ exp: 20, mp: -20 }) },
  { weight: 4, affinity: 'arcane',
    text: () => `A figure stands at the road's edge and watches you pass. It has no face. When you look back it is gone. You feel hollowed out.`,
    rewards: () => ({ exp: 15, mp: -25 }) },
  { weight: 3, affinity: 'arcane',
    text: () => `You hear your name spoken clearly, once, from somewhere above. There is nothing above. You walk faster for a while.`,
    rewards: () => ({ exp: 18, mp: -15 }) },
  { weight: 2, affinity: 'arcane',
    text: () => `The road passes through a section where your shadow is missing. When it returns a mile later it is slightly the wrong shape.`,
    rewards: () => ({ exp: 30, mp: -35 }) },

  // Mixed: cost one, gain another
  { weight: 4, affinity: 'endurance',
    text: () => `A hard road, but a fast one. You push through the pain and arrive somewhere ahead of where you expected to be.`,
    rewards: () => ({ exp: 35, hp: -20, sp: -15 }) },
  { weight: 3, affinity: 'arcane',
    text: () => `Something passes through you on the road — a cold presence, curious, brief. It leaves your mind clearer and your body cold.`,
    rewards: () => ({ exp: 25, hp: -15, mp: 20 }) },
  { weight: 3, affinity: 'nature',
    text: () => `You drink from a stream that tastes of iron and something sweeter. Your legs ache afterward but your head is unusually clear.`,
    rewards: () => ({ exp: 20, hp: -10, mp: 15 }) },
  { weight: 2, affinity: 'luck',
    text: () => `You fall into a ravine and land on something soft. The something soft turns out to be valuable. It was still a bad fall.`,
    rewards: () => ({ exp: 30, hp: -25 }) },
];

// ── Seasonal helpers ──────────────────────────────────
function getSeasonalWindow() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day   = now.getDate();
  if ((month === 10 && day >= 20) || (month === 11 && day <= 3))  return 'halloween';
  if  (month === 11 && day >= 20 && day <= 30)                    return 'thanksgiving';
  if ((month === 12 && day >= 15) || (month === 1  && day <= 2))  return 'christmas';
  return null;
}

const SEASONAL_EVENTS = {
  halloween: [
    { weight: 8, affinity: 'arcane',
      text: () => `The road tonight is lined with carved gourds, each lit from within. There is no-one around who could have placed them. The light is warm and the faces are kind. You walk between them feeling inexplicably welcome.`,
      rewards: () => ({ exp: 20, mp: 15 }) },
    { weight: 7, affinity: 'arcane',
      text: () => `Something follows you in the dark at a fixed distance. When you stop it stops. When you walk it walks. At dawn it is gone. You decide not to think too hard about what it wanted.`,
      rewards: () => ({ exp: 18, mp: -18 }) },
    { weight: 6, affinity: 'nature',
      text: () => `The leaves have all turned at once. The road is buried in them — red, gold, deep brown. Walking through them is loud and satisfying and briefly makes everything feel less strange.`,
      rewards: () => ({ exp: 14, sp: 12 }) },
    { weight: 6, affinity: 'luck',
      text: () => `A child in costume runs across the road ahead of you. In their wake they leave something small behind. A treat, or perhaps something stranger. You pick it up.`,
      rewards: () => ({ exp: 16, hp: 15 }) },
    { weight: 5, affinity: 'social',
      text: () => `A village celebration tonight — costumes, fire, noise. You are pulled in despite yourself, fed things you cannot identify, and released an hour later feeling oddly restored.`,
      rewards: () => ({ exp: 30, hp: 20, sp: 15 }) },
    { weight: 4, affinity: 'endurance',
      text: () => `The mist tonight is thicker than usual and moves against the wind. You walk through it steadily, one foot after the other, until you are out the other side.`,
      rewards: () => ({ exp: 16, sp: -15, hp: -8 }) },
    { weight: 3, affinity: 'arcane',
      text: () => `At midnight you hear something howl from very far away. Then something answers it from very close. Then silence. You keep walking.`,
      rewards: () => ({ exp: 25, mp: -22, hp: -10 }) },
  ],
  thanksgiving: [
    { weight: 8, affinity: 'social',
      text: () => `A farmhouse with its door open and a long table visible through the window, crowded with people and food. Someone waves you in before you have decided to stop. You sit, eat, say very little, and leave full in a way that has nothing to do with food.`,
      rewards: () => ({ exp: 25, hp: 30, sp: 20 }) },
    { weight: 7, affinity: 'nature',
      text: () => `The harvest is in. The fields on either side are cut short and gold, stubble catching the low autumn light. Geese fly over in formation so tight you can hear the air through their feathers.`,
      rewards: () => ({ exp: 14, hp: 10 }) },
    { weight: 6, affinity: 'social',
      text: () => `A traveler coming the other way stops and shares what they have — a little bread, a little dried fruit, news from further down the road. You share what you have in return. Both of you continue feeling less alone.`,
      rewards: () => ({ exp: 18, hp: 15, sp: 10 }) },
    { weight: 6, affinity: 'endurance',
      text: () => `The autumn air is sharp and clear. Your breath fogs. Your footsteps are crisp on the frost. You feel more present in your body than you have in days.`,
      rewards: () => ({ exp: 12, sp: 15 }) },
    { weight: 5, affinity: 'luck',
      text: () => `Someone has left a basket at a crossroads — bread, a preserved jar of something, a small pie. A note attached says only: for whoever needs it. You needed it.`,
      rewards: () => ({ exp: 20, hp: 25 }) },
    { weight: 4, affinity: 'arcane',
      text: () => `The last light of a harvest moon turns the road amber. Your shadow is very long. You have the feeling that the road is glad you are still walking it.`,
      rewards: () => ({ exp: 22, mp: 18 }) },
    { weight: 3, affinity: 'nature',
      text: () => `A flock of starlings moves overhead in formation — thousands of them shifting shape in the low sky. You stop and watch until they are gone. Some things are worth stopping for.`,
      rewards: () => ({ exp: 16, hp: 8, sp: 8 }) },
  ],
  christmas: [
    { weight: 8, affinity: 'nature',
      text: () => `Snow has fallen in the night. The road is white and silent and entirely new. Your footprints are the first. You find this unexpectedly moving.`,
      rewards: () => ({ exp: 18, sp: -10 }) },
    { weight: 7, affinity: 'social',
      text: () => `A town decorated for the season — candles in every window, greenery on every door. A stranger presses a gift into your hands without explanation and disappears into the crowd before you can ask.`,
      rewards: () => ({ exp: 25, hp: 20, sp: 15 }) },
    { weight: 6, affinity: 'endurance',
      text: () => `The cold is deep and honest today. You walk with your chin down and your hands tucked. The road is harder in winter but it is still the road.`,
      rewards: () => ({ exp: 16, sp: -20, hp: -10 }) },
    { weight: 6, affinity: 'luck',
      text: () => `A gift, wrapped carefully and left on a milestone with no name on it. You are the only traveler on this road today. You open it. It is exactly what you would have wanted.`,
      rewards: () => ({ exp: 28, hp: 25 }) },
    { weight: 5, affinity: 'social',
      text: () => `An old man walking the other direction, muttering to himself about people not appreciating things. You wish him well. He stops, looks at you properly, and wishes you well in return. Something shifts in his expression that might be the beginning of something better.`,
      rewards: () => ({ exp: 20, mp: 15 }) },
    { weight: 5, affinity: 'arcane',
      text: () => `The snow around you is unmarked in every direction except for the road ahead — where a single trail of footprints leads on, slightly larger than yours, moving at exactly your pace. By midday they are gone.`,
      rewards: () => ({ exp: 22, mp: -15 }) },
    { weight: 4, affinity: 'nature',
      text: () => `Frost on every surface. The world has been re-drawn in silver overnight. Even the road looks different — cleaner, clearer, as if the year is making an effort.`,
      rewards: () => ({ exp: 14, hp: 8, sp: 8 }) },
    { weight: 3, affinity: 'endurance',
      text: () => `A blizzard comes from nowhere. You find shelter and wait it out — hours of white noise against whatever roof you found. When it clears the world is buried and silent and you keep going.`,
      rewards: () => ({ exp: 30, hp: -20, sp: -25 }) },
  ],
};

// ── Glimpse events ────────────────────────────────────
// Fragments from other travelers' journals. Pure flavor for now —
// flagged for real player data hookup in a future update.
const GLIMPSE_EVENTS = [
  `A torn page on the road. Someone else's handwriting: "Day 12 — found something in the river I cannot explain and have decided not to try."`,
  `A scrap of journal, waterlogged. Legible: "The Hollow Road is longer than it looks. I am beginning to think it is longer than it is."`,
  `A note pinned to a milestone by someone who has passed through: "The bread at the crossing is good. Ask the miller's child."`,
  `Half a letter, the top torn off: "...and the stone was warm when I picked it up. I have been carrying it for three days now and it has not cooled. I am not sure what to do with that."`,
  `A journal page, folded into a bird shape: "Saw something in the Ashfield today that I will not write down. Some things are better left between you and the road."`,
  `Someone has left a note at a crossroads: "Took the left path. Do not take the left path."`,
  `A scrap of paper wrapped around a small stone: "Leaving this here for the next traveler. The road ahead is long but it does get better. Or at least different."`,
  `A page, heavily annotated: "The moors are not as empty as they look. I have counted seven things moving that I cannot account for. I am now counting eight."`,
  `A torn corner of a map, with a note: "This part is wrong. The tower is further than it shows. The road past it is shorter. It balances out."`,
  `A single line on a scrap of parchment: "Whatever is in the fen water — do not look at it directly. Look slightly to the left of where you think it is."`,
  `A note tucked into a crack in a milestone: "Day 34. Still walking. Cannot remember why I started. Cannot imagine stopping."`,
  `A journal entry, the date rubbed off: "The wood let me out today. I had begun to wonder if it would."`,
];

function tryGlimpseEvent() {
  const text = GLIMPSE_EVENTS[Math.floor(Math.random() * GLIMPSE_EVENTS.length)];
  state.glimpsesSeen = (state.glimpsesSeen || 0) + 1;
  const chips = [{ label: `A fragment from another road`, cls: 'chip-skill' }];
  if (hasSkill('glimpse_heal')) {
    const hpMax = maxHP(state.level) + (hasSkill('hp_max_bonus') ? 40 : 0);
    const spMax = maxSP(state.level) + (hasSkill('sp_max_bonus') ? 50 : 0);
    state.hp = Math.min(hpMax, state.hp + 12);
    state.sp = Math.min(spMax, state.sp + 12);
    chips.push({ label: '+ 12 HP', cls: 'chip-stat' });
    chips.push({ label: '+ 12 SP', cls: 'chip-stat' });
  }
  pushLog('Glimpse', 'tag-skill', 'dot-skill', 'ev-skill', text, chips);
  checkTitles();
}

// ── Location-specific events ──────────────────────────
// Keyed by locationIndex. Fire at 30% chance instead of a regular event.
const LOCATION_EVENTS = {
  0: [ // The First Road
    { affinity: 'endurance', text: () => `The gate of wherever you came from is still visible behind you. You do not look back again.`, rewards: () => ({ exp: 5 }) },
    { affinity: 'social',    text: () => `Another traveler sets out the same direction. You walk together for a while before the road separates you without either of you noticing.`, rewards: () => ({ exp: 8 }) },
    { affinity: 'luck',      text: () => `Something falls out of your pack and lands perfectly upright. You take this as a good sign.`, rewards: () => ({ exp: 4 }) },
  ],
  1: [ // Millbrook Crossing
    { affinity: 'nature',    text: () => `The mill wheel turns slowly below you. Something about the rhythm of it is deeply settling.`, rewards: () => ({ exp: 8, sp: 10 }) },
    { affinity: 'arcane',    text: () => `The stream below the crossing runs in two directions at once. The miller, when you point this out, says he stopped noticing years ago.`, rewards: () => ({ exp: 12, mp: 8 }) },
    { affinity: 'social',    text: () => `The miller's child hands you something wrapped in cloth without being asked. Inside: a piece of bread and a single dried plum. You eat both.`, rewards: () => ({ exp: 10, hp: 15 }) },
  ],
  2: [ // The Hollow Road
    { affinity: 'arcane',    text: () => `The willows on either side lean inward overhead. Walking the Hollow Road feels like walking through something's throat.`, rewards: () => ({ exp: 15, mp: -10 }) },
    { affinity: 'nature',    text: () => `Something in the branches above is watching you. It has been watching you for half a mile. When you finally stop and look directly at it, there is only a branch.`, rewards: () => ({ exp: 12 }) },
    { affinity: 'endurance', text: () => `The road narrows here until your shoulders nearly brush the willows on both sides. You keep your pace and do not think about it.`, rewards: () => ({ exp: 10, sp: -8 }) },
  ],
  3: [ // Greymere Crossing
    { affinity: 'luck',      text: () => `Three of the signpost's four directions are scratched off. You pick the remaining one. It seems as good a reason as any.`, rewards: () => ({ exp: 10 }) },
    { affinity: 'social',    text: () => `A group of travelers at the crossing, all stopped, all looking at the signpost. No one speaks. You pass through them without stopping.`, rewards: () => ({ exp: 8 }) },
    { affinity: 'arcane',    text: () => `Standing at the exact centre of the crossroads you feel, briefly, that you are in four places at once. Then a cart passes and you are just standing in the road.`, rewards: () => ({ exp: 20, mp: 12 }) },
  ],
  4: [ // The Ashfield
    { affinity: 'nature',    text: () => `The grey wheat sways without wind in perfect unison. You walk between the rows quickly and do not touch any of it.`, rewards: () => ({ exp: 15, mp: -12 }) },
    { affinity: 'social',    text: () => `A farmer watches you from a distance. When you raise your hand he raises his. When you lower it, he lowers his. You break the pattern by looking away first.`, rewards: () => ({ exp: 10 }) },
    { affinity: 'arcane',    text: () => `One patch of the grey wheat is green. Just one patch, maybe ten stalks. You mark where it is and it is gone when you look back.`, rewards: () => ({ exp: 22, mp: 15 }) },
  ],
  5: [ // Crestfall Bridge (NEW)
    { affinity: 'social',    text: () => `The bridge is wide enough for a cart. Someone built this expecting traffic that never came, or stopped coming long ago.`, rewards: () => ({ exp: 10 }) },
    { affinity: 'nature',    text: () => `Below the bridge the river moves slowly. A large fish surfaces once, regards you, and descends again. You feel briefly assessed.`, rewards: () => ({ exp: 12, hp: 5 }) },
    { affinity: 'endurance', text: () => `Halfway across the bridge the wind picks up, coming from the river's direction. You lean into it and keep walking. The other side takes longer than the distance suggests.`, rewards: () => ({ exp: 14, sp: -8 }) },
  ],
  6: [ // Duskwatch Tower (was 5)
    { affinity: 'arcane',    text: () => `Every window in the tower has a candle. You count them. You count them again. The number is different each time.`, rewards: () => ({ exp: 20, mp: -20 }) },
    { affinity: 'endurance', text: () => `The tower's shadow falls across the road regardless of where the sun is. You walk through it quickly. It is cold inside the shadow.`, rewards: () => ({ exp: 15, hp: -10 }) },
    { affinity: 'luck',      text: () => `At the base of the tower, a single candle sits on a stone outside. It has not been lit by anyone you can see. You walk on before you have to think about it too hard.`, rewards: () => ({ exp: 18 }) },
  ],
  7: [ // The Salt Flats (NEW)
    { affinity: 'endurance', text: () => `The white ground stretches in every direction. There is no shade here. You walk faster than usual and do not admit why.`, rewards: () => ({ exp: 18, sp: -20, hp: -8 }) },
    { affinity: 'arcane',    text: () => `Your footprints behind you are the only marks on the salt. When you turn to look at them, there are two sets. The second set is slightly smaller than yours.`, rewards: () => ({ exp: 25, mp: -18 }) },
    { affinity: 'luck',      text: () => `A single object sits in the middle of the Salt Flats with no explanation for how it got there. You take it. The salt around it is undisturbed.`, rewards: () => ({ exp: 20 }) },
  ],
  8: [ // The Sunken Road (was 6)
    { affinity: 'nature',    text: () => `The plants down here are larger than they should be — leaves the size of shields, roots like fallen trees. Everything grows toward you slightly as you pass.`, rewards: () => ({ exp: 18, hp: -8 }) },
    { affinity: 'endurance', text: () => `The sky is a ribbon above. Walls of earth rise on either side. The road goes down and you follow it, because that is what you do.`, rewards: () => ({ exp: 20, sp: -15 }) },
    { affinity: 'arcane',    text: () => `Sound behaves differently in the Sunken Road. Your footsteps echo wrong — a half-second late, slightly too loud, as if something is mimicking them nearby.`, rewards: () => ({ exp: 25, mp: -18 }) },
  ],
  9: [ // Oldhollow Fen (NEW)
    { affinity: 'nature',    text: () => `The causeway is solid underfoot but narrow. On either side the dark water sits perfectly still. You do not look at what is in it.`, rewards: () => ({ exp: 16, hp: -10 }) },
    { affinity: 'arcane',    text: () => `A light moves slowly beneath the surface of the fen water, keeping pace with you. It does not break the surface. You do not invite it to.`, rewards: () => ({ exp: 28, mp: -20 }) },
    { affinity: 'endurance', text: () => `The air in the fen is heavy and close. Every breath feels slightly insufficient. You breathe through it and keep your pace steady.`, rewards: () => ({ exp: 20, sp: -18 }) },
  ],
  10: [ // The Pale Moors (was 7)
    { affinity: 'endurance', text: () => `The moors offer no shelter, no shade, no landmarks. You walk by feel and direction and something that might be instinct. An hour passes that could have been three.`, rewards: () => ({ exp: 25, sp: -20 }) },
    { affinity: 'arcane',    text: () => `Something large moves beneath the moor's surface. You see the ground shift and settle. You do not stop walking.`, rewards: () => ({ exp: 30, mp: -22, hp: -10 }) },
    { affinity: 'nature',    text: () => `A single tree on the pale moors, alone, with no explanation for how it came to be here. Birds sit in it. They watch you pass.`, rewards: () => ({ exp: 20, hp: 10 }) },
  ],
  11: [ // Thornwall Village (was 8)
    { affinity: 'social',    text: () => `The villagers are friendly. Specifically friendly. You cannot find a single person here who will make eye contact for more than a moment.`, rewards: () => ({ exp: 18, mp: -12 }) },
    { affinity: 'social',    text: () => `Someone presses a warm meal into your hands before you can object. It is good. You do not ask what is in it.`, rewards: () => ({ exp: 20, hp: 25, sp: 15 }) },
    { affinity: 'arcane',    text: () => `The village does not appear on any map you have seen. When you ask a local about this they smile and say it prefers it that way.`, rewards: () => ({ exp: 28, mp: 20 }) },
  ],
  12: [ // The Shivering Pass (NEW)
    { affinity: 'endurance', text: () => `The wind in the pass comes from every direction at once. You tuck your chin and walk. There is nothing else to do.`, rewards: () => ({ exp: 28, sp: -25, hp: -12 }) },
    { affinity: 'arcane',    text: () => `In the narrowest part of the pass the wind stops completely. The silence is total. Then it starts again and you realise you were holding your breath.`, rewards: () => ({ exp: 30, mp: -22 }) },
    { affinity: 'luck',      text: () => `Sheltered behind a boulder in the Shivering Pass, out of the wind, you find something left by a previous traveler. A small kindness from someone you will never meet.`, rewards: () => ({ exp: 22, hp: 20, sp: 15 }) },
  ],
  13: [ // The Wandering Wood (was 9)
    { affinity: 'arcane',    text: () => `The trees have moved again. You know this because the one with the split trunk was on your left yesterday. It is on your right today.`, rewards: () => ({ exp: 30, mp: -25 }) },
    { affinity: 'nature',    text: () => `The wood is quiet in a way that feels intentional. Not the quiet of nothing present — the quiet of many things listening.`, rewards: () => ({ exp: 25, hp: -12 }) },
    { affinity: 'endurance', text: () => `You have stopped trying to track your path. You walk. The wood will let you out when it decides to. Until then you keep moving.`, rewards: () => ({ exp: 35, sp: -20 }) },
  ],
  14: [ // The Unmapped Shore (NEW)
    { affinity: 'arcane',    text: () => `The water goes further than it should. You have been watching the horizon for an hour and it has not changed. The sea here does not behave like a sea.`, rewards: () => ({ exp: 35, mp: -25 }) },
    { affinity: 'nature',    text: () => `Birds you do not recognise land near you on the shore, study you carefully, and fly back out to sea. You get the sense you have been reported on.`, rewards: () => ({ exp: 25, hp: 10 }) },
    { affinity: 'endurance', text: () => `The shoreline curves gently and you follow it. The road is gone. The shore is what there is. You walk it anyway because walking is what you do.`, rewards: () => ({ exp: 40, sp: -20 }) },
  ],
};

// ── Default state ─────────────────────────────────────
function defaultState(name) {
  return {
    name, level: 1, exp: 0,
    hp: maxHP(1), mp: maxMP(1), sp: maxSP(1),
    steps: 0, days: 1, travelSeconds: 0, gemsEarned: 0,
    itemsFound: 0, eventsFound: 0,
    collection: {},       // { itemId: count }
    titlesEarned: ['first_step'],
    activeTitle: 'First Step',
    skillsUnlocked: [],   // array of effect strings
    affinities: { endurance: 0, luck: 0, arcane: 0, nature: 0, social: 0 },
    locationIndex: 0, locationSteps: 0,
    log: [], isResting: false, forcedRest: false, forcedRests: 0, portrait: null, glimpsesSeen: 0, lastSaved: Date.now(),
    _revision: serverRevision, _dirty: true,
  };
}

// ── Persistence ───────────────────────────────────────
function save() {
  state.lastSaved = Date.now();
  state._dirty = true;
  const stateJson = JSON.stringify(state);
  try { localStorage.setItem(SAVE_KEY, stateJson); } catch(e) {}

  if (saveUrl && window.XF) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const submittedState = JSON.parse(JSON.stringify(state));
      const submittedActiveSeconds = rewardTracker.pendingSeconds();
      XF.ajax('POST', saveUrl, {
        state: JSON.stringify(submittedState),
        active_seconds: submittedActiveSeconds,
        earning_session: rewardTracker.sessionId
      }, function (data) {
        if (data && data.state) {
          rewardTracker.acknowledge(submittedActiveSeconds);
          const currentState = state;
          state = Core.mergeProgress(data.state, currentState);
          for (const preference of ['name', 'activeTitle', 'portrait']) {
            if (currentState[preference] === submittedState[preference]) {
              state[preference] = data.state[preference];
            }
          }
          state._dirty = currentState.steps > submittedState.steps
            || ['name', 'activeTitle', 'portrait'].some(preference => currentState[preference] !== submittedState[preference]);
          state._syncError = false;
          if (data.gemsAwarded > 0) {
            pushLog('Gem reward', 'tag-mile', 'dot-mile', 'ev-mile',
              `Active travel earned ${data.gemsAwarded} Gem${data.gemsAwarded === 1 ? '' : 's'}.`,
              [{label: `+ ${data.gemsAwarded} Gems`, cls: 'chip-gem'}]);
          }
          try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {}
        }
      }, {
        skipDefaultSuccessError: true,
        skipDefault: true,
        error: function () {
          state._syncError = true;
          updateUI();
          console.warn('The Long Road server sync failed; progress remains saved locally.');
        }
      });
    }, 1200);
  }
}
function load() {
  let serverState = null;
  let localState = null;

  if (!serverStateRead && appRoot) {
    serverStateRead = true;
    const initialState = appRoot.dataset.initialState;
    if (initialState) {
      try { serverState = JSON.parse(initialState); } catch(e) {}
    }
  }
  try {
    const storedState = localStorage.getItem(SAVE_KEY);
    if (storedState) localState = JSON.parse(storedState);
  } catch(e) {}

  if (!serverState) {
    if (localState && (Number(localState._revision) || 0) < serverRevision) {
      try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
      return null;
    }
    return localState;
  }
  if (!localState) return serverState;

  // A page transition can happen before the debounced server save completes.
  // Keep freshly collected items and other progress by selecting the newest copy.
  return Core.normalizeState(Core.resolveState(serverState, localState));
}

// ── Helpers ───────────────────────────────────────────
function timeLabel() {
  const now = new Date(); let h = now.getHours(), m = now.getMinutes();
  const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
  return `${h}:${String(m).padStart(2,'0')} ${ap}`;
}
function fmt(n) { return Math.floor(n).toLocaleString(); }
function pct(a, b) { return Math.min(100, Math.max(0, (a / b) * 100)).toFixed(1) + '%'; }
function weightedPick(arr) {
  const total = arr.reduce((s,x) => s + (x.weight||1), 0);
  let r = Math.random() * total;
  for (const x of arr) { r -= (x.weight||1); if (r <= 0) return x; }
  return arr[arr.length-1];
}
function hasSkill(effect) { return state.skillsUnlocked.includes(effect); }
function plainText(value) { return String(value ?? '').replace(/<[^>]*>/g, ''); }
function safeClass(value) { return /^[a-z0-9_-]{1,40}$/i.test(String(value || '')) ? String(value) : ''; }

// ── Log ───────────────────────────────────────────────
function pushLog(tag, tagCls, dotCls, bodyCls, html, chips=[]) {
  state.log.unshift({
    tag: plainText(tag),
    tagCls: safeClass(tagCls),
    dotCls: safeClass(dotCls),
    bodyCls: safeClass(bodyCls),
    html: plainText(html),
    chips: chips.map(chip => ({label: plainText(chip.label), cls: safeClass(chip.cls)})),
    time: timeLabel()
  });
  if (state.log.length > LOG_MAX) state.log.length = LOG_MAX;
  if (activePanel === 'log') prependLogEntry(state.log[0]);
}

function logEvent(html, chips)  { pushLog('Encounter',    'tag-event','dot-event','ev-event', html, chips); }
function logFind(html, chips)   { pushLog('Found',        'tag-event','dot-event','ev-event', html, chips); }
function logRare(html, chips)   { pushLog('Rare find',    'tag-rare', 'dot-rare', 'ev-rare',  html, chips); }
function logLevel(html, chips)  { pushLog('Level up',     'tag-level','dot-level','ev-level', html, chips); }
function logMile(html, chips)   { pushLog('Milestone',    '',         '',         '',          html, chips); }
function logRest(html)          { pushLog('Resting',      '',         'dot-rest', 'ev-rest',   html); }
function logWake(html)          { pushLog('Resumed',      '',         '',         '',          html); }
function logTitle(html, chips)  { pushLog('Title earned', 'tag-rare', 'dot-rare', 'ev-rare',  html, chips); }
function logSkill(html, chips)  { pushLog('Skill learned','tag-skill','dot-skill','ev-skill', html, chips); }
function logLocation(html)      { pushLog('New ground',   'tag-event','dot-event','ev-event', html); }
function logForced(html)        { pushLog('Forced rest',  'tag-rare', 'dot-rest', 'ev-rest',   html); }

// ── Skill checking ────────────────────────────────────
function checkSkills() {
  for (const effect of Core.unlockSkills(state)) {
    const skill = Object.values(SKILLS).flatMap(data => data.skills).find(candidate => candidate.effect === effect);
    if (!skill) continue;
    logSkill(
      `Something settles into place. You have learned <strong>${skill.name}</strong>. ${skill.desc}`,
      [{ label: `Skill: ${skill.name}`, cls: 'chip-skill' }]
    );
    checkTitles();
    if (activePanel === 'skills') renderSkillsPanel();
  }
}

// ── Title checking ────────────────────────────────────
function checkTitles() {
  for (const t of Core.newTitles(state)) {
      state.titlesEarned.push(t.id);
      logTitle(
        `The road has named you. You are now known as <strong>"${t.label}"</strong>.`,
        [{ label: `Title: "${t.label}"`, cls: 'chip-item' }]
      );
      if (activePanel === 'titles') renderTitlesPanel();
  }
}

// ── EXP & levelling ───────────────────────────────────
function gainExp(amount) {
  for (const level of Core.gainExp(state, amount)) {
    logLevel(
      `The road behind you grows longer. <strong>Level ${level}</strong> — the miles have sharpened something in you.`,
      [
        { label: `+ Max HP → ${maxHP(level)}`, cls: 'chip-stat' },
        { label: `+ Max SP → ${maxSP(level)}`, cls: 'chip-stat' },
      ]
    );
    checkTitles();
  }
}

// ── Item drop ─────────────────────────────────────────
function tryItemDrop(fromSocial = false) {
  const eligible = Core.eligibleItems(state.level);
  if (!eligible.length) return;

  // Rarity weights, modified by skills
  const rareBoost   = hasSkill('rare_rate_up')   ? 3 : 1;
  const socialBoost = (fromSocial && hasSkill('social_items')) ? 2 : 1;

  const pool = eligible.map(i => ({
    ...i,
    weight: i.rarity === 'common'   ? 10
          : i.rarity === 'uncommon' ? 4 * socialBoost
          :                           1 * rareBoost * socialBoost
  }));

  const item = weightedPick(pool);
  const expGain = item.rarity === 'common' ? 5 : item.rarity === 'uncommon' ? 20 : 80;

  // Add to collection
  state.collection[item.id] = (state.collection[item.id] || 0) + 1;
  state.itemsFound++;
  gainExp(expGain);

  if (item.rarity === 'rare') {
    logRare(`<strong>${item.name}</strong> — ${item.desc}`,
      [{ label: `+ ${item.name}`, cls: 'chip-item' }, { label: `+ ${expGain} exp`, cls: 'chip-exp' }]);
  } else {
    logFind(`A <strong>${item.name}</strong> beside the path. ${item.desc}`,
      [{ label: `+ ${item.name}`, cls: 'chip-item' }, { label: `+ ${expGain} exp`, cls: 'chip-exp' }]);
  }

  if (activePanel === 'collection') renderCollectionPanel();
  save();
}

// ── Apply rewards ─────────────────────────────────────
function applyRewards(rewards, affinity) {
  let expAmt = rewards.exp || 0;

  // Affinity EXP bonuses from skills
  if (affinity === 'arcane' && hasSkill('arcane_exp'))   expAmt = Math.round(expAmt * 1.5);
  if (affinity === 'social' && hasSkill('social_exp'))   expAmt = Math.round(expAmt * 1.3);
  // Windfall: 15% chance to double event EXP
  if (hasSkill('exp_windfall') && Math.random() < 0.15) expAmt *= 2;

  if (expAmt) gainExp(expAmt);

  const hpMax = maxHP(state.level) + (hasSkill('hp_max_bonus') ? 40 : 0);
  const mpMax = maxMP(state.level) + (hasSkill('mp_max_bonus') ? 40 : 0);
  const spMax = maxSP(state.level) + (hasSkill('sp_max_bonus') ? 50 : 0);

  if (rewards.hp) {
    // Endurance skill: reduce incoming HP damage by 25%
    const hpDelta = rewards.hp < 0 && hasSkill('sp_max_bonus')
      ? Math.ceil(rewards.hp * 0.75) : rewards.hp;
    state.hp = Math.max(0, Math.min(hpMax, state.hp + hpDelta));
  }
  if (rewards.mp) state.mp = Math.max(0, Math.min(mpMax, state.mp + rewards.mp));
  if (rewards.sp) state.sp = Math.max(0, Math.min(spMax, state.sp + rewards.sp));
}

// ── Location ──────────────────────────────────────────
function checkLocation() {
  for (const reachedIndex of Core.advanceLocations(state)) {
    const cur = LOCATIONS[reachedIndex - 1];
    const next = LOCATIONS[reachedIndex];
    let expBonus = 0;
    if (hasSkill('loc_exp')) expBonus += 50;
    if (hasSkill('deep_road_exp') && reachedIndex >= 4) expBonus += 100;
    logLocation(`You leave <strong>${cur.name}</strong> behind and arrive at <strong>${next.name}</strong>. ${next.desc}`);
    if (expBonus) gainExp(expBonus);
  }
}

// ── Milestones ────────────────────────────────────────
const STEP_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000];
let _lastMilestone = 0;
function checkMilestone() {
  for (const m of STEP_MILESTONES) {
    if (state.steps >= m && _lastMilestone < m) {
      _lastMilestone = m;
      const labels = {1000:'a thousand',5000:'five thousand',10000:'ten thousand',25000:'twenty-five thousand',50000:'fifty thousand',100000:'a hundred thousand',250000:'two hundred fifty thousand',500000:'half a million'};
      logMile(`${labels[m]||m.toLocaleString()} steps since leaving the gate. The road has become familiar in its unfamiliarity.`,
        [{ label: `+ ${m>=1000?m/1000+'k':m} steps`, cls: 'chip-exp' }]);
      gainExp(m >= 10000 ? 200 : m >= 1000 ? 50 : 10);
      checkTitles();
    }
  }
}

// ── Tick ──────────────────────────────────────────────
let _tickCount = 0, _eventCooldown = 0, _itemCooldown = 0;
let tickInterval = null;
let state = null;
let activePanel = 'log';
let visibleLogEntries = LOG_PAGE_SIZE;

function tick() {
  // Rest is now an event consequence, never a real-world nightly shutdown.
  // A forced rest lasts for one tick, then the idle journey resumes.
  if (state.isResting) {
    state.isResting = false;
    const wasForcedRest = state.forcedRest;
    state.forcedRest = false;
    if (wasForcedRest) {
      logWake('You catch your breath, bind your wounds, and return to the road.');
    }
    save();
  }

  _tickCount++;
  rewardTracker.recordSecond();
  state.travelSeconds = (state.travelSeconds || 0) + 1;
  state.days = 1 + Math.floor(state.travelSeconds / 3600);
  state.steps++;
  state.locationSteps++;

  // EXP per step
  gainExp(1);

  // SP regen
  const spMax = maxSP(state.level) + (hasSkill('sp_max_bonus') ? 50 : 0);
  const spRegen = hasSkill('sure_footed') ? 0.1 : 0.05;
  state.sp = Math.min(spMax, state.sp + spRegen);

  // HP regen (nature skill)
  if (hasSkill('hp_regen')) {
    const hpMax = maxHP(state.level) + (hasSkill('hp_max_bonus') ? 40 : 0);
    state.hp = Math.min(hpMax, state.hp + 0.02);
  }

  // Bonus step every 5s at full SP (Iron Stride)
  if (hasSkill('bonus_steps') && _tickCount % 5 === 0 && state.sp >= spMax) {
    state.steps++; state.locationSteps++; gainExp(1);
  }

  // Mile bonus every 500 steps (Golden Mile)
  if (hasSkill('mile_bonus') && state.steps % 500 === 0 && Math.random() < 0.3) {
    tryItemDrop();
  }

  checkMilestone();
  checkLocation();
  checkTitles();

  // Event cooldown
  _eventCooldown--;
  if (_eventCooldown <= 0) {
    const socialFreqBoost = hasSkill('social_freq') ? 0.8 : 1;
    const arcaneFreqBoost = hasSkill('arcane_freq') ? 0.8 : 1;

        // 5% chance of a glimpse event (10% with glimpse_freq skill)
    const base = 45, spread = 45;
    const socialMod = hasSkill('social_freq') ? 0.8 : 1;
    const arcaneMod = hasSkill('arcane_freq') ? 0.8 : 1;
    const glimpseChance = hasSkill('glimpse_freq') ? 0.10 : 0.05;
    if (Math.random() < glimpseChance) {
      tryGlimpseEvent();
      _eventCooldown = Math.round((base + Math.random() * spread) * Math.min(socialMod, arcaneMod));
      if (_tickCount % 30 === 0) save();
      updateUI();
      return;
    }

    // Check for seasonal events (replace ~40% of normal events during active windows)
    const season = getSeasonalWindow();
    const seasonalPool = season ? SEASONAL_EVENTS[season] : null;
    if (seasonalPool && Math.random() < 0.40) {
      const ev = weightedPick(seasonalPool);
      const rewards = ev.rewards();
      state.affinities[ev.affinity] = (state.affinities[ev.affinity] || 0) + 1;
      applyRewards(rewards, ev.affinity);
      const chips = [];
      if (rewards.exp) chips.push({ label: `+ ${rewards.exp} exp`, cls: 'chip-exp' });
      if (rewards.hp)  chips.push({ label: `${rewards.hp > 0 ? '+' : ''}${rewards.hp} HP`, cls: rewards.hp > 0 ? 'chip-stat' : 'chip-cost' });
      if (rewards.mp)  chips.push({ label: `${rewards.mp > 0 ? '+' : ''}${rewards.mp} MP`, cls: rewards.mp > 0 ? 'chip-stat' : 'chip-cost' });
      if (rewards.sp)  chips.push({ label: `${rewards.sp > 0 ? '+' : ''}${rewards.sp} SP`, cls: rewards.sp > 0 ? 'chip-stat' : 'chip-cost' });
      logEvent(ev.text(state), chips);
      state.eventsFound++;
      checkSkills();
      _eventCooldown = Math.round((base + Math.random() * spread) * Math.min(socialMod, arcaneMod));
      if (_tickCount % 30 === 0) save();
      updateUI();
      return;
    }

    // 30% chance to fire a location-specific event if one exists here
    // boosted to 45% with loc_event_freq skill
        const locEventChance = hasSkill('loc_event_freq') ? 0.45 : 0.30;
    const locEvents = LOCATION_EVENTS[state.locationIndex];
    let ev;
    if (locEvents && Math.random() < locEventChance) {
      ev = locEvents[Math.floor(Math.random() * locEvents.length)];
    } else {
      const pool = EVENTS.map(e => ({
        ...e,
        weight: e.weight
          * (e.affinity === 'social' ? (1 / socialFreqBoost) : 1)
          * (e.affinity === 'arcane' ? (1 / arcaneFreqBoost) : 1)
      }));
      ev = weightedPick(pool);
    }
    const rewards = ev.rewards();
    state.affinities[ev.affinity] = (state.affinities[ev.affinity] || 0) + 1;
    applyRewards(rewards, ev.affinity);

    const chips = [];
    if (rewards.exp) chips.push({ label: `+ ${rewards.exp} exp`, cls: 'chip-exp' });
    if (rewards.hp)  chips.push({ label: `${rewards.hp > 0 ? '+' : ''}${rewards.hp} HP`, cls: rewards.hp > 0 ? 'chip-stat' : 'chip-cost' });
    if (rewards.mp)  chips.push({ label: `${rewards.mp > 0 ? '+' : ''}${rewards.mp} MP`, cls: rewards.mp > 0 ? 'chip-stat' : 'chip-cost' });
    if (rewards.sp)  chips.push({ label: `${rewards.sp > 0 ? '+' : ''}${rewards.sp} SP`, cls: rewards.sp > 0 ? 'chip-stat' : 'chip-cost' });
    logEvent(ev.text(state), chips);
    state.eventsFound++;

    // 0 HP → forced early rest
    if (state.hp <= 0) {
      state.hp = 0;
      state.isResting = true;
      state.forcedRest = true;
      state.forcedRests = (state.forcedRests || 0) + 1;
      state.days++;
      // Partial restore: 50% HP normally, 75% with better_recovery skill
      const hpMax = maxHP(state.level) + (hasSkill('hp_max_bonus') ? 40 : 0);
      const recoveryRate = hasSkill('better_recovery') ? 0.75 : 0.5;
      state.hp = Math.floor(hpMax * recoveryRate);
      state.mp = maxMP(state.level) + (hasSkill('mp_max_bonus') ? 40 : 0);
      state.sp = maxSP(state.level) + (hasSkill('sp_max_bonus') ? 50 : 0);
      const forcedRestLines = [
        `The world tilts. You find the nearest ditch and fold yourself into it, too spent to go further. You will continue when you can.`,
        `Your legs give out on a patch of grass beside the road. You do not choose to stop — the road chooses for you. You sleep where you fall.`,
        `Something has taken too much from you today. You crawl under a hedgerow and close your eyes. The road will still be there in the morning.`,
        `You stagger to a milestone and sit against it, then do not get up. The stars wheel overhead while you recover what you can.`,
        `The road wins this round. You find a hollow tree and squeeze yourself inside it, sleeping badly but sleeping nonetheless.`,
      ];
      logForced(forcedRestLines[Math.floor(Math.random() * forcedRestLines.length)]);
      save(); updateUI(); return;
    }

    // Beast-Familiar: animal events restore HP/SP
    if (ev.affinity === 'nature' && hasSkill('beast_heal')) {
      state.hp = Math.min(maxHP(state.level) + (hasSkill('hp_max_bonus')?40:0), state.hp + 10);
      state.sp = Math.min(spMax, state.sp + 15);
    }

    checkSkills();

    _eventCooldown = Math.round((base + Math.random() * spread) * Math.min(socialMod, arcaneMod));
  }

  // Item drop
  _itemCooldown--;
  if (_itemCooldown <= 0) {
    const rateBoost = hasSkill('item_rate_up') ? 0.75 : 1;
    _itemCooldown = Math.round((120 + Math.random() * 120) * rateBoost);
    tryItemDrop();
  }

  if (_tickCount % 30 === 0) save();
  updateUI();
}

// ── UI update ─────────────────────────────────────────
function updateUI() {
  const lv = state.level;
  document.getElementById('ui-char-name').textContent  = state.name;
  document.getElementById('ui-char-class').textContent = `The Traveler · Level ${lv}`;
  document.getElementById('ui-char-title').textContent = `"${state.activeTitle}"`;

  const mhp = maxHP(lv) + (hasSkill('hp_max_bonus')?40:0);
  const mmp = maxMP(lv) + (hasSkill('mp_max_bonus')?40:0);
  const msp = maxSP(lv) + (hasSkill('sp_max_bonus')?50:0);
  const mexp = expToNext(lv);

  document.getElementById('ui-hp-val').textContent  = `${fmt(state.hp)} / ${mhp}`;
  document.getElementById('ui-mp-val').textContent  = `${fmt(state.mp)} / ${mmp}`;
  document.getElementById('ui-sp-val').textContent  = `${fmt(state.sp)} / ${msp}`;
  document.getElementById('ui-exp-val').textContent = `${fmt(state.exp)} / ${mexp}`;
  document.getElementById('ui-hp-bar').style.width  = pct(state.hp, mhp);
  document.getElementById('ui-mp-bar').style.width  = pct(state.mp, mmp);
  document.getElementById('ui-sp-bar').style.width  = pct(state.sp, msp);
  document.getElementById('ui-exp-bar').style.width = pct(state.exp, mexp);

  document.getElementById('ui-steps').textContent  = fmt(state.steps);
  document.getElementById('ui-days').textContent   = state.days;
  document.getElementById('ui-items').textContent  = state.itemsFound;
  document.getElementById('ui-events').textContent = state.eventsFound;
  document.getElementById('ui-item-count').textContent  = state.itemsFound;
  document.getElementById('ui-title-count').textContent = state.titlesEarned.length;
  document.getElementById('ui-skill-count').textContent = state.skillsUnlocked.length;

  const loc  = LOCATIONS[state.locationIndex];
  const next = LOCATIONS[Math.min(state.locationIndex + 1, LOCATIONS.length - 1)];
  document.getElementById('ui-loc-name').textContent = loc.name;
  document.getElementById('ui-loc-desc').textContent = loc.desc;

  const atEnd = state.locationIndex >= LOCATIONS.length - 1;
  const pathPct = atEnd ? 100 : Math.min(99, (state.locationSteps / loc.stepsNeeded) * 100);
  const remain  = atEnd ? 0   : loc.stepsNeeded - state.locationSteps;
  document.getElementById('ui-path-dest').textContent   = atEnd ? 'End of the known road' : `To: ${next.name}`;
  document.getElementById('ui-path-fill').style.width   = pathPct.toFixed(1) + '%';
  document.getElementById('ui-path-remain').textContent = atEnd ? 'The road goes ever on...' : `~${fmt(remain)} steps remaining`;
  document.getElementById('ui-log-day').textContent = `Day ${state.days} of the journey`;

  const dot   = document.getElementById('ui-status-dot');
  const label = document.getElementById('ui-status-label');
  if (state.isResting) {
    dot.className = 'status-dot resting';
    label.textContent = uiPhrase('phraseResting', 'Resting');
    label.style.color = '';
    document.getElementById('ui-step-rate').textContent = '— steps / sec';
    document.getElementById('ui-rest-time').textContent = 'Catching breath…';
  } else {
    dot.className = 'status-dot walking'; label.textContent = uiPhrase('phraseWalking', 'Walking'); label.style.color = '';
    document.getElementById('ui-step-rate').textContent = hasSkill('bonus_steps')
      ? uiPhrase('phraseBonusStepRate', '1+ steps / sec')
      : uiPhrase('phraseStepRate', '1 step / sec');
    document.getElementById('ui-rest-time').textContent = state._syncError
      ? uiPhrase('phraseSyncRetrying', 'Saved locally; server sync will retry.')
      : !rewardTracker.isEligible()
        ? uiPhrase('phraseRewardsPaused', 'Gem rewards paused — interact to resume.')
        : uiPhrase('phraseContinuesBrowsing', 'Journey continues; active travel earns Gems.');
  }
  const gemsEl = document.getElementById('ui-gems-earned');
  if (gemsEl) gemsEl.textContent = fmt(state.gemsEarned || 0);
  document.getElementById('ui-clock').textContent = `Day ${state.days} · ${timeLabel()}`;
}

// ── Log rendering ─────────────────────────────────────
function makeEntryEl(entry) {
  const li = document.createElement('li');
  li.className = 'log-entry';

  const timeColumn = document.createElement('div');
  timeColumn.className = 'entry-time-col';
  const dot = document.createElement('div');
  dot.className = `entry-dot ${safeClass(entry.dotCls)}`.trim();
  const time = document.createElement('div');
  time.className = 'entry-time';
  time.textContent = plainText(entry.time);
  timeColumn.append(dot, time);

  const body = document.createElement('div');
  body.className = `entry-body ${safeClass(entry.bodyCls)}`.trim();
  const tag = document.createElement('div');
  tag.className = `entry-tag ${safeClass(entry.tagCls)}`.trim();
  tag.textContent = plainText(entry.tag);
  const copy = document.createElement('p');
  copy.className = 'entry-text';
  copy.textContent = plainText(entry.html);
  body.append(tag, copy);

  if (Array.isArray(entry.chips) && entry.chips.length) {
    const rewards = document.createElement('div');
    rewards.className = 'entry-reward';
    entry.chips.forEach(chip => {
      const reward = document.createElement('span');
      reward.className = `reward-chip ${safeClass(chip.cls)}`.trim();
      reward.textContent = plainText(chip.label);
      rewards.appendChild(reward);
    });
    body.appendChild(rewards);
  }
  li.append(timeColumn, body);
  return li;
}

function prependLogEntry(entry) {
  const feed = document.getElementById('log-feed');
  const scroll = document.getElementById('log-scroll');
  const preservePosition = scroll && scroll.scrollTop > 24;
  const oldScrollHeight = preservePosition ? scroll.scrollHeight : 0;
  feed.insertBefore(makeEntryEl(entry), feed.firstChild);
  if (visibleLogEntries < LOG_PAGE_SIZE) {
    visibleLogEntries = Math.min(state.log.length, visibleLogEntries + 1);
  }
  while (feed.children.length > Math.min(visibleLogEntries, state.log.length)) {
    feed.removeChild(feed.lastChild);
  }
  if (preservePosition) {
    scroll.scrollTop += scroll.scrollHeight - oldScrollHeight;
  }
  updateLogLoadMore();
}

function rebuildLog(resetWindow = true) {
  const feed = document.getElementById('log-feed');
  if (resetWindow) visibleLogEntries = Math.min(LOG_PAGE_SIZE, state.log.length);
  feed.innerHTML = '';
  for (let i = 0; i < Math.min(visibleLogEntries, state.log.length); i++) {
    feed.appendChild(makeEntryEl(state.log[i]));
  }
  updateLogLoadMore();
}

function loadEarlierLogEntries() {
  const feed = document.getElementById('log-feed');
  const previousVisible = Math.min(visibleLogEntries, state.log.length);
  visibleLogEntries = Math.min(state.log.length, previousVisible + LOG_PAGE_SIZE);
  for (let i = previousVisible; i < visibleLogEntries; i++) {
    feed.appendChild(makeEntryEl(state.log[i]));
  }
  updateLogLoadMore();
}

function updateLogLoadMore() {
  const wrap = document.getElementById('log-load-more-wrap');
  const button = document.getElementById('log-load-more');
  if (!wrap || !button || !state) return;
  const remaining = Math.max(0, state.log.length - visibleLogEntries);
  wrap.classList.toggle('hidden', remaining === 0);
  if (remaining) {
    button.textContent = `Load ${Math.min(LOG_PAGE_SIZE, remaining)} earlier entries (${remaining} remaining)`;
  }
}

// ── Skills panel ──────────────────────────────────────
function renderSkillsPanel() {
  const el = document.getElementById('skills-content');
  el.innerHTML = '';
  for (const [aff, data] of Object.entries(SKILLS)) {
    const count = state.affinities[aff] || 0;
    const nextThreshold = AFFINITY_THRESHOLDS.find(t => t > count) || AFFINITY_THRESHOLDS[AFFINITY_THRESHOLDS.length-1];
    const unlockedCount = data.skills.filter(s => hasSkill(s.effect)).length;

    const block = document.createElement('div');
    block.className = 'affinity-block';
    block.innerHTML = `
      <div class="affinity-header">
        <span class="affinity-icon">${data.icon}</span>
        <span class="affinity-name">${data.label}</span>
        <span class="affinity-count">${count} encounters · ${unlockedCount}/${data.skills.length} skills</span>
      </div>
      <div class="affinity-bar-track">
        <div class="affinity-bar-fill" style="width:${Math.min(100,(count/nextThreshold)*100).toFixed(1)}%;background:${data.barColor}"></div>
      </div>
      <div class="skill-list">
        ${data.skills.map((skill, i) => {
          const unlocked = hasSkill(skill.effect);
          const req = AFFINITY_THRESHOLDS[i];
          return `
            <div class="skill-card ${unlocked ? 'unlocked' : 'locked'}">
              <div class="skill-icon">${data.icon}</div>
              <div class="skill-info">
                <div class="skill-name">${skill.name}</div>
                <div class="skill-desc">${skill.desc}</div>
                ${!unlocked ? `<div class="skill-req">Requires ${req} ${data.label} encounters (you have ${count})</div>` : ''}
              </div>
              <div class="skill-badge ${unlocked ? 'unlocked' : 'locked'}">${unlocked ? 'Learned' : 'Locked'}</div>
            </div>`;
        }).join('')}
      </div>`;
    el.appendChild(block);
  }
}

// ── Collection panel ──────────────────────────────────
function renderCollectionPanel() {
  const el = document.getElementById('collection-content');
  const sub = document.getElementById('collection-subtitle');
  const collection = state.collection && typeof state.collection === 'object' && !Array.isArray(state.collection)
    ? state.collection
    : {};
  const entries = Object.entries(collection).filter(([, count]) => Number(count) > 0);
  const recordedCount = entries.reduce((total, [, count]) => total + Math.floor(Number(count)), 0);
  const unrecordedCount = Math.max(0, Math.floor(Number(state.itemsFound) || 0) - recordedCount);
  if (unrecordedCount) entries.push(['__unrecorded', unrecordedCount]);

  if (!entries.length) {
    sub.textContent = 'Everything gathered on the road, carried without weight.';
    el.innerHTML = `<div class="empty-state"><span class="empty-icon">🎒</span>Nothing yet. The road ahead is long.</div>`;
    return;
  }

  sub.textContent = `${state.itemsFound} item${state.itemsFound!==1?'s':''} gathered. Carried without weight.`;
  // Sort: rare first, then uncommon, then common; alpha within
  const order = { rare: 0, uncommon: 1, common: 2 };
  const sorted = entries.sort(([a],[b]) => {
    const ia = ITEMS.find(i=>i.id===a), ib = ITEMS.find(i=>i.id===b);
    if (!ia||!ib) return 0;
    return (order[ia.rarity]??9) - (order[ib.rarity]??9) || ia.name.localeCompare(ib.name);
  });

  el.innerHTML = `<div class="collection-grid">
    ${sorted.map(([id, count]) => {
      if (id === '__unrecorded') {
        return `<div class="item-card rarity-common">
          <div class="item-rarity common">keepsake</div>
          <div class="item-name">Uncatalogued Road Keepsake</div>
          <div class="item-desc">Found on an earlier journey, before the journal recorded its details.</div>
          ${count > 1 ? `<div class="item-count">Found ${count}×</div>` : ''}
        </div>`;
      }
      const item = ITEMS.find(i=>i.id===id);
      if (!item) {
        return `<div class="item-card rarity-common">
          <div class="item-rarity common">keepsake</div>
          <div class="item-name">Unknown Road Keepsake</div>
          <div class="item-desc">An older road find whose details have faded from the journal.</div>
          ${count > 1 ? `<div class="item-count">Found ${count}×</div>` : ''}
        </div>`;
      }
      return `<div class="item-card rarity-${item.rarity}">
        <div class="item-rarity ${item.rarity}">${item.rarity}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-desc">${item.desc}</div>
        ${count > 1 ? `<div class="item-count">Found ${count}×</div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

// ── Restart ───────────────────────────────────────────
function renderRestartButton() {
  const el = document.getElementById('restart-wrap');
  if (!el) return;
  el.innerHTML = `
    <div class="restart-section">
      <button type="button" class="restart-btn" id="restart-btn-1">Start a new journey</button>
      <p class="restart-hint">This will permanently erase your current traveler and everything they have found. There is no going back.</p>
    </div>`;
  document.getElementById('restart-btn-1').addEventListener('click', () => {
    el.innerHTML = `
      <div class="restart-section restart-confirm">
        <p class="restart-hint">Are you certain? <strong>${state.name}</strong> has walked ${Math.floor(state.steps).toLocaleString()} steps. That road will be gone.</p>
        <div class="restart-btn-row">
          <button type="button" class="restart-btn restart-btn--cancel" id="restart-cancel">Keep walking</button>
          <button type="button" class="restart-btn restart-btn--confirm" id="restart-confirm">Leave it all behind</button>
        </div>
      </div>`;
    document.getElementById('restart-cancel').addEventListener('click', renderRestartButton);
    document.getElementById('restart-confirm').addEventListener('click', () => {
      try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
      if (saveUrl && window.XF) {
        XF.ajax('POST', saveUrl, { reset: true }, function() {}, { skipDefaultSuccessError: true, skipDefault: true });
      }
      location.reload();
    });
  });
}

// ── Titles panel ──────────────────────────────────────
function renderTitlesPanel() {
  const el = document.getElementById('titles-content');
  el.innerHTML = `<div class="titles-list">
    ${TITLES.map(t => {
      const earned = state.titlesEarned.includes(t.id);
      const isActive = state.activeTitle === t.label;
      return `<div class="title-card ${earned?'earned':''} ${isActive?'active-title':''}">
        <div class="title-icon">${earned ? '🏅' : '🔒'}</div>
        <div class="title-info">
          <div class="title-name">"${t.label}"</div>
          <div class="title-hint">${earned ? (isActive ? 'Currently displayed.' : 'Earned.') : t.hint}</div>
        </div>
        ${isActive ? `<span class="title-active-badge">ACTIVE</span>` : ''}
        ${earned && !isActive ? `<button type="button" class="title-set-btn" data-title-id="${t.id}">Set active</button>` : ''}
        ${!earned ? `<span class="title-locked-badge">LOCKED</span>` : ''}
      </div>`;
    }).join('')}
  </div>`;

  if (!document.getElementById('restart-wrap')) {
    const wrap = document.createElement('div');
    wrap.id = 'restart-wrap';
    el.after(wrap);
  }
  renderRestartButton();
}

function setTitle(titleId) {
  const title = TITLES.find(candidate => candidate.id === titleId);
  if (!title || !state.titlesEarned.includes(title.id)) return;

  state.activeTitle = title.label;
  save();
  updateUI();
  renderTitlesPanel();
}

// ── Panel switching ───────────────────────────────────
function switchPanel(name) {
  activePanel = name;
  document.getElementById('panel-area').classList.toggle('panel-area--log', name === 'log');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-panel="${name}"]`).classList.add('active');
  ['log','skills','collection','titles'].forEach(p => {
    document.getElementById(`panel-${p}`).classList.toggle('hidden', p !== name);
  });
  if (name === 'skills')     renderSkillsPanel();
  if (name === 'collection') renderCollectionPanel();
  if (name === 'titles')     { renderTitlesPanel(); renderRestartButton(); }
}

// ── Portrait upload ───────────────────────────────────
function applyPortrait() {
  const img   = document.getElementById('portrait-img');
  const emoji = document.getElementById('portrait-emoji');
  const removeBtn = document.getElementById('portrait-remove');
  if (state.portrait) {
    img.src = state.portrait;
    img.classList.remove('hidden');
    emoji.classList.add('hidden');
    removeBtn.classList.remove('hidden');
  } else {
    img.classList.add('hidden');
    emoji.classList.remove('hidden');
    removeBtn.classList.add('hidden');
  }
}

function initPortrait() {
  const ring   = document.getElementById('portrait-ring');
  const upload = document.getElementById('portrait-upload');
  const removeBtn = document.getElementById('portrait-remove');

  ring.addEventListener('click', () => upload.click());

  upload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      // Resize to 160×160 via canvas before storing
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160; canvas.height = 160;
        const ctx = canvas.getContext('2d');
        // Cover-crop: scale to fill square
        const size = Math.min(image.width, image.height);
        const sx = (image.width  - size) / 2;
        const sy = (image.height - size) / 2;
        ctx.drawImage(image, sx, sy, size, size, 0, 0, 160, 160);
        state.portrait = canvas.toDataURL('image/jpeg', 0.82);
        applyPortrait();
        save();
      };
      image.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    upload.value = '';
  });

  removeBtn.addEventListener('click', e => {
    e.stopPropagation(); // don't trigger ring click
    state.portrait = null;
    applyPortrait();
    save();
  });

  // Apply on load if portrait already saved
  applyPortrait();
}

function syncDesktopLayoutHeight() {
  const layout = document.querySelector('.layout');
  const sidebar = document.querySelector('.sidebar');
  if (!layout || !sidebar) return;

  if (window.matchMedia('(max-width: 900px)').matches) {
    layout.style.removeProperty('--tlr-layout-height');
    return;
  }

  const contentHeight = Array.from(sidebar.children)
    .reduce((height, child) => height + child.offsetHeight, 0);
  if (contentHeight > 0) {
    layout.style.setProperty('--tlr-layout-height', `${Math.ceil(contentHeight)}px`);
  }
}

// ── Start / init ──────────────────────────────────────
function startGame() {
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');

  applyOfflineProgress();

  _lastMilestone = 0;
  for (const m of STEP_MILESTONES) { if (state.steps >= m) _lastMilestone = m; }
  _eventCooldown = 30 + Math.floor(Math.random() * 30);
  _itemCooldown  = 60 + Math.floor(Math.random() * 60);

  if (state.log.length === 0) {
    pushLog('Journey begins','','','',
      `The gate closes behind you. Somewhere ahead, the road goes on longer than you can imagine. You take the first step.`);
  }

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });
  document.getElementById('log-load-more').addEventListener('click', loadEarlierLogEntries);
  document.getElementById('titles-content').addEventListener('click', event => {
    const button = event.target.closest('.title-set-btn');
    if (button) setTitle(button.dataset.titleId);
  });

  rebuildLog();
  updateUI();
  initPortrait();
  syncDesktopLayoutHeight();
  requestAnimationFrame(syncDesktopLayoutHeight);
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(tick, 1000);
}

function applyOfflineProgress() {
  const savedAt = Number(state.lastSaved) || Date.now();
  const elapsed = Math.min(8 * 60 * 60, Math.floor((Date.now() - savedAt) / 1000));
  if (elapsed < 15) return;

  state.isResting = false;
  state.forcedRest = false;
  state.travelSeconds = (state.travelSeconds || state.steps || 0) + elapsed;
  state.days = 1 + Math.floor(state.travelSeconds / 3600);
  state.steps += elapsed;
  state.locationSteps += elapsed;
  gainExp(elapsed);

  while (state.locationIndex < LOCATIONS.length - 1) {
    const current = LOCATIONS[state.locationIndex];
    if (state.locationSteps < current.stepsNeeded) break;
    state.locationSteps -= current.stepsNeeded;
    state.locationIndex++;
    const next = LOCATIONS[state.locationIndex];
    logLocation(`While you were away, the road carried you beyond <strong>${current.name}</strong> to <strong>${next.name}</strong>.`);
  }

  pushLog('Welcome back', 'tag-event', 'dot-event', 'ev-event',
    `Your traveler covered <strong>${fmt(elapsed)} steps</strong> while you were away.`,
    [{ label: `+ ${fmt(elapsed)} offline steps`, cls: 'chip-exp' }]);
  checkTitles();
  save();
}

const nameInput = document.getElementById('name-input');
const beginBtn  = document.getElementById('begin-btn');
window.addEventListener('resize', syncDesktopLayoutHeight);
nameInput.addEventListener('input', () => { beginBtn.disabled = nameInput.value.trim().length < 2; });
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !beginBtn.disabled) beginBtn.click(); });
beginBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (name.length < 2) return;
  state = defaultState(name);
  save(); startGame();
});

(function init() {
  const saved = load();
  if (saved) { state = saved; startGame(); }
})();

})();
