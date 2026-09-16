/* Front Office OS — NFL + NBA team selector and live roster loader.
   Data source: ESPN's public roster endpoints. No API key is required.
   The selected team is saved in localStorage so the choice persists between pages.
*/

const TEAMS = {
  NFL: [
    ['ARI','Arizona Cardinals'],['ATL','Atlanta Falcons'],['BAL','Baltimore Ravens'],['BUF','Buffalo Bills'],
    ['CAR','Carolina Panthers'],['CHI','Chicago Bears'],['CIN','Cincinnati Bengals'],['CLE','Cleveland Browns'],
    ['DAL','Dallas Cowboys'],['DEN','Denver Broncos'],['DET','Detroit Lions'],['GB','Green Bay Packers'],
    ['HOU','Houston Texans'],['IND','Indianapolis Colts'],['JAX','Jacksonville Jaguars'],['KC','Kansas City Chiefs'],
    ['LV','Las Vegas Raiders'],['LAC','Los Angeles Chargers'],['LAR','Los Angeles Rams'],['MIA','Miami Dolphins'],
    ['MIN','Minnesota Vikings'],['NE','New England Patriots'],['NO','New Orleans Saints'],['NYG','New York Giants'],
    ['NYJ','New York Jets'],['PHI','Philadelphia Eagles'],['PIT','Pittsburgh Steelers'],['SF','San Francisco 49ers'],
    ['SEA','Seattle Seahawks'],['TB','Tampa Bay Buccaneers'],['TEN','Tennessee Titans'],['WAS','Washington Commanders']
  ],
  NBA: [
    ['ATL','Atlanta Hawks'],['BOS','Boston Celtics'],['BKN','Brooklyn Nets'],['CHA','Charlotte Hornets'],
    ['CHI','Chicago Bulls'],['CLE','Cleveland Cavaliers'],['DAL','Dallas Mavericks'],['DEN','Denver Nuggets'],
    ['DET','Detroit Pistons'],['GS','Golden State Warriors'],['HOU','Houston Rockets'],['IND','Indiana Pacers'],
    ['LAC','LA Clippers'],['LAL','Los Angeles Lakers'],['MEM','Memphis Grizzlies'],['MIA','Miami Heat'],
    ['MIL','Milwaukee Bucks'],['MIN','Minnesota Timberwolves'],['NO','New Orleans Pelicans'],['NY','New York Knicks'],
    ['OKC','Oklahoma City Thunder'],['ORL','Orlando Magic'],['PHI','Philadelphia 76ers'],['PHX','Phoenix Suns'],
    ['POR','Portland Trail Blazers'],['SAC','Sacramento Kings'],['SA','San Antonio Spurs'],['TOR','Toronto Raptors'],
    ['UTA','Utah Jazz'],['WAS','Washington Wizards']
  ]
};

const TEAM_LOOKUP = Object.fromEntries(
  Object.entries(TEAMS).flatMap(([league, teams]) =>
    teams.map(([id, name]) => [`${league}:${id}`, { league, id, name }])
  )
);

function getSelectedTeam() {
  const saved = localStorage.getItem('frontOfficeTeam');
  return TEAM_LOOKUP[saved] || { league: 'NFL', id: 'ATL', name: 'Atlanta Falcons' };
}

function saveSelectedTeam(league, id) {
  localStorage.setItem('frontOfficeTeam', `${league}:${id}`);
}

function endpointFor(team) {
  const sport = team.league === 'NBA' ? 'basketball/nba' : 'football/nfl';
  return `https://site.api.espn.com/apis/site/v2/sports/${sport}/teams/${team.id.toLowerCase()}/roster`;
}

function flattenRoster(data) {
  if (!data || !Array.isArray(data.athletes)) return [];
  return data.athletes.flatMap(group =>
    (group.items || []).map(player => ({
      id: player.id,
      name: player.fullName || player.displayName || 'Unknown player',
      position: player.position?.abbreviation || player.position?.name || '—',
      jersey: player.jersey || '',
      status: player.status?.abbreviation || player.status?.name || '—',
      age: player.age || '',
      experience: player.experience?.years ?? ''
    }))
  );
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  }[char]));
}

function populateTeamControls(selected) {
  const leagueSelect = document.querySelector('#league-select');
  const teamSelect = document.querySelector('#team-select');
  if (!leagueSelect || !teamSelect) return;

  leagueSelect.value = selected.league;
  teamSelect.innerHTML = TEAMS[selected.league].map(([id, name]) =>
    `<option value="${id}">${escapeHtml(name)}</option>`
  ).join('');
  teamSelect.value = selected.id;

  leagueSelect.addEventListener('change', () => {
    const league = leagueSelect.value;
    teamSelect.innerHTML = TEAMS[league].map(([id, name]) =>
      `<option value="${id}">${escapeHtml(name)}</option>`
    ).join('');
    teamSelect.value = TEAMS[league][0][0];
    saveSelectedTeam(league, teamSelect.value);
    loadRoster();
  });

  teamSelect.addEventListener('change', () => {
    saveSelectedTeam(leagueSelect.value, teamSelect.value);
    loadRoster();
  });
}

function renderRoster(players, team) {
  const container = document.querySelector('#roster-list');
  const count = document.querySelector('#roster-count');
  const updated = document.querySelector('#roster-updated');
  const title = document.querySelector('#roster-title');
  const search = document.querySelector('#player-search');
  if (!container) return;

  count.textContent = `${players.length} players`;
  updated.textContent = `LIVE ROSTER · ${new Date().toLocaleString([], { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}`;
  title.textContent = `${team.name} roster.`;
  search.placeholder = `Search ${team.name} players...`;

  container.innerHTML = players.map(player => `
    <div class="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/5">
      <div class="col-span-6 md:col-span-5 flex items-center gap-3">
        <div class="w-11 h-11 rounded-full bg-[#39422e] flex items-center justify-center text-sm font-bold">${escapeHtml(initials(player.name))}</div>
        <div>
          <div class="font-bold">${escapeHtml(player.name)}</div>
          <div class="text-xs text-[var(--color-muted)]">${escapeHtml(team.name)} · #${escapeHtml(player.jersey || '—')}</div>
        </div>
      </div>
      <div class="col-span-2 text-sm">${escapeHtml(player.position)}</div>
      <div class="col-span-2 text-sm">${escapeHtml(player.status)}</div>
      <div class="hidden md:block col-span-3 text-xs text-[var(--color-muted)]">
        ${player.age ? `${escapeHtml(player.age)} yrs` : ''}${player.experience !== '' ? ` · ${escapeHtml(player.experience)} yrs exp.` : ''}
      </div>
    </div>
  `).join('');
}

async function loadRoster() {
  const team = getSelectedTeam();
  const status = document.querySelector('#roster-status');
  const container = document.querySelector('#roster-list');
  status.textContent = `Loading ${team.name} roster…`;
  container.innerHTML = '<div class="p-8 text-sm text-[var(--color-muted)]">Loading live roster…</div>';

  try {
    const response = await fetch(endpointFor(team), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Roster request failed: ${response.status}`);
    const data = await response.json();
    const players = flattenRoster(data);
    if (!players.length) throw new Error('No players returned');
    renderRoster(players, team);
    status.textContent = `Live ${team.league} roster connected`;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="p-8 text-sm text-[var(--color-muted)]">Could not load the live roster for ${escapeHtml(team.name)}. Check your internet connection or try again.</div>`;
    document.querySelector('#roster-count').textContent = '— players';
    status.textContent = 'Live roster unavailable';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const selected = getSelectedTeam();
  populateTeamControls(selected);
  loadRoster();

  const search = document.querySelector('#player-search');
  if (search) {
    search.addEventListener('input', event => {
      const term = event.target.value.trim().toLowerCase();
      [...document.querySelectorAll('#roster-list > div')].forEach(row => {
        row.hidden = !!term && !row.textContent.toLowerCase().includes(term);
      });
    });
  }
});
