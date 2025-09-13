import OpenAI from 'openai'

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
export const usingOpenAI = !!client

export async function generateItinerary({ destination, budget, durationDays, interests }) {
	if (!client) {
		return ruleBasedPlan({ destination, budget, durationDays, interests })
	}
	try {
		const prompt = [
			"You are an expert trip planner.",
			"Create a detailed, day-by-day itinerary in ENGLISH for the trip below.",
			"Inputs:",
			`Destination: ${destination}`,
			`Duration: ${durationDays} days`,
			`Interests: ${interests.join(', ')}`,
			`Budget: ${budget}`,
			"Requirements:",
			"- For EACH day (from morning to evening), suggest concrete activities and places.",
			"- Tailor all choices to the interests and budget.",
			"- Add a short explanatory note for each attraction and restaurant (why it fits).",
			"- Include transport guidance for the day (how to move between sites).",
			"Output JSON ONLY (no markdown). Use EXACTLY this schema:",
			"{",
			"  \"destination\": string,",
			"  \"budget\": string,",
			"  \"durationDays\": number,",
			"  \"interests\": string[],",
			"  \"days\": [",
			"    {",
			"      \"day\": number,",
			"      \"title\": string,",
			"      \"summary\": string,",
			"      \"morning\": string,",
			"      \"afternoon\": string,",
			"      \"evening\": string,",
			"      \"attractions\": [ { \"name\": string, \"type\": string, \"neighborhood\": string, \"notes\": string } ],",
			"      \"restaurants\": [ { \"name\": string, \"cuisine\": string, \"notes\": string } ],",
			"      \"transport\": string",
			"    }",
			"  ]",
			"}",
			"Return compact minified JSON."
		].join('\n')

		const res = await client.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: 'You are a travel planner that returns concise JSON only.' },
				{ role: 'user', content: prompt }
			]
		})
		const text = res.choices?.[0]?.message?.content || '{}'
		const parsed = JSON.parse(text)
		if (!parsed || !Array.isArray(parsed.days) || parsed.days.length === 0) {
			return ruleBasedPlan({ destination, budget, durationDays, interests })
		}
		return parsed
	} catch (e) {
		return ruleBasedPlan({ destination, budget, durationDays, interests })
	}
}

function pick(arr, i) { return arr[i % arr.length] }

function ruleBasedPlan({ destination, budget, durationDays, interests }) {
	const interestPools = buildPools(destination)
	const normalized = (interests && interests.length ? interests : ['Highlights']).map(s => s.toLowerCase())

	const days = []
	for (let i = 0; i < durationDays; i++) {
		const focus = normalized[i % normalized.length]
		const pool = interestPools[focus] || interestPools['highlights']
		const attractions = [pick(pool.attractions, i), pick(pool.attractions, i + 1)].filter(Boolean)
		const restaurants = [pick(pool.restaurants, i), pick(pool.restaurants, i + 2)].filter(Boolean)
		days.push({
			day: i + 1,
			title: `Day ${i + 1} in ${destination}: ${capitalize(focus)}`,
			summary: `Explore ${destination} with a ${budget.toLowerCase()} budget, focusing on ${capitalize(focus)}.`,
			morning: 'Morning walk and first site visit.',
			afternoon: 'Afternoon activity tailored to interests.',
			evening: 'Evening option such as show or night stroll.',
			attractions,
			restaurants,
			transport: pool.transport
		})
	}
	return { destination, budget, durationDays, interests, days }
}

function buildPools(destination) {
	return {
		highlights: {
			attractions: [
				{ name: 'Old Town Walking Tour', type: 'sight', neighborhood: 'Historic Center', notes: 'Iconic highlights walk.' },
				{ name: 'Central Market', type: 'market', neighborhood: 'Downtown', notes: 'Local produce and crafts.' },
				{ name: 'River Promenade', type: 'scenic', neighborhood: 'Waterfront', notes: 'Sunset views.' },
			],
			restaurants: [
				{ name: 'Local Bistro', cuisine: 'Regional', notes: 'Classic regional dishes.' },
				{ name: 'Street Food Corner', cuisine: 'Casual', notes: 'Quick bites between sights.' },
				{ name: 'Sunset Terrace', cuisine: 'Grill', notes: 'Great for dinner with views.' },
			],
			transport: 'Walk the compact center; use metro/bus for longer hops.'
		},
		art: {
			attractions: [
				{ name: 'Modern Art Museum', type: 'museum', neighborhood: 'Arts District', notes: 'Contemporary collection.' },
				{ name: 'Gallery Lane', type: 'gallery', neighborhood: 'Old Town', notes: 'Independent galleries.' },
				{ name: 'Public Murals Route', type: 'street art', neighborhood: 'Warehouse Quarter', notes: 'Open‑air murals.' },
			],
			restaurants: [
				{ name: 'Palette Cafe', cuisine: 'Cafe', notes: 'Near the museum cluster.' },
				{ name: 'Atelier Wine Bar', cuisine: 'Wine & Small Plates', notes: 'Art crowd favorite.' },
			],
			transport: 'Tram connects museums; bike lanes are great between galleries.'
		},
		nature: {
			attractions: [
				{ name: 'City Park Loop', type: 'park', neighborhood: 'Green Belt', notes: 'Shaded loop trail.' },
				{ name: 'Scenic Overlook', type: 'viewpoint', neighborhood: 'Hills', notes: 'Panoramic city views.' },
				{ name: 'Botanical Garden', type: 'garden', neighborhood: 'University', notes: 'Native plants section.' },
			],
			restaurants: [
				{ name: 'Garden Picnic', cuisine: 'Deli-to-go', notes: 'Pick up for picnic.' },
				{ name: 'Lakeside Shack', cuisine: 'Seafood', notes: 'Casual lunch with views.' },
			],
			transport: 'Bus to trailheads; rideshare back if returning late.'
		},
		food: {
			attractions: [
				{ name: 'Farmers’ Market', type: 'market', neighborhood: 'Downtown', notes: 'Morning tastings.' },
				{ name: 'Cooking Class', type: 'experience', neighborhood: 'Center', notes: 'Hands‑on class.' },
				{ name: 'Chocolate Workshop', type: 'experience', neighborhood: 'Riverside', notes: 'Bean‑to‑bar demo.' },
			],
			restaurants: [
				{ name: 'Chef’s Table', cuisine: 'Contemporary', notes: 'Seasonal tasting menu.' },
				{ name: 'Hidden Noodle Bar', cuisine: 'Asian', notes: 'Late‑night comfort food.' },
			],
			transport: 'Compact food crawl by foot; metro for outer neighborhoods.'
		},
		history: {
			attractions: [
				{ name: 'Ancient Citadel', type: 'fortress', neighborhood: 'Old City', notes: 'Foundations and ramparts.' },
				{ name: 'Archaeology Museum', type: 'museum', neighborhood: 'Center', notes: 'Local antiquities.' },
				{ name: 'Heritage Quarter', type: 'district', neighborhood: 'Old City', notes: 'Medieval lanes.' },
			],
			restaurants: [ { name: 'Tavern 1200', cuisine: 'Traditional', notes: 'Hearty classics.' }, { name: 'Heritage House', cuisine: 'Local', notes: 'Historic interior.' } ],
			transport: 'Most sites are walkable; use tram to reach the citadel.'
		},
		nightlife: {
			attractions: [
				{ name: 'Rooftop Bar Crawl', type: 'nightlife', neighborhood: 'Downtown', notes: 'Best views.' },
				{ name: 'Live Music Venue', type: 'music', neighborhood: 'Arts District', notes: 'Local bands.' },
			],
			restaurants: [ { name: 'Late Bite', cuisine: 'Burgers', notes: 'Open late.' }, { name: 'Tapas Alley', cuisine: 'Spanish', notes: 'Good for groups.' } ],
			transport: 'Use metro until midnight; rideshare after hours.'
		},
		shopping: {
			attractions: [
				{ name: 'Design District', type: 'shopping', neighborhood: 'West End', notes: 'Concept stores.' },
				{ name: 'Vintage Market', type: 'market', neighborhood: 'Old Town', notes: 'Thrift gems.' },
			],
			restaurants: [ { name: 'Food Court Hall', cuisine: 'Mixed', notes: 'Many options.' }, { name: 'Bakery Lane', cuisine: 'Bakery', notes: 'Coffee break.' } ],
			transport: 'Tram stops near all main malls; easy to carry bags.'
		},
		kids: {
			attractions: [
				{ name: 'Science Center', type: 'museum', neighborhood: 'University', notes: 'Hands‑on exhibits.' },
				{ name: 'City Zoo', type: 'zoo', neighborhood: 'Park', notes: 'Feeding hours.' },
			],
			restaurants: [ { name: 'Family Diner', cuisine: 'American', notes: 'Kids menu.' }, { name: 'Pasta Corner', cuisine: 'Italian', notes: 'High‑chairs available.' } ],
			transport: 'Bus lines have stroller space; plan nap breaks near parks.'
		},
		adventure: {
			attractions: [
				{ name: 'Kayak on the River', type: 'activity', neighborhood: 'Waterfront', notes: 'Guided session.' },
				{ name: 'Cliff Trail', type: 'hike', neighborhood: 'Hills', notes: 'Watch footing.' },
			],
			restaurants: [ { name: 'Trailhead Cafe', cuisine: 'Sandwiches', notes: 'Packable lunch.' }, { name: 'Grill House', cuisine: 'BBQ', notes: 'Protein‑heavy dinner.' } ],
			transport: 'Shuttle to trailheads; check weather before departure.'
		},
		beach: {
			attractions: [
				{ name: 'City Beach', type: 'beach', neighborhood: 'Coast', notes: 'Lifeguard hours.' },
				{ name: 'Lighthouse Walk', type: 'scenic', neighborhood: 'Coast', notes: 'Golden hour photos.' },
			],
			restaurants: [ { name: 'Sea Breeze', cuisine: 'Seafood', notes: 'Fresh catch.' }, { name: 'Beach Shack', cuisine: 'Casual', notes: 'Snacks and drinks.' } ],
			transport: 'Tram to the coast; sunscreen and water recommended.'
		},
		architecture: {
			attractions: [
				{ name: 'Cathedral & Square', type: 'landmark', neighborhood: 'Old Town', notes: 'Gothic details.' },
				{ name: 'Modern Skyline Walk', type: 'architecture', neighborhood: 'Financial District', notes: 'Iconic towers.' },
			],
			restaurants: [ { name: 'Atrium Cafe', cuisine: 'Cafe', notes: 'Light lunch.' }, { name: 'Skyline Sushi', cuisine: 'Japanese', notes: 'Views from bar.' } ],
			transport: 'Mix of walking and metro between neighborhoods.'
		}
	}
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }
