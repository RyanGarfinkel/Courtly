'use client';

import { useState } from 'react';

interface FlashCard
{
	front: string;
	back: string;
}

interface Deck
{
	id: string;
	title: string;
	description: string;
	cards: FlashCard[];
}

const DECKS: Deck[] = [
	{
		id: 'process',
		title: 'The Process',
		description: 'From cert to ruling — how a case reaches and moves through the Supreme Court.',
		cards: [
			{
				front: 'What is a writ of certiorari?',
				back: 'A formal order from the Supreme Court agreeing to hear an appeal. The Court receives ~7,000 petitions per year and grants roughly 60–80. Getting cert is the first battle.',
			},
			{
				front: "What is the 'rule of four'?",
				back: 'The Court grants cert if at least four of the nine justices vote to hear the case. A case can be denied cert without explanation — that is not a ruling on the merits.',
			},
			{
				front: 'What happens at conference?',
				back: 'Before oral argument, the justices meet privately to discuss the case. No clerks present. The Chief Justice speaks first, then each justice in order of seniority.',
			},
			{
				front: 'How long is oral argument?',
				back: 'Each side traditionally gets 30 minutes — though the Court has expanded time in major cases. In practice, justices interrupt immediately. You may never finish a sentence.',
			},
			{
				front: 'What is amicus curiae?',
				back: "Latin for 'friend of the court.' Third parties with a stake in the outcome may file amicus briefs. The Solicitor General appears frequently as amicus for the government's interest.",
			},
			{
				front: "Affirm vs. reverse — what's the difference?",
				back: "To affirm is to uphold the lower court's ruling. To reverse is to overturn it. The petitioner (who lost below) seeks reversal; the respondent defends the affirmance.",
			},
		],
	},
	{
		id: 'brief',
		title: 'Writing Your Brief',
		description: 'Structure, citations, and persuasion in a legal brief.',
		cards: [
			{
				front: "What is the 'Question Presented'?",
				back: "The single sentence at the opening of a brief that frames the legal issue for the Court. How you frame the question shapes everything — a well-drafted QP can decide the case before argument begins.",
			},
			{
				front: 'What is a legal citation?',
				back: "A reference to a prior case, statute, or legal authority. Format: 'Brown v. Board of Education, 347 U.S. 483 (1954).' The name, volume, reporter, page, and year.",
			},
			{
				front: 'What is stare decisis?',
				back: "Latin for 'to stand by decided matters.' The doctrine that courts follow prior decisions. Strong stare decisis arguments show the Court it can rule for you without destabilizing settled law.",
			},
			{
				front: "What is a 'limiting principle'?",
				back: "The argument that tells the Court your rule won't go too far. Justices will ask: 'If we rule for you here, where does it stop?' You must have an answer.",
			},
			{
				front: 'What makes a brief persuasive?',
				back: "Clarity, specificity, and honest engagement with the hardest counter-argument. Never ignore the strongest objection — address it and dismantle it. The Court knows if you're hiding something.",
			},
		],
	},
	{
		id: 'argument',
		title: 'Oral Argument',
		description: 'What happens at the lectern — and how to survive the bench.',
		cards: [
			{
				front: 'How should you open oral argument?',
				back: "With a single sentence that captures your best theory of the case. 'The statute says X, and X means Y.' Do not waste the opening on pleasantries. The bench may interrupt within seconds.",
			},
			{
				front: "What is 'hot bench' vs 'cold bench'?",
				back: 'A hot bench asks aggressive questions from the start. A cold bench lets you speak longer but may be skeptical in silence. Modern SCOTUS is almost always hot — justices compete to ask the first question.',
			},
			{
				front: 'How do you handle an interrupting justice?',
				back: "Stop speaking the moment a justice begins. Never talk over the bench. Acknowledge the question: 'Justice Thomas, yes — ' then answer directly and briefly. Return to your argument if they let you.",
			},
			{
				front: 'What should you never say to the Court?',
				back: "Never say 'That's a good question' — it sounds sycophantic. Never say 'Clearly' before a contested point. Never say 'I don't know' without offering to follow up. Never argue with a justice.",
			},
			{
				front: 'What is rebuttal?',
				back: "Petitioner gets a few minutes at the end to respond to respondent's argument. Save your single strongest point for rebuttal — don't introduce new issues. End sharply.",
			},
			{
				front: "What is 'buying time' at the lectern?",
				back: 'Some attorneys use deliberate pacing to control the argument. Begin your answer with a clear thesis sentence, then support it. Do not let the bench chase you off your structure.',
			},
		],
	},
	{
		id: 'justices',
		title: 'The Nine Philosophies',
		description: "Each justice has a distinct lens. Know who you're talking to.",
		cards: [
			{
				front: 'Textualism',
				back: "Reads the law by the plain meaning of its words at the time of enactment. Resists legislative history and evolving interpretations. Ask: 'What does the statute literally say?'",
			},
			{
				front: 'Originalism',
				back: "Interprets the Constitution as understood by the ratifying generation. Looks to founding-era practices and debates. Ask: 'What would the framers have understood this to mean?'",
			},
			{
				front: 'Living Constitutionalism',
				back: "Reads the Constitution as evolving with society. Prior understandings inform but don't bind. Ask: 'What does liberty mean in our era?'",
			},
			{
				front: 'Pragmatism',
				back: "Weighs real-world consequences over doctrinal purity. Rules must work in practice across thousands of cases. Ask: 'What actually happens to people if we rule this way?'",
			},
			{
				front: 'Civil Libertarianism',
				back: "Strong presumption in favor of individual rights against government power. Government bears the burden of justifying restrictions. Ask: 'Has the government proved it needs this power?'",
			},
			{
				front: 'Structuralism',
				back: "Focuses on the Constitution's structural design — separation of powers, federalism, limits each branch places on the others. Ask: 'Does this decision respect the constitutional structure?'",
			},
			{
				front: 'Stare Decisis (Precedent-First)',
				back: "Heavily weights the stability value of prior decisions. Overturning precedent requires an exceptional showing. Ask: 'What reliance interests does settled law protect?'",
			},
			{
				front: 'Natural Law',
				back: "Grounds decisions in fundamental moral principles that transcend positive law. Rights exist prior to their legal recognition. Ask: 'Does this ruling respect human dignity?'",
			},
			{
				front: 'Balancing Test',
				back: "Applies proportionality — weighing competing state interests against individual rights. Ask: 'Are the government's means proportional to its ends?'",
			},
		],
	},
	{
		id: 'scoring',
		title: 'How You\'re Scored',
		description: 'Consistency, precedent, responsiveness — the rubric behind the ruling.',
		cards: [
			{
				front: "What is 'consistency'?",
				back: 'Your arguments across turns must not contradict each other. If you argue the statute is ambiguous in turn 2, you cannot argue it is clear in turn 4. Justices listen to everything you say.',
			},
			{
				front: "What is 'precedent command'?",
				back: "Your ability to accurately cite and apply prior cases. Not just citing them — applying them. A case that supports you on the surface may distinguish on the facts. Show you know the difference.",
			},
			{
				front: "What is 'responsiveness'?",
				back: "Did you actually answer the question asked? Justices give low marks for artful dodges. If you can't answer directly, acknowledge the difficulty — but engage with it.",
			},
			{
				front: "What is 'clarity'?",
				back: 'Can a justice follow your argument? Legal brilliance communicated poorly fails. Your structure must be visible: thesis, supporting logic, rebuttal of the counter-argument.',
			},
		],
	},
	{
		id: 'ruling',
		title: 'The Ruling',
		description: 'Majority, concurrences, dissents — how the Court speaks.',
		cards: [
			{
				front: 'What is a majority opinion?',
				back: 'An opinion joined by at least five justices that carries the force of law. It establishes precedent for all courts below. The Chief Justice, if in the majority, assigns who writes it.',
			},
			{
				front: 'What is a concurrence?',
				back: 'A separate opinion agreeing with the outcome but for different reasons. Concurrences do not establish precedent unless they represent the narrowest ground a majority agrees on (the Marks rule).',
			},
			{
				front: 'What is a dissent?',
				back: 'An opinion written by justices in the minority. Dissents have no precedential weight but can be influential — they sometimes become the majority position in a later case.',
			},
			{
				front: "What is the 'swing justice'?",
				back: "In a close case, the justice whose vote is decisive. Their concerns during oral argument are a map to the winning argument. If you've lost four and the fifth is wavering, they are your entire case.",
			},
			{
				front: 'What is a 5-4 ruling?',
				back: 'The narrowest possible victory. A 5-4 ruling has full precedential force but is the most likely to be revisited. A 9-0 ruling sends a clear message that the losing argument was simply wrong.',
			},
		],
	},
];

const Cards = () =>
{
	const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
	const [currentCardIndex, setCurrentCardIndex] = useState(0);
	const [revealed, setRevealed] = useState(false);

	const activeDeck = DECKS.find(d => d.id === activeDeckId) ?? null;

	const openDeck = (id: string) =>
	{
		setActiveDeckId(id);
		setCurrentCardIndex(0);
		setRevealed(false);
	};

	const closeDeck = () =>
	{
		setActiveDeckId(null);
		setCurrentCardIndex(0);
		setRevealed(false);
	};

	const goNext = () =>
	{
		if(!activeDeck) return;
		if(currentCardIndex >= activeDeck.cards.length - 1)
		{
			closeDeck();
			return;
		}
		setCurrentCardIndex(prev => prev + 1);
		setRevealed(false);
	};

	const goPrev = () =>
	{
		if(currentCardIndex <= 0) return;
		setCurrentCardIndex(prev => prev - 1);
		setRevealed(false);
	};

	if(activeDeck)
	{
		const card = activeDeck.cards[currentCardIndex];
		const progress = ((currentCardIndex + 1) / activeDeck.cards.length) * 100;
		const isLast = currentCardIndex >= activeDeck.cards.length - 1;

		return (
			<div className='flex flex-col gap-6 animate-fade-in'>
				<div className='flex items-center justify-between gap-4'>
					<button
						type='button'
						onClick={closeDeck}
						className='text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
					>
						← All Decks
					</button>
					<span className='font-heading font-bold text-sm text-foreground'>{activeDeck.title}</span>
					<span className='text-xs text-muted-foreground tabular-nums'>
						{currentCardIndex + 1} / {activeDeck.cards.length}
					</span>
				</div>

				<div className='h-0.5 bg-border rounded-full overflow-hidden'>
					<div
						className='h-full bg-primary transition-all duration-300 ease-out'
						style={{ width: `${progress}%` }}
					/>
				</div>

				<div className='border border-border rounded-sm p-8 md:p-10 flex flex-col gap-6 min-h-52'>
					<p className='font-heading text-2xl font-bold text-foreground leading-snug'>
						{card.front}
					</p>

					{revealed
						? (
							<div className='flex flex-col gap-2 animate-fade-in'>
								<p className='label-caps text-muted-foreground'>Answer</p>
								<p
									className='text-base text-foreground leading-relaxed italic'
									style={{ fontFamily: 'var(--font-sans)' }}
								>
									{card.back}
								</p>
							</div>
						)
						: (
							<button
								type='button'
								onClick={() => setRevealed(true)}
								className='self-start inline-flex items-center justify-center rounded-sm bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
							>
								Show Answer
							</button>
						)
					}
				</div>

				<div className='flex items-center justify-between gap-3'>
					<button
						type='button'
						onClick={goPrev}
						disabled={currentCardIndex <= 0}
						className='inline-flex items-center justify-center rounded-sm border border-border px-5 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					>
						Previous
					</button>
					<button
						type='button'
						onClick={goNext}
						className='inline-flex items-center justify-center rounded-sm bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					>
						{isLast ? 'Finish' : revealed ? 'Next →' : 'Skip →'}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2'>
			{DECKS.map((deck, i) => (
				<button
					key={deck.id}
					type='button'
					onClick={() => openDeck(deck.id)}
					className='group flex flex-col text-left border border-border rounded-sm p-6 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-fade-in'
					style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
				>
					<h2 className='font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors'>
						{deck.title}
					</h2>
					<p className='text-sm text-muted-foreground mt-1.5 leading-relaxed flex-1'>
						{deck.description}
					</p>
					<div className='flex items-center justify-between mt-5 pt-4 border-t border-border'>
						<span className='label-caps text-muted-foreground'>{deck.cards.length} cards</span>
						<span className='text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity'>
							Study →
						</span>
					</div>
				</button>
			))}
		</div>
	);
};

export default Cards;
