export interface Judge
{
	id: string;
	name: string;
	short: string;
	philosophy: string;
	image: string;
}

export const JUDGES: Judge[] = [
	{ id: 'hale',     name: 'Justice Hale',     short: 'HA', philosophy: 'Textualist',        image: '/assets/judges/Roberts_8807-16_Crop.jpg'          },
	{ id: 'okafor',   name: 'Justice Okafor',   short: 'OK', philosophy: 'Original Intent',   image: '/assets/judges/Thomas_9366-024_Crop.jpg'          },
	{ id: 'voss',     name: 'Justice Voss',      short: 'VO', philosophy: 'Living Const.',     image: '/assets/judges/Sotomayor_Official_2025.jpg'       },
	{ id: 'crane',    name: 'Justice Crane',     short: 'CR', philosophy: 'Pragmatist',        image: '/assets/judges/Alito_9264-001-Crop.jpg'           },
	{ id: 'mirande',  name: 'Justice Mirande',   short: 'MI', philosophy: 'Civil Libertarian', image: '/assets/judges/Kagan_10713-017-Crop.jpg'          },
	{ id: 'ashworth', name: 'Justice Ashworth',  short: 'AS', philosophy: 'Structuralist',     image: '/assets/judges/Gorsuch2.jpg'                      },
	{ id: 'lim',      name: 'Justice Lim',       short: 'LI', philosophy: 'Precedent-First',   image: '/assets/judges/Kavanaugh 12221_005_crop.jpg'      },
	{ id: 'ndidi',    name: 'Justice Ndidi',     short: 'ND', philosophy: 'Natural Law',       image: '/assets/judges/Barrett_102535_w151.jpg'           },
	{ id: 'solis',    name: 'Justice Solis',     short: 'SO', philosophy: 'Balancing Test',    image: '/assets/judges/KBJackson3.jpg'                    },
];

export const JUDGE_MAP = Object.fromEntries(JUDGES.map(j => [j.id, j]));
