# Front Office OS

Front Office OS is a multi-league sports front-office prototype for NFL and NBA teams.

## Current features

- NFL team selector with all 32 teams
- NBA team selector with all 30 teams
- Live roster loading through ESPN's public roster endpoints
- Player search
- Selected team persists in the browser with localStorage
- Static front-office pages for dashboard, AI GM, contracts, scouting, opportunities, and trade machine

## Important

The live roster is fetched in the browser. GitHub Pages hosts the front end but does not provide a backend or database.

The current contracts, scouting, opportunities, and AI GM sections are prototype/demo UI. They are not automatically populated with verified live league data yet.

For a production application, use a licensed sports-data provider and a backend/database for contracts, transactions, statistics, injuries, draft assets, and historical data.

## GitHub Pages

Upload the files to a GitHub repository with `index.html` in the repository root. Then enable GitHub Pages from Settings → Pages and deploy from the `main` branch and root directory.
