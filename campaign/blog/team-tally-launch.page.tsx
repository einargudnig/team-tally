import { Separator } from '@radix-ui/react-separator';

// Drop-in for einargudni.com. Suggested route: app/writing/team-tally/page.tsx
// Matches the conventions used in app/dissect/marchon/page.tsx (section wrapper,
// font-semibold headings, mt-4 paragraphs, text-muted-foreground for secondary,
// escaped apostrophes for the react/no-unescaped-entities lint rule).

export const metadata = {
	title: 'I built a fines app for football teams — and gave it no backend',
	description:
		'Team Tally is a fine tracker for sports teams. No accounts, no cloud, no server. Why offline-first was the whole point.'
};

export default function Page() {
	return (
		<section className="mx-auto w-full max-w-2xl space-y-8 print:space-y-6">
			<div className="space-y-2">
				<h2 className="text-xl font-bold">
					I built a fines app for football teams — and gave it no backend
				</h2>
				<p className="text-muted-foreground font-mono text-xs">23 June 2026</p>
			</div>

			<Separator className="bg-muted-foreground w-24" />

			<p className="mt-4">
				Every grassroots football team I&apos;ve ever been near runs a fines kitty. Late to
				training, forgot your shinpads, phone out during the team talk, a haircut nobody
				asked for — there&apos;s a price for everything, and the money goes into a pot that
				funds the end-of-season blowout.
			</p>
			<p className="mt-4">
				And every single one of those teams tracks it in the same place: a doomed,
				half-abandoned spreadsheet that one person owns, nobody else can find, and which is
				always three weeks out of date. By August it&apos;s a forensic exercise.{' '}
				<span className="text-muted-foreground italic">
					Did Jón ever pay that 2.500 for the red socks? Nobody knows. Jón says he did.
				</span>
			</p>
			<p className="mt-4">
				So I built{' '}
				<a
					href="https://teamtally.is"
					className="underline underline-offset-4"
					target="_blank"
					rel="noopener noreferrer"
				>
					Team Tally
				</a>{' '}
				— a fine tracker that lives where the fines actually happen: in someone&apos;s hand,
				in the dressing room. It launches today, free, on iOS and Android.
			</p>

			<h3 className="font-semibold">What it does</h3>
			<p className="mt-4">
				The whole app is built around how a captain actually behaves on matchday:
			</p>
			<ul className="mt-4 list-disc space-y-2 pl-5">
				<li>
					<strong>Log a fine in two taps.</strong> Pick the player, pick the offence. You
					define the offences and the amounts — every team&apos;s culture is its own.
				</li>
				<li>
					<strong>A live leaderboard.</strong> It ranks the squad by who owes the most, in
					real time. The worst offender has nowhere to hide, which turns out to be 90% of
					the fun.
				</li>
				<li>
					<strong>Settle the kitty period by period.</strong> Weekly, monthly, or by
					season — whatever rhythm your team already runs on. Mark people paid as the cash
					comes in, so you&apos;re never sending &quot;did you ever pay me?&quot; texts on a
					Sunday night.
				</li>
			</ul>
			<p className="mt-4">
				That&apos;s it. It does one thing, for one person, and it does it without asking you
				to sign up for anything.
			</p>

			<h3 className="font-semibold">The part I&apos;m actually proud of: there is no backend</h3>
			<p className="mt-4">
				Here&apos;s the decision the whole app hangs on. Team Tally has{' '}
				<strong>no accounts, no cloud, no server.</strong> Everything lives in a local SQLite
				database on the captain&apos;s phone. No login screen. No &quot;invite your
				teammates.&quot; No sync.
			</p>
			<p className="mt-4">
				Uninstall the app and the data is gone. That is the entire privacy policy, and I can
				explain it in one sentence to a 50-year-old club treasurer who does not care about
				your data-processing agreement.
			</p>
			<p className="mt-4">
				It would have been <em>easy</em> to add a backend. It&apos;s the default — spin up a
				database, bolt on auth, sync everything, call it &quot;multiplayer.&quot; But think
				about who uses this thing: one person, on a phone, often in a basement changing room
				with no signal, logging a fine thirty seconds before kickoff. For that user, a
				backend is pure downside:
			</p>
			<ul className="mt-4 list-disc space-y-2 pl-5">
				<li>
					<strong>Friction.</strong> An account screen is where casual tools go to die. The
					fastest path to &quot;this isn&apos;t worth it&quot; is making someone create a
					password before they&apos;ve fined anyone.
				</li>
				<li>
					<strong>A liability.</strong> The moment you hold other people&apos;s data on a
					server, you&apos;ve signed up for breaches, GDPR, an ongoing bill, and a thing
					that can go down. For a side project meant to be fun, that&apos;s a lot of rope.
				</li>
				<li>
					<strong>It breaks the one place it&apos;s used.</strong> Offline-first isn&apos;t
					a feature I bolted on; it&apos;s a consequence of having nothing to be online{' '}
					<em>for</em>. The dressing room has no wifi and that&apos;s fine, because the app
					never needed it.
				</li>
			</ul>
			<p className="mt-4">
				There&apos;s a quiet argument here for boring, local, offline-first software. Not
				everything needs to be a platform. Some things should just be a good tool that sits
				on your phone and works.
			</p>

			<h3 className="font-semibold">Why football, why Iceland, why now</h3>
			<p className="mt-4">
				I&apos;m starting where the problem is sharpest: Iceland&apos;s lower divisions — 4.
				and 5. deild karla, 2. deild kvenna. Small clubs, strong fine culture, and almost all
				of them currently fighting that spreadsheet.
			</p>
			{/* Optional: drop in your own story here — the team you played for, the specific
			    fine that started this, the spreadsheet that finally broke you. */}
			<p className="mt-4">
				It&apos;s mid-season, which is exactly when the kitty matters most and exactly when
				the spreadsheet has fallen apart. Good time to hand people something better.
			</p>
			<p className="mt-4">
				The kitty is universal, though. Rugby, handball, hockey, a five-a-side group, a
				climbing gym, a stag do — anywhere there&apos;s a culture of fines and a pot of
				money, Team Tally works.
			</p>
			{/* Optional: a line about where you want to take it next — but keep it honest,
			    no roadmap theatre. */}

			<h3 className="font-semibold">Get it</h3>
			<p className="mt-4">It&apos;s free. It works offline. It asks you for nothing.</p>
			<ul className="mt-4 list-disc space-y-2 pl-5">
				<li>
					📱{' '}
					<a
						href="https://teamtally.is"
						className="underline underline-offset-4"
						target="_blank"
						rel="noopener noreferrer"
					>
						teamtally.is
					</a>{' '}
					— links to the App Store and Play Store
				</li>
				<li>
					Built with Expo / React Native and Drizzle over SQLite, if you care about that
					sort of thing (I do).
				</li>
			</ul>
			<p className="mt-4">
				If you run a team&apos;s kitty, give it a go this weekend and tell me what breaks.
				And if you know a captain still wrestling a spreadsheet — send them this.
			</p>
		</section>
	);
}
