export interface Judge
{
	id: string;
	name: string;
	short: string;
	philosophy: string;
}

export const JUDGES: Judge[] = [
	{ id: 'hale',     name: 'Justice Hale',     short: 'HA', philosophy: 'Textualist'           },
	{ id: 'okafor',   name: 'Justice Okafor',   short: 'OK', philosophy: 'Original Intent'      },
	{ id: 'voss',     name: 'Justice Voss',      short: 'VO', philosophy: 'Living Const.'        },
	{ id: 'crane',    name: 'Justice Crane',     short: 'CR', philosophy: 'Pragmatist'           },
	{ id: 'mirande',  name: 'Justice Mirande',   short: 'MI', philosophy: 'Civil Libertarian'    },
	{ id: 'ashworth', name: 'Justice Ashworth',  short: 'AS', philosophy: 'Structuralist'        },
	{ id: 'lim',      name: 'Justice Lim',       short: 'LI', philosophy: 'Precedent-First'      },
	{ id: 'ndidi',    name: 'Justice Ndidi',     short: 'ND', philosophy: 'Natural Law'          },
	{ id: 'solis',    name: 'Justice Solis',     short: 'SO', philosophy: 'Balancing Test'       },
];

export const JUDGE_MAP = Object.fromEntries(JUDGES.map(j => [j.id, j]));
