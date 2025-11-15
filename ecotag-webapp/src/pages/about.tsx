import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

function FeatureCardItem({ feature }: { feature: any }) {
	return (
		<article className="group p-6 bg-white rounded-2xl shadow-sm border border-transparent hover:shadow-md transform transition hover:-translate-y-1">
			<div className="flex items-start gap-4">
				<div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shadow-sm">
					<div className="text-green-600">{feature.icon}</div>
				</div>

				<div className="flex-1">
					<h3 className="font-semibold text-lg text-green-800">{feature.title}</h3>
					<p className="mt-2 text-sm text-gray-600">{feature.summary}</p>
				</div>
			</div>

			<div className="mt-6">
				<Link href={feature.link ?? '#'} className="inline-block px-4 py-2 bg-green-700 text-white rounded shadow">
					{feature.cta}
				</Link>
			</div>
		</article>
	)
}

function FeatureCards() {
	const features = [
		{
			id: 1,
			title: 'Instant Product Scores',
			summary: 'A concise score summarises environmental and social considerations.',
			details:
				'Scores are built from ingredient lists, material composition, certifications and public data. Each score links to the evidence so you can verify our reasoning.',
			icon: (
				<svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
					<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
					<path d="M9.5 12.5l1.8 1.8L15 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			),
			cta: 'Install extension',
			link: '#',
		},
		{
			id: 2,
			title: 'Browser Extension',
			summary: 'See EcoTag insights while you shop — no context switching.',
			details:
				'The extension surfaces scores and short explanations directly on product pages so you can decide within the flow of shopping.',
			icon: (
				<svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
					<rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
					<path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			),
			cta: 'Open scanner',
			link: '/app/scanner',
		},
	]

	return (
		<section className="grid md:grid-cols-2 gap-6 mb-12">
			{features.map((f) => (
				<FeatureCardItem key={f.id} feature={f} />
			))}
		</section>
	)
}


function StepCard({ step }: { step: any }) {
	return (
		<article className="group p-6 bg-white rounded-2xl shadow-sm border border-transparent hover:shadow-md transform transition hover:-translate-y-1">
			<div className="flex items-start gap-4">
				<div className="w-14 h-14 rounded-lg bg-green-50 flex items-center justify-center shadow-sm flex-shrink-0">
					<div className="text-green-600 text-2xl" aria-hidden>
						{step.icon}
					</div>
				</div>
				<div className="flex-1">
					<h4 className="font-semibold text-lg text-green-800">{step.title}</h4>
					<p className="mt-1 text-sm text-gray-600">{step.summary}</p>
				</div>
			</div>
		</article>
	)
}

function HowItWorks() {
	const steps = [
		{
			id: 1,
			title: 'Scan',
			summary: 'Open the scanner and point at a barcode.',
			icon: '🔍',
		},
		{
			id: 2,
			title: 'Analyze',
			summary: 'We evaluate ingredients and certifications.',
			icon: '🔬',
		},
		{
			id: 3,
			title: 'Act',
			summary: 'Get clear scores and alternatives.',
			icon: '✅',
		},
	]

	return (
		<section className="mb-12">
			<h2 className="text-2xl font-bold mb-4">How it works</h2>
			<div className="grid md:grid-cols-3 gap-4">
				{steps.map((s) => (
					<StepCard key={s.id} step={s} />
				))}
			</div>
		</section>
	)
}

function ImpactCard() {
	return (
		<div className="p-6 bg-white rounded-2xl shadow-sm border border-transparent hover:shadow-md transform transition hover:-translate-y-1">
			<div className="flex items-center gap-4">
				<div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-700">
						<path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M13 2v7h7M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</div>
				<div>
					<h3 className="font-semibold text-lg text-green-800">Impact & Metrics</h3>
					<p className="mt-1 text-sm text-gray-600">We're tracking community impact as we grow.</p>
				</div>
			</div>
		</div>
	)
}

function PrivacyCard() {
	return (
		<div className="p-6 bg-white rounded-2xl shadow-sm border border-transparent hover:shadow-md transform transition hover:-translate-y-1">
			<div className="flex items-center gap-4">
				<div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-700">
						<path d="M12 2a4 4 0 00-4 4v3H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-2V6a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</div>
				<div>
					<h3 className="font-semibold text-lg text-green-800">Privacy & Data</h3>
					<p className="mt-1 text-sm text-gray-600">Your data stays private and secure.</p>
				</div>
			</div>
		</div>
	)
}

export default function AboutPage() {
	return (
		<main className="max-w-4xl mx-auto px-6 py-16">
			<section className="relative text-center mb-14">
				<h1 className="text-4xl md:text-5xl font-extrabold text-green-700">Scan. Learn. Choose Better.</h1>
				<p className="mt-4 text-gray-600 max-w-2xl mx-auto">EcoTag helps you quickly understand product sustainability — whether you're scanning in-store, browsing online, or researching alternatives. We turn complex ingredients, materials and certifications into clear, actionable guidance.</p>

				<div className="mt-8 flex justify-center gap-4">
					<Link href="/app/scanner" className="inline-block px-5 py-3 bg-green-600 text-white rounded shadow">Try the Scanner</Link>
					<Link href="/app/register" className="inline-block px-5 py-3 border border-green-600 text-green-600 rounded">Get Started</Link>
				</div>
			</section>

			<FeatureCards />

			<HowItWorks />

		<section className="my-12 grid md:grid-cols-2 gap-6">
			<ImpactCard />
			<PrivacyCard />
		</section>
			<section className="mb-12">
				<h2 className="text-2xl font-bold mb-4">Our team</h2>
				<article className="p-6 bg-white rounded-2xl shadow-sm border border-transparent hover:shadow-md transform transition hover:-translate-y-1">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
							<svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-green-700" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
								<path d="M4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
						<div className="flex-1">
							<ul className="mt-2 space-y-2 text-sm">
								<li className="px-3 py-1 bg-green-50 text-green-800 rounded text-center">Cristian Stigelbauer</li>
								<li className="px-3 py-1 bg-green-50 text-green-800 rounded text-center">Mihai Gorunescu</li>
								<li className="px-3 py-1 bg-green-50 text-green-800 rounded text-center">Teodor Ionici-Rădoi</li>
								<li className="px-3 py-1 bg-green-50 text-green-800 rounded text-center">Albert Molocea</li>
							</ul>
						</div>
					</div>
				</article>
			</section>

		<section className="mt-16 mb-12 text-center">
			<article className="inline-block p-8 bg-white rounded-2xl shadow-sm border border-transparent hover:shadow-md transform transition hover:-translate-y-1">
				<h3 className="text-lg font-semibold mb-4 text-green-800">Ready to try it?</h3>
				<div className="flex justify-center gap-3">
					<Link href="/app/scanner" className="px-4 py-2 bg-green-600 text-white rounded">Open Scanner</Link>
					<Link href="/app/register" className="px-4 py-2 border border-green-600 text-green-600 rounded">Create Account</Link>
				</div>
			</article>
		</section>
		</main>
	)
}

