(function (root, factory) {
  'use strict';

  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  if (root) root.OLFLongRoadCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LOCATIONS = [
  { name: 'The First Road', desc: 'The road stretches ahead, unfamiliar and full of quiet promise. Your boots are still clean.', stepsNeeded: 500 },
  { name: 'Millbrook Crossing', desc: 'A wooden bridge over a shallow stream. The mill wheel turns slowly, grinding something that does not smell like flour.', stepsNeeded: 1200 },
  { name: 'The Hollow Road', desc: 'A long stretch of packed earth flanked by old willows. Something watches from the branches.', stepsNeeded: 2500 },
  { name: 'Greymere Crossing', desc: 'A crossroads with a chipped signpost. Three of the four directions have been scratched off.', stepsNeeded: 4500 },
  { name: 'The Ashfield', desc: 'Fields of grey wheat that sway without wind. The farmers here speak only in whispers.', stepsNeeded: 7500 },
  { name: 'Crestfall Bridge', desc: 'A wide stone bridge over a slow river. The stonework is old and well-kept. Someone has been maintaining it for a long time, but there is no-one here.', stepsNeeded: 10000 },
  { name: 'Duskwatch Tower', desc: 'The tower is empty, yet a candle burns in every window. You do not linger.', stepsNeeded: 12000 },
  { name: 'The Salt Flats', desc: 'White ground that crunches underfoot. Nothing grows here. The air tastes of something old and mineral. Your shadow looks longer than it should.', stepsNeeded: 15000 },
  { name: 'The Sunken Road', desc: 'A road that descends below the treeline until the sky is a ribbon above you. Things grow larger here.', stepsNeeded: 18000 },
  { name: 'Oldhollow Fen', desc: 'Boggy ground on either side of a raised causeway. The water is dark and still. Occasionally something moves in it that is too large to be a fish.', stepsNeeded: 22000 },
  { name: 'The Pale Moors', desc: 'Flat, featureless land under a sky that seems too large. Distance is impossible to judge.', stepsNeeded: 27000 },
  { name: 'Thornwall Village', desc: 'A village that appears on no map. The people are friendly in the deliberate way of people who need something.', stepsNeeded: 40000 },
  { name: 'The Shivering Pass', desc: 'A narrow mountain pass where the wind comes from every direction at once. The cold here is not entirely explained by the altitude.', stepsNeeded: 50000 },
  { name: 'The Wandering Wood', desc: 'The trees here are never in the same place twice. You have given up trying to remember the path.', stepsNeeded: 60000 },
  { name: 'The Unmapped Shore', desc: 'The road ends at a shoreline that appears on no chart. The water is calm and goes further than the eye can follow. You are not sure what you are supposed to do here. You keep walking along the edge.', stepsNeeded: 80000 },
];

  const AFFINITY_THRESHOLDS = [3, 8, 16, 28, 45];
  const SKILLS = {
    endurance: { icon: '🥾', label: 'Endurance', color: '#6B7F5E', barColor: '#6B7F5E', skills: [
      { name: 'Sure-Footed', desc: 'Stamina recovers 2× faster while walking. The road has toughened your stride.', effect: 'sp_regen_2x' },
      { name: 'Iron Stride', desc: 'Gain a bonus step every 5 seconds at full Stamina. Momentum becomes its own reward.', effect: 'bonus_steps' },
      { name: 'Road-Hardened', desc: 'Maximum Stamina increased by 50. You have walked through worse.', effect: 'sp_max_bonus' },
      { name: 'The Long Haul', desc: 'Gain 1 bonus EXP per step instead of 1. The distance is the teacher.', effect: 'double_step_exp' },
      { name: 'Second Wind', desc: 'When forced to rest, recover 75% HP instead of 50%. The road has taught you how to fall.', effect: 'better_recovery' },
    ]},
    luck: { icon: '🎲', label: 'Luck', color: '#8B6F47', barColor: '#C4A97D', skills: [
      { name: "Fortune's Eye", desc: 'Item drop rate increased by 25%. You notice things others walk past.', effect: 'item_rate_up' },
      { name: 'Serendipity', desc: 'Rare item chance doubled. The road rewards surprise.', effect: 'rare_rate_up' },
      { name: 'Windfall', desc: 'Events occasionally award double EXP.', effect: 'exp_windfall' },
      { name: 'The Golden Mile', desc: 'Every 500 steps can trigger a bonus item drop.', effect: 'mile_bonus' },
      { name: 'Lucky Find', desc: 'Once per day, an item drop is guaranteed at full uncommon rarity or better.', effect: 'daily_rare_floor' },
    ]},
    arcane: { icon: '✨', label: 'Arcane', color: '#5B7FA6', barColor: '#5B7FA6', skills: [
      { name: 'Wayward Sense', desc: 'Strange events occur 20% more often.', effect: 'arcane_freq' },
      { name: 'The Knowing', desc: 'Gain 50% bonus EXP from arcane events.', effect: 'arcane_exp' },
      { name: 'Mana-Touched', desc: 'Maximum Mana increased by 40.', effect: 'mp_max_bonus' },
      { name: 'Deep Roads', desc: 'Locations beyond The Ashfield yield bonus EXP.', effect: 'deep_road_exp' },
      { name: 'The Wander-Sense', desc: 'Glimpse events appear more frequently. The road shares more of its secrets.', effect: 'glimpse_freq' },
    ]},
    nature: { icon: '🌿', label: 'Nature', color: '#5A7A52', barColor: '#5A7A52', skills: [
      { name: 'Roadside Forager', desc: 'Slowly regenerate HP while walking.', effect: 'hp_regen' },
      { name: 'Beast-Familiar', desc: 'Animal encounters restore HP and SP.', effect: 'beast_heal' },
      { name: 'Green-Thumbed', desc: 'Maximum HP increased by 40.', effect: 'hp_max_bonus' },
      { name: 'Old Paths', desc: 'Gain bonus EXP when entering new locations.', effect: 'loc_exp' },
      { name: 'Trail-Reader', desc: 'Location-specific events occur 50% more often. You have learned to read the land.', effect: 'loc_event_freq' },
    ]},
    social: { icon: '🤝', label: 'Social', color: '#A8431F', barColor: '#A8431F', skills: [
      { name: 'Well-Met', desc: 'Gain 30% bonus EXP from encounters.', effect: 'social_exp' },
      { name: 'A Friendly Face', desc: 'NPC encounters occur 20% more often.', effect: 'social_freq' },
      { name: "Trader's Eye", desc: 'Encounter item drops have improved rarity.', effect: 'social_items' },
      { name: 'Storied Road', desc: 'Each new day grants bonus EXP.', effect: 'day_bonus' },
      { name: 'Fellow Traveler', desc: 'Glimpse events from other travelers occasionally restore HP and SP. The road is less lonely than it was.', effect: 'glimpse_heal' },
    ]},
  };
  const SKILL_EFFECTS = Object.fromEntries(Object.entries(SKILLS).map(([key, data]) => [key, data.skills.map(skill => skill.effect)]));

  const ITEMS = [
    ['round_stone','Peculiarly Round Stone','common',1,'Smoother than river stones have any right to be.'],
    ['old_coin','Unreadable Old Coin','common',1,'The face on it does not match any known ruler.'],
    ['crow_feather','Crow Feather','common',1,'Glossy black. Probably just a feather.'],
    ['river_mud','Small Jar of River Mud','common',1,'Given to you by an old woman who seemed satisfied by the exchange.'],
    ['bent_nail','Bent Iron Nail','common',1,'Old enough to be interesting, not old enough to be valuable.'],
    ['dried_flower','Dried Wildflower','common',1,'Purple. Pressed flat. Someone kept this once.'],
    ['smooth_glass','Sea-Smoothed Glass','common',2,'Green. You are nowhere near the sea.'],
    ['brass_button','Brass Button','common',2,'From a coat of some importance, once.'],
    ['acorn_cap','Unusually Large Acorn Cap','common',2,'Big enough to use as a bowl. You have not done this.'],
    ['knot_of_rope','Knot That Cannot Be Undone','common',3,'You have tried. It is simply not possible.'],
    ['odd_root','Root Shaped Like a Hand','uncommon',3,'Five distinct fingers. You try not to think about it.'],
    ['warm_stone','Stone That Is Always Warm','uncommon',4,'Not from any obvious source. It does not cool.'],
    ['letter','Sealed Letter (Unopened)','uncommon',4,'Addressed to someone. You have not opened it. Not yet.'],
    ['worn_map','Map of Somewhere Else','uncommon',5,'The roads on this map do not exist anywhere you have been.'],
    ['bone_dice','Pair of Bone Dice','uncommon',5,'Both show six, no matter how they land.'],
    ['compass','Weathered Compass','rare',3,'Its needle spins slowly, pointing nowhere on any known map.'],
    ['glass_eye','Glass Eye','rare',6,'Hazel. Follows nothing. You keep it anyway.'],
    ['silver_key','Silver Key','rare',7,'No visible lock. The metal is warm to the touch.'],
    ['singing_stone','Stone That Hums at Dusk','rare',8,'A single, low note. Not unpleasant.'],
    ['ink_vial','Vial of Ink That Moves','rare',9,'The ink shifts inside the sealed glass with no apparent cause.'],
    ['old_crown','Tarnished Circlet','rare',12,'Too small for a man. Too large for a child. Unknown metal.'],
    ['road_ghost','Bottled Road Mist','rare',15,'The mist from a crossroads at midnight. It presses against the glass.'],
    ['worn_boot','Boot With No Pair','uncommon',15,'Well-made. Extremely worn. The other one is somewhere on this same road.'],
    ['folded_note','Note Written in Future Tense','uncommon',16,'It describes things that have not happened yet. Some already have.'],
    ['black_ribbon','Black Ribbon, Still Tied','uncommon',17,'In a bow around nothing. You do not untie it.'],
    ['heavy_coin','Coin Too Heavy for Its Size','uncommon',18,'Made of something denser than any metal you know by name.'],
    ['cracked_lens','Cracked Monocle Lens','uncommon',19,'Things look clearer through the crack than through the glass.'],
    ['frozen_watch','Pocketwatch Stopped at Dusk','rare',15,'The hands do not move. The ticking continues.'],
    ['small_door','Door That Fits in a Pocket','rare',17,'Fully functional. Leads somewhere different each time.'],
    ['named_stone','Stone with a Name Carved In','rare',18,'Your name, in handwriting you do not recognise.'],
    ['road_dust','Vial of Road Dust','uncommon',20,'Collected from ten roads. It moves when the vial is still.'],
    ['unfinished_map','Half-Drawn Map','uncommon',21,'Someone ran out of road before they ran out of map.'],
    ['travellers_oath',"Traveller's Oath (Unsigned)",'uncommon',22,"A formal agreement with the road. The other signature is blank."],
    ['mirror_shard','Mirror That Shows Yesterday','uncommon',23,'Not a metaphor. You checked.'],
    ['lantern_dark','Lantern That Burns Cold','rare',20,'It illuminates nothing but casts clear shadows.'],
    ['echo_stone','Echo Stone','rare',22,'Speak into it and it answers eventually, in a voice almost your own.'],
    ['road_coin',"The Road's Own Coin",'rare',24,'It has no face and far too much weight.'],
    ['first_boot','Boot from the First Journey','rare',25,'Impossibly preserved. Not yours—or an earlier version of yours.'],
    ['hollow_compass','Compass with No Needle','rare',27,'Something moves inside that is not a needle.'],
    ['last_mile_stone','Milestone Marked Zero','rare',29,'A milestone counting down to something you did not find.'],
['salt_crystal','Salt Flat Crystal','uncommon',15,'A perfect cube of salt from the flats. It should not be this shape naturally. It is.'],
['fen_reed','Bundle of Fen Reeds','common',22,'Tied with a cord you did not tie. They smell of deep water and something older.'],
['shore_stone','Stone from the Unmapped Shore','rare',35,'Perfectly smooth. Warm despite the cold wind off the water. It hums occasionally at low tide, wherever that is.'],
['bridge_toll','Old Bridge Toll Coin','common',10,'Left on the Crestfall Bridge by someone who is no longer there to collect it. You take it anyway.'],
['pass_wind','Bottled Shivering Pass Wind','uncommon',25,'Sealed in a flask. The glass is cold. When you hold it to your ear you can hear something that is not wind.'],
['fen_lantern','Fen Lantern','rare',23,'A small lamp that burns with a blue-green light. Found floating in Oldhollow Fen. It followed you to shore.'],
['salt_compass','Compass Crusted in Salt','uncommon',16,'Pulled from the Salt Flats. The needle works, but only points back the way you came.'],
['shore_chart','Chart of the Unmapped Shore','rare',36,'A detailed map of a coastline that should not exist. Whoever drew it was here before you. The footprints in the margin are about your size.'],
['pass_stone','Stone Carved with a Warning','uncommon',26,'Found in the Shivering Pass. The language is unfamiliar but the meaning feels obvious. You put it in your pack anyway.'],
['bridge_moss','Moss from the Crestfall Bridge','common',10,'Green and soft, growing from the join between two stones. It was growing there when the bridge was built. It will be growing there when it falls.'],
  ].map(([id,name,rarity,minLevel,desc]) => ({id,name,rarity,minLevel,desc}));

  const TITLES = [
    ['first_step','First Step','Take your first step.',s=>s.steps>=1],
    ['hundred','The Persistent','Walk 100 steps.',s=>s.steps>=100],
    ['wanderer','The Wanderer','Walk 500 steps.',s=>s.steps>=500],
    ['thousand','A Thousand Miles','Walk 1,000 steps.',s=>s.steps>=1000],
    ['tenthousand','The Long-Haul','Walk 10,000 steps.',s=>s.steps>=10000],
    ['collector','Finder of Odd Stones','Find 10 items.',s=>s.itemsFound>=10],
    ['hoarder','The Collector','Find 25 items.',s=>s.itemsFound>=25],
    ['seasoned','Seasoned Traveler','Journey for 7 days.',s=>s.days>=7],
    ['level5','Road-Worn','Reach level 5.',s=>s.level>=5],
    ['level10','Far-Travelled','Reach level 10.',s=>s.level>=10],
    ['level20','The Weathered','Reach level 20.',s=>s.level>=20],
    ['skilled','Marked by the Road','Unlock your first skill.',s=>(s.skillsUnlocked||[]).length>=1],
    ['adept','Road-Adept','Unlock 5 skills.',s=>(s.skillsUnlocked||[]).length>=5],
    ['master','The Road-Touched','Unlock 10 skills.',s=>(s.skillsUnlocked||[]).length>=10],
    ['fifty_thou','Fifty Thousand Steps','Walk 50,000 steps.',s=>s.steps>=50000],
    ['hundred_thou','The Endless','Walk 100,000 steps.',s=>s.steps>=100000],
    ['level30','Deeply Travelled','Reach level 30.',s=>s.level>=30],
    ['level50','The Inexhaustible','Reach level 50.',s=>s.level>=50],
    ['month','A Month on the Road','Journey for 30 days.',s=>s.days>=30],
    ['many_things','Keeper of Strange Things','Find 50 items.',s=>s.itemsFound>=50],
    ['rare_finder','The Fortunate','Find your first rare item.',s=>Object.keys(s.collection||{}).some(id=>ITEMS.find(item=>item.id===id)?.rarity==='rare')],
    ['down_once','What Does Not Kill','Be forced to rest.',s=>(s.forcedRests||0)>=1],
    ['down_five','Hard-Won Miles','Be forced to rest 5 times.',s=>(s.forcedRests||0)>=5],
    ['reach_ashfield','Beyond the Crossing','Reach The Ashfield.',s=>s.locationIndex>=4],
    ['reach_moors','Walker of Pale Places','Reach The Pale Moors.',s=>s.locationIndex>=7],
    ['reach_wood','Into the Wandering Wood','Reach The Wandering Wood.',s=>s.locationIndex>=9],
['reach_shore','Walker of the Unmapped Shore','Reach The Unmapped Shore.',s=>s.locationIndex>=14],
['reach_pass','Through the Shivering Pass','Reach The Shivering Pass.',s=>s.locationIndex>=12],
['two_fifty_thou','The Unrelenting','Walk 250,000 steps.',s=>s.steps>=250000],
['glimpse_seen','Something Shared','Experience your first glimpse of another journey.',s=>(s.glimpsesSeen||0)>=1],
['all_skilled','Road-Complete','Unlock all 25 skills.',s=>(s.skillsUnlocked||[]).length>=25],
  ].map(([id,label,hint,condition]) => ({id,label,hint,condition}));

  const STEP_MILESTONES = [1000,5000,10000,25000,50000,100000,250000,500000];
  const GEM_REWARDS = {1000:1,5000:2,10000:3,25000:5,50000:8,100000:12,250000:25,500000:50};
  const REWARD_INACTIVITY_MS = 15 * 60 * 1000;
  const REWARD_SESSION_KEY = 'tlr_reward_session_v1';

  function createRewardActivityTracker(onChange) {
    let sessionId = '';
    try { sessionId = sessionStorage.getItem(REWARD_SESSION_KEY) || ''; } catch (e) {}
    if (!/^[a-f0-9-]{16,64}$/i.test(sessionId)) {
      sessionId = self.crypto && typeof self.crypto.randomUUID === 'function'
        ? self.crypto.randomUUID()
        : Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join('');
      try { sessionStorage.setItem(REWARD_SESSION_KEY, sessionId); } catch (e) {}
    }

    let lastActivity = Date.now();
    let unacknowledgedSeconds = 0;
    let previousEligibility = null;
    const isEligible = () => document.visibilityState === 'visible'
      && (typeof document.hasFocus !== 'function' || document.hasFocus())
      && Date.now() - lastActivity < REWARD_INACTIVITY_MS;
    const publish = () => {
      const eligible = isEligible();
      if (eligible !== previousEligibility) {
        previousEligibility = eligible;
        if (typeof onChange === 'function') onChange(eligible);
      }
      return eligible;
    };
    const noteActivity = () => { lastActivity = Date.now(); publish(); };
    ['pointerdown','keydown','touchstart','scroll'].forEach(eventName => {
      window.addEventListener(eventName, noteActivity, {passive:true});
    });
    window.addEventListener('focus', noteActivity);
    document.addEventListener('visibilitychange', publish);

    return {
      sessionId,
      recordSecond() {
        if (!publish()) return false;
        unacknowledgedSeconds++;
        return true;
      },
      pendingSeconds() { return unacknowledgedSeconds; },
      acknowledge(seconds) {
        unacknowledgedSeconds = Math.max(0, unacknowledgedSeconds - Math.max(0, Number(seconds) || 0));
      },
      isEligible: publish
    };
  }
  function expToNext(level) { return Math.round(100*Math.pow(1.5,level-1)); }
  function maxHP(level) { return 100+(level-1)*20; }
  function maxMP(level) { return 50+(level-1)*10; }
  function maxSP(level) { return 100+(level-1)*15; }
  function weightedPick(items, random=Math.random) {
    const total=items.reduce((sum,item)=>sum+(item.weight||1),0);
    let value=random()*total;
    for (const item of items) { value-=item.weight||1; if (value<=0) return item; }
    return items[items.length-1];
  }
  function eligibleItems(level) { return ITEMS.filter(item=>item.minLevel<=level); }
  function skillSet(state) { return new Set(state.skillsUnlocked||[]); }
  function gainExp(state, amount) {
    const skills=skillSet(state);
    if (skills.has('double_step_exp')&&amount===1) amount=2;
    state.exp=(Number(state.exp)||0)+amount;
    const levels=[];
    while (state.exp>=expToNext(state.level)) {
      state.exp-=expToNext(state.level);
      state.level++;
      state.hp=maxHP(state.level)+(skills.has('hp_max_bonus')?40:0);
      state.mp=maxMP(state.level)+(skills.has('mp_max_bonus')?40:0);
      state.sp=maxSP(state.level)+(skills.has('sp_max_bonus')?50:0);
      levels.push(state.level);
    }
    return levels;
  }
  function unlockSkills(state) {
    const unlocked=skillSet(state);
    const added=[];
    Object.entries(SKILL_EFFECTS).forEach(([affinity,effects])=>{
      const count=Number(state.affinities?.[affinity])||0;
      effects.forEach((effect,index)=>{
        if (count>=AFFINITY_THRESHOLDS[index]&&!unlocked.has(effect)) {
          unlocked.add(effect); added.push(effect);
          if (effect==='sp_max_bonus') state.sp=Math.min(maxSP(state.level)+50,state.sp+50);
          if (effect==='mp_max_bonus') state.mp=Math.min(maxMP(state.level)+40,state.mp+40);
          if (effect==='hp_max_bonus') state.hp=Math.min(maxHP(state.level)+40,state.hp+40);
        }
      });
    });
    state.skillsUnlocked=Array.from(unlocked);
    return added;
  }
  function advanceLocations(state) {
    const reached=[];
    let current=LOCATIONS[state.locationIndex];
    while (current&&state.locationSteps>=current.stepsNeeded&&state.locationIndex<LOCATIONS.length-1) {
      state.locationSteps-=current.stepsNeeded;
      state.locationIndex++;
      reached.push(state.locationIndex);
      current=LOCATIONS[state.locationIndex];
    }
    return reached;
  }
  function newTitles(state) {
    const earned=new Set(state.titlesEarned||[]);
    return TITLES.filter(title=>!earned.has(title.id)&&title.condition(state));
  }
  function resolveState(serverState, localState) {
    if (!serverState) return localState;
    if (!localState) return serverState;
    const serverRevision=Number(serverState._revision)||0;
    const localRevision=Number(localState._revision)||0;
    if (localRevision!==serverRevision) return localRevision>serverRevision?localState:serverState;
    return localState._dirty?localState:serverState;
  }
  function normalizeState(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const level=Math.max(1,Number(input.level)||1);
    const base={
      name:'Traveler',level,exp:0,hp:maxHP(level),mp:maxMP(level),sp:maxSP(level),
      steps:0,days:1,travelSeconds:0,gemsEarned:0,itemsFound:0,eventsFound:0,
      collection:{},titlesEarned:['first_step'],activeTitle:'First Step',skillsUnlocked:[],
      affinities:{endurance:0,luck:0,arcane:0,nature:0,social:0},locationIndex:0,
      locationSteps:0,log:[],isResting:false,forcedRest:false,forcedRests:0,
      portrait:null,glimpsesSeen:0,lastSaved:Date.now(),_revision:0,_dirty:false,_syncError:false
    };
    const state={...base,...input};
    state.collection=state.collection&&typeof state.collection==='object'&&!Array.isArray(state.collection)?state.collection:{};
    state.affinities={...base.affinities,...(state.affinities||{})};
    state.titlesEarned=Array.isArray(state.titlesEarned)?state.titlesEarned:['first_step'];
    state.skillsUnlocked=Array.isArray(state.skillsUnlocked)?state.skillsUnlocked:[];
    state.log=Array.isArray(state.log)?state.log:[];
    return Object.fromEntries(Object.keys(base).map(key=>[key,state[key]]));
  }
  function mergeProgress(serverState, localState) {
    const server=normalizeState(serverState);
    const local=normalizeState(localState);
    if (!server) return local;
    if (!local) return server;
    const merged={...server,...local};
    ['steps','days','travelSeconds','itemsFound','eventsFound','forcedRests','level'].forEach(key=>{
      merged[key]=Math.max(Number(server[key])||0,Number(local[key])||0);
    });
    merged.gemsEarned=Number(server.gemsEarned)||0;
    ['collection','affinities'].forEach(mapKey=>{
      merged[mapKey]={...(server[mapKey]||{})};
      Object.entries(local[mapKey]||{}).forEach(([key,value])=>{
        merged[mapKey][key]=Math.max(Number(merged[mapKey][key])||0,Number(value)||0);
      });
    });
    ['titlesEarned','skillsUnlocked'].forEach(key=>{
      merged[key]=Array.from(new Set([...(server[key]||[]),...(local[key]||[])]));
    });
    merged.log=Array.from(new Map([...(local.log||[]),...(server.log||[])].map(entry=>[JSON.stringify(entry),entry])).values()).slice(0,500);
    merged._revision=Number(server._revision)||0;
    merged._dirty=true;
    return merged;
  }

  return {LOCATIONS,AFFINITY_THRESHOLDS,SKILLS,SKILL_EFFECTS,ITEMS,TITLES,STEP_MILESTONES,GEM_REWARDS,expToNext,maxHP,maxMP,maxSP,weightedPick,eligibleItems,skillSet,gainExp,unlockSkills,advanceLocations,newTitles,resolveState,normalizeState,mergeProgress,createRewardActivityTracker};
});
